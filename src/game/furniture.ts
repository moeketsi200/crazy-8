import { engine, Transform, MeshRenderer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

function createBox(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale, rotation: rot })
    MeshRenderer.setBox(ent)
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

function createCylinder(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale, rotation: rot })
    MeshRenderer.setCylinder(ent)
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

export function buildFurniture(houseEntity: Entity) {
    buildMediaUnit(houseEntity)
    buildDJBooth(houseEntity)
}

function buildMediaUnit(houseEntity: Entity) {
    const colorGlossWhite = Color4.White()
    const colorTVFrame = Color4.fromHexString('#080808')
    const colorTVScreen = Color4.Black()

    const mediaUnit = engine.addEntity()
    Transform.create(mediaUnit, {
        parent: houseEntity,
        position: Vector3.create(-5.9, 0, 1.5),
        scale: Vector3.create(1.3, 1.3, 1.3)
    })

    const stand_x = 0 
    const stand_y = 0 

    createBox(mediaUnit, Vector3.create(stand_x, 0.06, stand_y + 1.25), Vector3.create(0.50, 0.12, 1.30), colorGlossWhite)
    createBox(mediaUnit, Vector3.create(stand_x, 0.22, stand_y - 0.50), Vector3.create(0.52, 0.44, 2.20), colorGlossWhite)

    for (const dy_offset of [-0.52, 0.52]) {
        createBox(mediaUnit, Vector3.create(stand_x + 0.265, 0.22, stand_y - 0.50 + dy_offset), Vector3.create(0.02, 0.38, 0.98), colorGlossWhite)
    }
    for (const ry of [-1.45, -0.50, 0.45]) {
        createBox(mediaUnit, Vector3.create(stand_x, 0.52, stand_y + ry), Vector3.create(0.42, 0.16, 0.05), colorGlossWhite)
    }
    createBox(mediaUnit, Vector3.create(stand_x, 0.63, stand_y - 0.45), Vector3.create(0.54, 0.06, 2.35), colorGlossWhite)

    createBox(mediaUnit, Vector3.create(stand_x - 0.5, 1.85, stand_y - 0.35), Vector3.create(0.04, 1.38, 2.45), colorTVFrame)
    createBox(mediaUnit, Vector3.create(stand_x - 0.47, 1.85, stand_y - 0.35), Vector3.create(0.01, 1.33, 2.40), colorTVScreen)
}

function buildDJBooth(houseEntity: Entity) {
    const colorGlossWhite = Color4.White()
    const colorChrome = Color4.fromHexString('#D9D9D9')

    const djBooth = engine.addEntity()
    Transform.create(djBooth, {
        parent: houseEntity,
        position: Vector3.create(5.20, 0, 1.0),
        scale: Vector3.create(1.0, 1.0, 1.0)
    })

    const ik_x = 0
    const ik_y = 0

    buildDJBoothStructure(djBooth, ik_x, ik_y, colorChrome, colorGlossWhite)
    buildDJEquipment(djBooth, ik_x, ik_y, colorChrome, colorGlossWhite)
}

function buildDJBoothStructure(djBooth: Entity, ik_x: number, ik_y: number, colorChrome: Color4, colorGlossWhite: Color4) {
    for (const leg_x of [ik_x - 0.16, ik_x + 0.16]) {
        for (const leg_y of [ik_y - 0.85, ik_y + 0.85]) {
            createCylinder(djBooth, Vector3.create(leg_x, 0.075, leg_y), Vector3.create(0.05, 0.15, 0.05), colorChrome)
        }
    }

    const unit_w = 0.42, unit_l = 1.84, unit_h = 0.88
    const elev_z = 0.15 + (unit_h / 2.0)

    for (const z_pos of [0.15 + 0.025, 0.15 + unit_h - 0.025]) {
        createBox(djBooth, Vector3.create(ik_x, z_pos, ik_y), Vector3.create(unit_w, 0.05, unit_l), colorGlossWhite)
    }
    for (const y_pos of [ik_y - unit_l/2 + 0.025, ik_y + unit_l/2 - 0.025]) {
        createBox(djBooth, Vector3.create(ik_x, elev_z, y_pos), Vector3.create(unit_w, unit_h - 0.10, 0.05), colorGlossWhite)
    }
    createBox(djBooth, Vector3.create(ik_x - unit_w/2 + 0.01, elev_z, ik_y), Vector3.create(0.02, unit_h - 0.10, unit_l - 0.08), colorGlossWhite)
    createBox(djBooth, Vector3.create(ik_x, elev_z, ik_y), Vector3.create(unit_w - 0.02, 0.03, unit_l - 0.10), colorGlossWhite)

    const cell_step = (unit_l - 0.10) / 4.0
    for (const v_div of [-cell_step, 0.0, cell_step]) {
        createBox(djBooth, Vector3.create(ik_x, elev_z, ik_y + v_div), Vector3.create(unit_w - 0.02, unit_h - 0.10, 0.03), colorGlossWhite)
    }
}

