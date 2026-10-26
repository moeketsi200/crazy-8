import { engine, Transform, MeshRenderer, Material, Entity, AudioSource, MaterialTransparencyMode } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

interface Ripple {
  entity: Entity
  active: boolean
  progress: number
  duration: number
  startScale: number
  endScale: number
  basePos: Vector3
  maxAlpha: number
}

interface Droplet {
  entity: Entity
  active: boolean
  pos: Vector3
  vel: Vector3
  waterY: number
}

export function setupWaterEffects(houseEntity: Entity) {
  // Pool and Jacuzzi local coordinate boundaries inside houseEntity
  const pool = {
    minX: -3.5,
    maxX: 5.5,
    minZ: 12.0,
    maxZ: 17.0,
    waterY: 0.35,
    maxSurfaceY: 0.65
  }

  const jacuzzi = {
    minX: -6.05,
    maxX: -3.55,
    minZ: 15.25,
    maxZ: 17.75,
    waterY: 0.65,
    maxSurfaceY: 0.95
  }

  // 1. Splash Positional Audio Entity
  const splashAudioEntity = engine.addEntity()
  Transform.create(splashAudioEntity, {
    parent: houseEntity,
    position: Vector3.create(1.0, 0.35, 14.5)
  })
  AudioSource.create(splashAudioEntity, {
    audioClipUrl: 'assets/Audio/splash.mp3',
    playing: false,
    loop: false,
    volume: 1.0
  })

  // 2. Ripple Rings Pool (12 reusable ripple rings)
  const MAX_RIPPLES = 12
  const ripples: Ripple[] = []

  for (let i = 0; i < MAX_RIPPLES; i++) {
    const ent = engine.addEntity()
    Transform.create(ent, {
      parent: houseEntity,
      position: Vector3.create(0, -10, 0),
      scale: Vector3.Zero()
    })
    MeshRenderer.setCylinder(ent)
    Material.setPbrMaterial(ent, {
      albedoColor: Color4.create(0.7, 0.95, 1.0, 0),
      transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
      metallic: 0.1,
      roughness: 0.2
    })
    ripples.push({
      entity: ent,
      active: false,
      progress: 0,
      duration: 1.2,
      startScale: 0.2,
      endScale: 2.2,
      basePos: Vector3.Zero(),
      maxAlpha: 0.7
    })
  }

  function spawnRipple(x: number, y: number, z: number, scaleMultiplier: number = 1.0, delay: number = 0) {
    const ripple = ripples.find((r) => !r.active)
    if (!ripple) return

    ripple.active = true
    ripple.progress = -delay // Support staggered double-ripples
    ripple.duration = 1.0 + Math.random() * 0.3
    ripple.startScale = 0.2 * scaleMultiplier
    ripple.endScale = 2.4 * scaleMultiplier
    ripple.maxAlpha = 0.65
    ripple.basePos = Vector3.create(x, y + 0.005, z)

    const transform = Transform.getMutable(ripple.entity)
    transform.position = ripple.basePos
    transform.scale = Vector3.Zero()
  }

  // 3. Water Droplets Burst Pool (16 droplet beads)
  const MAX_DROPLETS = 16
  const droplets: Droplet[] = []

  for (let i = 0; i < MAX_DROPLETS; i++) {
    const ent = engine.addEntity()
    Transform.create(ent, {
      parent: houseEntity,
      position: Vector3.create(0, -10, 0),
      scale: Vector3.Zero()
    })
    MeshRenderer.setSphere(ent)
    Material.setPbrMaterial(ent, {
      albedoColor: Color4.create(0.85, 0.96, 1.0, 0.75),
      transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
      roughness: 0.1,
      metallic: 0.2
    })
    droplets.push({
      entity: ent,
      active: false,
      pos: Vector3.Zero(),
      vel: Vector3.Zero(),
      waterY: 0
    })
  }

  function spawnSplashDroplets(x: number, waterY: number, z: number, count: number = 12) {
    let spawned = 0
    for (const d of droplets) {
      if (d.active) continue

      d.active = true
      d.waterY = waterY
      // Spread out slightly from entry point
      const angle = Math.random() * Math.PI * 2
      const radius = 0.1 + Math.random() * 0.25
      d.pos = Vector3.create(
        x + Math.cos(angle) * radius,
        waterY + 0.05,
        z + Math.sin(angle) * radius
      )

      // Upward burst with outward radial explosion
      const speed = 1.2 + Math.random() * 1.6
      d.vel = Vector3.create(
        Math.cos(angle) * speed * 0.6,
        2.2 + Math.random() * 1.5,
        Math.sin(angle) * speed * 0.6
      )

      const beadSize = 0.04 + Math.random() * 0.035
      const transform = Transform.getMutable(d.entity)
      transform.position = d.pos
      transform.scale = Vector3.create(beadSize, beadSize, beadSize)

      spawned++
      if (spawned >= count) break
    }
  }

  // 4. Player Tracking & Splash Detection
  let wasInWater = false
  let lastInWaterType: 'pool' | 'jacuzzi' | null = null
  let lastWadingPos = Vector3.Zero()
  let wadingTimer = 0

  engine.addSystem((dt: number) => {
    // -----------------------------------------------------------------
    // A. Update active ripple rings
    // -----------------------------------------------------------------
    for (const r of ripples) {
      if (!r.active) continue
      r.progress += dt

      if (r.progress < 0) continue // Delayed ripple

      const t = r.progress / r.duration
      if (t >= 1.0) {
        r.active = false
        Transform.getMutable(r.entity).scale = Vector3.Zero()
        continue
      }

      // Smooth expansion easing
      const currentScale = r.startScale + (r.endScale - r.startScale) * Math.sin(t * (Math.PI / 2))
      const alpha = r.maxAlpha * (1.0 - t)

      const transform = Transform.getMutable(r.entity)
      transform.scale = Vector3.create(currentScale, 0.003, currentScale)

      Material.setPbrMaterial(r.entity, {
        albedoColor: Color4.create(0.7, 0.95, 1.0, alpha),
        transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND,
        roughness: 0.2
      })
    }

    // -----------------------------------------------------------------
    // B. Update water splash droplets physics
    // -----------------------------------------------------------------
    for (const d of droplets) {
      if (!d.active) continue

      // Apply gravity
      d.vel = Vector3.create(d.vel.x, d.vel.y - 9.8 * dt, d.vel.z)
      d.pos = Vector3.create(
        d.pos.x + d.vel.x * dt,
        d.pos.y + d.vel.y * dt,
        d.pos.z + d.vel.z * dt
      )

      if (d.pos.y <= d.waterY) {
        // Droplet fell back into the water!
        d.active = false
        Transform.getMutable(d.entity).scale = Vector3.Zero()
        continue
      }

      const transform = Transform.getMutable(d.entity)
      transform.position = d.pos
    }

    // -----------------------------------------------------------------
    // C. Detect player in water
    // -----------------------------------------------------------------
    const playerTransform = Transform.getOrNull(engine.PlayerEntity)
    if (!playerTransform) return

    const worldPos = playerTransform.position

    // Convert player world coordinates into houseEntity local coordinates:
    // houseEntity at (16, 0.05, 25), scale 0.9, rot 180° Y
    const localX = (16 - worldPos.x) / 0.9
    const localY = (worldPos.y - 0.05) / 0.9
    const localZ = (25 - worldPos.z) / 0.9

    // Check pool
    const inPool =
      localX >= pool.minX &&
      localX <= pool.maxX &&
      localZ >= pool.minZ &&
      localZ <= pool.maxZ &&
      localY <= pool.maxSurfaceY &&
      localY >= pool.waterY - 0.5

    // Check jacuzzi
    const inJacuzzi =
      localX >= jacuzzi.minX &&
      localX <= jacuzzi.maxX &&
      localZ >= jacuzzi.minZ &&
      localZ <= jacuzzi.maxZ &&
      localY <= jacuzzi.maxSurfaceY &&
      localY >= jacuzzi.waterY - 0.5

    const isInWater = inPool || inJacuzzi
    const waterType = inPool ? 'pool' : inJacuzzi ? 'jacuzzi' : null
    const currentWaterY = inPool ? pool.waterY : inJacuzzi ? jacuzzi.waterY : 0

    // Transition: Player just jumped / stepped into water!
    if (isInWater && !wasInWater) {
      // 1. Play splash sound at exact entry point
      Transform.getMutable(splashAudioEntity).position = Vector3.create(localX, currentWaterY, localZ)
      AudioSource.playSound(splashAudioEntity, 'assets/Audio/splash.mp3')

      // 2. Spawn dramatic multi-ring ripples
      spawnRipple(localX, currentWaterY, localZ, 1.0, 0)
      spawnRipple(localX, currentWaterY, localZ, 0.7, 0.15)
      spawnRipple(localX, currentWaterY, localZ, 0.4, 0.30)

      // 3. Burst water droplet splash beads into the air
      spawnSplashDroplets(localX, currentWaterY, localZ, 14)

      lastWadingPos = Vector3.create(localX, currentWaterY, localZ)
      wadingTimer = 0
    } else if (isInWater) {
      // Player is wading inside the pool / jacuzzi!
      wadingTimer += dt
      const dist = Vector3.distance(lastWadingPos, Vector3.create(localX, currentWaterY, localZ))

      // If moving through the water, generate wake ripples
      if (dist > 0.25 && wadingTimer > 0.35) {
        spawnRipple(localX, currentWaterY, localZ, 0.75, 0)
        lastWadingPos = Vector3.create(localX, currentWaterY, localZ)
        wadingTimer = 0
      }
    }

    wasInWater = isInWater
    lastInWaterType = waterType
  })
}
