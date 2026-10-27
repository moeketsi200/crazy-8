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
  Material,
  TextShape,
  TextAlignMode,
  MaterialTransparencyMode
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'
import {
  setRewardsModalOpen,
  setActiveRewardsTab,
  setActiveShopCategory,
  onCosmeticEquipped,
  getProfile
} from './economy'
import { showRewardToast } from './rewards_ui'

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
const chairGlowDisks: Entity[] = []

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

    // Rich emissive colored disk beneath the ring for dynamic aura colors
    const glowDisk = engine.addEntity()
    Transform.create(glowDisk, {
      parent: aura,
      position: Vector3.create(0, 0.01, 0),
      scale: Vector3.create(1.02, 0.04, 1.02)
    })
    MeshRenderer.setCylinder(glowDisk)
    Material.setPbrMaterial(glowDisk, {
      albedoColor: Color4.fromHexString('#00f3ff'),
      emissiveColor: Color3.fromHexString('#00f3ff'),
      emissiveIntensity: 2.2,
      metallic: 0.1,
      roughness: 0.2
    })
    chairGlowDisks[idx] = glowDisk

    // Start inactive/dim
    VisibilityComponent.create(aura, { visible: false })
    chairAuraEntities[idx] = aura
  })

  // Listen to aura cosmetic changes from Pro Shop
  onCosmeticEquipped((category, _itemId, item) => {
    if (category === 'aura' && item.auraHex) {
      setChairAuraColor(item.auraHex)
    }
  })
}

