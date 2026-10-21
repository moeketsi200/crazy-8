import { engine, Transform, MeshRenderer, MeshCollider, ColliderLayer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'

const colorBlack = Color4.fromHexString('#0f1117')
const colorDarkGrey = Color4.fromHexString('#1a1d26')
const colorNylon = Color4.fromHexString('#08090d')
const colorChrome = Color4.fromHexString('#8A93A6')

export type PartOptions = {
    parent: Entity
    pos: Vector3
    scale: Vector3
    rot: Quaternion
    color: Color4
    emissive?: Color3
    emissiveIntensity?: number
    isCylinder?: boolean
    hasPhysics?: boolean
}

function createPart(opts: PartOptions) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent: opts.parent, position: opts.pos, scale: opts.scale, rotation: opts.rot })
    if (opts.isCylinder) {
        MeshRenderer.setCylinder(ent)
        if (opts.hasPhysics) MeshCollider.setCylinder(ent, ColliderLayer.CL_PHYSICS)
    } else {
        MeshRenderer.setBox(ent)
        if (opts.hasPhysics) MeshCollider.setBox(ent, ColliderLayer.CL_PHYSICS)
    }
    if (opts.emissive) {
        Material.setPbrMaterial(ent, {
            albedoColor: opts.color,
            emissiveColor: opts.emissive,
            emissiveIntensity: opts.emissiveIntensity || 2.5,
            roughness: 0.3,
            metallic: 0.2
        })
    } else {
        Material.setPbrMaterial(ent, {
            albedoColor: opts.color,
            roughness: 0.5,
            metallic: opts.color === colorChrome ? 0.8 : 0.1
        })
    }
    return ent
}

