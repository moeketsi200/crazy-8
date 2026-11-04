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
  economyAction: Schemas.Map({
    requestId: Schemas.Int64,
    action: Schemas.String,
    itemId: Schemas.String,
    questId: Schemas.String,
    settlementId: Schemas.String
  }),
  economyProfile: Schemas.Map({
    requestId: Schemas.Int64,
    success: Schemas.Boolean,
    message: Schemas.String,
    profileJson: Schemas.String,
    resultJson: Schemas.String
  })
}

export const sceneRoom = registerMessages(SceneMessages)
