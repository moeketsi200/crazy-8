import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity, MaterialTransparencyMode, TextureWrapMode, TextureFilterMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3, Vector2 } from '@dcl/sdk/math'

export function buildHouse() {
  const houseEntity = engine.addEntity()
  Transform.create(houseEntity, {
    position: Vector3.create(16, 0.05, 25),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0),
    scale: Vector3.create(0.9, 0.9, 0.9)
  })

  const colorObsidianBase = Color4.fromHexString('#0a0c10')
  const colorNavy = Color4.fromHexString('#1A222E')
  const colorSlateBase = Color4.fromHexString('#12141a')
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
    const transparency = color.a < 1.0 ? MaterialTransparencyMode.MTM_ALPHA_BLEND : MaterialTransparencyMode.MTM_AUTO
    if (emissive) {
      Material.setPbrMaterial(ent, { albedoColor: color, emissiveColor: emissive, emissiveIntensity: 2.0, transparencyMode: transparency })
    } else {
      Material.setPbrMaterial(ent, { albedoColor: color, transparencyMode: transparency })
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

  function addWallpaperPlane(pos: Vector3, scale: Vector3, rot: Quaternion, tiling: Vector2): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, { parent: houseEntity, position: pos, scale: scale, rotation: rot })
    MeshRenderer.setPlane(ent)
    Material.setPbrMaterial(ent, {
      texture: Material.Texture.Common({
        src: 'assets/images/dark_hex_grid.png',
        wrapMode: TextureWrapMode.TWM_REPEAT,
        filterMode: TextureFilterMode.TFM_TRILINEAR
      }),
      emissiveTexture: Material.Texture.Common({
        src: 'assets/images/dark_hex_emissive.png',
        wrapMode: TextureWrapMode.TWM_REPEAT,
        filterMode: TextureFilterMode.TFM_TRILINEAR
      }),
      emissiveColor: Color3.create(0.0, 0.95, 1.0),
      emissiveIntensity: 0.6,
      transparencyMode: MaterialTransparencyMode.MTM_OPAQUE,
      metallic: 0.1,
      roughness: 0.70,
      specularIntensity: 0.2
    })
    return ent
  }

  function addBrickWallPlane(pos: Vector3, scale: Vector3, rot: Quaternion, tiling: Vector2): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, { parent: houseEntity, position: pos, scale: scale, rotation: rot })
    MeshRenderer.setPlane(ent)
    Material.setPbrMaterial(ent, {
      texture: Material.Texture.Common({
        src: 'assets/images/dark_brick_wallpaper.jpg',
        wrapMode: TextureWrapMode.TWM_REPEAT,
        filterMode: TextureFilterMode.TFM_TRILINEAR
      }),
      transparencyMode: MaterialTransparencyMode.MTM_OPAQUE,
      metallic: 0.0,
      roughness: 0.85,
      specularIntensity: 0.2
    })
    return ent
  }

  function addObsidianFloor(pos: Vector3, scale: Vector3, tiling: Vector2): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, {
      parent: houseEntity,
      position: pos,
      scale: scale,
      rotation: Quaternion.fromEulerDegrees(90, 0, 0)
    })
    MeshRenderer.setPlane(ent)
    Material.setPbrMaterial(ent, {
      texture: Material.Texture.Common({
        src: 'assets/images/polished_black_obsidian.png',
        wrapMode: TextureWrapMode.TWM_REPEAT,
        filterMode: TextureFilterMode.TFM_TRILINEAR
      }),
      transparencyMode: MaterialTransparencyMode.MTM_OPAQUE,
      metallic: 0.1,
      roughness: 0.5,
      specularIntensity: 0.3
    })
    return ent
  }

  function addSlatePatioFloor(pos: Vector3, scale: Vector3, tiling: Vector2): Entity {
    const ent = engine.addEntity()
    Transform.create(ent, {
      parent: houseEntity,
      position: pos,
      scale: scale,
      rotation: Quaternion.fromEulerDegrees(90, 0, 0)
    })
    MeshRenderer.setPlane(ent)
    Material.setPbrMaterial(ent, {
      texture: Material.Texture.Common({
        src: 'assets/images/charcoal_slate_patio.png',
        wrapMode: TextureWrapMode.TWM_REPEAT,
        filterMode: TextureFilterMode.TFM_TRILINEAR
      }),
      transparencyMode: MaterialTransparencyMode.MTM_OPAQUE,
      metallic: 0.05,
      roughness: 0.8,
      specularIntensity: 0.2
    })
    return ent
  }

  // 1. FLOOR & PIT (Polished Black Obsidian / Gloss Epoxy)
  addBlock(Vector3.create(0, -0.2, 0), Vector3.create(14.0, 0.4, 12.0), Color4.fromHexString('#0a0c10'))
  addObsidianFloor(Vector3.create(0, 0.003, 0), Vector3.create(13.8, 11.8, 1.0), Vector2.create(3.5, 3.0))
  addCylinder(Vector3.create(0, 0.01, -0.15), Vector3.create(6.4, 0.02, 6.4), Color4.fromHexString('#0c0e14'))

  // 2. MAIN WALLS (Exterior Architectural Shell)
  addBlock(Vector3.create(-6.9, 4.0, 0), Vector3.create(0.2, 8.0, 12.0), colorNavy) 
  addBlock(Vector3.create(6.9, 4.0, 0), Vector3.create(0.2, 8.0, 12.0), colorNavy)  

  // 3. FRONT & BACK STUB WALLS
  addBlock(Vector3.create(-5.8, 4.0, 5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(5.8, 4.0, 5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(0, 6.75, 5.9), Vector3.create(9.2, 2.50, 0.22), colorNavy) 
  addBlock(Vector3.create(-5.8, 4.0, -5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(5.8, 4.0, -5.9), Vector3.create(2.4, 8.0, 0.2), colorNavy)
  addBlock(Vector3.create(0, 6.75, -5.9), Vector3.create(9.2, 2.50, 0.22), colorNavy) 

  // 3.5. DARK HEXAGONAL SCI-FI CYBER GRID (INTERIOR VIP LOUNGE)
  // Left Interior Wall (facing +X into the room)
  addWallpaperPlane(
    Vector3.create(-6.78, 4.0, 0),
    Vector3.create(11.8, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, -90, 0),
    Vector2.create(3.0, 2.0)
  )

  // Right Interior Wall (facing -X into the room)
  addWallpaperPlane(
    Vector3.create(6.78, 4.0, 0),
    Vector3.create(11.8, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 90, 0),
    Vector2.create(3.0, 2.0)
  )

  // Back Interior Stub Walls & Header (facing +Z into the room)
  addWallpaperPlane(
    Vector3.create(-5.8, 4.0, -5.76),
    Vector3.create(2.38, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 180, 0),
    Vector2.create(0.6, 2.0)
  )
  addWallpaperPlane(
    Vector3.create(5.8, 4.0, -5.76),
    Vector3.create(2.38, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 180, 0),
    Vector2.create(0.6, 2.0)
  )
  addWallpaperPlane(
    Vector3.create(0, 6.75, -5.76),
    Vector3.create(9.2, 2.50, 1.0),
    Quaternion.fromEulerDegrees(0, 180, 0),
    Vector2.create(2.3, 0.625)
  )

  // Front Interior Stub Walls & Header (facing -Z into the room)
  addWallpaperPlane(
    Vector3.create(-5.8, 4.0, 5.76),
    Vector3.create(2.38, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 0, 0),
    Vector2.create(0.6, 2.0)
  )
  addWallpaperPlane(
    Vector3.create(5.8, 4.0, 5.76),
    Vector3.create(2.38, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 0, 0),
    Vector2.create(0.6, 2.0)
  )
  addWallpaperPlane(
    Vector3.create(0, 6.75, 5.76),
    Vector3.create(9.2, 2.50, 1.0),
    Quaternion.fromEulerDegrees(0, 0, 0),
    Vector2.create(2.3, 0.625)
  ) 

  // Interior Ceiling / Underside of Roof (facing -Y downwards into the room)
  addWallpaperPlane(
    Vector3.create(0, 7.98, 0),
    Vector3.create(13.6, 11.6, 1.0),
    Quaternion.fromEulerDegrees(-90, 0, 0),
    Vector2.create(3.4, 2.9)
  )

  // 3.8. EXTERIOR DARK BRICK WALLPAPER
  // Left Exterior Wall (facing -X)
  addBrickWallPlane(
    Vector3.create(-7.02, 4.0, 0),
    Vector3.create(12.04, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 90, 0),
    Vector2.create(6.0, 8.0)
  )

  // Right Exterior Wall (facing +X)
  addBrickWallPlane(
    Vector3.create(7.02, 4.0, 0),
    Vector3.create(12.04, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, -90, 0),
    Vector2.create(6.0, 8.0)
  )

  // Back Exterior Stub Walls & Header (Entrance side, facing -Z)
  addBrickWallPlane(
    Vector3.create(-5.8, 4.0, -6.02),
    Vector3.create(2.44, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 0, 0),
    Vector2.create(1.22, 8.0)
  )
  addBrickWallPlane(
    Vector3.create(5.8, 4.0, -6.02),
    Vector3.create(2.44, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 0, 0),
    Vector2.create(1.22, 8.0)
  )
  addBrickWallPlane(
    Vector3.create(0, 6.75, -6.02),
    Vector3.create(9.2, 2.50, 1.0),
    Quaternion.fromEulerDegrees(0, 0, 0),
    Vector2.create(4.6, 2.5)
  )

  // Front Exterior Stub Walls & Header (Patio side, facing +Z)
  addBrickWallPlane(
    Vector3.create(-5.8, 4.0, 6.02),
    Vector3.create(2.44, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 180, 0),
    Vector2.create(1.22, 8.0)
  )
  addBrickWallPlane(
    Vector3.create(5.8, 4.0, 6.02),
    Vector3.create(2.44, 8.0, 1.0),
    Quaternion.fromEulerDegrees(0, 180, 0),
    Vector2.create(1.22, 8.0)
  )
  addBrickWallPlane(
    Vector3.create(0, 6.75, 6.02),
    Vector3.create(9.2, 2.50, 1.0),
    Quaternion.fromEulerDegrees(0, 180, 0),
    Vector2.create(4.6, 2.5)
  )

  // 4. ROOF
  addBlock(Vector3.create(0, 8.1, 0), Vector3.create(14.5, 0.2, 12.5), colorNavy)

  // 5. CHILLERS OASIS PATIO (Charcoal Basalt Pavers / Dark Slate Slabs)
  addBlock(Vector3.create(0, -0.22, 16.5), Vector3.create(22.0, 0.38, 21.0), colorSlateBase)
  addSlatePatioFloor(Vector3.create(0, -0.027, 16.5), Vector3.create(21.96, 20.96, 1.0), Vector2.create(11.0, 10.5))

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

  // 9. JACUZZI BOILING EFFECT & BUBBLES
  const bubbleCount = 12
  const bubbles: { ent: Entity, speed: number, offset: number, x: number, z: number }[] = []
  
  for (let i = 0; i < bubbleCount; i++) {
      const b = engine.addEntity()
      const bx = jacX + (Math.random() * jacW * 0.8) - (jacW * 0.4)
      const bz = jacZ + (Math.random() * jacD * 0.8) - (jacD * 0.4)
      Transform.create(b, {
          parent: houseEntity,
          position: Vector3.create(bx, jacWaterH, bz),
          scale: Vector3.create(0.05, 0.05, 0.05)
      })
      MeshRenderer.setSphere(b)
      Material.setPbrMaterial(b, { albedoColor: Color4.create(0.8, 0.9, 1.0, 0.6), transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND })
      bubbles.push({ ent: b, speed: 0.5 + Math.random(), offset: Math.random() * 10, x: bx, z: bz })
  }

  let boilTime = 0
  engine.addSystem((dt) => {
      boilTime += dt
      
      // 1. Chaotic surface boil
      const boilOffset = (Math.sin(boilTime * 12) * 0.015) + (Math.cos(boilTime * 18) * 0.01)
      const waterTransform = Transform.getMutable(jacWater)
      waterTransform.position.y = jacWaterH + boilOffset
      
      // 2. Bubbles rising, wobbling, and popping
      for (const b of bubbles) {
          const t = Transform.getMutable(b.ent)
          // Cycle from bottom of jacuzzi up to the surface
          const cycle = (boilTime * b.speed + b.offset) % 0.4
          t.position.y = (jacWaterH - 0.3) + cycle
          
          // Shrink as they approach the surface
          const life = cycle / 0.4
          const scale = 0.06 * Math.sin(life * Math.PI) // bulge in middle, shrink at ends
          t.scale = Vector3.create(scale, scale, scale)
          
          // Wobble side to side
          t.position.x = b.x + Math.sin(boilTime * 8 + b.offset) * 0.03
          t.position.z = b.z + Math.cos(boilTime * 7 + b.offset) * 0.03
      }
  })

  return houseEntity
}
