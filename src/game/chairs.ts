import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

const colorBlack = Color4.fromHexString('#111111')
const colorRed = Color4.fromHexString('#D90A05')
const colorNylon = Color4.fromHexString('#040404')
const colorChrome = Color4.fromHexString('#BFC0C7')

function createPart(parent: Entity, pos: Vector3, scale: Vector3, rot: Quaternion, color: Color4, isCylinder = false, hasPhysics = false) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale: scale, rotation: rot })
    if (isCylinder) {
        MeshRenderer.setCylinder(ent)
        if (hasPhysics) MeshCollider.setCylinder(ent, ColliderLayer.CL_PHYSICS)
    } else {
        MeshRenderer.setBox(ent)
        if (hasPhysics) MeshCollider.setBox(ent, ColliderLayer.CL_PHYSICS)
    }
    Material.setPbrMaterial(ent, { albedoColor: color, roughness: 0.5, metallic: color === colorChrome ? 0.8 : 0.1 })
    return ent
}

export function buildPrimitiveChair(parentHouse: Entity, cx: number, cz: number, angleDeg: number) {
    const chairParent = engine.addEntity()
    Transform.create(chairParent, {
        parent: parentHouse,
        position: Vector3.create(cx, 0, cz),
        // Blender Z-rotation = DCL Y-rotation. 
        // Because of coordinate handedness, we negate the angle and add 90 for correct facing.
        rotation: Quaternion.fromEulerDegrees(0, -(angleDeg + 90), 0),
        scale: Vector3.create(1, 1.2, 1) // Scaled up 20% in Y so the cushion meets the avatar's floating hips!
    })

    // 1. Seat Cushion
    createPart(chairParent, Vector3.create(0, 0.44, 0), Vector3.create(0.42, 0.08, 0.44), Quaternion.Identity(), colorBlack)

    // 2. Seat Side Accents
    createPart(chairParent, Vector3.create(-0.22, 0.47, 0), Vector3.create(0.06, 0.07, 0.44), Quaternion.fromEulerDegrees(0, 0, 18), colorRed)
    createPart(chairParent, Vector3.create(0.22, 0.47, 0), Vector3.create(0.06, 0.07, 0.44), Quaternion.fromEulerDegrees(0, 0, -18), colorRed)

    // 3. Backrest
    createPart(chairParent, Vector3.create(0, 0.88, -0.20), Vector3.create(0.36, 0.76, 0.07), Quaternion.fromEulerDegrees(-6, 0, 0), colorBlack)

    // 4. Backrest Side Accents
    createPart(chairParent, Vector3.create(-0.20, 0.94, -0.19), Vector3.create(0.06, 0.50, 0.06), Quaternion.fromEulerDegrees(-6, 0, -16), colorRed)
    createPart(chairParent, Vector3.create(0.20, 0.94, -0.19), Vector3.create(0.06, 0.50, 0.06), Quaternion.fromEulerDegrees(-6, 0, 16), colorRed)

    // 5. Lumbar Support
    createPart(chairParent, Vector3.create(0, 0.58, -0.16), Vector3.create(0.26, 0.12, 0.05), Quaternion.fromEulerDegrees(-6, 0, 0), colorRed)

    // 6. Headrest (Cylinder)
    createPart(chairParent, Vector3.create(0, 1.16, -0.21), Vector3.create(0.12, 0.22, 0.12), Quaternion.fromEulerDegrees(-6, 0, 90), colorRed, true)

    // 7. Armrests
    createPart(chairParent, Vector3.create(-0.26, 0.65, -0.04), Vector3.create(0.05, 0.04, 0.26), Quaternion.Identity(), colorNylon)
    createPart(chairParent, Vector3.create(-0.26, 0.54, -0.04), Vector3.create(0.04, 0.18, 0.04), Quaternion.Identity(), colorNylon, true)
    
    createPart(chairParent, Vector3.create(0.26, 0.65, -0.04), Vector3.create(0.05, 0.04, 0.26), Quaternion.Identity(), colorNylon)
    createPart(chairParent, Vector3.create(0.26, 0.54, -0.04), Vector3.create(0.04, 0.18, 0.04), Quaternion.Identity(), colorNylon, true)

    // 8. Gas Piston
    createPart(chairParent, Vector3.create(0, 0.22, 0), Vector3.create(0.07, 0.32, 0.07), Quaternion.Identity(), colorChrome, true)

    // 9. 5-Point Base
    for (let leg = 0; leg < 5; leg++) {
        const legAngDeg = leg * 72 
        const legAngRad = legAngDeg * (Math.PI / 180)
        
        const lx = 0.15 * Math.cos(legAngRad)
        const lz = 0.15 * Math.sin(legAngRad)
        createPart(chairParent, Vector3.create(lx, 0.06, lz), Vector3.create(0.30, 0.03, 0.04), Quaternion.fromEulerDegrees(0, -legAngDeg, 0), colorNylon)

        const wx = 0.30 * Math.cos(legAngRad)
        const wz = 0.30 * Math.sin(legAngRad)
        createPart(chairParent, Vector3.create(wx, 0.035, wz), Vector3.create(0.06, 0.025, 0.06), Quaternion.fromEulerDegrees(90, -legAngDeg, 0), colorRed, true)
    }

    return chairParent
}
