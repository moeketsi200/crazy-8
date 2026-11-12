import {
  engine,
  Entity,
  Transform,
  GltfContainer,
  AvatarAttach,
  AvatarAnchorPointType,
  VisibilityComponent,
  Animator,
  GltfNodeModifiers,
  pointerEventsSystem,
  InputAction,
  ColliderLayer,
  MeshRenderer,
  MeshCollider,
  Material
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
    scale: Vector3.create(1.25, 1.25, 1.25)
  })

  GltfContainer.create(kiosk, {
    src: 'assets/Models/vip_kiosk.glb',
    visibleMeshesCollisionMask: ColliderLayer.CL_POINTER | ColliderLayer.CL_PHYSICS,
    invisibleMeshesCollisionMask: 0
  })

  GltfNodeModifiers.create(kiosk, {
    modifiers: [
      {
        path: 'Screen_Glass_Face',
        material: {
          material: {
            $case: 'unlit',
            unlit: {
              texture: Material.Texture.Common({ src: 'assets/images/crazy8_kiosk_display.png' }),
              diffuseColor: Color4.White()
            }
          }
        }
      }
    ]
  })

  // Pointer event to open the VIP Rewards & Daily Quests menu
  pointerEventsSystem.onPointerDown(
    {
      entity: kiosk,
      opts: {
        button: InputAction.IA_PRIMARY,
        hoverText: '⭐ Open VIP Rewards & Daily Quests ⭐'
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
// 4. CHAIR AURA RINGS (Underglow Floor Aura when Seated)
// ----------------------------------------------------
const chairAuraEntities: Entity[] = []
const chairGlowDisks: Entity[] = []
let chairAuraBaseHex = '#00f3ff'
let activeChairAuraIndex = -1

function applyChairAuraMaterial(index: number) {
  const disk = chairGlowDisks[index]
  if (!disk) return

  const isActive = index === activeChairAuraIndex
  const hex = isActive ? '#ffd700' : chairAuraBaseHex
  Material.setPbrMaterial(disk, {
    albedoColor: Color4.fromHexString(hex),
    emissiveColor: Color3.fromHexString(hex),
    emissiveIntensity: isActive ? 5.0 : 2.5,
    metallic: 0.1,
    roughness: 0.2
  })
}

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
  chairAuraBaseHex = hex.length >= 7 ? hex.slice(0, 7) : '#00f3ff'
  chairGlowDisks.forEach((_, index) => applyChairAuraMaterial(index))
}

export function updateActiveChairAura(chairIndex: number | null) {
  const nextActiveIndex = chairIndex !== null && chairIndex >= 0 && chairIndex < chairGlowDisks.length
    ? chairIndex
    : -1
  if (nextActiveIndex === activeChairAuraIndex) return

  const previousActiveIndex = activeChairAuraIndex
  activeChairAuraIndex = nextActiveIndex
  if (previousActiveIndex >= 0) applyChairAuraMaterial(previousActiveIndex)
  if (activeChairAuraIndex >= 0) applyChairAuraMaterial(activeChairAuraIndex)
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
let crownedPlayerId = ''

export function setupVictoryCelebration(_houseEntity: Entity) {
  // Persistent crown attached to the current round winner's head.
  crownEntity = engine.addEntity()
  Transform.create(crownEntity, { scale: Vector3.create(1.2, 1.2, 1.2) })
  GltfContainer.create(crownEntity, {
    src: 'assets/Models/winner_crown.glb',
    visibleMeshesCollisionMask: 0,
    invisibleMeshesCollisionMask: 0
  })
  VisibilityComponent.create(crownEntity, { visible: false })

  // 3D Confetti Burst
  confettiEntity = engine.addEntity()
  Transform.create(confettiEntity, {
    parent: _houseEntity,
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

  // Confetti is temporary; the crown remains visible until another player wins.
  engine.addSystem((dt) => {
    if (celebrationTimer > 0) {
      celebrationTimer -= dt
      if (celebrationTimer <= 0) {
        if (confettiEntity) VisibilityComponent.createOrReplace(confettiEntity, { visible: false })
      }
    }
  })
}

export function setRoundWinnerCrown(playerId?: string) {
  if (!crownEntity || !playerId || playerId.startsWith('bot')) {
    if (crownEntity) VisibilityComponent.createOrReplace(crownEntity, { visible: false })
    crownedPlayerId = ''
    return
  }

  if (playerId !== crownedPlayerId) {
    AvatarAttach.createOrReplace(crownEntity, {
      avatarId: playerId,
      anchorPointId: AvatarAnchorPointType.AAPT_HEAD
    })
    crownedPlayerId = playerId
  }
  VisibilityComponent.createOrReplace(crownEntity, { visible: true })
}

export function triggerVictoryCelebration() {
  celebrationTimer = 4.0

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
// 6. VIP WEARABLE SHOWCASES (Creator Hub composite entities)
// ----------------------------------------------------
export function setupWearableShowcases() {
  interface ShowcaseItem {
    id: string
    entityName: string
    title: string
    subtitle: string
  }

  const showcases: ShowcaseItem[] = [
    {
      id: 'wearable_holo_card_tee',
      entityName: 'Holo Card Tee',
      title: '👕 HOLO CARD TEE',
      subtitle: '🪙 1,500 CREDITS • 40 🏆'
    },
    {
      id: 'wearable_high_roller_tee',
      entityName: 'High Roller Tee',
      title: '👕 C8 ACE TEE',
      subtitle: '🪙 2,800 CREDITS • 100 🏆'
    },
    {
      id: 'wearable_crest_bomber',
      entityName: 'C8 Crest Bomber',
      title: '🧥 C8 CREST BOMBER',
      subtitle: '⚡ 5,500 CREDITS • 250 🏆'
    },
    {
      id: 'wearable_vip_club_bomber',
      entityName: 'VIP Club Bomber',
      title: '🧥 VIP CLUB BOMBER',
      subtitle: '👑 10,000 CREDITS • 500 🏆'
    }
  ]

  const rotatingEntities: Entity[] = []

  for (const item of showcases) {
    const pedestal = engine.getEntityOrNullByName(`${item.entityName} Pedestal`)
    const glass = engine.getEntityOrNullByName(`${item.entityName} Glass`)
    const model = engine.getEntityOrNullByName(`${item.entityName} Model`)

    if (!pedestal || !glass || !model) {
      console.error(`[Wearable] Missing composite display entities for ${item.id}`)
      continue
    }

    // Models and stands are authored in main.composite so they remain selectable in Creator Hub.
    // Runtime code only adds the existing rotation and click-to-inspect behavior.
    const ped = pedestal
    const modelEnt = model
    rotatingEntities.push(modelEnt)

    // Interaction to inspect & equip in Pro Shop
    const onInspect = () => {
      setActiveRewardsTab('shop')
      setActiveShopCategory('wearable')
      setRewardsModalOpen(true)
      showRewardToast(`${item.title}! Open Cosmetics to view and equip!`)
    }

    pointerEventsSystem.onPointerDown(
      {
        entity: ped,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: `Inspect ${item.title}`
        }
      },
      onInspect
    )
    pointerEventsSystem.onPointerDown(
      {
        entity: glass,
        opts: {
          button: InputAction.IA_PRIMARY,
          hoverText: `Inspect ${item.title}`
        }
      },
      onInspect
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

