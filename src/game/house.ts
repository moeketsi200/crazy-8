import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

export function buildHouse() {
  const houseEntity = engine.addEntity()
  Transform.create(houseEntity, {
    position: Vector3.create(16, 0.05, 25),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    scale: Vector3.create(0.9, 0.9, 0.9)
  })

  const colorWood = Color4.fromHexString('#2E1A11')
  const colorNavy = Color4.fromHexString('#1A222E')
  const colorFlagstone = Color4.fromHexString('#8C8070')
  const colorStone = Color4.fromHexString('#333333') // Darker for modern look
  const colorWater = Color4.create(0.0, 0.6, 0.9, 0.8) 
  const colorFire = Color4.fromHexString('#FF5905')
  const colorNeonCyan = Color4.fromHexString('#00f3ff')
  const colorNeonPink = Color4.fromHexString('#ff007b')

  function addBlock(pos: Vector3, scale: Vector3, color: Color4, emissive?: Color4): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, { parent: houseEntity, position: pos, scale: scale })
    MeshRenderer.setBox(ent)
    MeshCollider.setBox(ent)
    if (emissive) {
      Material.setPbrMaterial(ent, { albedoColor: color, emissiveColor: emissive, emissiveIntensity: 2.0 })
    } else {
      Material.setPbrMaterial(ent, { albedoColor: color })
    }
    return ent
  }

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
  addCylinder(Vector3.create(0, 0.01, -0.15), Vector3.create(6.4, 0.02, 6.4), colorNavy)

  // 2. MAIN WALLS
  addBlock(Vector3.create(-6.9, 4.0, 0), Vector3.create(0.2, 8.0, 12.0), colorNavy) 
  addBlock(Vector3.create(6.9, 4.0, 0), Vector3.create(0.2, 8.0, 12.0), colorNavy)  

  // 3. FRONT & BACK STUB WALLS
  addBlock(Vector3.create(-5.8, 4.0, 5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(5.8, 4.0, 5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(0, 6.75, 5.9), Vector3.create(9.2, 2.50, 0.22), colorNavy) 
  addBlock(Vector3.create(-5.8, 4.0, -5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(5.8, 4.0, -5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(0, 6.75, -5.9), Vector3.create(9.2, 2.50, 0.22), colorNavy) 

  // 4. ROOF
  addBlock(Vector3.create(0, 8.1, 0), Vector3.create(14.5, 0.2, 12.5), colorNavy)

  // 5. CHILLERS OASIS PATIO
  addBlock(Vector3.create(0, -0.22, 16.5), Vector3.create(22.0, 0.38, 21.0), colorFlagstone)

  // 6. NEON LUXURY POOL (Hollow Rectangular)
  const poolX = 1.0, poolZ = 14.5
  const poolW = 9.0, poolD = 5.0
  const wallThick = 0.4
  const poolH = 0.5 
  const waterH = 0.35 
  
  // Floor
  addBlock(Vector3.create(poolX, 0.05, poolZ), Vector3.create(poolW + wallThick*2, 0.1, poolD + wallThick*2), colorNavy)
  // Walls
  addBlock(Vector3.create(poolX, 0.05 + poolH/2, poolZ - poolD/2 - wallThick/2), Vector3.create(poolW + wallThick*2, poolH, wallThick), colorStone)
  addBlock(Vector3.create(poolX, 0.05 + poolH/2, poolZ + poolD/2 + wallThick/2), Vector3.create(poolW + wallThick*2, poolH, wallThick), colorStone)
  addBlock(Vector3.create(poolX - poolW/2 - wallThick/2, 0.05 + poolH/2, poolZ), Vector3.create(wallThick, poolH, poolD), colorStone)
  addBlock(Vector3.create(poolX + poolW/2 + wallThick/2, 0.05 + poolH/2, poolZ), Vector3.create(wallThick, poolH, poolD), colorStone)
  
  // LED glowing strip inside the pool rim
  addBlock(Vector3.create(poolX, 0.05 + poolH, poolZ - poolD/2 + 0.05), Vector3.create(poolW, 0.02, 0.1), colorNeonCyan, colorNeonCyan)
  addBlock(Vector3.create(poolX, 0.05 + poolH, poolZ + poolD/2 - 0.05), Vector3.create(poolW, 0.02, 0.1), colorNeonCyan, colorNeonCyan)
  addBlock(Vector3.create(poolX - poolW/2 + 0.05, 0.05 + poolH, poolZ), Vector3.create(0.1, 0.02, poolD), colorNeonCyan, colorNeonCyan)
  addBlock(Vector3.create(poolX + poolW/2 - 0.05, 0.05 + poolH, poolZ), Vector3.create(0.1, 0.02, poolD), colorNeonCyan, colorNeonCyan)

  // Water
  const mainWater = addBlock(Vector3.create(poolX, waterH, poolZ), Vector3.create(poolW, 0.02, poolD), colorWater)
  MeshCollider.deleteFrom(mainWater)

  // 7. FIREPLACE
  addBlock(Vector3.create(7.5, 0.9, 16.5), Vector3.create(3.2, 1.8, 1.4), colorStone)
  addBlock(Vector3.create(7.5, 2.6, 16.5), Vector3.create(1.8, 1.8, 1.1), colorStone)
  addBlock(Vector3.create(7.5, 0.55, 16.05), Vector3.create(1.4, 0.8, 0.6), colorNavy) 
  addBlock(Vector3.create(7.5, 0.60, 15.85), Vector3.create(1.1, 0.4, 0.2), colorFire, colorFire) 

  // 8. NEON SQUARE JACUZZI
  const jacX = -4.8, jacZ = 16.5
  const jacW = 2.5, jacD = 2.5
  const jacH = 0.8
  const jacWaterH = 0.65
  
  addBlock(Vector3.create(jacX, 0.05, jacZ), Vector3.create(jacW + wallThick*2, 0.1, jacD + wallThick*2), colorNavy)
  addBlock(Vector3.create(jacX, 0.05 + jacH/2, jacZ - jacD/2 - wallThick/2), Vector3.create(jacW + wallThick*2, jacH, wallThick), colorStone)
  addBlock(Vector3.create(jacX, 0.05 + jacH/2, jacZ + jacD/2 + wallThick/2), Vector3.create(jacW + wallThick*2, jacH, wallThick), colorStone)
  addBlock(Vector3.create(jacX - jacW/2 - wallThick/2, 0.05 + jacH/2, jacZ), Vector3.create(wallThick, jacH, jacD), colorStone)
  addBlock(Vector3.create(jacX + jacW/2 + wallThick/2, 0.05 + jacH/2, jacZ), Vector3.create(wallThick, jacH, jacD), colorStone)
  
  // Jacuzzi LED glowing strip
  addBlock(Vector3.create(jacX, 0.05 + jacH, jacZ - jacD/2 + 0.05), Vector3.create(jacW, 0.02, 0.1), colorNeonPink, colorNeonPink)
  addBlock(Vector3.create(jacX, 0.05 + jacH, jacZ + jacD/2 - 0.05), Vector3.create(jacW, 0.02, 0.1), colorNeonPink, colorNeonPink)
  addBlock(Vector3.create(jacX - jacW/2 + 0.05, 0.05 + jacH, jacZ), Vector3.create(0.1, 0.02, jacD), colorNeonPink, colorNeonPink)
  addBlock(Vector3.create(jacX + jacW/2 - 0.05, 0.05 + jacH, jacZ), Vector3.create(0.1, 0.02, jacD), colorNeonPink, colorNeonPink)

  const jacWater = addBlock(Vector3.create(jacX, jacWaterH, jacZ), Vector3.create(jacW, 0.02, jacD), colorWater)
  MeshCollider.deleteFrom(jacWater)

  return houseEntity
}
