import { createServer } from 'node:http'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { createHash, randomBytes, randomUUID, timingSafeEqual } from 'node:crypto'
import { URL } from 'node:url'
import { requireSigner, verify } from '@dcl/crypto-middleware'
import { WebSocket, WebSocketServer } from 'ws'
import { BOT_TURN_DELAY_MS, CrazyEightsGame, isBotPlayer } from '../src/game/logic'
import type { GameActionRequest } from '../src/game/logic'
import type { Suit } from '../src/game/deck'
import { getBotName } from '../src/game/bot_names'

const PORT = Number(process.env.PORT || 10000)
const MAX_REQUEST_BYTES = 8 * 1024
const MAX_SETTLEMENTS = 2_000
const HEARTBEAT_INTERVAL_MS = 2_000
const BOT_ABANDONED_DELAY_MS = 150
const AUTH_CHAIN_HEADERS = Array.from({ length: 10 }, (_, index) => `x-identity-auth-chain-${index}`)
  .concat(['x-identity-timestamp', 'x-identity-metadata'])
  .join(',')

interface PlayerSettlement {
  settlementId: string
  matchId: string
  playerId: string
  playerName: string
  gameMode: 'solo' | 'multiplayer'
  actions: Array<{ action: 'card_played' | 'wild_eight' | 'inflict_draw' | 'declare_safe'; count: number }>
  roundWinner: boolean
  matchWinner: boolean
}

interface Ticket {
  expiresAt: number
  playerId: string
  playerName: string
  roomId: string
}

const authTickets = new Map<string, Ticket>()
const rooms = new Map<string, GameRoom>()
const requiredSceneSigner = requireSigner('decentraland-kernel-scene')

function sanitizeName(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value.trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 32)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getRoomId(metadata: Record<string, unknown>): string {
  const realm = isRecord(metadata.realm) ? metadata.realm : {}
  const sceneId = typeof metadata.sceneId === 'string' ? metadata.sceneId.slice(0, 128) : 'crazy8'
  const serverName = typeof realm.serverName === 'string' ? realm.serverName.slice(0, 128) : 'default'
  return `${sceneId}:${serverName}`
}

function sendJson(response: ServerResponse, status: number, value: unknown) {
  const body = JSON.stringify(value)
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': `content-type,authorization,${AUTH_CHAIN_HEADERS}`
  })
  response.end(body)
}

async function readJsonBody(request: IncomingMessage): Promise<{ raw: Buffer; value: unknown }> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.length
    if (size > MAX_REQUEST_BYTES) throw new Error('Request body is too large.')
    chunks.push(buffer)
  }
  const raw = Buffer.concat(chunks)
  if (!raw.length) return { raw, value: {} }
  try {
    return { raw, value: JSON.parse(raw.toString('utf8')) }
  } catch {
    throw new Error('Request body must be valid JSON.')
  }
}

function bodyHashMatches(metadata: Record<string, unknown>, body: Buffer): boolean {
  if (!body.length) return true
  if (typeof metadata.hashPayload !== 'string') return true
  const actualHash = createHash('sha256').update(body).digest('hex')
  return timingSafeEqual(Buffer.from(actualHash), Buffer.from(metadata.hashPayload))
}

function safeTokenEquals(received: string, expected: string): boolean {
  const receivedBytes = Buffer.from(received)
  const expectedBytes = Buffer.from(expected)
  return receivedBytes.length === expectedBytes.length && timingSafeEqual(receivedBytes, expectedBytes)
}

