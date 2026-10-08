import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

function createBox(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale, rotation: rot })
    MeshRenderer.setBox(ent)
    MeshCollider.setBox(ent)
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

export function buildBeachSeats(houseEntity: Entity) {
    const colorWood = Color4.fromHexString('#3E2723')
    const colorCushion = Color4.fromHexString('#F5F5DC') // Beige/Cream

    function createLounger(x: number, z: number, yRot: number) {
        const lounger = engine.addEntity()
        Transform.create(lounger, {
            parent: houseEntity,
            position: Vector3.create(x, 0, z),
            rotation: Quaternion.fromEulerDegrees(0, yRot, 0)
        })

        // Wooden frame base
        createBox(lounger, Vector3.create(0, 0.15, 0), Vector3.create(0.8, 0.1, 2.0), colorWood)
        // Cushion base
        createBox(lounger, Vector3.create(0, 0.25, 0.2), Vector3.create(0.7, 0.1, 1.6), colorCushion)
        // Cushion backrest (angled)
        createBox(lounger, Vector3.create(0, 0.6, -0.7), Vector3.create(0.7, 0.8, 0.1), colorCushion, Quaternion.fromEulerDegrees(-30, 0, 0))
        // Frame backrest (angled)
        createBox(lounger, Vector3.create(0, 0.6, -0.75), Vector3.create(0.8, 0.85, 0.1), colorWood, Quaternion.fromEulerDegrees(-30, 0, 0))
    }

    function createUmbrella(x: number, z: number) {
        const umbrella = engine.addEntity()
        Transform.create(umbrella, {
            parent: houseEntity,
            position: Vector3.create(x, 0, z)
        })
        
        // Pole
        createBox(umbrella, Vector3.create(0, 1.5, 0), Vector3.create(0.05, 3.0, 0.05), colorWood)
        // Canopy (Thin flat pyramid, but we can just use a large flat box or 4 angled boxes)
        // A flat octagonal-ish shape is hard with just boxes without rotation, let's just use a wide flat box for simplicity
        createBox(umbrella, Vector3.create(0, 3.0, 0), Vector3.create(3.0, 0.05, 3.0), colorCushion)
    }

    // Move to the BACK side of the pool (further back)
    // Facing the pool (rotation 180)
    createLounger(0, 20.5, 180)
    createLounger(2.5, 20.5, 180)
    createLounger(5.0, 20.5, 180)
    
    // Umbrellas for the back row
    createUmbrella(1.25, 21.5)
    createUmbrella(6.25, 21.5)
    
    // Move side loungers further LEFT of the Jacuzzi
    // Facing the Jacuzzi/Pool (rotation 90)
    createLounger(-9.5, 15.0, 90)
    createLounger(-9.5, 17.5, 90)
    
    // Umbrella for the left side
    createUmbrella(-10.5, 16.25)
}
