import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, TextShape, Material, pointerEventsSystem, InputAction, Entity, AvatarModifierArea, AvatarModifierType, Billboard, PlayerIdentityData, AvatarShape } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'
import { movePlayerTo, triggerEmote, stopEmote } from '~system/RestrictedActions'
import { getPlayer } from '@dcl/sdk/src/players'
import { BOT_TURN_DELAY_MS, CrazyEightsGame, isBotPlayer } from './logic'
import { BOT_NAMES, getBotName } from './bot_names'
import { buildPrimitiveChair } from './chairs'
import { buildPrimitiveTable } from './table_visuals'
import { setupTableChips, setupChairAuras, updateActiveChairAura, updateChairAuraVisibility } from './models_integration'
import { getStreakReminderMessage } from './economy'
import { showRewardToast } from './rewards_ui'

// ==========================================
// BOT PERSONAS & WEARABLES
// ==========================================
export { BOT_NAMES }

export interface BotPersona {
  name: string
  title: string
  bodyShape: string
  wearables: string[]
  hairColor: { r: number, g: number, b: number }
  skinColor: { r: number, g: number, b: number }
  eyeColor: { r: number, g: number, b: number }
}

const BASE_URN = 'urn:decentraland:off-chain:base-avatars:'

export const BOT_PERSONAS: BotPersona[] = [
  {
    name: BOT_NAMES[0],
    title: 'The Hacker',
    bodyShape: `${BASE_URN}BaseMale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}black_jacket`,
      `${BASE_URN}distressed_black_Jeans`,
      `${BASE_URN}classic_shoes`,
      `${BASE_URN}short_hair`,
      `${BASE_URN}matrix_sunglasses`
    ],
    hairColor: { r: 0.05, g: 0.05, b: 0.05 },
    skinColor: { r: 0.90, g: 0.78, b: 0.68 },
    eyeColor: { r: 0.1, g: 0.2, b: 0.3 }
  },
  {
    name: BOT_NAMES[1],
    title: 'Code Breaker',
    bodyShape: `${BASE_URN}BaseFemale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}white_top`,
      `${BASE_URN}f_jeans`,
      `${BASE_URN}two_tails`,
      `${BASE_URN}f_glasses_fashion`
    ],
    hairColor: { r: 0.08, g: 0.08, b: 0.1 },
    skinColor: { r: 0.92, g: 0.80, b: 0.70 },
    eyeColor: { r: 0.2, g: 0.5, b: 0.6 }
  },
  {
    name: BOT_NAMES[2],
    title: 'Cypherpunk',
    bodyShape: `${BASE_URN}BaseMale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}green_hoodie`,
      `${BASE_URN}grey_joggers`,
      `${BASE_URN}sneakers`,
      `${BASE_URN}short_hair`
    ],
    hairColor: { r: 0.15, g: 0.10, b: 0.05 },
    skinColor: { r: 0.85, g: 0.72, b: 0.60 },
    eyeColor: { r: 0.3, g: 0.2, b: 0.1 }
  },
  {
    name: BOT_NAMES[3],
    title: 'High Roller',
    bodyShape: `${BASE_URN}BaseFemale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}f_blue_jacket`,
      `${BASE_URN}f_red_modern_pants`,
      `${BASE_URN}f_hair_cool`
    ],
    hairColor: { r: 0.8, g: 0.2, b: 0.3 },
    skinColor: { r: 0.95, g: 0.82, b: 0.72 },
    eyeColor: { r: 0.2, g: 0.6, b: 0.7 }
  },
  {
    name: BOT_NAMES[4],
    title: 'Card Shark',
    bodyShape: `${BASE_URN}BaseMale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}turtle_neck_sweater`,
      `${BASE_URN}oxford_pants`,
      `${BASE_URN}classic_shoes`,
      `${BASE_URN}black_sun_glasses`,
      `${BASE_URN}short_hair`
    ],
    hairColor: { r: 0.2, g: 0.15, b: 0.1 },
    skinColor: { r: 0.80, g: 0.65, b: 0.50 },
    eyeColor: { r: 0.1, g: 0.1, b: 0.1 }
  },
  {
    name: BOT_NAMES[5],
    title: 'Speed Dealer',
    bodyShape: `${BASE_URN}BaseMale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}blue_tshirt`,
      `${BASE_URN}hip_hop_joggers`,
      `${BASE_URN}sneakers`,
      `${BASE_URN}short_hair`
    ],
    hairColor: { r: 0.1, g: 0.1, b: 0.1 },
    skinColor: { r: 0.90, g: 0.76, b: 0.62 },
    eyeColor: { r: 0.2, g: 0.4, b: 0.2 }
  },
  {
    name: BOT_NAMES[6],
    title: 'The Pit Boss',
    bodyShape: `${BASE_URN}BaseMale`,
    wearables: [
      `${BASE_URN}eyebrows_00`,
      `${BASE_URN}mouth_00`,
      `${BASE_URN}eyes_00`,
      `${BASE_URN}puffer_jacket`,
      `${BASE_URN}brown_pants`,
      `${BASE_URN}classic_shoes`,
      `${BASE_URN}short_hair`
    ],
    hairColor: { r: 0.3, g: 0.2, b: 0.1 },
    skinColor: { r: 0.88, g: 0.75, b: 0.64 },
    eyeColor: { r: 0.2, g: 0.3, b: 0.4 }
  }
]

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
  const actualId = getPlayer()?.userId?.toLowerCase()
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
    return actualId
  }

  // Player identity lookups must not silently enroll anyone in a match.
  return 'player1'
}