async function handleHttp(request: IncomingMessage, response: ServerResponse) {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  if (request.method === 'OPTIONS') {
    response.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,OPTIONS',
      'access-control-allow-headers': `content-type,authorization,${AUTH_CHAIN_HEADERS}`
    })
    response.end()
    return
  }

  if (request.method === 'GET' && url.pathname === '/healthz') {
    sendJson(response, 200, { ok: true, rooms: rooms.size })
    return
  }

  if (request.method === 'POST' && url.pathname === '/auth') {
    try {
      const { raw, value } = await readJsonBody(request)
      const verification = await verify(
        request.method || 'GET',
        url.pathname,
        request.headers,
        {
          expiration: 60_000,
          canonicalMetadataKeys: ['signer', 'sceneId', 'realm.serverName', 'hashPayload'],
          metadataValidator: (metadata) => requiredSceneSigner(metadata)
        }
      )
      const metadata = verification.authMetadata as Record<string, unknown>
      const realm = isRecord(metadata.realm) ? metadata.realm : {}
      if (typeof metadata.sceneId !== 'string' || !metadata.sceneId ||
          typeof realm.serverName !== 'string' || !realm.serverName) {
        sendJson(response, 401, { ok: false, message: 'The signed Decentraland scene context is missing.' })
        return
      }
      if (!bodyHashMatches(metadata, raw)) {
        sendJson(response, 401, { ok: false, message: 'Signed request body did not match.' })
        return
      }

      const playerId = verification.auth.toLowerCase()
      if (playerId.length < 8 || playerId.length > 128) {
        sendJson(response, 401, { ok: false, message: 'The signed player identity is invalid.' })
        return
      }

      const body = isRecord(value) ? value : {}
      const roomId = getRoomId(metadata)
      let room = rooms.get(roomId)
      if (!room && rooms.size >= 64) {
        sendJson(response, 503, { ok: false, message: 'The game service is temporarily full.' })
        return
      }
      if (!room) room = new GameRoom(roomId)
      rooms.set(roomId, room)

      const ticket = randomBytes(32).toString('base64url')
      authTickets.set(ticket, {
        expiresAt: Date.now() + 60_000,
        playerId,
        playerName: sanitizeName(body.displayName),
        roomId
      })
      sendJson(response, 200, { ok: true, ticket })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Authentication failed.'
      console.warn(`[HTTP] Player authentication rejected: ${message}`)
      sendJson(response, 401, { ok: false, message: 'Could not authenticate this Decentraland player.' })
    }
    return
  }

  if (request.method === 'GET' && url.pathname.startsWith('/internal/settlements')) {
    const configuredToken = process.env.CRAZY8_SETTLEMENT_TOKEN || ''
    const suppliedToken = (request.headers.authorization || '').replace(/^Bearer\s+/i, '')
    if (!configuredToken || !safeTokenEquals(suppliedToken, configuredToken)) {
      sendJson(response, configuredToken ? 401 : 503, { ok: false, message: 'Settlement access is not configured.' })
      return
    }

    const playerId = (url.searchParams.get('playerId') || '').toLowerCase()
    if (playerId.length < 8 || playerId.length > 128) {
      sendJson(response, 400, { ok: false, message: 'A valid playerId is required.' })
      return
    }

    const settlementId = url.pathname.startsWith('/internal/settlements/')
      ? decodeURIComponent(url.pathname.slice('/internal/settlements/'.length))
      : ''
    const results: PlayerSettlement[] = []
    for (const room of rooms.values()) {
      results.push(...room.getSettlements(playerId, settlementId))
    }
    sendJson(response, 200, { ok: true, settlements: results })
    return
  }

  sendJson(response, 404, { ok: false, message: 'Not found.' })
}

const server = createServer((request, response) => {
  void handleHttp(request, response).catch((error) => {
    console.error('[HTTP] Request failed:', error)
    if (!response.headersSent) sendJson(response, 500, { ok: false, message: 'Internal server error.' })
    else response.end()
  })
})

const webSockets = new WebSocketServer({ noServer: true, maxPayload: 64 * 1024 })

server.on('upgrade', (request, socket, head) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`)
  if (url.pathname !== '/ws') {
    socket.destroy()
    return
  }

  const ticket = url.searchParams.get('ticket') || ''
  const details = authTickets.get(ticket)
  authTickets.delete(ticket)
  if (!details || details.expiresAt < Date.now()) {
    socket.write('HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n')
    socket.destroy()
    return
  }

  webSockets.handleUpgrade(request, socket, head, (client) => {
    const room = rooms.get(details.roomId)
    if (!room) {
      client.close(1011, 'Game room unavailable')
      return
    }
    room.connect(client, details.playerId, details.playerName)
  })
})

setInterval(() => {
  const now = Date.now()
  for (const [ticket, details] of authTickets) {
    if (details.expiresAt <= now) authTickets.delete(ticket)
  }
}, 30_000).unref()

setInterval(() => {
  for (const client of webSockets.clients) {
    if (client.readyState === WebSocket.OPEN) client.ping()
  }
}, 30_000).unref()

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Render] Crazy 8 authoritative game server listening on port ${PORT}.`)
  if (!process.env.CRAZY8_SETTLEMENT_TOKEN) {
    console.warn('[Render] CRAZY8_SETTLEMENT_TOKEN is not set; DCL Storage reward claims are disabled.')
  }
})

class GameRoom {
  private readonly game = new CrazyEightsGame()
  private readonly clients = new Set<WebSocket>()
  private readonly names = new Map<string, string>()
  private readonly roundActions = new Map<string, Map<string, number>>()
  private readonly settlements = new Map<string, PlayerSettlement[]>()
  private readonly lastActionAt = new Map<string, number>()
  private pendingBotTurn: { playerId: string; executeAt: number } | null = null
  private autoContinueAt = 0
  private soloMatchAbandoned = false

