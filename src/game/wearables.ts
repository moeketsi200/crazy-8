import {
  engine,
  Entity,
  AvatarAttach,
  AvatarBase,
  AvatarAnchorPointType,
  Transform,
  GltfContainer
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { getPlayer } from '@dcl/sdk/src/players'
import { onCosmeticEquipped, getProfile } from './economy'

interface WearableAttachConfig {
  modelPath: string
  femaleModelPath?: string
  anchorPoint: AvatarAnchorPointType
  position: Vector3
  rotation: Quaternion
  scale: Vector3
}

export const WEARABLE_CONFIGS: Record<string, WearableAttachConfig> = {
  wearable_electric_cap: {
    modelPath: 'assets/Models/electric_cap.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_HEAD,
    position: Vector3.create(0, 0.0, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.05, 1.05, 1.05)
  },
  wearable_shades_chain: {
    modelPath: 'assets/Models/shades_chain.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_HEAD,
    position: Vector3.create(0, 0.0, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.0, 1.0, 1.0)
  },
  wearable_holo_card_tee: {
    modelPath: 'assets/Models/crazy8_holo_card_tee.glb',
    femaleModelPath: 'assets/Models/crazy8_holo_card_tee_female.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_POSITION,
    position: Vector3.create(0, 0.0, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.03, 1.03, 1.03)
  },
  wearable_high_roller_tee: {
    modelPath: 'assets/Models/crazy8_high_roller_tee.glb',
    femaleModelPath: 'assets/Models/crazy8_high_roller_tee_female.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_POSITION,
    position: Vector3.create(0, 0.0, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.03, 1.03, 1.03)
  },
  wearable_crest_bomber: {
    modelPath: 'assets/Models/crazy8_crest_bomber.glb',
    femaleModelPath: 'assets/Models/crazy8_crest_bomber_female.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_POSITION,
    position: Vector3.create(0, 0.0, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.05, 1.05, 1.05)
  },
  wearable_vip_club_bomber: {
    modelPath: 'assets/Models/crazy8_vip_club_bomber.glb',
    femaleModelPath: 'assets/Models/crazy8_vip_club_bomber_female.glb',
    anchorPoint: AvatarAnchorPointType.AAPT_POSITION,
    position: Vector3.create(0, 0.0, 0.0),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0),
    scale: Vector3.create(1.05, 1.05, 1.05)
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
  const bodyShape = getPlayer()?.avatar?.bodyShapeUrn?.toLowerCase() || ''
  const isFemaleShape = bodyShape.includes('femal') || bodyShape.includes('shape_b')
  const modelPath = (isFemaleShape && config.femaleModelPath) || config.modelPath
  const useFemaleModel = !!config.femaleModelPath && modelPath === config.femaleModelPath

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
    src: modelPath
  })

  currentEquippedId = itemId
  console.log(`[Wearable] Equipped ${itemId} (${useFemaleModel ? 'female' : 'male'} model) onto avatar anchor ${config.anchorPoint}`)
}

export function setupWearablesSystem() {
  AvatarBase.onChange(engine.PlayerEntity, () => {
    if (currentEquippedId && WEARABLE_CONFIGS[currentEquippedId]) {
      equipAvatarWearable(currentEquippedId)
    }
  })

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
