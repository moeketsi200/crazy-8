import { engine, Transform, TextShape, Entity, TextAlignMode, MeshRenderer, MeshCollider, Material, MaterialTransparencyMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'
import { CrazyEightsGame, isBotPlayer, PlayerLeaderboardStats } from './logic'

export let scoreTextEntity: Entity
export let exteriorScoreTextEntity: Entity
const exteriorLeaderboardColumns: Entity[] = []

function currentWeekKey(): string {
  const date = new Date()
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-${String(week).padStart(2, '0')}`
}

function formatLeaderboard(title: string, rows: PlayerLeaderboardStats[], value: (row: PlayerLeaderboardStats) => number, empty: string): string {
  const ranked = rows.filter(row => value(row) > 0).sort((a, b) => value(b) - value(a)).slice(0, 3)
  const lines = ranked.length
    ? ranked.map((row, index) => `${index + 1}. ${row.name.toUpperCase().slice(0, 8)} ${value(row)}`)
    : [empty]
  return `${title}\n${lines.join('\n')}`
}

export function renderOutdoorHallOfFame(game?: CrazyEightsGame) {
  if (exteriorLeaderboardColumns.length === 0) return
  // Only real players from multiplayer games are counted. Bots and solo results stay out.
  const records = Array.from(game?.leaderboardStats.values() || []).filter(row => !isBotPlayer(row.playerId))
  const week = currentWeekKey()
  const columns = [
    formatLeaderboard('ALL-TIME WINS', records, row => row.gamesWon, 'No wins yet'),
    formatLeaderboard('WEEKLY WINS', records.filter(row => row.weekKey === week), row => row.weeklyWins, 'No wins this week'),
    formatLeaderboard('ROUNDS WON', records, row => row.roundsWon, 'No rounds won yet')
  ]

  columns.forEach((text, index) => {
    const entity = exteriorLeaderboardColumns[index]
    TextShape.getMutable(entity).text = text
  })
}

function createBox(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale, rotation: rot })
  MeshRenderer.setBox(ent)
  MeshCollider.setBox(ent)
  Material.setPbrMaterial(ent, { albedoColor: color })
  return ent
}

export function buildScoreBoard(parentHouse: Entity) {
  // 1. INDOOR TV SCOREBOARD
  scoreTextEntity = engine.addEntity()
  Transform.create(scoreTextEntity, {
    parent: parentHouse,
    position: Vector3.create(-6.48, 2.405, 1.045),
    scale: Vector3.create(1.04, 1.04, 1.04),
    rotation: Quaternion.fromEulerDegrees(0, -90, 0)
  })
  
  TextShape.create(scoreTextEntity, {
    text: `SCOREBOARD\n\nRound 1\nWaiting for game to end...`,
    fontSize: 1.2,
    textColor: Color4.fromHexString('#33FF33'),
    outlineColor: Color4.Black(),
    outlineWidth: 0.1,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
    textWrapping: true,
    width: 2.8 
  })

  // 2. FREESTANDING OUTDOOR BILLBOARD IN THE GRASS
  // We place it in the open grass space (Local X=12 is just outside the right edge of the patio)
  const billboardPos = Vector3.create(12.5, 0, 14.0)
  const billboardRot = Quaternion.fromEulerDegrees(0, 90, 0) // Facing inwards towards the patio

  const billboardGroup = engine.addEntity()
  Transform.create(billboardGroup, {
    parent: parentHouse,
    position: billboardPos,
    rotation: billboardRot
  })

  const metalColor = Color4.fromHexString('#444444')
  const screenColor = Color4.fromHexString('#111111')

  // Left and Right Poles
  createBox(billboardGroup, Vector3.create(-2.55, 2.5, 0), Vector3.create(0.2, 5.0, 0.2), metalColor)
  createBox(billboardGroup, Vector3.create(2.55, 2.5, 0), Vector3.create(0.2, 5.0, 0.2), metalColor)

  // 1. Sleek dark rear casing covering the back of the billboard (prevents bright rear blowout)
  const casingColor = Color4.fromHexString('#151820')
  createBox(billboardGroup, Vector3.create(0, 3.5, 0.06), Vector3.create(5.10, 2.80, 0.12), casingColor)

  // 2. Crazy 8 Logo on the rear chassis (branded esports look from outside)
  const backLogo = engine.addEntity()
  Transform.create(backLogo, {
    parent: billboardGroup,
    position: Vector3.create(0, 3.5, 0.125),
    scale: Vector3.create(2.0, 2.0, 1.0),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0)
  })
  MeshRenderer.setPlane(backLogo)
  Material.setPbrMaterial(backLogo, {
    texture: Material.Texture.Common({ src: 'assets/images/crazy8_logo.png' }),
    transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
    roughness: 0.3,
    metallic: 0.1
  })

  // 3. Neon glowing cyan trim border around the front of the screen
  const frameColor = Color4.fromHexString('#00f3ff')
  const frame = engine.addEntity()
  Transform.create(frame, { parent: billboardGroup, position: Vector3.create(0, 3.5, 0.00), scale: Vector3.create(4.96, 2.66, 0.04) })
  MeshRenderer.setBox(frame)
  Material.setPbrMaterial(frame, {
    albedoColor: frameColor,
    emissiveColor: frameColor,
    emissiveIntensity: 0.8,
    metallic: 0.2,
    roughness: 0.2
  })

  // 4. Main Screen Board (sleek dark glass in front of the glowing trim)
  createBox(billboardGroup, Vector3.create(0, 3.5, -0.04), Vector3.create(5.0, 2.5, 0.06), screenColor)

  // Three clear leaderboard panels share the outdoor screen.
  for (const x of [-1.68, 0, 1.68]) {
    const column = engine.addEntity()
    Transform.create(column, {
      parent: billboardGroup,
      position: Vector3.create(x, 3.5, -0.16),
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    })
    TextShape.create(column, {
      text: 'LOADING…',
      fontSize: 0.3,
      textColor: Color4.fromHexString('#FFD700'),
      outlineColor: Color4.Black(),
      outlineWidth: 0.05,
      textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
      textWrapping: true,
      width: 1.55
    })
    exteriorLeaderboardColumns.push(column)
  }
  exteriorScoreTextEntity = exteriorLeaderboardColumns[0]

  // Subtle dividers separate the three categories.
  const divider = Color4.fromHexString('#00f3ff')
  createBox(billboardGroup, Vector3.create(-0.84, 3.5, -0.15), Vector3.create(0.025, 2.05, 0.025), divider)
  createBox(billboardGroup, Vector3.create(0.84, 3.5, -0.15), Vector3.create(0.025, 2.05, 0.025), divider)

  renderOutdoorHallOfFame()
}

export function updateScoreBoardText(text: string) {
  if (scoreTextEntity) {
    const textShape = TextShape.getMutable(scoreTextEntity)
    textShape.text = text
  }
}

export function updateHighWinningsText(text: string) {
  if (exteriorScoreTextEntity) {
    const textShape = TextShape.getMutable(exteriorScoreTextEntity)
    textShape.text = text
  }
}
