import { engine } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import { EnvVar, Storage } from '@dcl/sdk/server'
import {
  applyEconomyRequestToProfile,
  applyGameplayActionToProfile,
  createDefaultProfile,
  grantCurrencyToProfile,
  normalizePlayerProfile,
  rollDailyQuests
} from '../game/economy'
import type { EconomyActionResult, EconomyRequestAction, PlayerProfile } from '../game/economy'
import { isBotPlayer } from '../game/logic'
import type { CrazyEightsGame, PlayerLeaderboardStats } from '../game/logic'
import { sceneRoom } from '../shared/messages'

const PLAYER_PROFILE_KEY = 'crazy8_player_profile_v1'
const LEADERBOARD_STORAGE_KEY = 'crazy8_leaderboard_v1'
const LEADERBOARD_VERSION = 1
const PROFILE_FLUSH_INTERVAL_MS = 10_000
const MAX_SETTLEMENT_ACTION_COUNT = 1_000

interface RenderSettlement {
  settlementId: string
  playerId: string
  playerName: string
  actions: Array<{ action: string; count: number }>
  roundWinner: boolean
  matchWinner: boolean
  gameMode: 'solo' | 'multiplayer'
}

let renderConfig: Promise<{ baseUrl: string; token: string; storageBackend: string }> | undefined

async function getRenderConfig() {
  if (!renderConfig) {
    renderConfig = Promise.all([
      EnvVar.get('CRAZY8_RENDER_URL'),
      EnvVar.get('CRAZY8_SETTLEMENT_TOKEN'),
      EnvVar.get('CRAZY8_STORAGE_BACKEND')
    ]).then(([baseUrl, token, storageBackend]) => ({
      baseUrl: baseUrl.replace(/\/+$/, ''),
      token,
      storageBackend: storageBackend.toLowerCase()
    }))
  }
  return renderConfig
}

interface RenderRequestInit {
  method: 'GET' | 'POST' | 'DELETE'
  headers?: Record<string, string>
  body?: string
}

