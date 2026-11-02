import { engine, Schemas } from '@dcl/sdk/ecs'
import { isServer, isStateSyncronized, syncEntity } from '@dcl/sdk/network'
import { AUTH_SERVER_PEER_ID } from '@dcl/sdk/network/message-bus-sync'
import { GameActionRequest, CrazyEightsGame } from './logic'
import { sceneRoom } from '../shared/messages'

export const SyncGameState = engine.defineComponent('game::SyncState', {
  stateJson: Schemas.String,
  updateId: Schemas.Int64,
  lastUpdater: Schemas.String
})

if (isServer()) {
  SyncGameState.validateBeforeChange((value) => value.senderAddress === AUTH_SERVER_PEER_ID)
}

// Use a new id so the server does not collide with the client-owned id from older builds.
const SERVER_GAME_STATE_ID = 2
let serverStateEntity: ReturnType<typeof engine.addEntity> | undefined
let localUpdateId = 0

export function createAuthoritativeGameState(game: CrazyEightsGame): ReturnType<typeof engine.addEntity> {
  if (!isServer()) throw new Error('Only the authoritative server may create the shared game state.')

  const entity = engine.addEntity()
  SyncGameState.create(entity, {
    stateJson: game.serialize(),
    updateId: Date.now(),
    lastUpdater: 'authoritative-server'
  })
  syncEntity(entity, [SyncGameState.componentId], SERVER_GAME_STATE_ID)
  serverStateEntity = entity
  return entity
}

export function publishAuthoritativeGameState(game: CrazyEightsGame) {
  if (!isServer() || serverStateEntity === undefined) return
  const state = SyncGameState.getMutable(serverStateEntity)
  state.stateJson = game.serialize()
  state.updateId = Math.max(Date.now(), state.updateId + 1)
  state.lastUpdater = 'authoritative-server'
}

export function setupMultiplayer(gameEngine: CrazyEightsGame, getLocalPlayerName: () => string = () => '') {
  if (isServer()) return

  gameEngine.onClientActionRequest = (request: GameActionRequest) => {
    const cardRequest = request.action === 'play' ? request : undefined
    void sceneRoom.send('gameAction', {
      action: request.action,
      playerName: getLocalPlayerName(),
      mode: request.action === 'startSolo' ? 'solo' : '',
      cardIndex: cardRequest?.cardIndex ?? -1,
      suit: cardRequest?.suit || '',
      targetId: request.action === 'challenge' ? request.targetId : ''
    })
  }

  engine.addSystem(() => {
    if (!isStateSyncronized()) return

    for (const [entity] of engine.getEntitiesWith(SyncGameState)) {
      const state = SyncGameState.getOrNull(entity)
      if (!state || state.lastUpdater !== 'authoritative-server' || !state.stateJson || state.updateId <= localUpdateId) continue

      try {
        const parsed = JSON.parse(state.stateJson)
        if (!parsed || !Array.isArray(parsed.playerOrder)) continue
        localUpdateId = state.updateId
        gameEngine.deserialize(state.stateJson)
      } catch (error) {
        console.error('Failed to read authoritative game state:', error)
      }
    }
  })
}