export function getPlayerDisplayName(userId: string): string {
  if (!userId) return 'Player'
  if (isBotPlayer(userId)) {
    return getBotName(userId)
  }
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

  // 1. CREATE THE DRAW PILE (Offset to side of center)
  Transform.create(drawPile, {
    parent: furnitureRoot,
    position: Vector3.create(-0.25, 0.798, 0.0), // Blender coords! Offset to left of center
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

  // 2. CREATE THE DISCARD PILE (Played Card - Centered in EXACT MIDDLE of table)
  Transform.create(discardPile, {
    parent: furnitureRoot,
    position: Vector3.create(0.0, 0.792, 0.0), // EXACT MIDDLE OF CASINO TABLE!
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
    position: Vector3.create(0, 0.45, 0),
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
  
  // Only the lobby host drives the shared bots, so they do not take duplicate turns.
  game.onBotTurnStart = (botId) => {
    update3DTable(game)
    if (resolvePlayerId(game) !== game.gameMasterId) return
    setGameTimer(BOT_TURN_DELAY_MS / 1000, () => {
      if (resolvePlayerId(game) === game.gameMasterId) {
        game.runBotTurn(botId)
        update3DTable(game)
      }
    })
  }

  game.onCardPlayed = () => {
    update3DTable(game)
  }
  game.onCardDrawn = () => {
    update3DTable(game)
  }
  game.onDeclareSafe = () => {
    update3DTable(game)
  }

  // Initial seeding of 3D table, discard pile, and seated bot avatars
  update3DTable(game)
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
    if (this.isOccupiedByAvatar()) {
      showRewardToast('This chair is occupied. Choose another seat.')
      return
    }
    if (globalGame?.isStarted && !globalGame.gameOver) {
      showRewardToast('This match has started. Join the next lobby to play.')
      return
    }
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

    if (globalGame) update3DTable(globalGame)
  }

  public isOccupiedByAvatar(): boolean {
    const localPlayerId = resolvePlayerId(globalGame)
    const seatPosition = this.sitPosition
    for (const [playerEntity, identity] of engine.getEntitiesWith(PlayerIdentityData)) {
      if (identity.address === localPlayerId) continue
      const transform = Transform.getOrNull(playerEntity)
      if (!transform) continue

      // Remote avatar transforms are world coordinates. This scene's base parcel is 0,0,
      // so they share the same coordinate frame as the chair positions above.
      const dx = transform.position.x - seatPosition.x
      const dz = transform.position.z - seatPosition.z
      if (dx * dx + dz * dz < 0.7 * 0.7) return true
    }
    return false
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

  if (globalGame) update3DTable(globalGame)
}

export function exitGame() {
  if (_isPlayerSeated) standUpPlayer()
  if (globalGame) {
    const myId = resolvePlayerId(globalGame)
    globalGame.removePlayer(myId)
    update3DTable(globalGame)
  }

  // Phase 6: Log-Off & Streak Protection Hook
  showRewardToast(getStreakReminderMessage())
}

export function sitPlayerAtOpenChair(_userId?: string): boolean {
  for (let i = 0; i < allChairs.length; i++) {
    if (!seatedChairs.has(i) && !allChairs[i].isOccupiedByAvatar()) {
      allChairs[i].occupy()
      return getPlayerSeated()
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
  if (globalGame && globalGame.playerOrder) {
    for (const p of globalGame.playerOrder) {
      if (!isBotPlayer(p) && !ids.includes(p)) {
        ids.push(p)
      }
    }
  }
  return Array.from(new Set(ids))
}

// System to automatically update the 3D table when the bot or any player draws, plays, or declares
let lastHandHash = ''

export function autoUpdateTableSystem(dt: number) {
  if (!globalGame) return

  const topCard = globalGame.discardPile.length > 0 ? globalGame.getTopDiscard() : null
  const currentTopCardStr = topCard ? `${topCard.suit}-${topCard.rank}` : 'none'
  const turn = globalGame.currentTurnIndex
  const actId = globalGame.actionHistory[0]?.id || 0
  const isStarted = globalGame.isStarted ? '1' : '0'
  
  let handHash = `${isStarted}|${currentTopCardStr}|t:${turn}|a:${actId}|seat:${_localSeatedChairIndex}|`
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

export function getPlayerChairIndex(playerId: string, game?: CrazyEightsGame | null): number {
  const g = game || globalGame
  const myId = resolvePlayerId(g)
  const myChair = _localSeatedChairIndex >= 0 ? _localSeatedChairIndex : 0
  if (playerId === myId) return myChair

  if (!g || !g.playerOrder || g.playerOrder.length === 0) {
    const botNum = parseInt(playerId.match(/_(\d+)$/)?.[1] || '1', 10)
    return (myChair + botNum) % 8
  }

  const otherPlayers = g.playerOrder.filter(id => id !== myId)
  const idx = otherPlayers.indexOf(playerId)
  if (idx !== -1) {
    return (myChair + 1 + idx) % 8
  }
  return (myChair + 1) % 8
}

interface SpawnedBotData {
  rootEntity: Entity
  nametagEntity: Entity
  chairIndex: number
  botId: string
  personaIndex: number
  lastEmoteEventId: number
}
let spawnedBotAvatars: Map<string, SpawnedBotData> = new Map()

export function clearBotAvatars() {
  for (const [_, data] of spawnedBotAvatars) {
    engine.removeEntity(data.rootEntity)
    engine.removeEntity(data.nametagEntity)
  }
  spawnedBotAvatars.clear()
}

export function updateBotAvatars(game: CrazyEightsGame) {
  if (!globalHouseEntity) return

  // Bots are solo opponents only. Never show idle placeholder bots in the multiplayer lobby.
  const botIds = game.gameMode === 'solo'
    ? game.playerOrder.filter(id => isBotPlayer(id))
    : []

  // Remove any bots no longer in the list
  for (const [bId, data] of spawnedBotAvatars) {
    if (!botIds.includes(bId)) {
      engine.removeEntity(data.rootEntity)
      engine.removeEntity(data.nametagEntity)
      spawnedBotAvatars.delete(bId)
    }
  }

  for (let i = 0; i < botIds.length; i++) {
    const botId = botIds[i]
    const botNum = parseInt(botId.match(/_(\d+)$/)?.[1] || `${i + 1}`, 10)
    const personaIdx = (botNum - 1) % BOT_PERSONAS.length
    const persona = BOT_PERSONAS[personaIdx]
    const chairIdx = getPlayerChairIndex(botId, game)

    const angleRad = chairIdx * (Math.PI / 4)
    const angleDeg = chairIdx * 45
    const chairRadius = 2.2
    const cx = chairRadius * Math.cos(angleRad)
    const cz = chairRadius * Math.sin(angleRad)

    const botX = cx * 0.92
    const botZ = cz * 0.92
    const botY = 0.12
    const botRot = Quaternion.fromEulerDegrees(0, -(angleDeg + 90), 0)

    let botData = spawnedBotAvatars.get(botId)
    if (!botData) {
      const rootEntity = engine.addEntity()
      Transform.create(rootEntity, {
        parent: globalHouseEntity,
        position: Vector3.create(botX, botY, botZ),
        rotation: botRot,
        scale: Vector3.One()
      })
      AvatarShape.create(rootEntity, {
        id: `bot_avatar_${botId}_${chairIdx}`,
        name: '',
        bodyShape: persona.bodyShape,
        emotes: [],
        wearables: persona.wearables,
        hairColor: persona.hairColor,
        skinColor: persona.skinColor,
        eyeColor: persona.eyeColor,
        expressionTriggerId: 'sittingChair1',
        expressionTriggerTimestamp: 0
      })

      MeshCollider.setBox(rootEntity, ColliderLayer.CL_POINTER)
      pointerEventsSystem.onPointerDown(
        {
          entity: rootEntity,
          opts: { button: InputAction.IA_PRIMARY, hoverText: `🚨 Challenge ${persona.name} (Declare Check)` }
        },
        () => {
          if (globalGame && globalGame.isStarted) {
            const localId = resolvePlayerId(globalGame)
            globalGame.challengePlayer(localId, botId)
            update3DTable(globalGame)
          }
        }
      )

      const nametagEntity = engine.addEntity()
      Transform.create(nametagEntity, {
        parent: globalHouseEntity,
        position: Vector3.create(botX, 1.85, botZ),
        scale: Vector3.create(0.24, 0.24, 0.24)
      })
      Billboard.create(nametagEntity)
      TextShape.create(nametagEntity, {
        text: `🤖 #${chairIdx + 1} ${persona.name}\n${persona.title}`,
        fontSize: 2.8,
        textColor: Color4.fromHexString('#00f3ff'),
        outlineWidth: 0.15,
        outlineColor: Color4.Black()
      })

      botData = {
        rootEntity,
        nametagEntity,
        chairIndex: chairIdx,
        botId,
        personaIndex: personaIdx,
        lastEmoteEventId: game.lastCardPlay?.id || 0
      }
      spawnedBotAvatars.set(botId, botData)
    } else {
      if (botData.chairIndex !== chairIdx) {
        botData.chairIndex = chairIdx
        const mutT = Transform.getMutable(botData.rootEntity)
        mutT.position = Vector3.create(botX, botY, botZ)
        mutT.rotation = botRot

        const mutTagT = Transform.getMutable(botData.nametagEntity)
        mutTagT.position = Vector3.create(botX, 1.85, botZ)
      }
    }

    const lastCardPlay = game.lastCardPlay
    if (lastCardPlay && lastCardPlay.id > botData.lastEmoteEventId) {
      botData.lastEmoteEventId = lastCardPlay.id
      if (lastCardPlay.playerId === botId) {
        playBotCardThrow(botData)
      }
    }

    const isEliminated = game.eliminatedPlayers.has(botId)
    const isCurrentTurn = game.isStarted && game.getCurrentPlayerId() === botId
    const hand = game.players.get(botId) || []
    const isSafe = game.safeDeclared.has(botId)
    const isVulnerable = !isEliminated && hand.length > 0 && hand.length <= 3

    const mutTag = TextShape.getMutable(botData.nametagEntity)
    if (isEliminated) {
      mutTag.text = `🤖 #${chairIdx + 1} ${persona.name}\n❌ ELIMINATED`
      mutTag.textColor = Color4.fromHexString('#777777')
    } else if (isCurrentTurn) {
      mutTag.text = `🤖 #${chairIdx + 1} ${persona.name}\n🤔 Thinking...`
      mutTag.textColor = Color4.fromHexString('#ffd700')
    } else if (isVulnerable && !isSafe) {
      mutTag.text = `🚨 #${chairIdx + 1} ${persona.name}\n${hand.length === 1 ? '1 CARD LEFT!' : `${hand.length} CARDS (UNSAFE)!`}`
      mutTag.textColor = Color4.fromHexString('#ff2a6d')
    } else if (isSafe) {
      mutTag.text = `🤖 #${chairIdx + 1} ${persona.name}\n🛡️ SAFE (${hand.length} cards)`
      mutTag.textColor = Color4.fromHexString('#00ffaa')
    } else {
      const lastAct = game.lastPlayerActions.get(botId)
      const ageSec = lastAct ? (Date.now() - lastAct.timestamp) / 1000 : 999
      if (lastAct && ageSec < 6) {
        mutTag.text = `🤖 #${chairIdx + 1} ${persona.name}\n💬 ${lastAct.text}`
        mutTag.textColor = Color4.fromHexString('#00f3ff')
      } else {
        mutTag.text = game.isStarted ? `🤖 #${chairIdx + 1} ${persona.name}\n🎴 ${hand.length} cards` : `🤖 #${chairIdx + 1} ${persona.name}\n✨ Ready`
        mutTag.textColor = Color4.fromHexString('#b9c8dd')
      }
    }
  }
}

function playBotCardThrow(botData: SpawnedBotData) {
  const expressionTimestamp = Date.now()
  const avatar = AvatarShape.getMutable(botData.rootEntity)
  avatar.expressionTriggerId = 'throw'
  avatar.expressionTriggerTimestamp = expressionTimestamp

  setGameTimer(0.75, () => {
    if (spawnedBotAvatars.get(botData.botId) !== botData) return
    const currentAvatar = AvatarShape.getMutable(botData.rootEntity)
    if (currentAvatar.expressionTriggerId !== 'throw' ||
        currentAvatar.expressionTriggerTimestamp !== expressionTimestamp) return

    currentAvatar.expressionTriggerId = 'sittingChair1'
    currentAvatar.expressionTriggerTimestamp = expressionTimestamp + 1
  })
}

function spawnSingleOpponentHand(playerId: string, numCards: number, chairIndex: number) {
  const angleRad = chairIndex * (Math.PI / 4)
  const angleDeg = chairIndex * 45
  
  const handRadius = 1.05
  const handCx = handRadius * Math.cos(angleRad)
  const handCz = handRadius * Math.sin(angleRad)

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
      rotation: Quaternion.fromEulerDegrees(0, -(angleDeg + 90 + (offset * 80)), 0)
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
    if (playerId !== myId && hand.length > 0 && !game.eliminatedPlayers.has(playerId)) {
      const chairIdx = getPlayerChairIndex(playerId, game)
      spawnSingleOpponentHand(playerId, hand.length, chairIdx)
    }
  }
}

export function update3DTable(game: CrazyEightsGame) {
  const seatedIndices = new Set<number>(seatedChairs.keys())
  for (const playerId of game.playerOrder) {
    seatedIndices.add(getPlayerChairIndex(playerId, game))
  }
  updateChairAuraVisibility(seatedIndices)

  const activePlayerId = game.isStarted ? game.getCurrentPlayerId() : undefined
  updateActiveChairAura(activePlayerId ? getPlayerChairIndex(activePlayerId, game) : null)

  updateDiscardPileVisual(game)
  spawnOpponentCardsVisuals(game)
  updateBotAvatars(game)
}
