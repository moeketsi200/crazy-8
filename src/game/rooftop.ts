import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity, MaterialTransparencyMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'

function createBox(
  parent: Entity,
  pos: Vector3,
  scale: Vector3,
  color: Color4,
  rot: Quaternion = Quaternion.Identity(),
  emissive?: Color3,
  emissiveIntensity: number = 2.0,
  hasCollider: boolean = true
): Entity {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale, rotation: rot })
  MeshRenderer.setBox(ent)
  if (hasCollider) {
    MeshCollider.setBox(ent)
  }
  const transparency = color.a < 1.0 ? MaterialTransparencyMode.MTM_ALPHA_BLEND : MaterialTransparencyMode.MTM_AUTO
  if (emissive) {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      emissiveColor: emissive,
      emissiveIntensity,
      transparencyMode: transparency,
      metallic: 0.2,
      roughness: 0.5
    })
  } else {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      transparencyMode: transparency,
      metallic: 0.1,
      roughness: 0.4
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
  emissiveIntensity: number = 2.0,
  hasCollider: boolean = true
): Entity {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale, rotation: rot })
  MeshRenderer.setCylinder(ent)
  if (hasCollider) {
    MeshCollider.setCylinder(ent)
  }
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
      transparencyMode: transparency
    })
  }
  return ent
}

export function buildRooftop(houseEntity: Entity) {
  buildRooftopDeck(houseEntity)
  buildPerimeterRailing(houseEntity)
  buildSpiralStaircase(houseEntity)
  buildRooftopBar(houseEntity)
  buildRooftopLoungers(houseEntity)
  buildRooftopLoungeSofa(houseEntity)
}

/**
 * 1. ROOFTOP DECK FLOORING
 * Fits neatly over the roof slab (y = 8.2)
 */
function buildRooftopDeck(houseEntity: Entity) {
  const colorDeck = Color4.fromHexString('#14171E') // Dark carbon composite decking
  const colorTrim = Color4.fromHexString('#0A0C10') // Dark metal edge trim

  // Main VIP Deck Floor
  createBox(
    houseEntity,
    Vector3.create(0, 8.21, 0),
    Vector3.create(14.3, 0.04, 12.3),
    colorDeck,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )

  // Decorative border trim
  createBox(houseEntity, Vector3.create(0, 8.22, 6.12), Vector3.create(14.3, 0.05, 0.15), colorTrim)
  createBox(houseEntity, Vector3.create(0, 8.22, -6.12), Vector3.create(14.3, 0.05, 0.15), colorTrim)
  createBox(houseEntity, Vector3.create(-7.12, 8.22, 0), Vector3.create(0.15, 0.05, 12.3), colorTrim)
  createBox(houseEntity, Vector3.create(7.12, 8.22, 0), Vector3.create(0.15, 0.05, 12.3), colorTrim)
}

/**
 * 2. PERIMETER GLASS BALUSTRADE & NEON BASEBOARDS
 * With an opening on the East side (x = 7.15, z ~ 3.5) for the spiral staircase
 */
