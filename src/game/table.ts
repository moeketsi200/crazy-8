import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, TextShape, Material, pointerEventsSystem, InputAction, Entity, AvatarModifierArea, AvatarModifierType } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { movePlayerTo, triggerEmote, stopEmote } from '~system/RestrictedActions'
import { getPlayer } from '@dcl/sdk/src/players'
import { CrazyEightsGame } from './logic'
import { buildPrimitiveChair } from './chairs'
import { buildPrimitiveTable } from './table_visuals'

// ==========================================
// CUSTOM TIMER SYSTEM
// ==========================================
type TimerData = {
  timeLeft: number
  callback: () => void
}
const timers: TimerData[] = []

export function timerSystem(dt: number) {
  for (let i = timers.length - 1; i >= 0; i--) {
    timers[i].timeLeft -= dt
    if (timers[i].timeLeft <= 0) {
      const cb = timers[i].callback
      timers.splice(i, 1)
      cb()
    }
  }
}
engine.addSystem(timerSystem)

export function setGameTimer(seconds: number, callback: () => void) {
  timers.push({ timeLeft: seconds, callback })
}

// ==========================================
// TABLE SETUP
// ==========================================
const drawPile = engine.addEntity()
const discardPile = engine.addEntity()
const discardText = engine.addEntity()

let globalHouseEntity: Entity
let spawnedOpponentCards: Entity[] = []

