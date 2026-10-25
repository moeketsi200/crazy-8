import { engine, Transform, TextShape, Entity, TextAlignMode, MeshRenderer, MeshCollider, Material, MaterialTransparencyMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

export let scoreTextEntity: Entity
export let exteriorScoreTextEntity: Entity

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
  createBox(billboardGroup, Vector3.create(-1.8, 2.5, 0), Vector3.create(0.2, 5.0, 0.2), metalColor)
  createBox(billboardGroup, Vector3.create(1.8, 2.5, 0), Vector3.create(0.2, 5.0, 0.2), metalColor)

  // 1. Sleek dark rear casing covering the back of the billboard (prevents bright rear blowout)
  const casingColor = Color4.fromHexString('#151820')
  createBox(billboardGroup, Vector3.create(0, 3.5, 0.06), Vector3.create(4.30, 2.80, 0.12), casingColor)

  // 2. Crazy 8 Logo on the rear chassis (branded esports look from outside)
  const backLogo = engine.addEntity()
  Transform.create(backLogo, {
    parent: billboardGroup,
    position: Vector3.create(0, 3.5, 0.125),
    scale: Vector3.create(2.2, 2.2, 1.0),
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
  Transform.create(frame, { parent: billboardGroup, position: Vector3.create(0, 3.5, 0.00), scale: Vector3.create(4.16, 2.66, 0.04) })
  MeshRenderer.setBox(frame)
  Material.setPbrMaterial(frame, {
    albedoColor: frameColor,
    emissiveColor: frameColor,
    emissiveIntensity: 0.8,
    metallic: 0.2,
    roughness: 0.2
  })

  // 4. Main Screen Board (sleek dark glass in front of the glowing trim)
  const screenBoard = createBox(billboardGroup, Vector3.create(0, 3.5, -0.04), Vector3.create(4.0, 2.5, 0.06), screenColor)

  // The text on the billboard
  exteriorScoreTextEntity = engine.addEntity()
  Transform.create(exteriorScoreTextEntity, {
    parent: billboardGroup,
    // Placed in front of the screen board
    position: Vector3.create(0, 3.5, -0.16),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0) // Fixed rotation so text isn't backward
  })

  TextShape.create(exteriorScoreTextEntity, {
    text: `HIGH WINNINGS\n\nNo winners yet!\nPlay a round of Crazy 8s to secure the bag.`,
    fontSize: 1.8,
    textColor: Color4.fromHexString('#FFD700'), // Gold text
    outlineColor: Color4.Black(),
    outlineWidth: 0.2,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER,
    textWrapping: true,
    width: 3.8
  })

  // Crown Images
  const crownTex = Material.Texture.Common({ src: 'assets/images/crown.jpg' })
  const crownMat = { 
    texture: crownTex,
    emissiveTexture: crownTex,
    emissiveIntensity: 1.5,
    albedoColor: Color4.White(),
    emissiveColor: Color4.White()
  }

  const crownLeft = engine.addEntity()
  Transform.create(crownLeft, {
    parent: billboardGroup,
    position: Vector3.create(-1.6, 4.3, -0.16),
    scale: Vector3.create(0.6, 0.6, 0.6),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  MeshRenderer.setPlane(crownLeft)
  Material.setPbrMaterial(crownLeft, crownMat)

  const crownRight = engine.addEntity()
  Transform.create(crownRight, {
    parent: billboardGroup,
    position: Vector3.create(1.6, 4.3, -0.16),
    scale: Vector3.create(0.6, 0.6, 0.6),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  MeshRenderer.setPlane(crownRight)
  Material.setPbrMaterial(crownRight, crownMat)
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
