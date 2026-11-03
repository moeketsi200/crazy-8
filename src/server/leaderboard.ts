import { engine } from '@dcl/sdk/ecs'
import { Storage } from '@dcl/sdk/server'
import { isServer } from '@dcl/sdk/network'
import { sceneRoom } from '../shared/messages'
import { BOT_TURN_DELAY_MS, CrazyEightsGame, PlayerLeaderboardStats, isBotPlayer } from '../game/logic'
import { Suit } from '../game/deck'
import { getBotName } from '../game/bot_names'
import { createAuthoritativeGameState, publishAuthoritativeGameState } from '../game/multiplayer'

const LEADERBOARD_STORAGE_KEY = 'crazy8_leaderboard_v1'
const LEADERBOARD_VERSION = 1

interface PersistedLeaderboard {
  version: number
  records: PlayerLeaderboardStats[]
}

function sanitizeName(name: string): string {
  return name.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 32)
}

function readRecords(value: unknown): PlayerLeaderboardStats[] {
  if (!value || typeof value !== 'object') return []
  const candidate = value as Partial<PersistedLeaderboard>
  if (candidate.version !== LEADERBOARD_VERSION || !Array.isArray(candidate.records)) return []

  return candidate.records.filter((row): row is PlayerLeaderboardStats => {
    return !!row && typeof row.playerId === 'string' && typeof row.name === 'string' &&
      Number.isFinite(row.gamesWon) && Number.isFinite(row.weeklyWins) &&
      Number.isFinite(row.roundsWon) && typeof row.weekKey === 'string'
  }).map((row) => ({
    playerId: row.playerId.toLowerCase(),
    name: sanitizeName(row.name),
    gamesWon: Math.max(0, Math.floor(row.gamesWon)),
    weeklyWins: Math.max(0, Math.floor(row.weeklyWins)),
    roundsWon: Math.max(0, Math.floor(row.roundsWon)),
    weekKey: row.weekKey
  }))
}

function mergeRecord(existing: PlayerLeaderboardStats | undefined, incoming: PlayerLeaderboardStats): PlayerLeaderboardStats {
  if (!existing) return incoming
  const weekKey = existing.weekKey > incoming.weekKey ? existing.weekKey : incoming.weekKey
  const weeklyWins = existing.weekKey === incoming.weekKey
    ? Math.max(existing.weeklyWins, incoming.weeklyWins)
    : (weekKey === existing.weekKey ? existing.weeklyWins : incoming.weeklyWins)
  return {
    playerId: incoming.playerId,
    name: incoming.name || existing.name,
    gamesWon: Math.max(existing.gamesWon, incoming.gamesWon),
    weeklyWins,
    roundsWon: Math.max(existing.roundsWon, incoming.roundsWon),
    weekKey
  }
}