  constructor(private readonly roomId: string) {
    this.game.playerNameResolver = (playerId) => {
      const knownName = this.names.get(playerId.toLowerCase())
      if (knownName) return knownName
      if (isBotPlayer(playerId)) return getBotName(playerId)
      return playerId.startsWith('0x') && playerId.length > 10
        ? `${playerId.slice(0, 6)}...${playerId.slice(-4)}`
        : playerId
    }
    this.game.onStateChanged = () => this.broadcastState()
    this.game.onBotTurnStart = (playerId) => {
      this.pendingBotTurn = {
        playerId,
        executeAt: Date.now() + (this.soloMatchAbandoned ? BOT_ABANDONED_DELAY_MS : BOT_TURN_DELAY_MS)
      }
    }
    this.game.onCardPlayed = (playerId, card) => {
      this.recordAction(playerId, 'card_played')
      if (card.rank === '8' || card.action === 'Wild' || card.action === 'Draw4') this.recordAction(playerId, 'wild_eight')
      if (card.action === 'Draw2' || card.action === 'Draw4') this.recordAction(playerId, 'inflict_draw')
    }
    this.game.onDeclareSafe = (playerId) => this.recordAction(playerId, 'declare_safe')
    this.game.onRoundEnd = () => this.recordRoundSettlement()

    setInterval(() => this.tick(), 100).unref()
    setInterval(() => this.broadcast({ type: 'heartbeat', at: Date.now() }), HEARTBEAT_INTERVAL_MS).unref()
  }

  connect(client: WebSocket, playerId: string, playerName: string) {
    this.clients.add(client)
    if (playerName) this.names.set(playerId, playerName)
    client.send(JSON.stringify({ type: 'state', state: this.game.serialize() }))
    client.on('message', (raw) => this.handleClientMessage(playerId, raw.toString()))
    client.on('close', () => this.clients.delete(client))
    client.on('error', () => this.clients.delete(client))
  }

  getSettlements(playerId: string, settlementId = ''): PlayerSettlement[] {
    const result: PlayerSettlement[] = []
    for (const [id, settlements] of this.settlements) {
      if (settlementId && id !== settlementId) continue
      const forPlayer = settlements.find((settlement) => settlement.playerId === playerId)
      if (forPlayer) result.push(forPlayer)
    }
    return result
  }

  private recordAction(playerId: string, action: string) {
    const normalizedId = playerId.toLowerCase()
    const actions = this.roundActions.get(normalizedId) || new Map<string, number>()
    actions.set(action, (actions.get(action) || 0) + 1)
    this.roundActions.set(normalizedId, actions)
  }

  private recordRoundSettlement() {
    const result = this.game.lastRoundResult
    if (!result?.settlementId || !this.game.matchId) return

    const records: PlayerSettlement[] = []
    for (const playerId of new Set(this.game.playerOrder.map((id) => id.toLowerCase()))) {
      if (!playerId.startsWith('0x') || playerId.length !== 42 || isBotPlayer(playerId)) continue
      const counts = this.roundActions.get(playerId) || new Map<string, number>()
      const actions = Array.from(counts.entries())
        .filter(([action, count]) => Number.isInteger(count) && count > 0 &&
          (action === 'card_played' || action === 'wild_eight' || action === 'inflict_draw' || action === 'declare_safe'))
        .map(([action, count]) => ({ action: action as PlayerSettlement['actions'][number]['action'], count }))
      records.push({
        settlementId: result.settlementId,
        matchId: this.game.matchId,
        playerId,
        playerName: this.game.getDisplayName(playerId),
        gameMode: result.gameMode === 'solo' ? 'solo' : 'multiplayer',
        actions,
        roundWinner: result.roundWinner?.toLowerCase() === playerId,
        matchWinner: result.winner?.toLowerCase() === playerId
      })
    }
    this.settlements.set(result.settlementId, records)
    while (this.settlements.size > MAX_SETTLEMENTS) {
      const oldest = this.settlements.keys().next().value as string | undefined
      if (!oldest) break
      this.settlements.delete(oldest)
    }
    this.roundActions.clear()

    if (this.game.gameMode === 'solo' && !this.game.matchOver &&
        (this.soloMatchAbandoned || this.game.eliminatedPlayers.has(this.game.gameMasterId))) {
      this.autoContinueAt = Date.now() + (this.soloMatchAbandoned ? 150 : 2_500)
    }
  }

  private handleClientMessage(playerId: string, raw: string) {
    const now = Date.now()
    const previousActionAt = this.lastActionAt.get(playerId) || 0
    if (now - previousActionAt < 100) return
    this.lastActionAt.set(playerId, now)

    let parsed: unknown
    try {
      parsed = JSON.parse(raw)
    } catch {
      return
    }
    if (!isRecord(parsed) || parsed.type !== 'action') return
    const action = parseAction(parsed.action)
    if (!action) return
    this.applyAction(playerId, action)
  }

