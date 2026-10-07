import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

export function buildHouse() {
  // Create a master entity to hold the entire house so we can easily scale and rotate it!
  const houseEntity = engine.addEntity()
  Transform.create(houseEntity, {
    position: Vector3.create(16, 0.05, 25),
    // Rotate 180 degrees just like the end of your Blender script
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    // We scale it up to 90% (0.9)! This is nearly double the previous 55% size.
    // We placed it at Z=25 so the 27m long patio doesn't slice through the boundaries.
    scale: Vector3.create(0.9, 0.9, 0.9)
  })

  // --- COLORS BASED ON YOUR BLENDER MATERIALS ---
  const colorWood = Color4.fromHexString('#2E1A11')
  const colorNavy = Color4.fromHexString('#1A222E')
  const colorFlagstone = Color4.fromHexString('#8C8070')
  const colorStone = Color4.fromHexString('#665C54')
  const colorWater = Color4.create(0.1, 0.7, 0.9, 0.6) // Semi-transparent cyan
  const colorFire = Color4.fromHexString('#FF5905')

  // --- HELPER FUNCTION FOR CUBES ---
  function addBlock(pos: Vector3, scale: Vector3, color: Color4): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, { parent: houseEntity, position: pos, scale: scale })
    MeshRenderer.setBox(ent)
    MeshCollider.setBox(ent)
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
  }

  // --- HELPER FUNCTION FOR CYLINDERS ---
  function addCylinder(pos: Vector3, scale: Vector3, color: Color4): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, { parent: houseEntity, position: pos, scale: scale })
    MeshRenderer.setCylinder(ent)
    MeshCollider.setCylinder(ent)
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
  }

  // 1. FLOOR & PIT
  addBlock(Vector3.create(0, -0.2, 0), Vector3.create(14.0, 0.4, 12.0), colorWood)
  // We use a flat cylinder for the sunken pit center
  addCylinder(Vector3.create(0, 0.01, -0.15), Vector3.create(6.4, 0.02, 6.4), colorNavy)

  // 2. MAIN WALLS (8m tall!)
  addBlock(Vector3.create(-6.9, 4.0, 0), Vector3.create(0.2, 8.0, 12.0), colorNavy) // Left
  addBlock(Vector3.create(6.9, 4.0, 0), Vector3.create(0.2, 8.0, 12.0), colorNavy)  // Right

  // 3. FRONT & BACK STUB WALLS
  // Back Wall (Y=5.9 in blender -> Z=5.9)
  addBlock(Vector3.create(-5.8, 4.0, 5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(5.8, 4.0, 5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(0, 6.75, 5.9), Vector3.create(9.2, 2.50, 0.22), colorNavy) // Lintel

  // Front Wall (Y=-5.9 in blender -> Z=-5.9)
  addBlock(Vector3.create(-5.8, 4.0, -5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(5.8, 4.0, -5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(0, 6.75, -5.9), Vector3.create(9.2, 2.50, 0.22), colorNavy) // Lintel

  // 4. ROOF
  addBlock(Vector3.create(0, 8.1, 0), Vector3.create(14.5, 0.2, 12.5), colorNavy)

  // 5. CHILLERS OASIS PATIO
  addBlock(Vector3.create(0, -0.22, 16.5), Vector3.create(22.0, 0.38, 21.0), colorFlagstone)

  // 6. LAGOON POOL
  addCylinder(Vector3.create(0, -0.02, 15.5), Vector3.create(11.0, 0.15, 8.0), colorStone) // Coping
  addCylinder(Vector3.create(0, 0.05, 15.5), Vector3.create(10.2, 0.02, 7.2), colorWater)  // Water

  // 7. FIREPLACE
  addBlock(Vector3.create(6.5, 0.9, 16.5), Vector3.create(3.2, 1.8, 1.4), colorStone)
  addBlock(Vector3.create(6.5, 2.6, 16.5), Vector3.create(1.8, 1.8, 1.1), colorStone)
  addBlock(Vector3.create(6.5, 0.55, 16.05), Vector3.create(1.4, 0.8, 0.6), colorNavy) // Sunken part
  addBlock(Vector3.create(6.5, 0.60, 15.85), Vector3.create(1.1, 0.4, 0.2), colorFire) // Embers

  // 8. JACUZZI
  addCylinder(Vector3.create(-4.6, 0.5, 16.8), Vector3.create(3.3, 1.0, 3.3), colorStone)
  addCylinder(Vector3.create(-4.6, 1.01, 16.8), Vector3.create(2.7, 0.02, 2.7), colorWater)

  return houseEntity
}
