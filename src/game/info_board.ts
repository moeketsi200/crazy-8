import { engine, Transform, MeshRenderer, MeshCollider, TextShape, Material, Entity, pointerEventsSystem, InputAction, TextAlignMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { CrazyEightsGame, GameMode, isBotPlayer } from './logic'
import { update3DTable, resolvePlayerId, sitPlayerAtOpenChair, getPlayerSeated } from './table'
import { updateScoreBoardText } from './score_board'
import { showRewardToast } from './rewards_ui'
import { openGameModePrompt } from './ui'

export let buttonEntity: Entity
export let buttonTextEntity: Entity
let cachedGameEngine: CrazyEightsGame | null = null

export type GameButtonAction = 'START' | 'COUNTDOWN' | 'JOIN' | 'CONTINUE'
let currentButtonAction: GameButtonAction = 'START'

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
          `Play a normal card to finish.\n` +
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

function startSelectedGameMode(gameMode: GameMode) {
  const gameEngine = cachedGameEngine
  if (!gameEngine) return

  if (!getPlayerSeated() && !sitPlayerAtOpenChair()) {
    showRewardToast('No chair is available at this table.')
    return
  }

  const myId = resolvePlayerId(gameEngine)
  if (gameMode === 'solo') {
    gameEngine.startGame([myId], 'solo', myId)
    update3DTable(gameEngine)
    updateScoreBoardText('SCOREBOARD\n\nRound 1\n\nSOLO GAME\n1 Player • 7 Bots')
    showRewardToast('Solo game started! You are playing against 7 bots.')
    return
  }

  gameEngine.startLobby(30, myId)
  setButtonState('COUNTDOWN', 'JOIN LOBBY • 30s')
  showRewardToast('Multiplayer lobby open for 30 seconds. Players must press JOIN to play.')
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
      label = text || 'JOIN THE LOBBY'
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
    openGameModePrompt((gameMode) => startSelectedGameMode(gameMode))
    return
  }

  if (currentButtonAction === 'COUNTDOWN') {
    const myId = resolvePlayerId(gameEngine)
    if (gameEngine.playerOrder.includes(myId)) {
      showRewardToast('You are already in this lobby. Wait for the 30-second timer.')
      return
    }
    if (!getPlayerSeated() && !sitPlayerAtOpenChair()) {
      showRewardToast('No chair is available at this table.')
      return
    }
    if (!gameEngine.tryJoinLobby(myId)) {
      showRewardToast('This lobby is full or the 30-second join window has closed.')
      return
    }
    showRewardToast('You joined the multiplayer lobby. The match starts when the timer ends.')
    return
  }

  if (currentButtonAction === 'JOIN') {
    showRewardToast('This match is already in progress. Join the next lobby to play.')
    return
  }

  if (currentButtonAction === 'CONTINUE') {
    if (resolvePlayerId(gameEngine) !== gameEngine.gameMasterId) {
      showRewardToast('The game host will start the next round.')
      return
    }
    gameEngine.startNextRound()
    update3DTable(gameEngine)
    updateScoreBoardText(`SCOREBOARD\n\nRound ${gameEngine.roundNumber}\n\nGame in progress!`)
  }
}

function setupLobbyCountdownSystem() {
  let lastSecondAnnounced = -1

  engine.addSystem(() => {
    const gameEngine = cachedGameEngine
    if (!gameEngine || !buttonEntity || !buttonTextEntity) return

    const now = Date.now()

    // 1. Network-synced multiplayer join window
    if (gameEngine.lobbyEndTime > now) {
      const secondLeft = Math.ceil((gameEngine.lobbyEndTime - now) / 1000)
      if (secondLeft !== lastSecondAnnounced) {
        lastSecondAnnounced = secondLeft
        const joined = gameEngine.playerOrder.includes(resolvePlayerId(gameEngine))
        setButtonState('COUNTDOWN', `${joined ? 'WAITING' : 'JOIN LOBBY'} • ${secondLeft}s`)
      }
      return
    }

    // The host deals the shared game once the 30-second join window expires.
    if (gameEngine.lobbyEndTime > 0 && !gameEngine.isStarted) {
      if (Date.now() < gameEngine.lobbyEndTime || resolvePlayerId(gameEngine) !== gameEngine.lobbyHostId) return

      const humanPlayers = gameEngine.playerOrder.filter((playerId) => !isBotPlayer(playerId))
      if (humanPlayers.length === 0) return

      gameEngine.startGame(humanPlayers, 'multiplayer', gameEngine.lobbyHostId)
      update3DTable(gameEngine)
      updateScoreBoardText(`SCOREBOARD\n\nRound 1\n\nMULTIPLAYER GAME\n${humanPlayers.length} Player${humanPlayers.length === 1 ? '' : 's'} • ${8 - humanPlayers.length} Bots`)
      showRewardToast(`Round 1 started with ${humanPlayers.length} player${humanPlayers.length === 1 ? '' : 's'} and ${8 - humanPlayers.length} bots.`)
      return
    }

    // 3. The match roster is locked once dealing begins.
    if (gameEngine.isStarted && !gameEngine.gameOver) {
      if (currentButtonAction !== 'JOIN') {
        setButtonState('JOIN', 'MATCH IN PROGRESS')
      }
      return
    }

    // 4. Continue elimination rounds, or offer a fresh game after a match winner.
    if (gameEngine.gameOver) {
      const nextAction = gameEngine.matchOver ? 'START' : 'CONTINUE'
      if (currentButtonAction !== nextAction) {
        setButtonState(nextAction, gameEngine.matchOver ? 'START NEW GAME' : 'CONTINUE\n(Next Round)')
      }
      return
    }

    // 5. Idle / Waiting for someone to start: "START THE GAME" (Red)
    if (currentButtonAction !== 'START') {
      setButtonState('START', 'START THE GAME')
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
