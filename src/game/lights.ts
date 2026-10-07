import { engine, Transform, MeshRenderer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Color4, Color3 } from '@dcl/sdk/math'

// Helper function to create a glowing neon orb since DCL doesn't have dynamic point lights!
function createGlowOrb(parent: Entity, pos: Vector3, color: Color3, intensity: number = 2.0, size: number = 0.2) {
    const orb = engine.addEntity()
    Transform.create(orb, {
        parent,
        position: pos,
        scale: Vector3.create(size, size, size)
    })
    MeshRenderer.setSphere(orb)
    
    // We use an Emissive Material so it literally glows in the dark!
    const albedoColor = Color4.create(color.r, color.g, color.b, 0.8)
    
    Material.setPbrMaterial(orb, {
        albedoColor: albedoColor,
        emissiveColor: color,
        emissiveIntensity: intensity,
        roughness: 1.0,
        castShadows: false
    })
}

export function buildLights(houseEntity: Entity) {
    // Decentraland handles the global sun and the player's camera automatically, 
    // so we don't need the Blender SUN or CAMERA configurations.
    // However, we CAN simulate the accent lights using glowing Emissive spheres!

    // 1. Raised center spotlight over the card table
    // Blender: (0, 0, 7.5) -> DCL: (0, 7.5, 0)
    // Warm light color (1.0, 0.85, 0.60)
    createGlowOrb(
        houseEntity, 
        Vector3.create(0, 7.5, 0), 
        Color3.create(1.0, 0.85, 0.60), 
        10.0, // High intensity for the main room light
        0.5  // Larger size hanging from the 8m ceiling
    )

    // 2. Purple accent light for the Media Unit
    // Blender stand_y = 1.5. location = (-6.65, 1.15, 1.85) -> DCL: (-6.65, 1.85, 1.15)
    createGlowOrb(
        houseEntity, 
        Vector3.create(-6.65, 1.85, 1.15), 
        Color3.create(0.6, 0.0, 1.0), 
        4.0, 
        0.15
    )

    // 3. Pink accent light for the DJ Booth
    // Blender ik_x = 5.20, ik_y = 1.0. location = (5.55, 1.0, 1.70) -> DCL: (5.55, 1.70, 1.0)
    createGlowOrb(
        houseEntity, 
        Vector3.create(5.55, 1.70, 1.0), 
        Color3.create(1.0, 0.1, 0.6), 
        4.0, 
        0.15
    )
}