export function buildPrimitiveChair(parentHouse: Entity, cx: number, cz: number, angleDeg: number, chairIndex?: number) {
    const chairParent = engine.addEntity()
    Transform.create(chairParent, {
        parent: parentHouse,
        position: Vector3.create(cx, 0, cz),
        rotation: Quaternion.fromEulerDegrees(0, -(angleDeg + 90), 0),
        scale: Vector3.create(1, 1.2, 1) // Scaled up 20% in Y so cushion meets avatar hips
    })

    // All chairs styled in matching Electric Cyan (#00f3ff)
    const isCyan = true
    const colAccent = isCyan ? Color4.fromHexString('#00f3ff') : Color4.fromHexString('#ff007b')
    const colGlow = isCyan ? Color3.fromHexString('#00f3ff') : Color3.fromHexString('#ff007b')
    const glowIntensity = 2.8

    // 1. Seat Cushion (Deep Carbon Leather)
    createPart({ parent: chairParent, pos: Vector3.create(0, 0.44, 0), scale: Vector3.create(0.42, 0.08, 0.44), rot: Quaternion.Identity(), color: colorBlack })

    // 2. Seat Side Glowing Accents
    createPart({
        parent: chairParent,
        pos: Vector3.create(-0.22, 0.47, 0),
        scale: Vector3.create(0.05, 0.07, 0.44),
        rot: Quaternion.fromEulerDegrees(0, 0, 18),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity
    })
    createPart({
        parent: chairParent,
        pos: Vector3.create(0.22, 0.47, 0),
        scale: Vector3.create(0.05, 0.07, 0.44),
        rot: Quaternion.fromEulerDegrees(0, 0, -18),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity
    })

    // 3. Backrest (Carbon Leather)
    createPart({ parent: chairParent, pos: Vector3.create(0, 0.88, -0.20), scale: Vector3.create(0.36, 0.76, 0.07), rot: Quaternion.fromEulerDegrees(-6, 0, 0), color: colorBlack })

    // 4. Backrest Side Glowing Piping / Bolsters
    createPart({
        parent: chairParent,
        pos: Vector3.create(-0.20, 0.94, -0.19),
        scale: Vector3.create(0.05, 0.50, 0.06),
        rot: Quaternion.fromEulerDegrees(-6, 0, -16),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity
    })
    createPart({
        parent: chairParent,
        pos: Vector3.create(0.20, 0.94, -0.19),
        scale: Vector3.create(0.05, 0.50, 0.06),
        rot: Quaternion.fromEulerDegrees(-6, 0, 16),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity
    })

    // 5. Lumbar Support with Neon Accent
    createPart({ parent: chairParent, pos: Vector3.create(0, 0.58, -0.16), scale: Vector3.create(0.26, 0.12, 0.05), rot: Quaternion.fromEulerDegrees(-6, 0, 0), color: colorDarkGrey })
    createPart({
        parent: chairParent,
        pos: Vector3.create(0, 0.58, -0.13),
        scale: Vector3.create(0.22, 0.03, 0.02),
        rot: Quaternion.fromEulerDegrees(-6, 0, 0),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity
    })

    // 6. Headrest with Glowing Accent
    createPart({
        parent: chairParent,
        pos: Vector3.create(0, 1.16, -0.21),
        scale: Vector3.create(0.12, 0.22, 0.12),
        rot: Quaternion.fromEulerDegrees(-6, 0, 90),
        color: colorDarkGrey,
        isCylinder: true
    })
    // Headrest side neon ring caps
    createPart({
        parent: chairParent,
        pos: Vector3.create(-0.115, 1.16, -0.21),
        scale: Vector3.create(0.125, 0.02, 0.125),
        rot: Quaternion.fromEulerDegrees(-6, 0, 90),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity,
        isCylinder: true
    })
    createPart({
        parent: chairParent,
        pos: Vector3.create(0.115, 1.16, -0.21),
        scale: Vector3.create(0.125, 0.02, 0.125),
        rot: Quaternion.fromEulerDegrees(-6, 0, 90),
        color: colAccent,
        emissive: colGlow,
        emissiveIntensity: glowIntensity,
        isCylinder: true
    })

    // 7. Armrests
    createPart({ parent: chairParent, pos: Vector3.create(-0.26, 0.65, -0.04), scale: Vector3.create(0.05, 0.04, 0.26), rot: Quaternion.Identity(), color: colorNylon })
    createPart({ parent: chairParent, pos: Vector3.create(-0.26, 0.54, -0.04), scale: Vector3.create(0.04, 0.18, 0.04), rot: Quaternion.Identity(), color: colorNylon, isCylinder: true })
    
    createPart({ parent: chairParent, pos: Vector3.create(0.26, 0.65, -0.04), scale: Vector3.create(0.05, 0.04, 0.26), rot: Quaternion.Identity(), color: colorNylon })
    createPart({ parent: chairParent, pos: Vector3.create(0.26, 0.54, -0.04), scale: Vector3.create(0.04, 0.18, 0.04), rot: Quaternion.Identity(), color: colorNylon, isCylinder: true })

    // 8. Gas Piston (Chrome)
    createPart({ parent: chairParent, pos: Vector3.create(0, 0.22, 0), scale: Vector3.create(0.07, 0.32, 0.07), rot: Quaternion.Identity(), color: colorChrome, isCylinder: true })

    // 9. 5-Point Base with Glowing Casters
    for (let leg = 0; leg < 5; leg++) {
        const legAngDeg = leg * 72 
        const legAngRad = legAngDeg * (Math.PI / 180)
        
        const lx = 0.15 * Math.cos(legAngRad)
        const lz = 0.15 * Math.sin(legAngRad)
        createPart({ parent: chairParent, pos: Vector3.create(lx, 0.06, lz), scale: Vector3.create(0.30, 0.03, 0.04), rot: Quaternion.fromEulerDegrees(0, -legAngDeg, 0), color: colorNylon })

        const wx = 0.30 * Math.cos(legAngRad)
        const wz = 0.30 * Math.sin(legAngRad)
        createPart({
            parent: chairParent,
            pos: Vector3.create(wx, 0.035, wz),
            scale: Vector3.create(0.06, 0.025, 0.06),
            rot: Quaternion.fromEulerDegrees(90, -legAngDeg, 0),
            color: colAccent,
            emissive: colGlow,
            emissiveIntensity: 2.0,
            isCylinder: true
        })
    }

    return chairParent
}