function buildPerimeterRailing(houseEntity: Entity) {
  const glassColor = Color4.create(0.12, 0.18, 0.25, 0.40)
  const railMetal = Color4.fromHexString('#12151B')
  const neonCyan = Color3.fromHexString('#00f3ff')
  const neonMagenta = Color3.fromHexString('#ff007b')
  const colNeonCyan = Color4.fromHexString('#00f3ff')
  const colNeonMagenta = Color4.fromHexString('#ff007b')

  const railH = 1.15
  const railY = 8.2 + railH / 2

  // A. Front Balustrade (Facing Pool / Patio, z = 6.15) - Neon Magenta Glow Base
  createBox(houseEntity, Vector3.create(0, railY, 6.15), Vector3.create(14.3, railH, 0.04), glassColor)
  // Top Handrail
  createBox(houseEntity, Vector3.create(0, 8.2 + railH, 6.15), Vector3.create(14.35, 0.06, 0.10), railMetal)
  // Neon Baseboard Ribbon (Magenta)
  createBox(houseEntity, Vector3.create(0, 8.24, 6.12), Vector3.create(14.3, 0.04, 0.06), colNeonMagenta, Quaternion.Identity(), neonMagenta, 3.0, false)

  // B. Back Balustrade (Entrance Side, z = -6.15) - Neon Cyan Glow Base
  createBox(houseEntity, Vector3.create(0, railY, -6.15), Vector3.create(14.3, railH, 0.04), glassColor)
  createBox(houseEntity, Vector3.create(0, 8.2 + railH, -6.15), Vector3.create(14.35, 0.06, 0.10), railMetal)
  createBox(houseEntity, Vector3.create(0, 8.24, -6.12), Vector3.create(14.3, 0.04, 0.06), colNeonCyan, Quaternion.Identity(), neonCyan, 3.0, false)

  // C. Left Balustrade (x = -7.15) - Full length
  createBox(houseEntity, Vector3.create(-7.15, railY, 0), Vector3.create(0.04, railH, 12.3), glassColor)
  createBox(houseEntity, Vector3.create(-7.15, 8.2 + railH, 0), Vector3.create(0.10, 0.06, 12.35), railMetal)
  createBox(houseEntity, Vector3.create(-7.12, 8.24, 0), Vector3.create(0.06, 0.04, 12.3), colNeonCyan, Quaternion.Identity(), neonCyan, 3.0, false)

  // D. Right Balustrade (x = 7.15) - Broken into two sections to leave 1.4m opening for stairs at z ~ 3.5
  // Back section: z from -6.15 to +2.6 (length 8.75m, center z = -1.775)
  createBox(houseEntity, Vector3.create(7.15, railY, -1.775), Vector3.create(0.04, railH, 8.75), glassColor)
  createBox(houseEntity, Vector3.create(7.15, 8.2 + railH, -1.775), Vector3.create(0.10, 0.06, 8.75), railMetal)
  createBox(houseEntity, Vector3.create(7.12, 8.24, -1.775), Vector3.create(0.06, 0.04, 8.75), colNeonCyan, Quaternion.Identity(), neonCyan, 3.0, false)

  // Front section: z from 4.2 to 6.15 (length 1.95m, center z = 5.175)
  createBox(houseEntity, Vector3.create(7.15, railY, 5.175), Vector3.create(0.04, railH, 1.95), glassColor)
  createBox(houseEntity, Vector3.create(7.15, 8.2 + railH, 5.175), Vector3.create(0.10, 0.06, 1.95), railMetal)
  createBox(houseEntity, Vector3.create(7.12, 8.24, 5.175), Vector3.create(0.06, 0.04, 1.95), colNeonCyan, Quaternion.Identity(), neonCyan, 3.0, false)

  // VIP Entrance Gateway Posts (flanking the staircase opening at z = 2.6 and z = 4.2)
  for (const pz of [2.6, 4.2]) {
    createBox(houseEntity, Vector3.create(7.15, 8.2 + railH / 2, pz), Vector3.create(0.12, railH + 0.1, 0.12), railMetal)
    // Small glowing cyan top cap
    createBox(houseEntity, Vector3.create(7.15, 8.2 + railH + 0.08, pz), Vector3.create(0.14, 0.05, 0.14), colNeonCyan, Quaternion.Identity(), neonCyan, 2.5, false)
  }
}

/**
 * 3. OUTDOOR SPIRAL STAIRCASE
 * Positioned on the side at x = 8.1, z = 3.4.
 * Ascends from y = 0.0 up to y = 8.20.
 * 28 steps (rise ~ 0.29m per step), winding up seamlessly to the rooftop entrance.
 */
