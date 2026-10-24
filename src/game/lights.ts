import { engine, Transform, MeshRenderer, Material, Entity, MaterialTransparencyMode } from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3, Quaternion } from '@dcl/sdk/math'

function createBox(
  parent: Entity,
  pos: Vector3,
  scale: Vector3,
  color: Color4,
  rot: Quaternion = Quaternion.Identity(),
  emissive?: Color3,
  emissiveIntensity: number = 2.0
): Entity {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale, rotation: rot })
  MeshRenderer.setBox(ent)
  const transparency = color.a < 1.0 ? MaterialTransparencyMode.MTM_ALPHA_BLEND : MaterialTransparencyMode.MTM_AUTO
  if (emissive) {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      emissiveColor: emissive,
      emissiveIntensity,
      transparencyMode: transparency,
      roughness: 0.3,
      metallic: 0.2
    })
  } else {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      transparencyMode: transparency,
      roughness: 0.4,
      metallic: 0.6
    })
  }
  return ent
}

function createCylinder(
  parent: Entity,
  pos: Vector3,
  scale: Vector3,
  color: Color4,
  rot: Quaternion = Quaternion.Identity(),
  emissive?: Color3,
  emissiveIntensity: number = 2.0
): Entity {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale, rotation: rot })
  MeshRenderer.setCylinder(ent)
  const transparency = color.a < 1.0 ? MaterialTransparencyMode.MTM_ALPHA_BLEND : MaterialTransparencyMode.MTM_AUTO
  if (emissive) {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      emissiveColor: emissive,
      emissiveIntensity,
      transparencyMode: transparency
    })
  } else {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      transparencyMode: transparency,
      roughness: 0.4,
      metallic: 0.7
    })
  }
  return ent
}

function createGlowOrb(parent: Entity, pos: Vector3, color: Color3, intensity: number = 2.0, size: number = 0.2) {
  const orb = engine.addEntity()
  Transform.create(orb, {
    parent,
    position: pos,
    scale: Vector3.create(size, size, size)
  })
  MeshRenderer.setSphere(orb)
  Material.setPbrMaterial(orb, {
    albedoColor: Color4.create(color.r, color.g, color.b, 0.9),
    emissiveColor: color,
    emissiveIntensity: intensity,
    roughness: 1.0,
    castShadows: false
  })
  return orb
}

export function buildLights(houseEntity: Entity) {
  // 1. Futuristic Suspended Halo Chandelier over the card table
  buildHaloChandelier(houseEntity)

  // 2. Ceiling Cove Perimeter Neon Lighting (tracing top corners of the room)
  buildCeilingCoveLights(houseEntity)

  // 3. Side Ambient Accent Glows (Media Unit & DJ Booth)
  buildAccentLights(houseEntity)
}

/**
 * Suspended Circular Halo Chandelier:
 * - Ceiling canopy disc mounted at y = 7.96m
 * - 4 angled black steel suspension cables in an X-pattern
 * - 36-segment glowing electric cyan halo ring (radius 1.65m, diameter 3.3m)
 *   suspended at y = 6.60m over the central card table
 */
