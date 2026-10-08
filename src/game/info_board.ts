import { engine, Transform, MeshRenderer, MeshCollider, TextShape, Material, Entity, pointerEventsSystem, inputSystem, InputAction, TextAlignMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { CrazyEightsGame } from './logic'
import { update3DTable } from './table'
import { updateScoreBoardText } from './score_board'

export let buttonEntity: Entity
export let buttonTextEntity: Entity
let cachedGameEngine: CrazyEightsGame | null = null

export function buildInfoBoard(parentHouse: Entity, gameEngine: CrazyEightsGame) {
  cachedGameEngine = gameEngine
  createBoardBackground(parentHouse)
  createRulesText(parentHouse)
  createStartButton(parentHouse)
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

export function showGameButton(text: string, actionType: 'START' | 'CONTINUE') {
  if (buttonEntity && buttonTextEntity) {
    Transform.getMutable(buttonEntity).scale = Vector3.create(3.0, 0.6, 1.0)
    Transform.getMutable(buttonTextEntity).scale = Vector3.create(1, 1, 1)
    
    TextShape.getMutable(buttonTextEntity).text = text
    
    pointerEventsSystem.onPointerDown(
      { entity: buttonEntity, opts: { button: InputAction.IA_POINTER, hoverText: text } },
      () => handleButtonClick(actionType)
    )
    pointerEventsSystem.onPointerDown(
      { entity: buttonTextEntity, opts: { button: InputAction.IA_POINTER, hoverText: text } },
      () => handleButtonClick(actionType)
    )
  }
}

function handleButtonClick(actionType: 'START' | 'CONTINUE') {
  const gameEngine = cachedGameEngine
  if (!gameEngine) return

  if (actionType === 'START') {
    gameEngine.startGame()
  } else if (actionType === 'CONTINUE') {
    gameEngine.startNextRound()
  }

  update3DTable(gameEngine)
  
  updateScoreBoardText(`SCOREBOARD\n\nRound ${gameEngine.roundNumber}\n\nGame is running!\nLet's go!`)

  Transform.getMutable(buttonEntity).scale = Vector3.Zero()
  Transform.getMutable(buttonTextEntity).scale = Vector3.Zero()
}

function createStartButton(parentHouse: Entity) {
  buttonEntity = engine.addEntity()
  Transform.create(buttonEntity, {
    parent: parentHouse,
    position: Vector3.create(6.65, 1.3, -2),
    scale: Vector3.create(3.0, 0.6, 1.0),
    rotation: Quaternion.fromEulerDegrees(0, -90, 0)
  })
  MeshRenderer.setPlane(buttonEntity)
  MeshCollider.setPlane(buttonEntity)
  Material.setPbrMaterial(buttonEntity, { albedoColor: Color4.fromHexString('#C91D1D') })

  buttonTextEntity = engine.addEntity()
  Transform.create(buttonTextEntity, {
    parent: parentHouse,
    position: Vector3.create(6.64, 1.3, -2),
    scale: Vector3.create(1, 1, 1), 
    rotation: Quaternion.fromEulerDegrees(0, 90, 0) 
  })
  TextShape.create(buttonTextEntity, {
    text: 'START THE GAME',
    fontSize: 2.0,
    textColor: Color4.White(),
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
    outlineColor: Color4.Black(),
    outlineWidth: 0.1
  })
  MeshCollider.setBox(buttonTextEntity)

  // Attach default start logic initially
  pointerEventsSystem.onPointerDown(
    { entity: buttonEntity, opts: { button: InputAction.IA_POINTER, hoverText: 'Start The Game' } },
    () => handleButtonClick('START')
  )
  pointerEventsSystem.onPointerDown(
    { entity: buttonTextEntity, opts: { button: InputAction.IA_POINTER, hoverText: 'Start The Game' } },
    () => handleButtonClick('START')
  )
}