function buildSpiralStaircase(houseEntity: Entity) {
  const centerX = 8.1
  const centerZ = 3.4
  const totalH = 8.20
  const stepsCount = 28
  const risePerStep = totalH / stepsCount

  const colPillar = Color4.fromHexString('#1A1C22')
  const colTread = Color4.fromHexString('#101216')
  const colCyan = Color3.fromHexString('#00f3ff')
  const colorCyan = Color4.fromHexString('#00f3ff')
  const colRail = Color4.fromHexString('#2A2E38')

  // Center structural pillar
  createCylinder(
    houseEntity,
    Vector3.create(centerX, (totalH + 1.2) / 2, centerZ),
    Vector3.create(0.35, totalH + 1.2, 0.35),
    colPillar
  )

  // Top decorative finial on pillar
  createCylinder(
    houseEntity,
    Vector3.create(centerX, totalH + 1.2 + 0.1, centerZ),
    Vector3.create(0.42, 0.15, 0.42),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    2.5,
    false
  )

  // 1.25 turns = 450 degrees.
  // Top step (#27) lands at angle 180 degrees (facing West towards the house opening at x = 7.15).
  // Step 0 starts at 180 - 450 = -270 = +90 degrees (facing North towards the patio).
  const startAngle = 90.0
  const totalRotation = 450.0
  const anglePerStep = totalRotation / (stepsCount - 1)
  const treadLength = 1.35
  const treadDist = treadLength / 2 + 0.15

  const glassColor = Color4.create(0.12, 0.20, 0.28, 0.40)
  const railMetal = Color4.fromHexString('#141720')

  for (let i = 0; i < stepsCount; i++) {
    const angleDeg = startAngle + i * anglePerStep
    const angleRad = (angleDeg * Math.PI) / 180
    const stepY = (i + 1) * risePerStep

    // Position of tread center
    const tx = centerX + Math.cos(angleRad) * treadDist
    const tz = centerZ + Math.sin(angleRad) * treadDist

    // Rotation so step radiates from the center pillar
    const stepRot = Quaternion.fromEulerDegrees(0, -angleDeg + 90, 0)

    // Solid Tread (Walkable!)
    createBox(
      houseEntity,
      Vector3.create(tx, stepY - 0.04, tz),
      Vector3.create(0.48, 0.08, treadLength),
      colTread,
      stepRot,
      undefined,
      0,
      true
    )

    // Glowing Cyan LED Strip under the front edge of each tread
    createBox(
      houseEntity,
      Vector3.create(tx, stepY - 0.07, tz),
      Vector3.create(0.04, 0.02, treadLength * 0.9),
      colorCyan,
      stepRot,
      colCyan,
      2.0,
      false
    )

    // 1. OUTER PROTECTIVE GLASS BALUSTRADE (1.15m height with solid collider)
    const glassDist = treadDist + treadLength / 2 + 0.02 // r ~ 1.52m
    const gx = centerX + Math.cos(angleRad) * glassDist
    const gz = centerZ + Math.sin(angleRad) * glassDist
    const glassH = 1.15

    createBox(
      houseEntity,
      Vector3.create(gx, stepY + glassH / 2, gz),
      Vector3.create(0.48, glassH, 0.03),
      glassColor,
      stepRot,
      undefined,
      0,
      true
    )

    // Dark Metal Handrail Cap along the outer glass top
    createBox(
      houseEntity,
      Vector3.create(gx, stepY + glassH + 0.02, gz),
      Vector3.create(0.50, 0.04, 0.08),
      railMetal,
      stepRot,
      undefined,
      0,
      false
    )

    // Glowing Cyan LED accent ribbon at base of protective glass
    createBox(
      houseEntity,
      Vector3.create(gx, stepY + 0.02, gz),
      Vector3.create(0.48, 0.02, 0.04),
      colorCyan,
      stepRot,
      colCyan,
      2.5,
      false
    )

    // 2. OVERHEAD PROTECTIVE GLASS CANOPY (2.4m headroom over stairs)
    const canopyDist = centerX + Math.cos(angleRad) * (treadDist * 0.95)
    const canopyZ = centerZ + Math.sin(angleRad) * (treadDist * 0.95)
    const canopyH = 2.40

    // Overhead protective glass roof segment
    createBox(
      houseEntity,
      Vector3.create(canopyDist, stepY + canopyH, canopyZ),
      Vector3.create(0.52, 0.03, treadLength + 0.35),
      glassColor,
      stepRot,
      undefined,
      0,
      false
    )

    // Structural titanium overhead support rib
    createBox(
      houseEntity,
      Vector3.create(canopyDist, stepY + canopyH + 0.03, canopyZ),
      Vector3.create(0.05, 0.04, treadLength + 0.40),
      railMetal,
      stepRot,
      undefined,
      0,
      false
    )

    // Glowing Neon Cyan spine along the outer rim of the glass canopy
    const spineDist = centerX + Math.cos(angleRad) * (treadLength + 0.25)
    const spineZ = centerZ + Math.sin(angleRad) * (treadLength + 0.25)
    createBox(
      houseEntity,
      Vector3.create(spineDist, stepY + canopyH + 0.03, spineZ),
      Vector3.create(0.52, 0.03, 0.03),
      colorCyan,
      stepRot,
      colCyan,
      3.0,
      false
    )
  }

  // Connecting bridge from top step into the rooftop deck opening
  createBox(
    houseEntity,
    Vector3.create(7.45, 8.19, centerZ),
    Vector3.create(1.0, 0.06, 1.4),
    colTread,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )

  // Protective glass sides and overhead cover on the connecting bridge
  createBox(
    houseEntity,
    Vector3.create(7.45, 8.2 + 0.58, centerZ - 0.70),
    Vector3.create(1.0, 1.15, 0.03),
    glassColor,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )
  createBox(
    houseEntity,
    Vector3.create(7.45, 8.2 + 0.58, centerZ + 0.70),
    Vector3.create(1.0, 1.15, 0.03),
    glassColor,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )
  createBox(
    houseEntity,
    Vector3.create(7.45, 8.2 + 2.40, centerZ),
    Vector3.create(1.0, 0.03, 1.45),
    glassColor,
    Quaternion.Identity(),
    undefined,
    0,
    false
  )
}