function buildDJEquipment(djBooth: Entity, ik_x: number, ik_y: number, colorChrome: Color4, colorGlossWhite: Color4) {
    const colorTVScreen = Color4.Black()
    const colorDJBlack = Color4.fromHexString('#080809')
    const colorAluminum = Color4.fromHexString('#A6ABB3')
    const colorPVCBlack = Color4.fromHexString('#050506')
    const colorKRKYellow = Color4.fromHexString('#FFC70A')

    const unit_h = 0.88
    const desk_z = 0.15 + unit_h + 0.025
    createBox(djBooth, Vector3.create(ik_x + 0.04, desk_z, ik_y), Vector3.create(0.34, 0.04, 0.72), colorDJBlack)

    for (const j_offset of [-0.24, 0.24]) {
        createCylinder(djBooth, Vector3.create(ik_x + 0.04, desk_z + 0.025, ik_y + j_offset), Vector3.create(0.17, 0.015, 0.17), colorAluminum)
    }
    createBox(djBooth, Vector3.create(ik_x + 0.04, desk_z + 0.022, ik_y), Vector3.create(0.28, 0.01, 0.18), colorPVCBlack)

    for (const b_offset of [-0.60, 0.60]) {
        createCylinder(djBooth, Vector3.create(ik_x - 0.08, desk_z + 0.10, ik_y + b_offset), Vector3.create(0.036, 0.22, 0.036), colorChrome, Quaternion.fromEulerDegrees(0, 0, -12))
    }

    const shelf_z = desk_z + 0.22
    createBox(djBooth, Vector3.create(ik_x - 0.06, shelf_z, ik_y), Vector3.create(0.26, 0.04, 1.84), colorGlossWhite)

    for (const [spk_sign, spk_y] of [[-1, ik_y - 0.72], [1, ik_y + 0.72]]) {
        createCylinder(djBooth, Vector3.create(ik_x - 0.06, shelf_z + 0.06, spk_y), Vector3.create(0.04, 0.10, 0.04), colorChrome)
        
        const yaw = -(180 - 14 * spk_sign)
        createBox(djBooth, Vector3.create(ik_x - 0.04, shelf_z + 0.25, spk_y), Vector3.create(0.22, 0.28, 0.18), colorDJBlack, Quaternion.fromEulerDegrees(0, yaw, 0))

        const ang_rad = Math.PI + (-14 * spk_sign * Math.PI / 180)
        const cone_x = (ik_x - 0.04) + 0.115 * Math.cos(ang_rad)
        const cone_y = spk_y + 0.115 * Math.sin(ang_rad)
        
        createCylinder(djBooth, Vector3.create(cone_x, shelf_z + 0.20, cone_y), Vector3.create(0.10, 0.015, 0.10), colorKRKYellow, Quaternion.fromEulerDegrees(90, -(yaw - 90), 0))
    }

    createBox(djBooth, Vector3.create(ik_x - 0.04, shelf_z + 0.03, ik_y), Vector3.create(0.20, 0.012, 0.28), colorAluminum)
    createBox(djBooth, Vector3.create(ik_x - 0.14, shelf_z + 0.12, ik_y), Vector3.create(0.01, 0.18, 0.28), colorTVScreen, Quaternion.fromEulerDegrees(0, 18, 0))
    createBox(djBooth, Vector3.create(ik_x - 0.04, shelf_z + 0.035, ik_y + 0.28), Vector3.create(0.16, 0.025, 0.14), colorDJBlack)
    createBox(djBooth, Vector3.create(ik_x - 0.04, shelf_z + 0.04, ik_y - 0.28), Vector3.create(0.15, 0.012, 0.20), colorTVScreen, Quaternion.fromEulerDegrees(0, -20, 0))
}