function buildHaloChandelier(houseEntity: Entity) {
  const colCanopy = Color4.fromHexString('#141720')
  const colCable = Color4.fromHexString('#0E1015')
  const colChassis = Color4.fromHexString('#12151D')
  const colCyanGlow = Color3.fromHexString('#00f3ff')
  const colLedCore = Color4.create(0.75, 0.98, 1.0, 1.0)
  const colNeonCyan = Color4.fromHexString('#00f3ff')

  const ceilingY = 7.96
  const ringY = 6.60
  const ringRadius = 1.65

  // A. Ceiling Canopy Disc
  createCylinder(
    houseEntity,
    Vector3.create(0, ceilingY, 0),
    Vector3.create(0.50, 0.05, 0.50),
    colCanopy
  )
  // Glowing cyan accent ring on ceiling canopy
  createCylinder(
    houseEntity,
    Vector3.create(0, ceilingY - 0.02, 0),
    Vector3.create(0.54, 0.015, 0.54),
    colNeonCyan,
    Quaternion.Identity(),
    colCyanGlow,
    2.5
  )

  // B. 4 Angled Suspension Cables (X-pattern to 45°, 135°, 225°, 315°)
  const pTop = Vector3.create(0, ceilingY - 0.02, 0)
  const cableAngles = [45, 135, 225, 315]

  for (const deg of cableAngles) {
    const rad = (deg * Math.PI) / 180
    const pBottom = Vector3.create(
      ringRadius * Math.cos(rad),
      ringY + 0.04,
      ringRadius * Math.sin(rad)
    )

    const delta = Vector3.subtract(pBottom, pTop)
    const cableLength = Vector3.length(delta)
    const pMid = Vector3.scale(Vector3.add(pTop, pBottom), 0.5)
    const cableRot = Quaternion.fromToRotation(Vector3.Up(), Vector3.normalize(delta))

    // Thin steel cable
    createCylinder(
      houseEntity,
      pMid,
      Vector3.create(0.010, cableLength, 0.010),
      colCable,
      cableRot
    )

    // Cable mounting anchor on ring
    createCylinder(
      houseEntity,
      Vector3.create(pBottom.x, ringY + 0.05, pBottom.z),
      Vector3.create(0.04, 0.04, 0.04),
      colCanopy
    )
  }

  // C. Circular Halo Ring Light (36 segments for a smooth curved ring)
  const segments = 36
  const angleStep = 360 / segments

  for (let i = 0; i < segments; i++) {
    const midAngle = (i + 0.5) * angleStep
    const rad = (midAngle * Math.PI) / 180
    const segX = ringRadius * Math.cos(rad)
    const segZ = ringRadius * Math.sin(rad)

    // Tangent rotation along the circle
    const segRot = Quaternion.fromEulerDegrees(0, -midAngle + 90, 0)

    // Segment length = chord length + slight overlap
    const chordLen = 2 * ringRadius * Math.sin((angleStep / 2) * (Math.PI / 180)) * 1.05

    // 1. Dark titanium outer housing / frame
    createBox(
      houseEntity,
      Vector3.create(segX, ringY, segZ),
      Vector3.create(chordLen, 0.09, 0.09),
      colChassis,
      segRot
    )

    // 2. High-intensity glowing neon cyan LED core (facing downwards & inwards)
    createBox(
      houseEntity,
      Vector3.create(segX, ringY - 0.012, segZ),
      Vector3.create(chordLen * 0.98, 0.07, 0.07),
      colLedCore,
      segRot,
      colCyanGlow,
      4.0
    )

    // 3. Inner accent neon glow strip
    const innerRadius = ringRadius - 0.04
    const inX = innerRadius * Math.cos(rad)
    const inZ = innerRadius * Math.sin(rad)
    createBox(
      houseEntity,
      Vector3.create(inX, ringY, inZ),
      Vector3.create(chordLen * 0.95, 0.04, 0.02),
      colNeonCyan,
      segRot,
      colCyanGlow,
      3.0
    )
  }

  // D. Downward Light Illuminator directly onto the poker table
  createGlowOrb(
    houseEntity,
    Vector3.create(0, ringY - 0.05, 0),
    Color3.create(0.7, 0.95, 1.0),
    1.8,
    0.20
  )
}

/**
 * Ceiling Cove Perimeter Lighting:
 * Traces the top corners of the room where the walls meet the ceiling (at y = 7.92m).
 * Matches the bright cyan perimeter light bar in the screenshot!
 */
function buildCeilingCoveLights(houseEntity: Entity) {
  const colCyan = Color3.fromHexString('#00f3ff')
  const colorCyan = Color4.fromHexString('#00f3ff')
  const coveY = 7.92
  const coveThickness = 0.045

  // Left Wall Cove (along Z)
  createBox(
    houseEntity,
    Vector3.create(-6.74, coveY, 0),
    Vector3.create(coveThickness, coveThickness, 11.6),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    3.5
  )

  // Right Wall Cove (along Z)
  createBox(
    houseEntity,
    Vector3.create(6.74, coveY, 0),
    Vector3.create(coveThickness, coveThickness, 11.6),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    3.5
  )

  // Back Wall Cove (along X, entrance side)
  createBox(
    houseEntity,
    Vector3.create(0, coveY, -5.74),
    Vector3.create(13.4, coveThickness, coveThickness),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    3.5
  )

  // Front Wall Cove (along X, patio side)
  createBox(
    houseEntity,
    Vector3.create(0, coveY, 5.74),
    Vector3.create(13.4, coveThickness, coveThickness),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    3.5
  )
}

/**
 * Side Accent Lights:
 * Subtle accent lighting for the Media Unit and DJ Booth.
 */
function buildAccentLights(houseEntity: Entity) {
  // Purple accent light over the Media Unit
  createGlowOrb(
    houseEntity,
    Vector3.create(-6.65, 1.85, 1.15),
    Color3.create(0.6, 0.0, 1.0),
    4.0,
    0.15
  )

  // Pink accent light over the DJ Booth
  createGlowOrb(
    houseEntity,
    Vector3.create(5.55, 1.70, 1.0),
    Color3.create(1.0, 0.1, 0.6),
    4.0,
    0.15
  )
}