/**
 * 4. SHADED VIP ROOFTOP COCKTAIL BAR
 * Features a minimalist black steel pergola, polished stone bar counter,
 * cyan undercounter glow, and bar stools overlooking the horizon.
 */
function buildRooftopBar(houseEntity: Entity) {
  const colMetal = Color4.fromHexString('#141720')
  const colBarTop = Color4.fromHexString('#FFFFFF') // Polished white quartz counter
  const colBarBody = Color4.fromHexString('#181C26')
  const colWood = Color4.fromHexString('#2E1C12')
  const colCyan = Color3.fromHexString('#00f3ff')
  const colorCyan = Color4.fromHexString('#00f3ff')

  const barOrigin = Vector3.create(-2.5, 8.21, -2.5)

  // A. Modern Pergola Canopy (4m x 3.5m, Height 2.8m)
  const pergolaH = 2.8
  const pergolaW = 4.2
  const pergolaD = 3.4

  // 4 Upright Steel Posts
  const offsets = [
    [-pergolaW / 2, -pergolaD / 2],
    [pergolaW / 2, -pergolaD / 2],
    [-pergolaW / 2, pergolaD / 2],
    [pergolaW / 2, pergolaD / 2]
  ]

  for (const [ox, oz] of offsets) {
    createBox(
      houseEntity,
      Vector3.create(barOrigin.x + ox, barOrigin.y + pergolaH / 2, barOrigin.z + oz),
      Vector3.create(0.12, pergolaH, 0.12),
      colMetal
    )
  }

  // Top perimeter beam frame
  createBox(houseEntity, Vector3.create(barOrigin.x, barOrigin.y + pergolaH, barOrigin.z - pergolaD / 2), Vector3.create(pergolaW, 0.12, 0.12), colMetal)
  createBox(houseEntity, Vector3.create(barOrigin.x, barOrigin.y + pergolaH, barOrigin.z + pergolaD / 2), Vector3.create(pergolaW, 0.12, 0.12), colMetal)
  createBox(houseEntity, Vector3.create(barOrigin.x - pergolaW / 2, barOrigin.y + pergolaH, barOrigin.z), Vector3.create(0.12, 0.12, pergolaD), colMetal)
  createBox(houseEntity, Vector3.create(barOrigin.x + pergolaW / 2, barOrigin.y + pergolaH, barOrigin.z), Vector3.create(0.12, 0.12, pergolaD), colMetal)

  // Horizontal wood sunscreen louvers across the pergola top
  for (let zOffset = -pergolaD / 2 + 0.35; zOffset < pergolaD / 2; zOffset += 0.45) {
    createBox(
      houseEntity,
      Vector3.create(barOrigin.x, barOrigin.y + pergolaH - 0.04, barOrigin.z + zOffset),
      Vector3.create(pergolaW - 0.1, 0.04, 0.18),
      colWood
    )
  }

  // B. Cocktail Bar Counter (Length 3.0m, Height 1.05m)
  const barCounterPos = Vector3.create(barOrigin.x, barOrigin.y, barOrigin.z + 0.6)

  // Bar Body
  createBox(
    houseEntity,
    Vector3.create(barCounterPos.x, barCounterPos.y + 0.50, barCounterPos.z),
    Vector3.create(2.8, 1.0, 0.7),
    colBarBody
  )

  // Polished Quartz Waterfall Countertop
  createBox(
    houseEntity,
    Vector3.create(barCounterPos.x, barCounterPos.y + 1.04, barCounterPos.z),
    Vector3.create(3.0, 0.08, 0.85),
    colBarTop
  )

  // Cyan Neon LED Under-Counter Glow
  createBox(
    houseEntity,
    Vector3.create(barCounterPos.x, barCounterPos.y + 0.98, barCounterPos.z + 0.41),
    Vector3.create(2.9, 0.03, 0.03),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    3.0,
    false
  )

  // Footrest rail along the front
  createBox(
    houseEntity,
    Vector3.create(barCounterPos.x, barCounterPos.y + 0.18, barCounterPos.z + 0.44),
    Vector3.create(2.8, 0.04, 0.04),
    colMetal
  )

  // C. High-Top Bar Stools (3 stools)
  for (const sx of [-0.9, 0, 0.9]) {
    const stoolPos = Vector3.create(barCounterPos.x + sx, barCounterPos.y, barCounterPos.z + 1.1)

    // Stool Central Post
    createCylinder(houseEntity, Vector3.create(stoolPos.x, stoolPos.y + 0.35, stoolPos.z), Vector3.create(0.06, 0.7, 0.06), colMetal)
    // Base Disc
    createCylinder(houseEntity, Vector3.create(stoolPos.x, stoolPos.y + 0.02, stoolPos.z), Vector3.create(0.38, 0.03, 0.38), colMetal)
    // Cushion Seat
    createCylinder(houseEntity, Vector3.create(stoolPos.x, stoolPos.y + 0.72, stoolPos.z), Vector3.create(0.40, 0.08, 0.40), Color4.fromHexString('#22252C'))
    // Low Backrest
    createBox(houseEntity, Vector3.create(stoolPos.x, stoolPos.y + 0.85, stoolPos.z + 0.16), Vector3.create(0.36, 0.18, 0.05), Color4.fromHexString('#181A20'))
  }

  // D. Backbar Bottle Display Shelf
  const backShelfPos = Vector3.create(barOrigin.x, barOrigin.y, barOrigin.z - 1.2)
  createBox(houseEntity, Vector3.create(backShelfPos.x, backShelfPos.y + 0.8, backShelfPos.z), Vector3.create(2.6, 1.6, 0.35), colBarBody)

  // Glowing backlit liquor shelf tiers
  for (const tierY of [0.55, 0.95, 1.35]) {
    createBox(
      houseEntity,
      Vector3.create(backShelfPos.x, backShelfPos.y + tierY, backShelfPos.z + 0.16),
      Vector3.create(2.4, 0.03, 0.04),
      colorCyan,
      Quaternion.Identity(),
      colCyan,
      2.5,
      false
    )
  }
}

