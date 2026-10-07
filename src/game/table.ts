import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, TextShape, Material, pointerEventsSystem, InputAction, Entity, AvatarModifierArea, AvatarModifierType } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { movePlayerTo, triggerEmote, stopEmote } from '~system/RestrictedActions'
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


// ==========================================
// TABLE SETUP
// ==========================================
const drawPile = engine.addEntity()
const discardPile = engine.addEntity()
const discardText = engine.addEntity()

export function setup3DTable(game: CrazyEightsGame, furnitureRoot: Entity) {
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
      const success = game.drawCard('player1')
      if (success) {
        console.log(`You drew a card! Your hand now has ${game.players.get('player1')?.length} cards.`)
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

  // 4. START A TEST GAME
  game.addPlayer('player1')
  game.addPlayer('bot')
  game.startGame()
  update3DTable(game)
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

export function update3DTable(game: CrazyEightsGame) {
  if (game.discardPile.length > 0) {
    const topCard = game.getTopDiscard()
    let symbol = ''
    let color = Color4.Black()
    
    if (topCard.suit === 'Hearts') { symbol = '♥'; color = Color4.Red() }
    if (topCard.suit === 'Diamonds') { symbol = '♦'; color = Color4.Red() }
    if (topCard.suit === 'Clubs') { symbol = '♣'; color = Color4.Black() }
    if (topCard.suit === 'Spades') { symbol = '♠'; color = Color4.Black() }

    const mutableText = TextShape.getMutable(discardText)
    mutableText.text = `${topCard.rank}\n${symbol}`
    mutableText.textColor = color
  }
}
