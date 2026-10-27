import {
  engine,
  Entity,
  AvatarAttach,
  AvatarAnchorPointType,
  Transform,
  GltfContainer
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { onCosmeticEquipped, getProfile } from './economy'

interface WearableAttachConfig {
  modelPath: string
  anchorPoint: AvatarAnchorPointType
  position: Vector3
  rotation: Quaternion
  scale: Vector3
}

export const WEARABLE_CONFIGS: Record<string, WearableAttachConfig> = {
  wearable_electric_cap: {
    modelPath: 'assets/Models/electric_cap.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_HEAD,
    position: Vector3.create(0, 0.06, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.05, 1.05, 1.05)
  },
  wearable_shades_chain: {
    modelPath: 'assets/Models/shades_chain.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_HEAD,
    position: Vector3.create(0, 0.02, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.02, 1.02, 1.02)
  },
  wearable_vip_bomber: {
    modelPath: 'assets/Models/vip_bomber.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_SPINE2,
    position: Vector3.create(0, -0.16, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.12, 1.12, 1.12)
  },
  wearable_champion_crown_hoodie: {
    modelPath: 'assets/Models/winner_crown.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_HEAD,
    position: Vector3.create(0, 0.28, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(0.50, 0.50, 0.50)
  }
}

let anchorEntity: Entity | null = null
let modelEntity: Entity | null = null
let currentEquippedId: string | null = null

export function getCurrentlyEquippedWearableId(): string | null {
  return currentEquippedId
}

export function unequipAvatarWearable() {
  if (modelEntity) {
    engine.removeEntity(modelEntity)
    modelEntity = null
  }
  if (anchorEntity) {
    engine.removeEntity(anchorEntity)
    anchorEntity = null
  }
  currentEquippedId = null
}

export function equipAvatarWearable(itemId: string) {
  unequipAvatarWearable()

  const config = WEARABLE_CONFIGS[itemId]
  if (!config) return

  // 1. Create anchor entity attached to the avatar bone
  anchorEntity = engine.addEntity()
  AvatarAttach.create(anchorEntity, {
    anchorPointId: config.anchorPoint
  })

  // 2. Create child entity with local offset and GLTF model
  modelEntity = engine.addEntity()
  Transform.create(modelEntity, {
    parent: anchorEntity,
    position: config.position,
    rotation: config.rotation,
    scale: config.scale
  })
  GltfContainer.create(modelEntity, {
    src: config.modelPath
  })

  currentEquippedId = itemId
  console.log(`[Wearable] Equipped ${itemId} onto avatar anchor ${config.anchorPoint}`)
}

export function setupWearablesSystem() {
  // Listen for cosmetic changes from economy / UI
  onCosmeticEquipped((category, itemId) => {
    if (category === 'wearable') {
      if (itemId && WEARABLE_CONFIGS[itemId]) {
        equipAvatarWearable(itemId)
      } else {
        unequipAvatarWearable()
      }
    }
  })

  // Initialize with currently equipped wearable if any
  const profile = getProfile()
  if (profile.equippedWearable && WEARABLE_CONFIGS[profile.equippedWearable]) {
    equipAvatarWearable(profile.equippedWearable)
  }
}
