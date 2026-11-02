import { Schemas } from '@dcl/sdk/ecs'
import { registerMessages } from '@dcl/sdk/network'

export const SceneMessages = {
  gameAction: Schemas.Map({
    action: Schemas.String,
    playerName: Schemas.String,
    mode: Schemas.String,
    cardIndex: Schemas.Int,
    suit: Schemas.String,
    targetId: Schemas.String
  }),
  gameplayEvent: Schemas.Map({
    eventId: Schemas.Int64,
    event: Schemas.String,
    playerId: Schemas.String,
    rank: Schemas.String,
    cardAction: Schemas.String
  })
}

export const sceneRoom = registerMessages(SceneMessages)
