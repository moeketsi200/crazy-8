import {
  engine,
  Entity,
  Transform,
  GltfContainer,
  VisibilityComponent,
  Animator,
  pointerEventsSystem,
  InputAction,
  ColliderLayer,
  MeshRenderer,
  Material
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'
import { setRewardsModalOpen } from './economy'

// ----------------------------------------------------
// 1. VIP KIOSK (Interactive 3D Terminal)
// ----------------------------------------------------
export function setupVipKiosk(houseEntity: Entity): Entity {
  const kiosk = engine.addEntity()
  Transform.create(kiosk, {
    parent: houseEntity,
    position: Vector3.create(3.6, 0.0, -4.2),
    rotation: Quaternion.fromEulerDegrees(0, -45, 0),
    scale: Vector3.create(1.0, 1.0, 1.0)
  })

  GltfContainer.create(kiosk, {
    src: 'assets/Models/vip_kiosk.glb',
    visibleMeshesCollisionMask: ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS,
    invisibleMeshesCollisionMask: 0
  })

  // Pointer event to open the VIP Rewards & Bounties menu
  pointerEventsSystem.onPointerDown(
    {
      entity: kiosk,
      opts: {
        button: InputAction.IA_PRIMARY,
        hoverText: '⭐ Open VIP Rewards & Daily Bounties ⭐'
      }
    },
    () => {
      setRewardsModalOpen(true)
    }
  )

  return kiosk
}

// ----------------------------------------------------
// 2. CRAZY 8 SHOWCASE TROPHY (Pedestal & Rotating Cup)
// ----------------------------------------------------
export function setupTrophyShowcase(houseEntity: Entity): Entity {
  const showcaseGroup = engine.addEntity()
  Transform.create(showcaseGroup, {
    parent: houseEntity,
    position: Vector3.create(-5.2, 0.0, -3.2),
    rotation: Quaternion.fromEulerDegrees(0, 45, 0),
    scale: Vector3.create(1.0, 1.0, 1.0)
  })

  // Pedestal Column (Dark obsidian with neon cyan emissive trim)
  const pedestal = engine.addEntity()
  Transform.create(pedestal, {
    parent: showcaseGroup,
    position: Vector3.create(0, 0.45, 0),
    scale: Vector3.create(0.7, 0.9, 0.7)
  })
  MeshRenderer.setCylinder(pedestal)
  Material.setPbrMaterial(pedestal, {
    albedoColor: Color4.fromHexString('#0f172a'),
    emissiveColor: Color3.fromHexString('#00f3ff'),
    emissiveIntensity: 0.8,
    metallic: 0.8,
    roughness: 0.2
  })

  // The 3D Trophy Model
  const trophy = engine.addEntity()
  Transform.create(trophy, {
    parent: showcaseGroup,
    position: Vector3.create(0, 1.15, 0),
    scale: Vector3.create(0.45, 0.45, 0.45)
  })

  GltfContainer.create(trophy, {
    src: 'assets/Models/crazy8_trophy.glb',
    visibleMeshesCollisionMask: ColliderLayer.CL_POINTER,
    invisibleMeshesCollisionMask: 0
  })

  // Rotate trophy slowly
  let rotAngle = 0
  engine.addSystem((dt) => {
    rotAngle += dt * 30
    if (rotAngle >= 360) rotAngle -= 360
    const t = Transform.getMutableOrNull(trophy)
    if (t) {
      t.rotation = Quaternion.fromEulerDegrees(0, rotAngle, 0)
    }
  })

  pointerEventsSystem.onPointerDown(
    {
      entity: trophy,
      opts: {
        button: InputAction.IA_PRIMARY,
        hoverText: '🏆 Crazy 8 VIP Champions Cup'
      }
    },
    () => {
      setRewardsModalOpen(true)
    }
  )

  return showcaseGroup
}

// ----------------------------------------------------
// 3. TABLE CHIP STACKS (3D Poker Chips on Felt)
// ----------------------------------------------------
export function setupTableChips(houseEntity: Entity) {
  // Stack 1 (Near right side of felt)
  const chips1 = engine.addEntity()
  Transform.create(chips1, {
    parent: houseEntity,
    position: Vector3.create(0.55, 0.79, 0.35),
    rotation: Quaternion.fromEulerDegrees(0, 25, 0),
    scale: Vector3.create(4.0, 4.0, 4.0)
  })
  GltfContainer.create(chips1, {
    src: 'assets/Models/chip_stacks.glb',
    visibleMeshesCollisionMask: 0,
    invisibleMeshesCollisionMask: 0
  })

  // Stack 2 (Near left side of felt)
  const chips2 = engine.addEntity()
  Transform.create(chips2, {
    parent: houseEntity,
    position: Vector3.create(-0.55, 0.79, -0.35),
    rotation: Quaternion.fromEulerDegrees(0, -40, 0),
    scale: Vector3.create(4.0, 4.0, 4.0)
  })
  GltfContainer.create(chips2, {
    src: 'assets/Models/chip_stacks.glb',
    visibleMeshesCollisionMask: 0,
    invisibleMeshesCollisionMask: 0
  })
}

// ----------------------------------------------------
// 4. CHAIR AURA RINGS (Underglow Floor Aura when Seated)
// ----------------------------------------------------
const chairAuraEntities: Entity[] = []

export function setupChairAuras(houseEntity: Entity, chairPositions: { x: number; z: number }[]) {
  chairPositions.forEach((pos, idx) => {
    const aura = engine.addEntity()
    Transform.create(aura, {
      parent: houseEntity,
      position: Vector3.create(pos.x, 0.02, pos.z),
      scale: Vector3.create(1.0, 0.15, 1.0)
    })
    GltfContainer.create(aura, {
      src: 'assets/Models/chair_aura_ring.glb',
      visibleMeshesCollisionMask: 0,
      invisibleMeshesCollisionMask: 0
    })
    // Start inactive/dim
    VisibilityComponent.create(aura, { visible: false })
    chairAuraEntities[idx] = aura
  })
}

export function updateChairAuraVisibility(seatedIndices: Set<number>) {
  chairAuraEntities.forEach((aura, idx) => {
    if (aura) {
      const isSeated = seatedIndices.has(idx)
      VisibilityComponent.createOrReplace(aura, { visible: isSeated })
    }
  })
}

// ----------------------------------------------------
// 5. VICTORY CELEBRATION (Winner Crown & Confetti Burst)
// ----------------------------------------------------
let crownEntity: Entity | null = null
let confettiEntity: Entity | null = null
let celebrationTimer = 0

export function setupVictoryCelebration(houseEntity: Entity) {
  // 3D Winner Crown (Hovering above the card table)
  crownEntity = engine.addEntity()
  Transform.create(crownEntity, {
    parent: houseEntity,
    position: Vector3.create(0, 2.1, 0),
    scale: Vector3.create(1.2, 1.2, 1.2)
  })
  GltfContainer.create(crownEntity, {
    src: 'assets/Models/winner_crown.glb',
    visibleMeshesCollisionMask: 0,
    invisibleMeshesCollisionMask: 0
  })
  VisibilityComponent.create(crownEntity, { visible: false })

  // 3D Confetti Burst
  confettiEntity = engine.addEntity()
  Transform.create(confettiEntity, {
    parent: houseEntity,
    position: Vector3.create(0, 1.3, 0),
    scale: Vector3.create(25.0, 25.0, 25.0)
  })
  GltfContainer.create(confettiEntity, {
    src: 'assets/Models/confetti_burst.glb',
    visibleMeshesCollisionMask: 0,
    invisibleMeshesCollisionMask: 0
  })
  Animator.create(confettiEntity, {
    states: [
      {
        clip: 'WinBurst',
        playing: false,
        loop: false
      }
    ]
  })
  VisibilityComponent.create(confettiEntity, { visible: false })

  // System to animate crown and countdown celebration
  let crownRotation = 0
  engine.addSystem((dt) => {
    if (celebrationTimer > 0) {
      celebrationTimer -= dt

      // Spin crown smoothly
      crownRotation += dt * 90
      if (crownRotation >= 360) crownRotation -= 360

      if (crownEntity) {
        const t = Transform.getMutableOrNull(crownEntity)
        if (t) {
          // Bob up and down slightly
          const bob = Math.sin(celebrationTimer * 3) * 0.08
          t.position = Vector3.create(0, 2.1 + bob, 0)
          t.rotation = Quaternion.fromEulerDegrees(0, crownRotation, 0)
        }
      }

      if (celebrationTimer <= 0) {
        if (crownEntity) VisibilityComponent.createOrReplace(crownEntity, { visible: false })
        if (confettiEntity) VisibilityComponent.createOrReplace(confettiEntity, { visible: false })
      }
    }
  })
}

export function triggerVictoryCelebration() {
  celebrationTimer = 9.0 // Celebrate for 9 seconds!

  if (crownEntity) {
    VisibilityComponent.createOrReplace(crownEntity, { visible: true })
  }

  if (confettiEntity) {
    VisibilityComponent.createOrReplace(confettiEntity, { visible: true })
    const anim = Animator.getClipOrNull(confettiEntity, 'WinBurst')
    if (anim) {
      anim.playing = true
      anim.loop = true
    }
  }
}
