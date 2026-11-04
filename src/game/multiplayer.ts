import { engine, executeTask } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import type { GameActionRequest, CrazyEightsGame } from './logic'
import { GAME_SERVER_HTTP_URL } from './server_config'

export const SERVER_START_TIMEOUT_MS = 120_000

const MAX_RECONNECT_DELAY_MS = 30_000
const HEARTBEAT_TIMEOUT_MS = 15_000

interface GameServerMessage {
  type: string
  state?: string
  playerId?: string
}

function websocketUrl(): string {
  return GAME_SERVER_HTTP_URL.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:')
}

function actionEnvelope(request: GameActionRequest) {
  return { type: 'action', action: request }
}

export function setupMultiplayer(gameEngine: CrazyEightsGame, getLocalPlayerName: () => string = () => '') {
  if (isServer()) return

  let socket: WebSocket | undefined
  let reconnectTimer: ReturnType<typeof setTimeout> | undefined
  let reconnectDelay = 1_000
  let lastHeartbeatAt = 0
  let pendingStartRequest: GameActionRequest | null = null
  let pendingStartRequestedAt = 0
  let shouldReconnect = true

  function send(request: GameActionRequest) {
    if (!socket || socket.readyState !== WebSocket.OPEN) return false
    socket.send(JSON.stringify(actionEnvelope(request)))
    return true
  }

  function requestReconnect() {
    if (!shouldReconnect || reconnectTimer) return
    reconnectTimer = setTimeout(() => {
      reconnectTimer = undefined
      executeTask(async () => {
        await connect()
      })
    }, reconnectDelay)
    reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY_MS)
  }

  async function connect() {
    if (!shouldReconnect) return
    try {
      const { signedFetch } = await import('~system/SignedFetch')
      const auth = await signedFetch({
        url: `${GAME_SERVER_HTTP_URL}/auth`,
        init: {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ displayName: getLocalPlayerName() })
        }
      })
      if (!auth.ok) throw new Error(`Game service authentication failed (${auth.status}).`)

      const credentials = JSON.parse(auth.body) as { ticket?: string }
      if (!credentials.ticket) throw new Error('Game service did not return a connection ticket.')

      const nextSocket = new WebSocket(`${websocketUrl()}/ws?ticket=${encodeURIComponent(credentials.ticket)}`)
      socket = nextSocket
      nextSocket.onopen = () => {
        reconnectDelay = 1_000
        lastHeartbeatAt = Date.now()
        if (pendingStartRequest) {
          const request = pendingStartRequest
          pendingStartRequest = null
          pendingStartRequestedAt = 0
          send(request)
        }
      }
      nextSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(String(event.data)) as GameServerMessage
          if (message.type === 'state' && typeof message.state === 'string') {
            gameEngine.deserialize(message.state)
          } else if (message.type === 'heartbeat') {
            lastHeartbeatAt = Date.now()
          }
        } catch (error) {
          console.error('[Game] Could not read the Render game server message:', error)
        }
      }
      nextSocket.onerror = () => {
        console.error('[Game] The Render game server connection encountered an error.')
      }
      nextSocket.onclose = () => {
        if (socket === nextSocket) socket = undefined
        requestReconnect()
      }
    } catch (error) {
      console.error('[Game] Could not connect to the Render game server:', error)
      requestReconnect()
    }
  }

  gameEngine.onClientActionRequest = (request: GameActionRequest) => {
    if (send(request)) return
    if (request.action === 'startSolo' || request.action === 'startLobby') {
      pendingStartRequest = request
      pendingStartRequestedAt = Date.now()
    }
  }

  executeTask(async () => {
    await connect()
  })

  // A silent WebSocket can survive a broken route for much longer than a turn.
  // Closing it here lets the normal reconnect path restore the authoritative snapshot.
  engine.addSystem(() => {
    if (pendingStartRequest && Date.now() - pendingStartRequestedAt >= SERVER_START_TIMEOUT_MS) {
      pendingStartRequest = null
      pendingStartRequestedAt = 0
    }
    if (!socket || socket.readyState !== WebSocket.OPEN || !lastHeartbeatAt) return
    if (Date.now() - lastHeartbeatAt > HEARTBEAT_TIMEOUT_MS) socket.close()
  })
}