export function setChairAuraColor(hex: string) {
  const col = Color4.fromHexString(hex)
  const em = Color3.fromHexString(hex.length >= 7 ? hex.slice(0, 7) : '#00f3ff')
  chairGlowDisks.forEach(disk => {
    if (disk) {
      Material.setPbrMaterial(disk, {
        albedoColor: col,
        emissiveColor: em,
        emissiveIntensity: 2.5,
        metallic: 0.1,
        roughness: 0.2
      })
    }
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

// ----------------------------------------------------
// ----------------------------------------------------
// 6. VIP WEARABLE SHOWCASES (3D Showcase Pedestals)
// ----------------------------------------------------
export function setupWearableShowcases(houseEntity: Entity) {
  interface ShowcaseItem {
    id: string
    title: string
    subtitle: string
    modelSrc: string
    modelScale: Vector3
    modelPos: Vector3
    themeColor: string
    pos: Vector3
    rotY: number
  }

  const showcases: ShowcaseItem[] = [
    {
      id: 'wearable_electric_cap',
      title: '🧢 ELECTRIC STREAK CAP',
      subtitle: '⚡ 30 MATCH WINS MILESTONE',
      modelSrc: 'assets/Models/electric_cap.glb',
      modelScale: Vector3.create(1.7, 1.7, 1.7),
      modelPos: Vector3.create(0, 1.38, 0),
      themeColor: '#00f3ff',
      pos: Vector3.create(-5.2, 0.0, 9.2),
      rotY: 90
    },
    {
      id: 'wearable_shades_chain',
      title: '🕶️ DESIGNER SHADES & CHAIN',
      subtitle: '✨ 60 MATCH WINS MILESTONE',
      modelSrc: 'assets/Models/shades_chain.glb',
      modelScale: Vector3.create(1.8, 1.8, 1.8),
      modelPos: Vector3.create(0, 1.42, 0),
      themeColor: '#ffd700',
      pos: Vector3.create(-5.2, 0.0, 11.5),
      rotY: 90
    },
    {
      id: 'wearable_vip_bomber',
      title: '🧥 VIP LOUNGE BOMBER',
      subtitle: '🔥 80 MATCH WINS MILESTONE',
      modelSrc: 'assets/Models/vip_bomber.glb',
      modelScale: Vector3.create(1.15, 1.15, 1.15),
      modelPos: Vector3.create(0, 1.38, 0),
      themeColor: '#ff0055',
      pos: Vector3.create(-5.2, 0.0, 13.8),
      rotY: 90
    },
    {
      id: 'wearable_champion_crown_hoodie',
      title: '👑 CHAMPION CROWN & HOODIE',
      subtitle: '🏆 #1 WEEKLY CHAMPION RANK',
      modelSrc: 'assets/Models/winner_crown.glb',
      modelScale: Vector3.create(0.72, 0.72, 0.72),
      modelPos: Vector3.create(0, 1.36, 0),
      themeColor: '#ffd700',
      pos: Vector3.create(-5.2, 0.0, 16.1),
      rotY: 90
    }
  ]

  const rotatingEntities: Entity[] = []

  for (const item of showcases) {
    const group = engine.addEntity()
    Transform.create(group, {
      parent: houseEntity,
      position: item.pos,
      rotation: Quaternion.fromEulerDegrees(0, item.rotY, 0)
    })

    // Pedestal cylinder base
    const ped = engine.addEntity()
    Transform.create(ped, {
      parent: group,
      position: Vector3.create(0, 0.45, 0),
      scale: Vector3.create(0.85, 0.9, 0.85)
    })
    MeshRenderer.setCylinder(ped)
    Material.setPbrMaterial(ped, {
      albedoColor: Color4.fromHexString('#0b1424'),
      emissiveColor: Color3.fromHexString(item.themeColor),
      emissiveIntensity: 0.6,
      metallic: 0.85,
      roughness: 0.2
    })

    // Glowing neon ring rim
    const ring = engine.addEntity()
    Transform.create(ring, {
      parent: group,
      position: Vector3.create(0, 0.91, 0),
      scale: Vector3.create(0.88, 0.03, 0.88)
    })
    MeshRenderer.setCylinder(ring)
    Material.setPbrMaterial(ring, {
      albedoColor: Color4.fromHexString(item.themeColor),
      emissiveColor: Color3.fromHexString(item.themeColor),
      emissiveIntensity: 3.2
    })

    // Real 3D Model floating inside pedestal
    const modelEnt = engine.addEntity()
    Transform.create(modelEnt, {
      parent: group,
      position: item.modelPos,
      scale: item.modelScale
    })
    GltfContainer.create(modelEnt, {
      src: item.modelSrc
    })
    rotatingEntities.push(modelEnt)

    // Glass enclosure cylinder
    const glass = engine.addEntity()
    Transform.create(glass, {
      parent: group,
      position: Vector3.create(0, 1.45, 0),
      scale: Vector3.create(0.78, 1.05, 0.78)
    })
    MeshRenderer.setCylinder(glass)
    Material.setPbrMaterial(glass, {
      albedoColor: Color4.fromHexString(`${item.themeColor}15`),
      roughness: 0.1,
      metallic: 0.9,
      transparencyMode: MaterialTransparencyMode.MTM_ALPHA_BLEND
    })

    // Floating 3D label
    const label = engine.addEntity()
    Transform.create(label, {
      parent: group,
      position: Vector3.create(0, 2.15, 0),
      rotation: Quaternion.fromEulerDegrees(0, 180, 0)
    })
    TextShape.create(label, {
      text: `${item.title}\n${item.subtitle}\n[Click to Inspect & Equip]`,
      fontSize: 1.2,
      textColor: Color4.fromHexString(item.themeColor),
      outlineColor: Color4.Black(),
      outlineWidth: 0.15,
      textAlign: TextAlignMode.TAM_MIDDLE_CENTER
    })

    // Interaction to inspect & equip in Pro Shop
    pointerEventsSystem.onPointerDown(
      {
        entity: ped,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: `Inspect ${item.title}`
        }
      },
      () => {
        setActiveRewardsTab('shop')
        setActiveShopCategory('wearable')
        setRewardsModalOpen(true)
        showRewardToast(`${item.title}! Check VIP Pro Shop to view and equip!`)
      }
    )
  }

  // System to smoothly rotate all 3D wearable models
  let rotAngle = 0
  engine.addSystem((dt) => {
    rotAngle += dt * 45
    if (rotAngle >= 360) rotAngle -= 360
    for (const ent of rotatingEntities) {
      const t = Transform.getMutableOrNull(ent)
      if (t) {
        t.rotation = Quaternion.fromEulerDegrees(0, rotAngle, 0)
      }
    }
  })
}

