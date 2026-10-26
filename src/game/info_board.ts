import { engine, Transform, MeshRenderer, MeshCollider, TextShape, Material, Entity, pointerEventsSystem, InputAction, TextAlignMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { CrazyEightsGame } from './logic'
import { update3DTable, resolvePlayerId, getSeatedPlayerIds, sitPlayerAtOpenChair, getPlayerSeated } from './table'
import { updateScoreBoardText } from './score_board'
import { showRewardToast } from './rewards_ui'

export let buttonEntity: Entity
export let buttonTextEntity: Entity
let cachedGameEngine: CrazyEightsGame | null = null

export type GameButtonAction = 'START' | 'COUNTDOWN' | 'JOIN' | 'CONTINUE'
let currentButtonAction: GameButtonAction = 'START'
let lobbyCountdown = 0
let isLobbyActive = false

export function buildInfoBoard(parentHouse: Entity, gameEngine: CrazyEightsGame) {
  cachedGameEngine = gameEngine
  createBoardBackground(parentHouse)
  createRulesText(parentHouse)
  createStartButton(parentHouse)
  setupLobbyCountdownSystem()
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

export function showGameButton(text: string, actionType: GameButtonAction) {
  setButtonState(actionType, text)
}

function setButtonState(action: GameButtonAction, text?: string) {
  currentButtonAction = action
  if (!buttonEntity || !buttonTextEntity) return

  Transform.getMutable(buttonEntity).scale = Vector3.create(3.0, 0.6, 1.0)
  Transform.getMutable(buttonTextEntity).scale = Vector3.create(1, 1, 1)

  let label = text || 'START THE GAME'
  let colorHex = '#C91D1D' // Default red

  switch (action) {
    case 'START':
      label = text || 'START THE GAME'
      colorHex = '#C91D1D' // Red
      break
    case 'COUNTDOWN':
      label = text || `STARTING IN ${Math.ceil(lobbyCountdown)}s\nTAKE A SEAT`
      colorHex = '#FF8800' // Gold/Orange
      break
    case 'JOIN':
      label = text || 'JOIN THE GAME'
      colorHex = '#0099FF' // Electric Cyan/Blue
      break
    case 'CONTINUE':
      label = text || 'CONTINUE\n(Next Round)'
      colorHex = '#10B981' // Emerald Green
      break
  }

  TextShape.getMutable(buttonTextEntity).text = label
  Material.setPbrMaterial(buttonEntity, { albedoColor: Color4.fromHexString(colorHex) })
}

function handleButtonClick() {
  const gameEngine = cachedGameEngine
  if (!gameEngine) return

  if (currentButtonAction === 'START') {
    // 1. Player presses Start: If not seated, sit them down at first open chair!
    if (!getPlayerSeated()) {
      sitPlayerAtOpenChair()
    }
    // 2. Begin 15-second lobby countdown
    isLobbyActive = true
    lobbyCountdown = 15.0
    setButtonState('COUNTDOWN', 'STARTING IN 15s\nTAKE A SEAT!')
    showRewardToast('⏱️ Game starting in 15s! Grab a seat at the table to play!')
    return
  }

  if (currentButtonAction === 'COUNTDOWN') {
    // If clicked during countdown, take a seat!
    if (!getPlayerSeated()) {
      sitPlayerAtOpenChair()
      showRewardToast('🪑 You took a seat! Waiting for countdown to finish.')
    }
    return
  }

  if (currentButtonAction === 'JOIN') {
    // Game already started: Player joins the table!
    if (!getPlayerSeated()) {
      sitPlayerAtOpenChair()
    }
    const myId = resolvePlayerId(gameEngine)
    gameEngine.joinGame(myId)
    showRewardToast('🎮 You joined the table! You will be dealt in next round.')
    return
  }

  if (currentButtonAction === 'CONTINUE') {
    // Start the next round with all currently seated players
    gameEngine.startNextRound()
    update3DTable(gameEngine)
    updateScoreBoardText(`SCOREBOARD\n\nRound ${gameEngine.roundNumber}\n\nGame in progress!`)
    setButtonState('JOIN', 'JOIN THE GAME')
  }
}

function setupLobbyCountdownSystem() {
  let lastSecondAnnounced = 16

  engine.addSystem((dt) => {
    if (!isLobbyActive) return

    lobbyCountdown -= dt
    const secondLeft = Math.ceil(lobbyCountdown)

    if (secondLeft !== lastSecondAnnounced && secondLeft > 0) {
      lastSecondAnnounced = secondLeft
      if (buttonTextEntity) {
        TextShape.getMutable(buttonTextEntity).text = `STARTING IN ${secondLeft}s\nTAKE A SEAT`
      }
    }

    if (lobbyCountdown <= 0) {
      isLobbyActive = false
      const gameEngine = cachedGameEngine
      if (!gameEngine) return

      // Gather all currently seated players
      const seatedPlayers = getSeatedPlayerIds()

      if (seatedPlayers.length === 0) {
        showRewardToast('⚠️ No players were seated! Sit at the table to play.')
        setButtonState('START', 'START THE GAME')
        return
      }

      // If only 1 human is seated, spawn exactly 1 bot to play against.
      // If 2 or more humans are seated, they play together without extra bots!
      const needBot = seatedPlayers.length === 1
      gameEngine.startGame(seatedPlayers, needBot)

      update3DTable(gameEngine)
      updateScoreBoardText(`SCOREBOARD\n\nRound 1\n\nGame is running!\n${seatedPlayers.length} Seated Player${seatedPlayers.length > 1 ? 's' : ''}`)

      // Change button to "JOIN THE GAME" so observers can join mid-game
      setButtonState('JOIN', 'JOIN THE GAME')
      showRewardToast('🃏 Round 1 Started! Cards dealt to all seated players.')
    }
  })
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

  // Attach click listeners (both E key and Click)
  pointerEventsSystem.onPointerDown(
    { entity: buttonEntity, opts: { button: InputAction.IA_POINTER, hoverText: 'Interact' } },
    () => handleButtonClick()
  )
  pointerEventsSystem.onPointerDown(
    { entity: buttonEntity, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Interact' } },
    () => handleButtonClick()
  )
  pointerEventsSystem.onPointerDown(
    { entity: buttonTextEntity, opts: { button: InputAction.IA_POINTER, hoverText: 'Interact' } },
    () => handleButtonClick()
  )
  pointerEventsSystem.onPointerDown(
    { entity: buttonTextEntity, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Interact' } },
    () => handleButtonClick()
  )
}
