import { engine, Transform, TextShape, Entity, TextAlignMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

export let scoreTextEntity: Entity

export function buildScoreBoard(parentHouse: Entity) {
  // We place the text directly on the Flat Screen TV in the media unit!
  // The TV and stand were scaled up by 1.7x in furniture.ts
  // New TV Screen world pos relative to house: X = -7.049, Y = 3.145, Z = 0.905
  scoreTextEntity = engine.addEntity()
  Transform.create(scoreTextEntity, {
    parent: parentHouse,
    position: Vector3.create(-6.67, 2.405, 1.045), // Slightly in front of the TV (-7.049 -> -7.02)
    scale: Vector3.create(1.04, 1.04, 1.04), // Increased scale to match the massive TV
    rotation: Quaternion.fromEulerDegrees(0, -90, 0) // Face the room (left wall)
  })
  
  TextShape.create(scoreTextEntity, {
    text: `SCOREBOARD\n\nRound 1\nWaiting for game to end...`,
    fontSize: 1.2,
    textColor: Color4.fromHexString('#33FF33'), // Retro green text for the TV
    outlineColor: Color4.Black(),
    outlineWidth: 0.1,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
    textWrapping: true,
    width: 2.8 // Keeps the same aspect ratio wrapper, but scaled up by 1.36 parent scale
  })
}

export function updateScoreBoardText(text: string) {
  if (scoreTextEntity) {
    const textShape = TextShape.getMutable(scoreTextEntity)
    textShape.text = text
  }
}
