import { readFileSync, writeFileSync } from 'fs'

const code = readFileSync('src/game/chairs.ts', 'utf-8')

let newCode = code.replace(
    /function createPart\(parent: Entity, pos: Vector3, scale: Vector3, rot: Quaternion, color: Color4, isCylinder = false, hasPhysics = false\) {/g,
    `type PartOptions = {
    parent: Entity
    pos: Vector3
    scale: Vector3
    rot: Quaternion
    color: Color4
    isCylinder?: boolean
    hasPhysics?: boolean
}

function createPart(opts: PartOptions) {`
)

newCode = newCode.replace(/Transform.create\(ent, \{ parent, position: pos, scale: scale, rotation: rot \}\)/g, `Transform.create(ent, { parent: opts.parent, position: opts.pos, scale: opts.scale, rotation: opts.rot })`)
newCode = newCode.replace(/if \(isCylinder\)/g, `if (opts.isCylinder)`)
newCode = newCode.replace(/if \(hasPhysics\)/g, `if (opts.hasPhysics)`)
newCode = newCode.replace(/albedoColor: color/g, `albedoColor: opts.color`)
newCode = newCode.replace(/color === colorChrome/g, `opts.color === colorChrome`)

// Replace all calls
newCode = newCode.replace(/createPart\(([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,)]+)(?:,\s*([^,)]+))?(?:,\s*([^,)]+))?\)/g, (match, parent, pos, scale, rot, color, isCyl, hasPhys) => {
    let call = `createPart({ parent: ${parent}, pos: ${pos}, scale: ${scale}, rot: ${rot}, color: ${color}`
    if (isCyl !== undefined && isCyl !== 'false') call += `, isCylinder: ${isCyl}`
    if (hasPhys !== undefined && hasPhys !== 'false') call += `, hasPhysics: ${hasPhys}`
    call += ` })`
    return call
})

writeFileSync('src/game/chairs.ts', newCode)