/**
 * 5. VIP SUN LOUNGERS OVERLOOKING POOL
 * Placed along the front glass balustrade (z ~ 3.2 to 4.2),
 * positioned so players look directly down at the swimming pool and patio.
 */
function buildRooftopLoungers(houseEntity: Entity) {
  const colWood = Color4.fromHexString('#2A1A10')
  const colCushion = Color4.fromHexString('#F0EDE6') // Plush off-white
  const colCyan = Color3.fromHexString('#00f3ff')
  const colorCyan = Color4.fromHexString('#00f3ff')

  function createRooftopLounger(x: number, z: number) {
    const lounger = engine.addEntity()
    Transform.create(lounger, {
      parent: houseEntity,
      position: Vector3.create(x, 8.21, z),
      // Rotated 0 to face +Z (looking over the front pool/patio)
      rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    })

    // Wooden base frame
    createBox(lounger, Vector3.create(0, 0.14, 0), Vector3.create(0.9, 0.12, 2.1), colWood)
    // Plush bottom cushion
    createBox(lounger, Vector3.create(0, 0.24, 0.2), Vector3.create(0.8, 0.12, 1.6), colCushion)
    // Angled backrest cushion
    createBox(
      lounger,
      Vector3.create(0, 0.58, -0.7),
      Vector3.create(0.8, 0.8, 0.12),
      colCushion,
      Quaternion.fromEulerDegrees(-32, 0, 0)
    )
    // Wooden back frame
    createBox(
      lounger,
      Vector3.create(0, 0.58, -0.76),
      Vector3.create(0.9, 0.85, 0.08),
      colWood,
      Quaternion.fromEulerDegrees(-32, 0, 0)
    )
  }

  // Two luxury loungers along the front glass railing
  createRooftopLounger(-5.2, 3.8)
  createRooftopLounger(-3.6, 3.8)

  // Drinks side table between them
  const tablePos = Vector3.create(-4.4, 8.21, 3.8)
  createBox(houseEntity, Vector3.create(tablePos.x, tablePos.y + 0.18, tablePos.z), Vector3.create(0.5, 0.36, 0.5), colWood)
  // Neon accent ring on side table
  createBox(
    houseEntity,
    Vector3.create(tablePos.x, tablePos.y + 0.37, tablePos.z),
    Vector3.create(0.44, 0.02, 0.44),
    colorCyan,
    Quaternion.Identity(),
    colCyan,
    2.5,
    false
  )
}

