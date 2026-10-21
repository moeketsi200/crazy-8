import { engine, Schemas, Transform } from '@dcl/sdk/ecs'
import { syncEntity, isStateSyncronized } from '@dcl/sdk/network'
import { CrazyEightsGame } from './logic'
import { getPlayer } from '@dcl/sdk/src/players'

// Define a custom CRDT component for synchronizing the game state
export const SyncGameState = engine.defineComponent('game::SyncState', {
  stateJson: Schemas.String,
  updateId: Schemas.Int64,
  lastUpdater: Schemas.String
})

// Unique ID for the singleton entity that holds the game state
enum SyncIds {
  GAME_STATE = 1
}

export let syncEntityInstance: any

export function setupMultiplayer(gameEngine: CrazyEightsGame) {
  // Create a singleton entity for syncing the game state
  syncEntityInstance = engine.addEntity()
  Transform.create(syncEntityInstance)
  
  SyncGameState.create(syncEntityInstance, {
    stateJson: gameEngine.serialize(),
    updateId: Date.now(),
    lastUpdater: ''
  })
  
  // Register with SDK7 CRDT network
  syncEntity(syncEntityInstance, [SyncGameState.componentId], SyncIds.GAME_STATE)

  let localUpdateId = Date.now()
  let hasAppliedInitialSync = false

  // System to detect remote changes to the SyncGameState component
  engine.addSystem(() => {
    if (!isStateSyncronized()) return

    const currentState = SyncGameState.getOrNull(syncEntityInstance)
    if (currentState && currentState.stateJson) {
      // Validate that stateJson is non-empty before deserializing
      let isValidPayload = false
      try {
        const parsed = JSON.parse(currentState.stateJson)
        if (parsed && Array.isArray(parsed.playerOrder) && parsed.playerOrder.length > 0) {
          isValidPayload = true
        }
      } catch {}

      if (isValidPayload) {
        if (currentState.updateId > localUpdateId) {
          localUpdateId = currentState.updateId
          gameEngine.deserialize(currentState.stateJson)
        } else if (!hasAppliedInitialSync) {
          localUpdateId = currentState.updateId
          gameEngine.deserialize(currentState.stateJson)
          hasAppliedInitialSync = true
        }
      }
    }
  })
}

// Helper to push our local state to the network
export function pushGameState(gameEngine: CrazyEightsGame) {
  if (!syncEntityInstance || !isStateSyncronized()) return
  
  const mutableState = SyncGameState.getMutable(syncEntityInstance)
  mutableState.stateJson = gameEngine.serialize()
  mutableState.updateId = Date.now()
  
  const player = getPlayer()
  mutableState.lastUpdater = player ? player.userId : 'unknown'
}

