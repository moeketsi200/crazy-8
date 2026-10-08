import { engine, Transform, MeshRenderer, MeshCollider, TextShape, Material, Entity, pointerEventsSystem, inputSystem, InputAction, TextAlignMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { CrazyEightsGame } from './logic'
import { update3DTable } from './table'
import { updateScoreBoardText } from './score_board'

export function buildInfoBoard(parentHouse: Entity, gameEngine: CrazyEightsGame) {
  createBoardBackground(parentHouse)
  createRulesText(parentHouse)
  createStartButton(parentHouse, gameEngine)
}

function createBoardBackground(parentHouse: Entity) {
  const board = engine.addEntity()
  Transform.create(board, {
    parent: parentHouse,
    position: Vector3.create(6.75, 2.5, -2), 
    rotation: Quaternion.fromEulerDegrees(0, -90, 0),
    scale: Vector3.create(4, 3, 0.1)
  })
  MeshRenderer.setBox(board)
  Material.setPbrMaterial(board, { 
    albedoColor: Color4.fromHexString('#111111ee'),
    roughness: 0.8 
  })
}

function createRulesText(parentHouse: Entity) {
  const textEnt = engine.addEntity()
  Transform.create(textEnt, {
    parent: parentHouse,
    position: Vector3.create(6.65, 3.2, -2),
    scale: Vector3.create(1, 1, 1),
    rotation: Quaternion.fromEulerDegrees(0, 90, 0)
  })
  
  TextShape.create(textEnt, {
    text: `CRAZY 8s RULES\n\n` +
          `• Match the Suit or Rank to play.\n` +
          `• 8 is WILD (Change the active suit).\n` +
          `• 2 = Next player draws 2 cards.\n` +
          `• J = Reverse turn order.\n` +
          `• 7 = Skip next player.\n` +
          `• Joker = Next player draws 4 cards.\n\n` +
          `Highest score is eliminated!`,
    fontSize: 1.1,
    textColor: Color4.White(),
    outlineColor: Color4.Black(),
    outlineWidth: 0.1,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
    textWrapping: true,
    width: 3.8
  })
}

function createStartButton(parentHouse: Entity, gameEngine: CrazyEightsGame) {
  const btnEnt = engine.addEntity()
  Transform.create(btnEnt, {
    parent: parentHouse,
    position: Vector3.create(6.65, 1.3, -2),
    scale: Vector3.create(3.0, 0.6, 1.0),
    rotation: Quaternion.fromEulerDegrees(0, -90, 0)
  })
  MeshRenderer.setPlane(btnEnt)
  MeshCollider.setPlane(btnEnt)
  Material.setPbrMaterial(btnEnt, { albedoColor: Color4.fromHexString('#C91D1D') })

  const btnText = engine.addEntity()
  Transform.create(btnText, {
    parent: parentHouse,
    position: Vector3.create(6.64, 1.3, -2),
    scale: Vector3.create(1, 1, 1), 
    rotation: Quaternion.fromEulerDegrees(0, 90, 0) 
  })
  TextShape.create(btnText, {
    text: 'START THE GAME',
    fontSize: 2.0,
    textColor: Color4.White(),
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
    outlineColor: Color4.Black(),
    outlineWidth: 0.1
  })
  MeshCollider.setBox(btnText)

  const clickHandler = () => {
    if (!gameEngine.isStarted) {
      console.log("Starting game from 3D button!")
      gameEngine.startGame()
      update3DTable(gameEngine)
      
      updateScoreBoardText(`SCOREBOARD\n\nRound ${gameEngine.roundNumber}\n\nGame is running!\nLet's go!`)

      Transform.getMutable(btnEnt).scale = Vector3.Zero()
      Transform.getMutable(btnText).scale = Vector3.Zero()
    }
  }

  pointerEventsSystem.onPointerDown(
    { entity: btnEnt, opts: { button: InputAction.IA_POINTER, hoverText: 'Start The Game' } },
    clickHandler
  )
  pointerEventsSystem.onPointerDown(
    { entity: btnText, opts: { button: InputAction.IA_POINTER, hoverText: 'Start The Game' } },
    clickHandler
  )
}