/**
 * 6. VIP CONVERSATIONAL LOUNGE SOFA
 * L-shaped modern modular sectional with low cocktail coffee table
 */
function buildRooftopLoungeSofa(houseEntity: Entity) {
  const colBase = Color4.fromHexString('#12141A')
  const colCushion = Color4.fromHexString('#252932')
  const colPillow = Color4.fromHexString('#00f3ff')
  const colCyan = Color3.fromHexString('#00f3ff')
  const colTable = Color4.fromHexString('#0A0C10')
  const colGlass = Color4.create(0.1, 0.15, 0.2, 0.6)

  const sofaOrigin = Vector3.create(3.2, 8.21, -1.8)

  // Long sofa section (running along Z)
  createBox(houseEntity, Vector3.create(sofaOrigin.x, sofaOrigin.y + 0.16, sofaOrigin.z), Vector3.create(1.0, 0.32, 3.2), colBase)
  createBox(houseEntity, Vector3.create(sofaOrigin.x, sofaOrigin.y + 0.38, sofaOrigin.z), Vector3.create(0.9, 0.14, 3.1), colCushion)
  // Backrest (facing West toward center of deck)
  createBox(houseEntity, Vector3.create(sofaOrigin.x + 0.42, sofaOrigin.y + 0.55, sofaOrigin.z), Vector3.create(0.16, 0.45, 3.2), colBase)
  createBox(houseEntity, Vector3.create(sofaOrigin.x + 0.36, sofaOrigin.y + 0.55, sofaOrigin.z), Vector3.create(0.12, 0.38, 3.1), colCushion)

  // Short sofa return (forming L-shape along X)
  createBox(houseEntity, Vector3.create(sofaOrigin.x - 1.2, sofaOrigin.y + 0.16, sofaOrigin.z - 1.1), Vector3.create(1.6, 0.32, 1.0), colBase)
  createBox(houseEntity, Vector3.create(sofaOrigin.x - 1.2, sofaOrigin.y + 0.38, sofaOrigin.z - 1.1), Vector3.create(1.5, 0.14, 0.9), colCushion)
  createBox(houseEntity, Vector3.create(sofaOrigin.x - 1.2, sofaOrigin.y + 0.55, sofaOrigin.z - 1.52), Vector3.create(1.6, 0.45, 0.16), colBase)
  createBox(houseEntity, Vector3.create(sofaOrigin.x - 1.2, sofaOrigin.y + 0.55, sofaOrigin.z - 1.46), Vector3.create(1.5, 0.38, 0.12), colCushion)

  // Cyan Neon Pillows
  createBox(
    houseEntity,
    Vector3.create(sofaOrigin.x + 0.25, sofaOrigin.y + 0.50, sofaOrigin.z + 1.1),
    Vector3.create(0.12, 0.25, 0.25),
    colPillow,
    Quaternion.fromEulerDegrees(0, 15, -10),
    colCyan,
    1.5,
    false
  )
  createBox(
    houseEntity,
    Vector3.create(sofaOrigin.x + 0.25, sofaOrigin.y + 0.50, sofaOrigin.z - 0.2),
    Vector3.create(0.12, 0.25, 0.25),
    colPillow,
    Quaternion.fromEulerDegrees(0, -10, -10),
    colCyan,
    1.5,
    false
  )

  // Low Modern Coffee Table
  const tablePos = Vector3.create(sofaOrigin.x - 0.9, sofaOrigin.y, sofaOrigin.z + 0.2)
  createBox(houseEntity, Vector3.create(tablePos.x, tablePos.y + 0.15, tablePos.z), Vector3.create(1.2, 0.28, 1.5), colTable)
  createBox(houseEntity, Vector3.create(tablePos.x, tablePos.y + 0.30, tablePos.z), Vector3.create(1.24, 0.02, 1.54), colGlass)

  // Centerpiece: Ambient neon glass candle / lantern
  createCylinder(
    houseEntity,
    Vector3.create(tablePos.x, tablePos.y + 0.38, tablePos.z),
    Vector3.create(0.18, 0.14, 0.18),
    colPillow,
    Quaternion.Identity(),
    colCyan,
    2.5,
    false
  )
}
