import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, TextShape, Material, pointerEventsSystem, InputAction, Entity, AvatarModifierArea, AvatarModifierType, Billboard } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'
import { movePlayerTo, triggerEmote, stopEmote } from '~system/RestrictedActions'
import { getPlayer } from '@dcl/sdk/src/players'
import { CrazyEightsGame } from './logic'
import { buildPrimitiveChair } from './chairs'
import { buildPrimitiveTable } from './table_visuals'
import { setupTableChips, setupChairAuras, updateChairAuraVisibility } from './models_integration'
import { getStreakReminderMessage } from './economy'
import { showRewardToast } from './rewards_ui'

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
export let globalGame: CrazyEightsGame | null = null

export function resolvePlayerId(game?: CrazyEightsGame | null): string {
  const actualId = getPlayer()?.userId
  const targetGame = game || globalGame

  if (!targetGame) return actualId || 'player1'

  // If actualId is known and game has 'player1', migrate 'player1' to actualId
  if (actualId && actualId !== 'player1') {
    if (targetGame.players.has('player1') && !targetGame.players.has(actualId)) {
      const hand = targetGame.players.get('player1') || []
      const score = targetGame.scores.get('player1') || 0
      targetGame.players.delete('player1')
      targetGame.players.set(actualId, hand)
      targetGame.scores.delete('player1')
      targetGame.scores.set(actualId, score)
      const orderIdx = targetGame.playerOrder.indexOf('player1')
      if (orderIdx !== -1) {
        targetGame.playerOrder[orderIdx] = actualId
      }
      if (targetGame.safeDeclared.has('player1')) {
        targetGame.safeDeclared.delete('player1')
        targetGame.safeDeclared.add(actualId)
      }
      targetGame.onStateChanged?.()
    }
    if (!targetGame.players.has(actualId)) {
      targetGame.addPlayer(actualId)
    }
    return actualId
  }

  // Fallback: if actualId not available, ensure 'player1' exists in game
  if (!targetGame.players.has('player1') && targetGame.playerOrder.length === 0) {
    targetGame.addPlayer('player1')
  }
  return 'player1'
}

export function getPlayerDisplayName(userId: string): string {
  if (!userId) return 'Player'
  if (userId.toLowerCase() === 'bot') return 'Cyber Bot'
  if (userId === 'player1') {
    const local = getPlayer()
    return local?.name || 'Player 1'
  }
  const localPlayer = getPlayer()
  if (localPlayer && (localPlayer.userId === userId || localPlayer.userId?.toLowerCase() === userId.toLowerCase())) {
    if (localPlayer.name && localPlayer.name.trim().length > 0) {
      return localPlayer.name
    }
  }
  const otherPlayer = getPlayer({ userId })
  if (otherPlayer?.name && otherPlayer.name.trim().length > 0) {
    return otherPlayer.name
  }
  // If it's an Ethereum address e.g. 0xad439...cd35b, shorten for clean UI
  if (userId.startsWith('0x') && userId.length >= 10) {
    return `${userId.slice(0, 6)}...${userId.slice(-4)}`
  }
  return userId
}