export function setup3DTable(game: CrazyEightsGame, furnitureRoot: Entity) {
  globalHouseEntity = furnitureRoot
  globalGame = game
  
  // 0. GENERATE THE 3D VISUAL TABLE AND CARDS
  buildPrimitiveTable(furnitureRoot)

  // 1. CREATE THE DRAW PILE
  Transform.create(drawPile, {
    parent: furnitureRoot,
    position: Vector3.create(-0.15, 0.798, 0.0), // Blender coords!
    scale: Vector3.create(0.063, 0.015, 0.088),
    rotation: Quaternion.fromEulerDegrees(0, -12, 0)
  })
  MeshRenderer.setBox(drawPile)
  MeshCollider.setBox(drawPile)
  Material.setPbrMaterial(drawPile, { albedoColor: Color4.Red() })
  
  pointerEventsSystem.onPointerDown(
    { entity: drawPile, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Draw Card' } },
    () => {
      const success = game.drawCard(getPlayer()?.userId || 'player1')
      if (success) {
        console.log(`You drew a card! Your hand now has ${game.players.get(getPlayer()?.userId || 'player1')?.length} cards.`)
        update3DTable(game)
      } else {
        console.log("It's not your turn, or the deck is empty!")
      }
    }
  )

  // 2. CREATE THE DISCARD PILE (Interactive Top Card)
  Transform.create(discardPile, {
    parent: furnitureRoot,
    position: Vector3.create(0.15, 0.792, 0.02), // Blender coords!
    scale: Vector3.create(0.063, 0.001, 0.088),
    rotation: Quaternion.fromEulerDegrees(0, 15, 0)
  })
  MeshRenderer.setBox(discardPile)
  Material.setPbrMaterial(discardPile, { albedoColor: Color4.White() })

  Transform.create(discardText, {
    parent: discardPile,
    position: Vector3.create(0, 0.6, 0),
    rotation: Quaternion.fromEulerDegrees(90, 180, 0)
  })
  TextShape.create(discardText, {
    text: '',
    fontSize: 5,
    outlineWidth: 0.1,
    outlineColor: Color4.White()
  })

  // 3. SETUP CHAIRS USING OUR NEW CLASS
  for (let i = 0; i < 8; i++) {
    const angleRad = i * (Math.PI / 4)
    const angleDeg = i * 45
    new CasinoChair(angleRad, angleDeg, furnitureRoot) // furnitureRoot is now houseEntity!
  }

  // 4. ADD PLAYERS
  game.addPlayer(getPlayer()?.userId || 'player1')
  game.addPlayer('bot')
  
  // 5. BOT THINKING DELAY
  // This gives the human 5 seconds to press their DECLARE button before the bot strikes!
  game.onBotTurnStart = () => {
    setGameTimer(5.0, () => {
      game.runBotTurn()
    })
  }

  // Game will be started via the UI button!
}

// ==========================================
// CASINO CHAIR CLASS (Updated for Primitive Visuals)
// ==========================================
class CasinoChair {
  private entity: Entity
  private sitPosition: Vector3
  private lookAtPosition: Vector3

  constructor(angleRad: number, angleDeg: number, houseEntity: Entity) {
    // 1. First, build the visual primitive chair and parent it to the house.
    // We move the chairs back from the table (radius 2.2 instead of 1.95)
    const chairRadius = 2.2
    const cx = chairRadius * Math.cos(angleRad)
    const cz = chairRadius * Math.sin(angleRad)
    buildPrimitiveChair(houseEntity, cx, cz, angleDeg)

    // 2. Second, build the invisible interactive collision box!
    // We parent this directly to the house so it perfectly matches the scale and rotation.
    this.entity = engine.addEntity()
    Transform.create(this.entity, {
      parent: houseEntity,
      position: Vector3.create(cx, 0.45, cz),
      scale: Vector3.create(0.6, 0.8, 0.6)
    })
    // Use ColliderLayer.CL_POINTER so it is clickable but you can walk through it!
    MeshCollider.setBox(this.entity, ColliderLayer.CL_POINTER) 

    // We calculate absolute WORLD coordinates for the player teleport!
    // Matching chairRadius exactly to prevent any vector-math offset artifacts.
    const sitRadius = 2.2
    const sitCx = sitRadius * Math.cos(angleRad)
    const sitCz = sitRadius * Math.sin(angleRad)
    
    this.sitPosition = Vector3.create(
      16 - (sitCx * 0.9),  // World X
      0.0,                 // World Y (Ensure we are fully grounded to prevent falling cancellation)
      25 - (sitCz * 0.9)   // World Z
    )

    this.lookAtPosition = Vector3.create(16, 1, 25)

    pointerEventsSystem.onPointerDown(
      { entity: this.entity, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Sit' } },
      () => {
        this.occupy()
      }
    )
  }

  private occupy() {
    setPlayerSeated(true)
    movePlayerTo({
      newRelativePosition: this.sitPosition,
      cameraTarget: this.lookAtPosition,
      avatarTarget: this.lookAtPosition
    })
    
    timers.push({
      timeLeft: 0.5,
      callback: () => {
        stopEmote({}).then(() => {
          // 'sittingChair1' is the correct Decentraland sit emote string!
          triggerEmote({ predefinedEmote: 'sittingChair1' }).catch(console.error)
        })
      }
    })
  }
}

let _isPlayerSeated = false
let _timeSeated = 0

export function getPlayerSeated() {
  return _isPlayerSeated
}

export function getTimeSeated() {
  return _timeSeated
}

export function setPlayerSeated(value: boolean) {
  _isPlayerSeated = value
  if (value) {
    _timeSeated = Date.now()
  }
}

// System to automatically update the 3D table when the bot (or anyone) plays a card
let lastTopCardStr = ''
let lastBotHandSize = -1
let globalGame: CrazyEightsGame | null = null

export function autoUpdateTableSystem(dt: number) {
  if (!globalGame || !globalGame.isStarted || globalGame.discardPile.length === 0) return

  const topCard = globalGame.getTopDiscard()
  const currentTopCardStr = `${topCard.suit}-${topCard.rank}`
  const currentBotHandSize = globalGame.players.get('bot')?.length || 0

  if (currentTopCardStr !== lastTopCardStr || currentBotHandSize !== lastBotHandSize) {
    lastTopCardStr = currentTopCardStr
    lastBotHandSize = currentBotHandSize
    update3DTable(globalGame)
  }
}
engine.addSystem(autoUpdateTableSystem)

function getSuitVisuals(suit: string): { symbol: string, color: Color4 } {
  switch (suit) {
    case 'Hearts': return { symbol: '♥', color: Color4.Red() }
    case 'Diamonds': return { symbol: '♦', color: Color4.Red() }
    case 'Clubs': return { symbol: '♣', color: Color4.Black() }
    case 'Spades': return { symbol: '♠', color: Color4.Black() }
    default: return { symbol: '', color: Color4.Black() }
  }
}

function updateDiscardPileVisual(game: CrazyEightsGame) {
  if (game.discardPile.length === 0) return
  
  const topCard = game.getTopDiscard()
  const visuals = getSuitVisuals(topCard.suit)
  
  const mutableText = TextShape.getMutable(discardText)
  mutableText.text = `${topCard.rank}\n${visuals.symbol}`
  mutableText.textColor = visuals.color
}

function clearOpponentCards() {
  for (const ent of spawnedOpponentCards) {
    engine.removeEntity(ent)
  }
  spawnedOpponentCards = []
}

function spawnSingleOpponentHand(playerId: string, numCards: number) {
  let slot = 2
  if (globalGame) {
    const idx = globalGame.playerOrder.indexOf(playerId)
    if (idx !== -1) {
      slot = idx * 2 // spread out nicely
    }
  }
  
  const angleRad = slot * (Math.PI / 4) + (Math.PI / 2)
  const angleDeg = angleRad * (180 / Math.PI)
  
  const handCx = 1.15 * Math.cos(angleRad)
  const handCz = 1.15 * Math.sin(angleRad)

  for (let i = 0; i < numCards; i++) {
    const offset = (i - (numCards - 1) / 2) * 0.05
    
    const shiftX = offset * Math.cos(angleRad - Math.PI / 2)
    const shiftZ = offset * Math.sin(angleRad - Math.PI / 2)
    
    const cardEnt = engine.addEntity()
    Transform.create(cardEnt, {
      parent: globalHouseEntity,
      position: Vector3.create(handCx + shiftX, 0.791 + (i * 0.001), handCz + shiftZ),
      scale: Vector3.create(0.063, 0.001, 0.088),
      rotation: Quaternion.fromEulerDegrees(0, -(angleDeg + 15 + (offset * 100)), 0)
    })
    MeshRenderer.setBox(cardEnt)
    Material.setPbrMaterial(cardEnt, { albedoColor: Color4.fromHexString('#BF0D0D') }) 
    
    MeshCollider.setBox(cardEnt, ColliderLayer.CL_POINTER)
    pointerEventsSystem.onPointerDown(
      { entity: cardEnt, opts: { button: InputAction.IA_PRIMARY, hoverText: `Challenge ${playerId}!` } },
      () => {
        if (globalGame) {
          globalGame.challengePlayer(getPlayer()?.userId || 'player1', playerId)
          update3DTable(globalGame)
        }
      }
    )

    spawnedOpponentCards.push(cardEnt)
  }
}

function spawnOpponentCardsVisuals(game: CrazyEightsGame) {
  clearOpponentCards()

  for (const [playerId, hand] of game.players.entries()) {
    if (playerId !== (getPlayer()?.userId || 'player1')) {
      spawnSingleOpponentHand(playerId, hand.length)
    }
  }
}

export function update3DTable(game: CrazyEightsGame) {
  updateDiscardPileVisual(game)
  spawnOpponentCardsVisuals(game)
}