export async function initAuthoritativeServer() {
  if (!isServer()) return

  const names = new Map<string, string>()
  const game = new CrazyEightsGame()
  game.playerNameResolver = (playerId) => {
    const knownName = names.get(playerId.toLowerCase())
    if (knownName) return knownName
    if (isBotPlayer(playerId)) return getBotName(playerId)
    return playerId.startsWith('0x') && playerId.length > 10
      ? `${playerId.slice(0, 6)}...${playerId.slice(-4)}`
      : playerId
  }

  let storageLoaded = false
  let leaderboardDirty = false
  let leaderboardRevision = 0
  let saveInProgress = false
  let lastStorageRetryAt = 0
  let lastSaveAttemptAt = 0
  let sharedStateReady = false
  let gameplayEventId = Date.now()
  let autoContinueAt = 0
  let pendingBotTurn: { botId: string, executeAt: number } | null = null

  const loadLeaderboard = async () => {
    try {
      const saved = await Storage.get<PersistedLeaderboard>(LEADERBOARD_STORAGE_KEY)
      let mergedLocalResults = false
      const persistedRecords = readRecords(saved)
      const persistedIds = new Set(persistedRecords.map((record) => record.playerId))
      for (const record of persistedRecords) {
        const previous = game.leaderboardStats.get(record.playerId)
        const merged = mergeRecord(previous, record)
        if (merged.gamesWon > record.gamesWon || merged.roundsWon > record.roundsWon ||
            (merged.weekKey === record.weekKey && merged.weeklyWins > record.weeklyWins)) mergedLocalResults = true
        game.leaderboardStats.set(record.playerId, merged)
      }
      for (const localRecord of game.leaderboardStats.values()) {
        if (!persistedIds.has(localRecord.playerId)) mergedLocalResults = true
      }
      storageLoaded = true
      leaderboardDirty = leaderboardDirty || mergedLocalResults
      if (sharedStateReady) publishAuthoritativeGameState(game)
      console.log(`[Server] Loaded ${game.leaderboardStats.size} leaderboard records.`)
      if (leaderboardDirty) void saveLeaderboard()
    } catch (error) {
      console.error('[Server] Could not load the saved leaderboard; it will retry without overwriting stored data.', error)
    }
  }

  const saveLeaderboard = async () => {
    if (!storageLoaded || !leaderboardDirty || saveInProgress) return
    saveInProgress = true
    lastSaveAttemptAt = Date.now()
    const savingRevision = leaderboardRevision
    const payload: PersistedLeaderboard = {
      version: LEADERBOARD_VERSION,
      records: Array.from(game.leaderboardStats.values()).filter((record) => !isBotPlayer(record.playerId))
    }
    try {
      const saved = await Storage.set(LEADERBOARD_STORAGE_KEY, payload)
      if (saved) {
        leaderboardDirty = leaderboardRevision !== savingRevision
      } else {
        console.error('[Server] Leaderboard save did not persist; it will retry.')
      }
    } catch (error) {
      console.error('[Server] Leaderboard save failed; it will retry.', error)
    } finally {
      saveInProgress = false
    }
  }

  await loadLeaderboard()

  createAuthoritativeGameState(game)
  sharedStateReady = true
  game.onStateChanged = () => publishAuthoritativeGameState(game)
  game.onBotTurnStart = (botId) => {
    pendingBotTurn = { botId, executeAt: Date.now() + BOT_TURN_DELAY_MS }
  }
  game.onRoundEnd = () => {
    leaderboardDirty = true
    leaderboardRevision++
    void saveLeaderboard()
    if (game.gameMode === 'solo' && !game.matchOver && game.eliminatedPlayers.has(game.gameMasterId)) {
      autoContinueAt = Date.now() + 2_500
    }
  }
  game.onCardPlayed = (playerId, card) => {
    void sceneRoom.send('gameplayEvent', {
      eventId: ++gameplayEventId,
      event: 'cardPlayed',
      playerId,
      rank: card.rank,
      cardAction: card.action
    })
  }
  game.onDeclareSafe = (playerId) => {
    void sceneRoom.send('gameplayEvent', {
      eventId: ++gameplayEventId,
      event: 'declareSafe',
      playerId,
      rank: '',
      cardAction: ''
    })
  }

  sceneRoom.onMessage('gameAction', (data, context) => {
    const playerId = context?.from?.toLowerCase()
    if (!playerId || !playerId.startsWith('0x') && playerId.length < 20) return

    const name = sanitizeName(data.playerName)
    if (name) names.set(playerId, name)

    switch (data.action) {
      case 'startLobby':
        if (!game.isStarted && (game.gameMode === 'idle' || game.gameOver || game.lobbyEndTime <= Date.now())) {
          game.startLobby(30, playerId)
        }
        break
      case 'startSolo':
        if (!game.isStarted && (game.gameOver || game.gameMode === 'idle')) game.startGame([playerId], 'solo', playerId)
        break
      case 'startMultiplayer':
        if (!game.isStarted && game.lobbyEndTime > 0 && game.lobbyEndTime <= Date.now() && game.gameMasterId === playerId) {
          const players = game.playerOrder.filter((id) => !isBotPlayer(id))
          if (players.length > 0) game.startGame(players, 'multiplayer', playerId)
        }
        break
      case 'joinLobby':
        game.tryJoinLobby(playerId)
        break
      case 'continue':
        if (game.gameMasterId === playerId && game.gameOver && !game.matchOver) game.startNextRound()
        break
      case 'leave':
        game.removePlayer(playerId)
        break
      case 'draw':
        game.drawCard(playerId)
        break
      case 'play':
        game.playCard(playerId, data.cardIndex, data.suit ? data.suit as Suit : undefined)
        break
      case 'declareSafe':
        game.declareLowCards(playerId)
        break
      case 'challenge':
        if (game.getCurrentPlayerId() === playerId) game.challengePlayer(playerId, data.targetId.toLowerCase())
        break
    }
  })

  engine.addSystem(() => {
    if (!storageLoaded && Date.now() - lastStorageRetryAt >= 10_000) {
      lastStorageRetryAt = Date.now()
      void loadLeaderboard()
    }

    if (leaderboardDirty && Date.now() - lastSaveAttemptAt >= 5_000) {
      void saveLeaderboard()
    }

    if (game.lobbyEndTime > 0 && !game.isStarted && Date.now() >= game.lobbyEndTime) {
      const players = game.playerOrder.filter((id) => !isBotPlayer(id))
      if (players.length > 0) game.startGame(players, 'multiplayer', game.gameMasterId)
    }

    if (autoContinueAt && Date.now() >= autoContinueAt) {
      autoContinueAt = 0
      if (game.gameMode === 'solo' && game.gameOver && !game.matchOver &&
          game.eliminatedPlayers.has(game.gameMasterId)) game.startNextRound()
    }

    if (pendingBotTurn) {
      const currentPlayer = game.getCurrentPlayerId()
      if (!game.isStarted || game.gameOver || currentPlayer !== pendingBotTurn.botId || !isBotPlayer(currentPlayer || '')) {
        pendingBotTurn = null
      } else if (Date.now() >= pendingBotTurn.executeAt) {
        const botId = pendingBotTurn.botId
        pendingBotTurn = null
        game.runBotTurn(botId)
      }
    }

    game.applyTurnTimeout()
  })
  console.log('[Server] Authoritative Crazy Eights game is ready.')
}
