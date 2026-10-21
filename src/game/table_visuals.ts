import { engine, Transform, MeshRenderer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'

const colorBaseWood = Color4.fromHexString('#141110')
const colorObsidianArmrest = Color4.fromHexString('#0a0c10')
const colorCarbonFelt = Color4.fromHexString('#0d1017')
const colorCardBack = Color4.fromHexString('#BF0D0D')
const colorCardWhite = Color4.White()
const colorNeonCyan = Color4.fromHexString('#00f3ff')
const colCyanGlow = Color3.fromHexString('#00f3ff')

function createCylinder(
  parent: Entity,
  pos: Vector3,
  scale: Vector3,
  color: Color4,
  emissive?: Color3,
  emissiveIntensity: number = 2.0
) {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale })
  MeshRenderer.setCylinder(ent)
  if (emissive) {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      emissiveColor: emissive,
      emissiveIntensity,
      roughness: 0.3,
      metallic: 0.2
    })
  } else {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      roughness: 0.5,
      metallic: 0.2
    })
  }
  return ent
}

function createCard(parent: Entity, cx: number, cy: number, cz: number, rotZDeg: number, isDeck: boolean) {
  const ent = engine.addEntity()
  const thickness = isDeck ? 0.015 : 0.001
  Transform.create(ent, {
    parent,
    position: Vector3.create(cx, cy, cz),
    scale: Vector3.create(0.063, thickness, 0.088),
    rotation: Quaternion.fromEulerDegrees(0, -rotZDeg, 0)
  })
  MeshRenderer.setBox(ent)
  if (isDeck) {
    Material.setPbrMaterial(ent, {
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
  } else {
    Material.setPbrMaterial(ent, {
      texture: Material.Texture.Common({
        src: 'assets/images/card_front_cyber.png'
      }),
      roughness: 0.3,
      metallic: 0.1
    })
  }
  return ent
}

export function buildPrimitiveTable(houseEntity: Entity) {
  // 1. Dark Wood Pedestal Base
  createCylinder(houseEntity, Vector3.create(0, 0.36, 0), Vector3.create(0.9, 0.72, 0.9), colorBaseWood)
  // Chrome base foot ring
  createCylinder(houseEntity, Vector3.create(0, 0.04, 0), Vector3.create(1.3, 0.08, 1.3), Color4.fromHexString('#333842'))

  // 2. Outer Armrest Bumper (Sleek Obsidian Carbon)
  createCylinder(houseEntity, Vector3.create(0, 0.74, 0), Vector3.create(3.3, 0.08, 3.3), colorObsidianArmrest)

  // 3. Glowing Neon Cyan Tabletop Accent Ring (Between bumper and felt)
  createCylinder(houseEntity, Vector3.create(0, 0.765, 0), Vector3.create(2.96, 0.035, 2.96), colorNeonCyan, colCyanGlow, 3.0)

  // Inner Wooden Sub-structure
  createCylinder(houseEntity, Vector3.create(0, 0.75, 0), Vector3.create(3.04, 0.07, 3.04), colorBaseWood)

  // 4. Playing Surface Core Cylinder
  createCylinder(houseEntity, Vector3.create(0, 0.778, 0), Vector3.create(2.84, 0.02, 2.84), colorCarbonFelt)

  // 5. Holographic Cyber Felt Playing Surface (Top Plane)
  const feltPlane = engine.addEntity()
  Transform.create(feltPlane, {
    parent: houseEntity,
    position: Vector3.create(0, 0.785, 0),
    scale: Vector3.create(2.84, 2.84, 1.0),
    rotation: Quaternion.fromEulerDegrees(90, 0, 0)
  })
  MeshRenderer.setPlane(feltPlane)
  Material.setPbrMaterial(feltPlane, {
    texture: Material.Texture.Common({
      src: 'assets/images/cyber_table_felt.png'
    }),
    emissiveTexture: Material.Texture.Common({
      src: 'assets/images/cyber_table_emissive.png'
    }),
    emissiveColor: Color3.create(0.0, 0.95, 1.0),
    emissiveIntensity: 2.2,
    roughness: 0.6,
    metallic: 0.1
  })

  // Spawn the decorative second card of the discard pile
  createCard(houseEntity, 0.12, 0.791, 0.05, -42, false)
}
