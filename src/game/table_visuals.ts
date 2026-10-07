import { engine, Transform, MeshRenderer, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

const colorWalnut = Color4.fromHexString('#2E1A11')
const colorBlack = Color4.fromHexString('#111111')
const colorFelt = Color4.fromHexString('#032E0D')
const colorCardBack = Color4.fromHexString('#BF0D0D')
const colorCardWhite = Color4.White()

function createCylinder(parent: Entity, pos: Vector3, scale: Vector3, color: Color4) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale })
    MeshRenderer.setCylinder(ent)
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

function createCard(parent: Entity, cx: number, cy: number, cz: number, rotZDeg: number, isDeck: boolean) {
    const ent = engine.addEntity()
    const thickness = isDeck ? 0.015 : 0.001
    Transform.create(ent, {
        parent,
        position: Vector3.create(cx, cy, cz),
        scale: Vector3.create(0.063, thickness, 0.088),
        // Blender Z-rotation maps to DCL Y-rotation.
        rotation: Quaternion.fromEulerDegrees(0, -rotZDeg, 0)
    })
    MeshRenderer.setBox(ent)
    Material.setPbrMaterial(ent, { albedoColor: isDeck ? colorCardBack : colorCardWhite })
    return ent
}

export function buildPrimitiveTable(houseEntity: Entity) {
    // 1. Wooden Table Base
    createCylinder(houseEntity, Vector3.create(0, 0.36, 0), Vector3.create(0.9, 0.72, 0.9), colorWalnut)
    
    // 2. PVC Bumper (DCL doesn't have a Torus shape, so we use a slightly larger black cylinder!)
    createCylinder(houseEntity, Vector3.create(0, 0.74, 0), Vector3.create(3.3, 0.08, 3.3), colorBlack)
    
    // Inner Tabletop (Wood)
    createCylinder(houseEntity, Vector3.create(0, 0.75, 0), Vector3.create(3.04, 0.07, 3.04), colorWalnut)
    
    // 3. Emerald Felt Playing Surface
    createCylinder(houseEntity, Vector3.create(0, 0.78, 0), Vector3.create(2.84, 0.02, 2.84), colorFelt)

    // 4. Player Hands (2 cards for all 8 positions)
    for (let i = 0; i < 8; i++) {
        const angleRad = i * (Math.PI / 4) + (Math.PI / 2)
        const angleDeg = angleRad * (180 / Math.PI)

        // First Card
        const handCx = 1.15 * Math.cos(angleRad)
        const handCz = 1.15 * Math.sin(angleRad) // Blender Y is DCL Z
        createCard(houseEntity, handCx, 0.791, handCz, angleDeg + 15, false)

        // Second Card (slightly offset)
        const shiftX = 0.03 * Math.cos(angleRad - Math.PI / 2)
        const shiftZ = 0.03 * Math.sin(angleRad - Math.PI / 2)
        createCard(houseEntity, handCx + shiftX, 0.792, handCz + shiftZ, angleDeg + 5, false)
    }

    // We will also spawn the decorative second card of the discard pile here!
    createCard(houseEntity, 0.12, 0.791, 0.05, -42, false)
}