  private applyAction(playerId: string, request: GameActionRequest) {
    switch (request.action) {
      case 'startLobby':
        if ((!this.game.isStarted || this.game.gameOver) &&
            (this.game.gameMode === 'idle' || this.game.matchOver ||
              (!this.game.isStarted && this.game.lobbyEndTime > 0 && this.game.lobbyEndTime <= Date.now()))) {
          this.game.matchId = randomUUID()
          this.soloMatchAbandoned = false
          this.game.startLobby(30, playerId)
        }
        break
      case 'startSolo':
        if ((!this.game.isStarted && this.game.gameMode === 'idle') || this.game.matchOver) {
          this.game.matchId = randomUUID()
          this.soloMatchAbandoned = false
          this.game.startGame([playerId], 'solo', playerId)
        }
        break
      case 'startMultiplayer':
        if (!this.game.isStarted && this.game.lobbyEndTime > 0 && this.game.lobbyEndTime <= Date.now() &&
            this.game.gameMasterId === playerId) {
          this.startLobbyGame(playerId)
        }
        break
      case 'joinLobby':
        this.game.tryJoinLobby(playerId)
        break
      case 'continue':
        if (this.game.gameMasterId === playerId && this.game.gameOver && !this.game.matchOver) {
          this.autoContinueAt = 0
          this.game.startNextRound()
        }
        break
      case 'leave':
        if (this.game.gameMode === 'solo' && this.game.players.has(playerId)) {
          this.soloMatchAbandoned = true
          if (this.game.gameOver && !this.game.matchOver) this.autoContinueAt = Date.now() + BOT_ABANDONED_DELAY_MS
        }
        this.game.removePlayer(playerId)
        break
      case 'draw':
        this.game.drawCard(playerId)
        break
      case 'play':
        this.game.playCard(playerId, request.cardIndex, request.suit)
        break
      case 'declareSafe':
        this.game.declareLowCards(playerId)
        break
      case 'challenge':
        if (this.game.getCurrentPlayerId() === playerId) this.game.challengePlayer(playerId, request.targetId.toLowerCase())
        break
    }
  }

  private startLobbyGame(hostId: string) {
    const players = this.game.playerOrder.filter((id) => !isBotPlayer(id))
    if (players.length > 0) this.game.startGame(players, 'multiplayer', hostId)
  }

  private tick() {
    const now = Date.now()
    if (this.game.lobbyEndTime > 0 && !this.game.isStarted && now >= this.game.lobbyEndTime) {
      this.startLobbyGame(this.game.gameMasterId)
    }

    if (this.autoContinueAt && now >= this.autoContinueAt) {
      this.autoContinueAt = 0
      if (this.game.gameMode === 'solo' && this.game.gameOver && !this.game.matchOver &&
          (this.soloMatchAbandoned || this.game.eliminatedPlayers.has(this.game.gameMasterId))) {
        this.game.startNextRound()
      }
    }

    if (this.pendingBotTurn) {
      const currentPlayer = this.game.getCurrentPlayerId()
      if (!this.game.isStarted || this.game.gameOver || currentPlayer !== this.pendingBotTurn.playerId || !isBotPlayer(currentPlayer || '')) {
        this.pendingBotTurn = null
      } else if (now >= this.pendingBotTurn.executeAt) {
        const botId = this.pendingBotTurn.playerId
        this.pendingBotTurn = null
        this.game.runBotTurn(botId)
      }
    }

    this.game.applyTurnTimeout()
  }

  private broadcastState() {
    this.broadcast({ type: 'state', state: this.game.serialize() })
  }

  private broadcast(payload: unknown) {
    const message = JSON.stringify(payload)
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) client.send(message)
      else this.clients.delete(client)
    }
  }
}

function parseAction(value: unknown): GameActionRequest | null {
  if (!isRecord(value) || typeof value.action !== 'string') return null
  switch (value.action) {
    case 'startLobby':
    case 'startSolo':
    case 'startMultiplayer':
    case 'joinLobby':
    case 'continue':
    case 'leave':
    case 'draw':
    case 'declareSafe':
      return { action: value.action }
    case 'play':
      if (!Number.isInteger(value.cardIndex) || (value.cardIndex as number) < 0 || (value.cardIndex as number) >= 64) return null
      if (value.suit !== undefined && value.suit !== '' && !['Hearts', 'Diamonds', 'Clubs', 'Spades'].includes(String(value.suit))) return null
      return {
        action: 'play',
        cardIndex: value.cardIndex as number,
        suit: value.suit ? value.suit as Suit : undefined
      }
    case 'challenge':
      if (typeof value.targetId !== 'string' || value.targetId.length > 128) return null
      return { action: 'challenge', targetId: value.targetId }
    default:
      return null
  }
}