export function setup3DTable(game: CrazyEightsGame, furnitureRoot: Entity) {
  globalHouseEntity = furnitureRoot
  globalGame = game
  game.playerNameResolver = getPlayerDisplayName
  
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
  Material.setPbrMaterial(drawPile, {
    texture: Material.Texture.Common({
      src: 'assets/images/card_back_logo.png'
    }),
    emissiveTexture: Material.Texture.Common({
      src: 'assets/images/card_back_emissive.png'
    }),
    emissiveIntensity: 1.8,
    roughness: 0.3,
    metallic: 0.1
  })
  
  pointerEventsSystem.onPointerDown(
    { entity: drawPile, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Draw Card' } },
    () => {
      const myId = resolvePlayerId(game)
      const success = game.drawCard(myId)
      if (success) {
        console.log(`You drew a card! Your hand now has ${game.players.get(myId)?.length} cards.`)
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
  Material.setPbrMaterial(discardPile, {
    texture: Material.Texture.Common({
      src: 'assets/images/card_front_cyber.png'
    }),
    roughness: 0.3,
    metallic: 0.1
  })

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
  allChairs = []
  seatedChairs.clear()
  for (let i = 0; i < 8; i++) {
    const angleRad = i * (Math.PI / 4)
    const angleDeg = i * 45
    const chair = new CasinoChair(angleRad, angleDeg, furnitureRoot, i)
    allChairs.push(chair)
  }

  const chairCoords = allChairs.map((_, i) => {
    const angleRad = i * (Math.PI / 4)
    return {
      x: 2.2 * Math.cos(angleRad),
      z: 2.2 * Math.sin(angleRad)
    }
  })
  setupChairAuras(furnitureRoot, chairCoords)

  // 4. PREPARE GAME STATE
  resolvePlayerId(game)
  
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
export let allChairs: CasinoChair[] = []
export const seatedChairs: Map<number, string> = new Map()
let _localSeatedChairIndex = -1

export class CasinoChair {
  private entity: Entity
  public sitPosition: Vector3
  public standPosition: Vector3
  public lookAtPosition: Vector3
  public chairIndex: number

  constructor(angleRad: number, angleDeg: number, houseEntity: Entity, chairIndex: number = 0) {
    this.chairIndex = chairIndex
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

    // Absolute WORLD coordinates for player teleport!
    const sitRadius = 2.2
    const sitCx = sitRadius * Math.cos(angleRad)
    const sitCz = sitRadius * Math.sin(angleRad)
    
    this.sitPosition = Vector3.create(
      16 - (sitCx * 0.9),  // World X
      0.15,                // World Y (Cleanly on top of floor surface)
      25 - (sitCz * 0.9)   // World Z
    )

    // Standing position 1.4m behind the chair for clean exit
    const standRadius = 3.6
    const standCx = standRadius * Math.cos(angleRad)
    const standCz = standRadius * Math.sin(angleRad)
    this.standPosition = Vector3.create(
      16 - (standCx * 0.9),
      0.15,
      25 - (standCz * 0.9)
    )

    this.lookAtPosition = Vector3.create(16, 1, 25)

    pointerEventsSystem.onPointerDown(
      { entity: this.entity, opts: { button: InputAction.IA_PRIMARY, hoverText: 'Sit' } },
      () => {
        this.occupy()
      }
    )
  }

  public occupy() {
    setPlayerSeated(true)
    _localSeatedChairIndex = this.chairIndex
    const myId = resolvePlayerId(globalGame)
    seatedChairs.set(this.chairIndex, myId)
    updateChairAuraVisibility(new Set(seatedChairs.keys()))

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

    if (globalGame) {
      update3DTable(globalGame)
    }
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
  } else {
    if (_localSeatedChairIndex >= 0) {
      seatedChairs.delete(_localSeatedChairIndex)
      updateChairAuraVisibility(new Set(seatedChairs.keys()))
      _localSeatedChairIndex = -1
    }
  }
}

export function getLocalSeatedChair(): CasinoChair | null {
  if (_isPlayerSeated && _localSeatedChairIndex >= 0 && _localSeatedChairIndex < allChairs.length) {
    return allChairs[_localSeatedChairIndex]
  }
  return null
}

export function standUpPlayer() {
  if (!_isPlayerSeated) return
  stopEmote({}).catch(console.error)

  if (_localSeatedChairIndex >= 0 && _localSeatedChairIndex < allChairs.length) {
    const chair = allChairs[_localSeatedChairIndex]
    movePlayerTo({
      newRelativePosition: chair.standPosition,
      cameraTarget: chair.lookAtPosition,
      avatarTarget: chair.lookAtPosition
    })
  }

  setPlayerSeated(false)

  if (globalGame) {
    const myId = resolvePlayerId(globalGame)
    globalGame.removePlayer(myId)
    update3DTable(globalGame)
  }

  // Phase 6: Log-Off & Streak Protection Hook
  showRewardToast(getStreakReminderMessage())
}

export function sitPlayerAtOpenChair(userId?: string): boolean {
  const targetId = userId || resolvePlayerId(globalGame)
  for (let i = 0; i < allChairs.length; i++) {
    if (!seatedChairs.has(i)) {
      allChairs[i].occupy()
      return true
    }
  }
  return false
}

export function getSeatedPlayerIds(): string[] {
  const ids = Array.from(seatedChairs.values()).filter(id => !!id && id.trim().length > 0)
  if (_isPlayerSeated) {
    const myId = resolvePlayerId(globalGame)
    if (!ids.includes(myId)) {
      ids.push(myId)
    }
  }
  return Array.from(new Set(ids))
}

// System to automatically update the 3D table when the bot or any player draws, plays, or declares
let lastHandHash = ''

export function autoUpdateTableSystem(dt: number) {
  if (!globalGame || !globalGame.isStarted || globalGame.discardPile.length === 0) return

  const topCard = globalGame.getTopDiscard()
  const currentTopCardStr = `${topCard.suit}-${topCard.rank}`
  
  let handHash = `${currentTopCardStr}|`
  for (const [pId, hand] of globalGame.players.entries()) {
    const isSafe = globalGame.safeDeclared.has(pId) ? 'S' : 'U'
    handHash += `${pId}:${hand.length}:${isSafe};`
  }

  if (handHash !== lastHandHash) {
    lastHandHash = handHash
    update3DTable(globalGame)
  }
}
engine.addSystem(autoUpdateTableSystem)

function getSuitVisuals(suit: string): { symbol: string, color: Color4 } {
  switch (suit) {
    case 'Hearts': return { symbol: '♥', color: Color4.fromHexString('#FF2A6D') }
    case 'Diamonds': return { symbol: '♦', color: Color4.fromHexString('#FF2A6D') }
    case 'Clubs': return { symbol: '♣', color: Color4.fromHexString('#00f3ff') }
    case 'Spades': return { symbol: '♠', color: Color4.fromHexString('#00f3ff') }
    default: return { symbol: '★', color: Color4.fromHexString('#FFD700') }
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

  const isSafe = !!(globalGame && globalGame.safeDeclared.has(playerId))
  const isVulnerable = numCards > 0 && numCards <= 3

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
    Material.setPbrMaterial(cardEnt, {
      texture: Material.Texture.Common({
        src: 'assets/images/card_back_logo.png'
      }),
      emissiveTexture: Material.Texture.Common({
        src: 'assets/images/card_back_emissive.png'
      }),
      emissiveColor: isSafe ? Color3.fromHexString('#00f3ff') : (isVulnerable ? Color3.fromHexString('#ff2a6d') : Color3.White()),
      emissiveIntensity: isSafe ? 2.8 : 1.8,
      roughness: 0.3,
      metallic: 0.1
    }) 
    
    let hoverAction = `${getPlayerDisplayName(playerId)}: ${numCards} card${numCards === 1 ? '' : 's'}`
    if (isSafe) {
      hoverAction = `🛡️ ${getPlayerDisplayName(playerId)} (DECLARED SAFE • ${numCards} card${numCards === 1 ? '' : 's'})`
    } else if (isVulnerable) {
      hoverAction = `🚨 Catch ${getPlayerDisplayName(playerId)}! (Failing to declare)`
    }

    MeshCollider.setBox(cardEnt, ColliderLayer.CL_POINTER)
    pointerEventsSystem.onPointerDown(
      { entity: cardEnt, opts: { button: InputAction.IA_PRIMARY, hoverText: hoverAction } },
      () => {
        if (globalGame) {
          const myId = resolvePlayerId(globalGame)
          globalGame.challengePlayer(myId, playerId)
          update3DTable(globalGame)
        }
      }
    )

    spawnedOpponentCards.push(cardEnt)
  }

  // 3D In-World Status Badge above the opponent hand
  if (isVulnerable || isSafe) {
    const statusEnt = engine.addEntity()
    Transform.create(statusEnt, {
      parent: globalHouseEntity,
      position: Vector3.create(handCx, 0.96, handCz),
      scale: Vector3.create(0.2, 0.2, 0.2)
    })
    Billboard.create(statusEnt)
    TextShape.create(statusEnt, {
      text: isSafe ? `🛡️ SAFE (${numCards})` : `🚨 NOT DECLARED! (${numCards})`,
      fontSize: 2.5,
      textColor: isSafe ? Color4.fromHexString('#00f3ff') : Color4.fromHexString('#ff2a6d'),
      outlineWidth: 0.15,
      outlineColor: Color4.Black()
    })
    spawnedOpponentCards.push(statusEnt)
  }
}

function spawnOpponentCardsVisuals(game: CrazyEightsGame) {
  clearOpponentCards()
  const myId = resolvePlayerId(game)

  for (const [playerId, hand] of game.players.entries()) {
    if (playerId !== myId) {
      spawnSingleOpponentHand(playerId, hand.length)
    }
  }
}

export function update3DTable(game: CrazyEightsGame) {
  updateDiscardPileVisual(game)
  spawnOpponentCardsVisuals(game)
}