async function renderStorageRequest<T>(url: string, init: RenderRequestInit): Promise<T> {
  const { baseUrl, token } = await getRenderConfig()
  if (!baseUrl || !token) throw new Error('Render storage needs CRAZY8_RENDER_URL and CRAZY8_SETTLEMENT_TOKEN.')
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Render storage request timed out.')), 5_000)
    })
    const response = await Promise.race([
      fetch(`${baseUrl}${url}`, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` }
      }),
      timeoutPromise
    ])
    if (!response.ok) throw new Error(`Render storage request returned ${response.status}.`)
    return await response.json() as T
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

async function readRenderStorage(namespace: 'player' | 'scene', key: string, playerId = '') {
  const path = namespace === 'player' ? '/internal/storage/player' : '/internal/storage/scene'
  const query = `key=${encodeURIComponent(key)}` +
    (namespace === 'player' ? `&playerId=${encodeURIComponent(playerId)}` : '')
  return renderStorageRequest<{ ok?: boolean; found?: boolean; value?: unknown }>(
    `${path}?${query}`, { method: 'GET' }
  )
}

async function writeRenderStorage(
  namespace: 'player' | 'scene',
  key: string,
  value: unknown,
  playerId = '',
  onlyIfMissing = false
) {
  const path = namespace === 'player' ? '/internal/storage/player' : '/internal/storage/scene'
  return renderStorageRequest<{ ok?: boolean; saved?: boolean; created?: boolean }>(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ key, value, playerId, onlyIfMissing })
  })
}

async function readProfileStorage(playerId: string): Promise<string | null> {
  const { storageBackend } = await getRenderConfig()
  if (storageBackend !== 'render') return Storage.player.get<string>(playerId, PLAYER_PROFILE_KEY)

  const stored = await readRenderStorage('player', PLAYER_PROFILE_KEY, playerId)
  if (stored.found) {
    if (typeof stored.value !== 'string') throw new Error('Render player profile storage has an invalid value.')
    return stored.value
  }

  const legacy = await Storage.player.get<string>(playerId, PLAYER_PROFILE_KEY)
  if (legacy === null) return null
  await writeRenderStorage('player', PLAYER_PROFILE_KEY, legacy, playerId, true)
  const migrated = await readRenderStorage('player', PLAYER_PROFILE_KEY, playerId)
  return migrated.found && typeof migrated.value === 'string' ? migrated.value : legacy
}

async function saveProfileStorage(playerId: string, profile: PlayerProfile): Promise<boolean> {
  const { storageBackend } = await getRenderConfig()
  if (storageBackend !== 'render') {
    return Storage.player.set(playerId, PLAYER_PROFILE_KEY, JSON.stringify(profile))
  }
  const result = await writeRenderStorage('player', PLAYER_PROFILE_KEY, JSON.stringify(profile), playerId)
  return result.ok === true && result.saved === true
}

async function readLeaderboardStorage(): Promise<{
  version: number
  records: PlayerLeaderboardStats[]
  processedSettlementIds?: string[]
} | null> {
  const { storageBackend } = await getRenderConfig()
  if (storageBackend !== 'render') {
    return Storage.get<{
      version: number
      records: PlayerLeaderboardStats[]
      processedSettlementIds?: string[]
    }>(LEADERBOARD_STORAGE_KEY)
  }
  const stored = await readRenderStorage('scene', LEADERBOARD_STORAGE_KEY)
  if (stored.found) {
    if (!stored.value || typeof stored.value !== 'object' || Array.isArray(stored.value)) {
      throw new Error('Render leaderboard storage has an invalid value.')
    }
    return stored.value as {
      version: number
      records: PlayerLeaderboardStats[]
      processedSettlementIds?: string[]
    }
  }
  const legacy = await Storage.get<{
    version: number
    records: PlayerLeaderboardStats[]
    processedSettlementIds?: string[]
  }>(LEADERBOARD_STORAGE_KEY)
  if (legacy === null) return null
  await writeRenderStorage('scene', LEADERBOARD_STORAGE_KEY, legacy, '', true)
  const migrated = await readRenderStorage('scene', LEADERBOARD_STORAGE_KEY)
  return migrated.found ? migrated.value as typeof legacy : legacy
}

async function saveLeaderboardStorage(value: {
  version: number
  records: PlayerLeaderboardStats[]
  processedSettlementIds: string[]
}): Promise<boolean> {
  const { storageBackend } = await getRenderConfig()
  if (storageBackend !== 'render') return Storage.set(LEADERBOARD_STORAGE_KEY, value)
  const result = await writeRenderStorage('scene', LEADERBOARD_STORAGE_KEY, value)
  return result.ok === true && result.saved === true
}

async function acknowledgeRenderSettlement(playerId: string, settlementId: string): Promise<boolean> {
  const { baseUrl, token } = await getRenderConfig()
  if (!baseUrl || !token) return false
  const query = `playerId=${encodeURIComponent(playerId)}&settlementId=${encodeURIComponent(settlementId)}`
  try {
    const result = await renderStorageRequest<{ ok?: boolean; deleted?: boolean }>(
      `/internal/settlements?${query}`, { method: 'DELETE' }
    )
    return result.ok === true && result.deleted === true
  } catch (error) {
    console.warn(`[Server] Could not acknowledge saved settlement ${settlementId}:`, error)
    return false
  }
}

async function fetchRenderSettlements(playerId: string, settlementId = ''): Promise<RenderSettlement[]> {
  const { baseUrl, token, storageBackend } = await getRenderConfig()
  if ((!baseUrl || !token) && storageBackend === 'render') {
    throw new Error('Render storage needs CRAZY8_RENDER_URL and CRAZY8_SETTLEMENT_TOKEN.')
  }
  if (!baseUrl || !token) return []

  const base = `${baseUrl}/internal/settlements`
  const path = settlementId ? `${base}/${encodeURIComponent(settlementId)}` : base
  const url = `${path}?playerId=${encodeURIComponent(playerId)}`
  let timeout: ReturnType<typeof setTimeout> | undefined
  try {
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeout = setTimeout(() => reject(new Error('Render settlement lookup timed out.')), 5_000)
    })
    const response = await Promise.race([
      fetch(url, { headers: { Authorization: `Bearer ${token}` } }),
      timeoutPromise
    ])
    if (!response.ok) throw new Error(`Render settlement lookup returned ${response.status}.`)
    const payload = await response.json() as { ok?: boolean; settlements?: unknown }
    if (!payload.ok || !Array.isArray(payload.settlements)) return []
    return payload.settlements.filter((item): item is RenderSettlement => {
      return !!item && typeof item === 'object' &&
        typeof (item as RenderSettlement).settlementId === 'string' &&
        typeof (item as RenderSettlement).playerId === 'string' &&
        typeof (item as RenderSettlement).playerName === 'string' &&
        Array.isArray((item as RenderSettlement).actions) &&
        typeof (item as RenderSettlement).roundWinner === 'boolean' &&
        typeof (item as RenderSettlement).matchWinner === 'boolean' &&
        ((item as RenderSettlement).gameMode === 'solo' || (item as RenderSettlement).gameMode === 'multiplayer')
    })
  } finally {
    if (timeout) clearTimeout(timeout)
  }
}

function applySettlement(profile: PlayerProfile, playerId: string, settlement: RenderSettlement): boolean {
  const normalizedId = playerId.toLowerCase()
  if (settlement.playerId.toLowerCase() !== normalizedId || !settlement.settlementId ||
      profile.processedSettlementIds.includes(settlement.settlementId)) return false

  rollDailyQuests(profile)
  for (const entry of settlement.actions) {
    if (!entry || !Number.isFinite(entry.count)) continue
    const count = Math.max(0, Math.min(MAX_SETTLEMENT_ACTION_COUNT, Math.floor(entry.count)))
    if (count === 0) continue
    if (entry.action === 'card_played' || entry.action === 'wild_eight' ||
        entry.action === 'inflict_draw' || entry.action === 'declare_safe') {
      applyGameplayActionToProfile(profile, entry.action, count)
    }
  }
  applyGameplayActionToProfile(profile, 'match_finished')
  if (settlement.roundWinner) applyGameplayActionToProfile(profile, 'round_won')

  if (settlement.matchWinner) {
    grantCurrencyToProfile(profile, settlement.gameMode === 'solo' ? 30 : 150,
      settlement.gameMode === 'solo' ? 5 : 20)
    applyGameplayActionToProfile(profile, 'match_won')
    if (settlement.gameMode === 'solo') applyGameplayActionToProfile(profile, 'solo_won')
  } else {
    grantCurrencyToProfile(profile, 30, 5)
  }

  profile.processedSettlementIds.push(settlement.settlementId)
  if (profile.processedSettlementIds.length > 2_000) profile.processedSettlementIds.splice(0, profile.processedSettlementIds.length - 2_000)
  return true
}

function isWalletAddress(value: string): boolean {
  return /^0x[a-f0-9]{40}$/i.test(value)
}

function sanitizeName(name: string): string {
  return name.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 32)
}

function isLeaderboardStat(value: unknown): value is PlayerLeaderboardStats {
  if (!value || typeof value !== 'object') return false
  const stat = value as Partial<PlayerLeaderboardStats>
  return typeof stat.playerId === 'string' && typeof stat.name === 'string' &&
    Number.isFinite(stat.gamesWon) && Number.isFinite(stat.weeklyWins) &&
    Number.isFinite(stat.roundsWon) && typeof stat.weekKey === 'string'
}

function getLeaderboardWeekKey(date = new Date()): string {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = utcDate.getUTCDay() || 7
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7)
  return `${utcDate.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

export function setupPersistentPlayerEconomy(game?: CrazyEightsGame) {
  if (!isServer()) return

  const profiles = new Map<string, PlayerProfile>()
  const dirtyProfiles = new Set<string>()
  const saveQueued = new Set<string>()
  const queues = new Map<string, Promise<unknown>>()
  let lastFlushAt = Date.now()
  let leaderboardCache: PlayerLeaderboardStats[] | undefined
  const processedLeaderboardSettlements = new Set<string>()
  let leaderboardDirty = false
  let lastLeaderboardFlushAt = 0
  let leaderboardQueue: Promise<unknown> = Promise.resolve()

  function serializeLeaderboard<T>(operation: () => Promise<T>): Promise<T> {
    const current = leaderboardQueue.then(operation, operation)
    leaderboardQueue = current.then(() => undefined, () => undefined)
    return current
  }

  async function loadLeaderboardCache() {
    if (leaderboardCache) return leaderboardCache
    const stored = await readLeaderboardStorage()
    const candidate = stored && stored.version === LEADERBOARD_VERSION && Array.isArray(stored.records)
      ? stored.records.filter(isLeaderboardStat)
      : []
    if (Array.isArray(stored?.processedSettlementIds)) {
      for (const id of stored.processedSettlementIds) {
        if (typeof id === 'string') processedLeaderboardSettlements.add(id)
      }
    }
    leaderboardCache = candidate.map((record) => ({
      playerId: record.playerId.toLowerCase(),
      name: sanitizeName(record.name),
      gamesWon: Math.max(0, Math.floor(record.gamesWon)),
      weeklyWins: Math.max(0, Math.floor(record.weeklyWins)),
      roundsWon: Math.max(0, Math.floor(record.roundsWon)),
      weekKey: record.weekKey
    }))
    return leaderboardCache
  }

  async function flushLeaderboardCache(): Promise<boolean> {
    if (!leaderboardDirty || !leaderboardCache) return true
    const saved = await saveLeaderboardStorage({
      version: LEADERBOARD_VERSION,
      records: leaderboardCache,
      processedSettlementIds: Array.from(processedLeaderboardSettlements)
    })
    if (saved) {
      leaderboardDirty = false
      return true
    }
    console.error('[Server] Leaderboard save did not persist; it will retry.')
    return false
  }

  async function syncLeaderboardFromSettlement(settlement: RenderSettlement): Promise<boolean> {
    const playerId = settlement.playerId.toLowerCase()
    if (!settlement.settlementId || !isWalletAddress(playerId) || isBotPlayer(playerId)) return true
    const processedId = `${settlement.settlementId}:${playerId}`
    return serializeLeaderboard(async () => {
      const records = await loadLeaderboardCache()
      if (processedLeaderboardSettlements.has(processedId)) {
        return flushLeaderboardCache()
      }

      const weekKey = getLeaderboardWeekKey()
      const index = records.findIndex((record) => record.playerId === playerId)
      if (index === -1 && !settlement.roundWinner && !settlement.matchWinner) {
        processedLeaderboardSettlements.add(processedId)
        leaderboardDirty = true
        return flushLeaderboardCache()
      }
      const record = index === -1
        ? { playerId, name: sanitizeName(settlement.playerName) || playerId, gamesWon: 0, weeklyWins: 0, roundsWon: 0, weekKey }
        : records[index]
      if (record.weekKey !== weekKey) {
        record.weekKey = weekKey
        record.weeklyWins = 0
      }
      if (settlement.playerName) record.name = sanitizeName(settlement.playerName) || record.name
      if (settlement.roundWinner) record.roundsWon += 1
      if (settlement.matchWinner) {
        record.gamesWon += 1
        record.weeklyWins += 1
      }
      if (index === -1) records.push(record)
      processedLeaderboardSettlements.add(processedId)
      while (processedLeaderboardSettlements.size > 5_000) {
        const oldest = processedLeaderboardSettlements.values().next().value as string | undefined
        if (!oldest) break
        processedLeaderboardSettlements.delete(oldest)
      }
      leaderboardDirty = true
      return flushLeaderboardCache()
    })
  }

  async function getLeaderboardSnapshot() {
    return serializeLeaderboard(async () => {
      await loadLeaderboardCache()
      await flushLeaderboardCache()
      return (leaderboardCache || []).map((record) => ({ ...record }))
    })
  }

  function serialize<T>(playerId: string, operation: () => Promise<T>): Promise<T> {
    const previous = queues.get(playerId) || Promise.resolve()
    const current = previous.catch(() => undefined).then(operation)
    queues.set(playerId, current)
    void current.finally(() => {
      if (queues.get(playerId) === current) queues.delete(playerId)
    }).catch(() => undefined)
    return current
  }

  async function loadProfile(playerId: string): Promise<{ profile: PlayerProfile; saved: boolean }> {
    const cached = profiles.get(playerId)
    if (cached) return { profile: cached, saved: !dirtyProfiles.has(playerId) }

    const stored = await readProfileStorage(playerId)
    const profile = stored === null ? createDefaultProfile() : normalizePlayerProfile(stored)
    const rolledQuests = rollDailyQuests(profile)
    profiles.set(playerId, profile)

    if (stored === null || rolledQuests) {
      const saved = await saveProfile(playerId, profile)
      return { profile, saved }
    }
    return { profile, saved: true }
  }

  async function saveProfile(playerId: string, profile: PlayerProfile): Promise<boolean> {
    try {
      const saved = await saveProfileStorage(playerId, profile)
      if (saved) {
        dirtyProfiles.delete(playerId)
        return true
      }
      dirtyProfiles.add(playerId)
      console.error(`[Server] Profile save did not persist for ${playerId}; it will retry.`)
      return false
    } catch (error) {
      dirtyProfiles.add(playerId)
      console.error(`[Server] Profile save failed for ${playerId}; it will retry.`, error)
      return false
    }
  }

  async function sendProfile(
    playerId: string,
    requestId: number,
    profileJson: string,
    success: boolean,
    message = '',
    result: unknown = {}
  ) {
    try {
      await sceneRoom.send('economyProfile', {
        requestId,
        success,
        message,
        profileJson,
        resultJson: JSON.stringify(result)
      }, { to: [playerId] })
    } catch (error) {
      console.error(`[Server] Could not send profile update to ${playerId}:`, error)
    }
  }

  async function updateFromGameplay(playerId: string, actions: Array<{ action: 'card_played' | 'wild_eight' | 'inflict_draw' | 'declare_safe'; count?: number }>) {
    if (!isWalletAddress(playerId) || isBotPlayer(playerId)) return
    try {
      await serialize(playerId, async () => {
        const { profile } = await loadProfile(playerId)
        rollDailyQuests(profile)
        for (const entry of actions) applyGameplayActionToProfile(profile, entry.action, entry.count ?? 1)
        if (!dirtyProfiles.has(playerId)) dirtyProfiles.add(playerId)
        await sendProfile(playerId, 0, JSON.stringify(profile), true)
      })
    } catch (error) {
      console.error(`[Server] Could not update gameplay progress for ${playerId}:`, error)
    }
  }

  sceneRoom.onMessage('economyAction', (data, context) => {
    const playerId = context?.from?.toLowerCase()
    if (!playerId || !isWalletAddress(playerId)) return

    const requestId = Number.isFinite(data.requestId) ? data.requestId : 0
    if (data.action === 'claimMatchResult') {
      const settlementId = typeof data.settlementId === 'string' ? data.settlementId : ''
      if (!settlementId || settlementId.length > 160) {
        void sendProfile(playerId, requestId, '', false, 'That match result could not be verified.')
        return
      }
      void serialize(playerId, async () => {
        try {
          const loaded = await loadProfile(playerId)
          const settlements = await fetchRenderSettlements(playerId, settlementId)
          const matching = settlements.find((settlement) => settlement.settlementId === settlementId)
          if (!matching) {
            await sendProfile(playerId, requestId, JSON.stringify(loaded.profile), false,
              'Match rewards are waiting for the game service to reconnect.')
            return
          }

          const leaderboardSaved = await syncLeaderboardFromSettlement(matching)
          const draft = normalizePlayerProfile(loaded.profile)
          const changed = applySettlement(draft, playerId, matching)
          if (!changed) {
            const alreadySaved = !dirtyProfiles.has(playerId)
            if (alreadySaved && leaderboardSaved) await acknowledgeRenderSettlement(playerId, settlementId)
            let leaderboard: PlayerLeaderboardStats[] = []
            try {
              leaderboard = await getLeaderboardSnapshot()
            } catch (error) {
              console.error('[Server] Could not read the saved leaderboard:', error)
            }
            await sendProfile(playerId, requestId, JSON.stringify(loaded.profile), alreadySaved,
              alreadySaved ? 'This match result was already saved.' : 'Your match rewards will retry when storage reconnects.',
              { leaderboard })
            return
          }
          const saved = await saveProfile(playerId, draft)
          profiles.set(playerId, draft)
          if (saved) {
            if (leaderboardSaved) await acknowledgeRenderSettlement(playerId, settlementId)
            let leaderboard: PlayerLeaderboardStats[] = []
            try {
              leaderboard = await getLeaderboardSnapshot()
            } catch (error) {
              console.error('[Server] Could not read the saved leaderboard:', error)
            }
            await sendProfile(playerId, requestId, JSON.stringify(draft), true, 'Match rewards saved.', { leaderboard })
          } else {
            await sendProfile(playerId, requestId, JSON.stringify(loaded.profile), false,
              'Your match rewards will retry when storage reconnects.')
          }
        } catch (error) {
          console.error(`[Server] Could not claim Render match result for ${playerId}:`, error)
          await sendProfile(playerId, requestId, '', false, 'Could not verify match rewards right now.')
        }
      })
      return
    }

    if (data.action !== 'load' && data.action !== 'claimStreak' && data.action !== 'claimQuest' &&
        data.action !== 'buyItem' && data.action !== 'equipItem') {
      void sendProfile(playerId, requestId, '', false, 'Unknown profile action.')
      return
    }
    const action = data.action as EconomyRequestAction

    void serialize(playerId, async () => {
      try {
        const loaded = await loadProfile(playerId)
        const current = loaded.profile
        if (action === 'load') {
          try {
            const settlements = await fetchRenderSettlements(playerId)
            let leaderboardSaved = true
            for (const settlement of settlements) {
              const saved = await syncLeaderboardFromSettlement(settlement)
              leaderboardSaved = saved && leaderboardSaved
            }
            const draft = normalizePlayerProfile(current)
            const changed = settlements.reduce((didChange, settlement) => applySettlement(draft, playerId, settlement) || didChange, false)
            let profileSaved = !dirtyProfiles.has(playerId)
            if (changed) {
              profiles.set(playerId, draft)
              profileSaved = await saveProfile(playerId, draft)
              if (!profileSaved) console.error(`[Server] Render settlements for ${playerId} are queued for a storage retry.`)
            }
            if (profileSaved && leaderboardSaved) {
              for (const settlement of settlements) {
                await acknowledgeRenderSettlement(playerId, settlement.settlementId)
              }
            }
          } catch (error) {
            console.error(`[Server] Could not sync saved Render match results for ${playerId}:`, error)
          }
          const refreshed = profiles.get(playerId) || current
          let leaderboard: PlayerLeaderboardStats[] = []
          try {
            leaderboard = await getLeaderboardSnapshot()
          } catch (error) {
              console.error('[Server] Could not read the saved leaderboard:', error)
          }
          await sendProfile(
            playerId,
            requestId,
            JSON.stringify(refreshed),
            !dirtyProfiles.has(playerId),
            dirtyProfiles.has(playerId) ? 'Profile storage is temporarily unavailable. Retrying…' : '',
            { leaderboard }
          )
          return
        }

        const draft = normalizePlayerProfile(current)
        const result: EconomyActionResult = applyEconomyRequestToProfile(draft, action, data.itemId, data.questId)
        const draftJson = JSON.stringify(draft)
        const currentJson = JSON.stringify(current)
        const needsSave = result.success || draftJson !== currentJson

        if (needsSave) {
          const saved = await saveProfile(playerId, draft)
          if (saved) {
            profiles.set(playerId, draft)
            await sendProfile(playerId, requestId, draftJson, result.success, result.message, result.result)
          } else {
            await sendProfile(playerId, requestId, currentJson, false, 'Could not save that change. Please try again.')
          }
        } else {
          await sendProfile(playerId, requestId, currentJson, false, result.message, result.result)
        }
      } catch (error) {
        console.error(`[Server] Could not process profile action for ${playerId}:`, error)
        await sendProfile(playerId, requestId, '', false, 'Could not load your saved profile. Please try again.')
      }
    })
  })

  if (game) {
    const previousOnCardPlayed = game.onCardPlayed
    game.onCardPlayed = (playerId, card) => {
      previousOnCardPlayed?.(playerId, card)
      if (isBotPlayer(playerId)) return
      const actions: Array<{ action: 'card_played' | 'wild_eight' | 'inflict_draw' }> = [{ action: 'card_played' }]
      if (card.rank === '8' || card.action === 'Wild' || card.action === 'Draw4') actions.push({ action: 'wild_eight' })
      if (card.action === 'Draw2' || card.action === 'Draw4') actions.push({ action: 'inflict_draw' })
      void updateFromGameplay(playerId.toLowerCase(), actions)
    }

    const previousOnDeclareSafe = game.onDeclareSafe
    game.onDeclareSafe = (playerId) => {
      previousOnDeclareSafe?.(playerId)
      void updateFromGameplay(playerId.toLowerCase(), [{ action: 'declare_safe' }])
    }

    const previousOnRoundEnd = game.onRoundEnd
    game.onRoundEnd = (eliminated, winner, scoreBreakdown, roundWinner) => {
      previousOnRoundEnd?.(eliminated, winner, scoreBreakdown, roundWinner)
      const result = game.lastRoundResult
      if (!result) return

      for (const playerId of new Set(game.playerOrder.map(id => id.toLowerCase()))) {
        if (!isWalletAddress(playerId) || isBotPlayer(playerId)) continue
        void serialize(playerId, async () => {
          try {
            const { profile } = await loadProfile(playerId)
            rollDailyQuests(profile)
            applyGameplayActionToProfile(profile, 'match_finished')
            if (result.roundWinner?.toLowerCase() === playerId) applyGameplayActionToProfile(profile, 'round_won')

            const isOverallWinner = result.winner?.toLowerCase() === playerId
            grantCurrencyToProfile(profile, isOverallWinner ? (result.gameMode === 'solo' ? 30 : 150) : 30,
              isOverallWinner ? (result.gameMode === 'solo' ? 5 : 20) : 5)
            if (isOverallWinner) {
              applyGameplayActionToProfile(profile, 'match_won')
              if (result.gameMode === 'solo') applyGameplayActionToProfile(profile, 'solo_won')
            }

            const saved = await saveProfile(playerId, profile)
            await sendProfile(playerId, 0, JSON.stringify(profile), saved,
              saved ? '' : 'Your round reward is waiting for the server storage to reconnect.')
          } catch (error) {
            console.error(`[Server] Could not award round rewards to ${playerId}:`, error)
          }
        })
      }
    }
  }

  engine.addSystem(() => {
    const now = Date.now()
    if (leaderboardDirty && now - lastLeaderboardFlushAt >= 5_000) {
      lastLeaderboardFlushAt = now
      void serializeLeaderboard(flushLeaderboardCache).catch((error) => {
        console.error('[Server] Could not flush leaderboard results:', error)
      })
    }
    if (now - lastFlushAt < PROFILE_FLUSH_INTERVAL_MS) return
    lastFlushAt = now

    for (const playerId of dirtyProfiles) {
      if (saveQueued.has(playerId)) continue
      saveQueued.add(playerId)
      void serialize(playerId, async () => {
        try {
          const profile = profiles.get(playerId)
          if (profile && dirtyProfiles.has(playerId)) await saveProfile(playerId, profile)
        } catch (error) {
          console.error(`[Server] Could not flush profile progress for ${playerId}:`, error)
        } finally {
          saveQueued.delete(playerId)
        }
      })
    }
  })
}
