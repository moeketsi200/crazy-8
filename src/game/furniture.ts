import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity, TextShape, TextAlignMode, GltfContainer } from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4 } from '@dcl/sdk/math'

function createBox(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale, rotation: rot })
    MeshRenderer.setBox(ent)
    MeshCollider.setBox(ent) // Added collider
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

function createCylinder(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale, rotation: rot })
    MeshRenderer.setCylinder(ent)
    MeshCollider.setCylinder(ent) // Added collider
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

function createSphere(parent: Entity, pos: Vector3, scale: Vector3, color: Color4, rot: Quaternion = Quaternion.Identity()) {
    const ent = engine.addEntity()
    Transform.create(ent, { parent, position: pos, scale, rotation: rot })
    MeshRenderer.setSphere(ent)
    MeshCollider.setSphere(ent) // Added collider
    Material.setPbrMaterial(ent, { albedoColor: color })
    return ent
}

export function buildFurniture(houseEntity: Entity) {
    buildMediaUnit(houseEntity)
    buildDJBooth(houseEntity)
    buildBraaiStand(houseEntity)
    buildDJAvatar(houseEntity)
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

export function buildDJBooth(houseEntity: Entity) {
    const djGroup = engine.addEntity()
    Transform.create(djGroup, {
        parent: houseEntity,
        position: Vector3.create(5.20, 0, 1.0), // Main position
        scale: Vector3.create(1.0, 1.0, 1.0)
    })

    const colorDarkGrey = Color4.fromHexString('#1a1a1c')
    const colorBlack = Color4.fromHexString('#0a0a0c')
    const colorNeonBlue = Color4.fromHexString('#00f3ff')
    const colorNeonPink = Color4.fromHexString('#ff007b')
    const colorChrome = Color4.fromHexString('#8c92a1')

    // 1. DJ PLATFORM (Raised floor)
    createBox(djGroup, Vector3.create(0, 0.1, 0), Vector3.create(3.0, 0.2, 2.5), colorBlack)
    // Platform LED Strip (Pink)
    const platLed = createBox(djGroup, Vector3.create(-1.48, 0.2, 0), Vector3.create(0.05, 0.02, 2.5), colorBlack)
    Material.setPbrMaterial(platLed, { albedoColor: colorNeonPink, emissiveColor: colorNeonPink, emissiveIntensity: 2.0 })

    // 2. MAIN BOOTH STRUCTURE (Angled Front)
    // Base block
    createBox(djGroup, Vector3.create(-0.6, 0.65, 0), Vector3.create(0.8, 0.9, 2.0), colorDarkGrey)
    // Angled Front Panel
    const frontPanel = createBox(djGroup, Vector3.create(-1.05, 0.65, 0), Vector3.create(0.1, 0.9, 1.9), colorBlack, Quaternion.fromEulerDegrees(0, 0, 15))
    // Thick Countertop
    createBox(djGroup, Vector3.create(-0.65, 1.12, 0), Vector3.create(1.0, 0.08, 2.1), colorBlack)
    
    // Front LED Strips (Top and Bottom of panel)
    const ledTop = createBox(djGroup, Vector3.create(-1.12, 1.05, 0), Vector3.create(0.02, 0.02, 1.9), colorBlack, Quaternion.fromEulerDegrees(0, 0, 15))
    Material.setPbrMaterial(ledTop, { albedoColor: colorNeonBlue, emissiveColor: colorNeonBlue, emissiveIntensity: 2.5 })
    const ledBot = createBox(djGroup, Vector3.create(-0.90, 0.25, 0), Vector3.create(0.02, 0.02, 1.9), colorBlack, Quaternion.fromEulerDegrees(0, 0, 15))
    Material.setPbrMaterial(ledBot, { albedoColor: colorNeonBlue, emissiveColor: colorNeonBlue, emissiveIntensity: 2.5 })

    // FRONT LOGO TEXT
    const logoText = engine.addEntity()
    Transform.create(logoText, {
        parent: djGroup,
        position: Vector3.create(-1.08, 0.65, 0),
        rotation: Quaternion.fromEulerDegrees(0, -90, -15),
        scale: Vector3.create(0.2, 0.2, 0.2)
    })
    TextShape.create(logoText, {
        text: 'THE EIGHTS OASIS',
        textColor: colorNeonBlue,
        fontSize: 3,
        textAlign: TextAlignMode.TAM_MIDDLE_CENTER
    })

    // 3. DJ EQUIPMENT (Mixer, CDJs, Laptop)
    const desk_z = 1.16 // base desk height
    const base_x = -0.65 // base depth on table

    const colChassis = Color4.fromHexString('#1a1a1c')
    const colFaceplate = Color4.fromHexString('#222225')
    const colKnob = Color4.fromHexString('#0a0a0a')
    const colFader = Color4.fromHexString('#141414')
    const colJogTop = Color4.fromHexString('#050505')
    const colJogEdge = Color4.fromHexString('#111111')
    
    // Emissives
    const colScreen = Color4.fromHexString('#0d59d9')
    const colJogLcd = Color4.fromHexString('#f2261a')
    const colJogRing = Color4.fromHexString('#0099ff')
    const colPlayGreen = Color4.fromHexString('#00ff33')
    const colCueOrange = Color4.fromHexString('#ff8000')
    const colHotCue = Color4.fromHexString('#3380ff')
    const colMeterGreen = Color4.fromHexString('#00ff33')
    const colMeterRed = Color4.fromHexString('#ff1a1a')

    const createEmissive = (parent: Entity, pos: Vector3, scale: Vector3, col: Color4, isCyl = false, rot?: Quaternion) => {
        const ent = isCyl ? createCylinder(parent, pos, scale, col, rot) : createBox(parent, pos, scale, col, rot)
        Material.setPbrMaterial(ent, { albedoColor: col, emissiveColor: col, emissiveIntensity: 2.0 })
    }

    const djEquipGroup = engine.addEntity()
    Transform.create(djEquipGroup, {
        parent: djGroup,
        position: Vector3.create(base_x, desk_z, 0),
        rotation: Quaternion.fromEulerDegrees(0, 180, 0)
    })

    // Helper to map Blender (X, Y, Z) to DCL (X, Y, Z)
    // Blender X (width) -> DCL Z
    // Blender Y (depth) -> DCL X
    // Blender Z (height) -> DCL Y
    const mapPos = (x: number, y: number, z: number, offsetZ = 0) => Vector3.create(y, z, offsetZ + x)
    const mapScale = (x: number, y: number, z: number) => Vector3.create(y, z, x)

    // --- MIXER (DJM-750MK2) ---
    const mx_w = 0.32, mx_d = 0.42, mx_h = 0.08
    createBox(djEquipGroup, mapPos(0, 0, mx_h/2), mapScale(mx_w, mx_d, mx_h), colChassis)
    createBox(djEquipGroup, mapPos(0, 0, mx_h + 0.001), mapScale(mx_w - 0.006, mx_d - 0.006, 0.002), colFaceplate)
    
    const ch_xs = [-0.075, -0.025, 0.025, 0.075]
    for (let i = 0; i < ch_xs.length; i++) {
        const cx = ch_xs[i]
        // Knobs
        for (const cy of [0.13, 0.08, 0.03, -0.02]) {
            createCylinder(djEquipGroup, mapPos(cx, cy, mx_h + 0.009), mapScale(0.016, 0.016, 0.014), colKnob)
            createEmissive(djEquipGroup, mapPos(cx, cy + 0.005, mx_h + 0.016), mapScale(0.002, 0.005, 0.002), colScreen)
        }
        // Fader
        createBox(djEquipGroup, mapPos(cx, -0.10, mx_h + 0.002), mapScale(0.003, 0.055, 0.001), colChassis)
        createBox(djEquipGroup, mapPos(cx, -0.09 + (i%2)*0.015, mx_h + 0.008), mapScale(0.011, 0.015, 0.012), colFader)
        // VU Meters
        createEmissive(djEquipGroup, mapPos(cx + 0.014, 0.05, mx_h + 0.002), mapScale(0.002, 0.07, 0.001), colMeterGreen)
        createEmissive(djEquipGroup, mapPos(cx + 0.014, 0.09, mx_h + 0.002), mapScale(0.002, 0.015, 0.001), colMeterRed)
    }
    // Crossfader
    createBox(djEquipGroup, mapPos(0, -0.165, mx_h + 0.002), mapScale(0.065, 0.003, 0.001), colChassis)
    createBox(djEquipGroup, mapPos(0.005, -0.165, mx_h + 0.008), mapScale(0.015, 0.011, 0.012), colFader)
    
    // FX
    createEmissive(djEquipGroup, mapPos(0.125, 0.04, mx_h + 0.002), mapScale(0.038, 0.05, 0.002), colScreen)
    createCylinder(djEquipGroup, mapPos(0.125, -0.04, mx_h + 0.01), mapScale(0.022, 0.022, 0.016), colKnob)
    createEmissive(djEquipGroup, mapPos(0.125, -0.10, mx_h + 0.005), mapScale(0.020, 0.020, 0.006), colCueOrange, true)

    // --- CDJs (CDJ-3000) ---
    for (const offset of [-0.355, 0.355]) {
        const cw = 0.33, cd = 0.45, ch = 0.08
        createBox(djEquipGroup, mapPos(0, 0, ch/2, offset), mapScale(cw, cd, ch), colChassis)
        createBox(djEquipGroup, mapPos(0, 0, ch + 0.001, offset), mapScale(cw - 0.006, cd - 0.006, 0.002), colFaceplate)

        // Screen Pod (Angled)
        const rot8 = Quaternion.fromEulerDegrees(0, 0, -8) // Tilt towards DJ
        createBox(djEquipGroup, mapPos(0, 0.125, ch + 0.015, offset), mapScale(0.24, 0.14, 0.02), colChassis, rot8)
        createEmissive(djEquipGroup, mapPos(0, 0.125, ch + 0.024, offset), mapScale(0.20, 0.11, 0.002), colScreen, false, rot8)

        // Hot Cues
        for (let i = 0; i < 8; i++) {
            createEmissive(djEquipGroup, mapPos(-0.10 + i * 0.0285, 0.035, ch + 0.004, offset), mapScale(0.022, 0.012, 0.004), colHotCue)
        }

        // Jog Wheel
        const jy = -0.065, jz = ch + 0.008
        createCylinder(djEquipGroup, mapPos(0, jy, jz, offset), mapScale(0.206, 0.206, 0.016), colJogEdge)
        createCylinder(djEquipGroup, mapPos(0, jy, jz + 0.005, offset), mapScale(0.196, 0.196, 0.008), colJogTop)
        createEmissive(djEquipGroup, mapPos(0, jy, jz + 0.009, offset), mapScale(0.080, 0.080, 0.003), colJogRing, true)
        createEmissive(djEquipGroup, mapPos(0, jy, jz + 0.010, offset), mapScale(0.070, 0.070, 0.003), colJogLcd, true)

        // Play / Cue
        createCylinder(djEquipGroup, mapPos(-0.115, -0.145, ch + 0.003, offset), mapScale(0.032, 0.032, 0.004), colChassis)
        createEmissive(djEquipGroup, mapPos(-0.115, -0.145, ch + 0.006, offset), mapScale(0.026, 0.026, 0.004), colCueOrange, true)
        createCylinder(djEquipGroup, mapPos(-0.115, -0.185, ch + 0.003, offset), mapScale(0.036, 0.036, 0.004), colChassis)
        createEmissive(djEquipGroup, mapPos(-0.115, -0.185, ch + 0.006, offset), mapScale(0.030, 0.030, 0.004), colPlayGreen, true)

        // Pitch Slider
        createBox(djEquipGroup, mapPos(0.125, -0.065, ch + 0.002, offset), mapScale(0.004, 0.12, 0.001), colChassis)
        createBox(djEquipGroup, mapPos(0.125, -0.075, ch + 0.008, offset), mapScale(0.012, 0.02, 0.012), colFader)

        // Nav Dial
        createCylinder(djEquipGroup, mapPos(0.125, 0.165, ch + 0.012, offset), mapScale(0.024, 0.024, 0.016), colKnob)
    }

    // 4. BIG CLUB SPEAKERS (Left and Right)
    for (const spkPos of [-1.5, 1.5]) {
        const spkParent = engine.addEntity()
        Transform.create(spkParent, {
            parent: djGroup,
            position: Vector3.create(-1.2, 0.0, spkPos),
            scale: Vector3.create(1.2, 1.2, 1.2),
            rotation: Quaternion.fromEulerDegrees(0, spkPos > 0 ? -15 : 15, 0)
        })

        // Colors based on the Three.js script
        const colCabinet = Color4.fromHexString('#090909')
        const colPlastic = Color4.fromHexString('#080808')
        const colGrille = Color4.fromHexString('#0d0d0d')
        const colBadge = Color4.fromHexString('#d8d8de')

        // Dimensions (width: 0.44m, height: 0.69m, depth: 0.38m)
        const cabY = 0.345 // half height center

        // 1. Cabinet Body (Rectangular approximation instead of trapezoid)
        createBox(spkParent, Vector3.create(0, cabY, 0), Vector3.create(0.44, 0.69, 0.38), colCabinet)

        // 2. Front Grille
        createBox(spkParent, Vector3.create(-0.224, cabY, 0), Vector3.create(0.008, 0.675, 0.428), colGrille)

        // 3. Wharfedale Badge
        createBox(spkParent, Vector3.create(-0.23, cabY - 0.255, 0), Vector3.create(0.005, 0.024, 0.065), colBadge)

        // 4. Fake woofer & horn details (visible behind/through grille slightly, so we stick them slightly out or just add them as decorative sides if needed, but since grille covers front, we can leave front simple or add them). 
        // We will put the horn and woofer just behind the grille plane.
        
        // HF Horn
        createBox(spkParent, Vector3.create(-0.222, cabY + 0.17, 0), Vector3.create(0.005, 0.16, 0.24), colPlastic)
        createBox(spkParent, Vector3.create(-0.226, cabY + 0.17, 0), Vector3.create(0.005, 0.05, 0.06), colCabinet) // horn throat

        // 15-inch Woofer
        const woofer = createCylinder(spkParent, Vector3.create(-0.222, cabY - 0.105, 0), Vector3.create(0.012, 0.384, 0.384), colPlastic, Quaternion.fromEulerDegrees(0, 0, 90))
        const cone = createCylinder(spkParent, Vector3.create(-0.224, cabY - 0.105, 0), Vector3.create(0.008, 0.35, 0.35), colCabinet, Quaternion.fromEulerDegrees(0, 0, 90))
        const dustcap = createCylinder(spkParent, Vector3.create(-0.226, cabY - 0.105, 0), Vector3.create(0.005, 0.096, 0.096), colPlastic, Quaternion.fromEulerDegrees(0, 0, 90))

        // Bass Ports
        createCylinder(spkParent, Vector3.create(-0.222, cabY - 0.275, -0.135), Vector3.create(0.01, 0.068, 0.068), colPlastic, Quaternion.fromEulerDegrees(0, 0, 90))
        createCylinder(spkParent, Vector3.create(-0.222, cabY - 0.275, 0.135), Vector3.create(0.01, 0.068, 0.068), colPlastic, Quaternion.fromEulerDegrees(0, 0, 90))
        createCylinder(spkParent, Vector3.create(-0.226, cabY - 0.275, -0.135), Vector3.create(0.005, 0.05, 0.05), colCabinet, Quaternion.fromEulerDegrees(0, 0, 90)) // hole dark
        createCylinder(spkParent, Vector3.create(-0.226, cabY - 0.275, 0.135), Vector3.create(0.005, 0.05, 0.05), colCabinet, Quaternion.fromEulerDegrees(0, 0, 90)) // hole dark
        
        // Pole socket / feet
        createBox(spkParent, Vector3.create(0, -0.005, 0), Vector3.create(0.1, 0.01, 0.1), colPlastic)
    }

    // 5. GIANT SCREEN BEHIND DJ
    // Removed because it blocks the rules board and looked like a giant solid pink block.
}

export function buildBraaiStand(houseEntity: Entity) {
    const braaiGroup = engine.addEntity()
    Transform.create(braaiGroup, {
        parent: houseEntity,
        position: Vector3.create(7.5, 0, 16.5),
        scale: Vector3.create(1, 1, 1),
        rotation: Quaternion.fromEulerDegrees(0, 0, 0)
    })

    const matStucco = Color4.fromHexString('#dcd4c4')
    const matStainless = Color4.fromHexString('#d1d6db')
    const matBraaiDark = Color4.fromHexString('#0f0f10')
    const matCabinet = Color4.fromHexString('#1c1e21')
    const matTimber = Color4.fromHexString('#946133')
    const matWoodCut = Color4.fromHexString('#c79e6b')
    const matGrillSteel = Color4.fromHexString('#d9d9d9')
    const matEmber = Color4.fromHexString('#cc1905')
    const matFire = Color4.fromHexString('#ff660c')

    const mapPos = (x: number, y: number, z: number) => Vector3.create(x, z, y)
    const mapScale = (x: number, y: number, z: number) => Vector3.create(x, z, y)

    const addCube = (pos: Vector3, scale: Vector3, color: Color4, rot?: Quaternion) => {
        createBox(braaiGroup, pos, scale, color, rot)
    }
    const addCyl = (pos: Vector3, scale: Vector3, color: Color4, rot?: Quaternion) => {
        createCylinder(braaiGroup, pos, scale, color, rot)
    }

    // 1. Structure
    addCube(mapPos(-0.625, 0.0, 0.38), mapScale(0.19, 0.74, 0.76), matStucco)
    addCube(mapPos( 0.625, 0.0, 0.38), mapScale(0.19, 0.74, 0.76), matStucco)
    addCube(mapPos( 0.000, 0.28, 0.38), mapScale(1.06, 0.18, 0.76), matStucco)
    addCube(mapPos(0.0, 0.0, 0.85), mapScale(1.44, 0.74, 0.18), matStucco)
    addCube(mapPos(-0.66, 0.0, 1.40), mapScale(0.12, 0.74, 0.92), matStucco)
    addCube(mapPos( 0.66, 0.0, 1.40), mapScale(0.12, 0.74, 0.92), matStucco)
    addCube(mapPos( 0.00, 0.28, 1.40), mapScale(1.20, 0.18, 0.92), matStucco)
    addCube(mapPos(0.0, 0.0, 2.55), mapScale(1.44, 0.74, 1.38), matStucco)

    // 2. Insert
    const fx=1.30, fz=0.84, thick=0.03, w_trim=0.08, center_z=1.40
    addCube(mapPos(0, -0.375, center_z + fz/2 - w_trim/2), mapScale(fx, thick, w_trim), matStainless)
    addCube(mapPos(0, -0.375, center_z - fz/2 + w_trim/2), mapScale(fx, thick, w_trim), matStainless)
    const side_h = fz - (2 * w_trim)
    addCube(mapPos(-fx/2 + w_trim/2, -0.375, center_z), mapScale(w_trim, thick, side_h), matStainless)
    addCube(mapPos(fx/2 - w_trim/2, -0.375, center_z), mapScale(w_trim, thick, side_h), matStainless)

    const box_w=1.14, box_d=0.55, box_h=0.68, box_y=-0.09
    addCube(mapPos(0, box_y + box_d/2, center_z), mapScale(box_w, 0.015, box_h), matBraaiDark)
    addCube(mapPos(-box_w/2, box_y, center_z), mapScale(0.015, box_d, box_h), matBraaiDark)
    addCube(mapPos(box_w/2, box_y, center_z), mapScale(0.015, box_d, box_h), matBraaiDark)
    addCube(mapPos(0, box_y, center_z + box_h/2), mapScale(box_w, box_d, 0.015), matBraaiDark)
    addCube(mapPos(0, box_y, center_z - box_h/2), mapScale(box_w, box_d, 0.015), matBraaiDark)
    
    addCube(mapPos(0, box_y - 0.05, center_z + 0.24), mapScale(box_w - 0.02, 0.18, 0.03), matBraaiDark)
    addCube(mapPos(0, box_y, center_z - 0.18), mapScale(box_w - 0.02, 0.40, 0.025), matBraaiDark)

    const door_w=1.15, door_d=0.36, door_t=0.022
    addCube(mapPos(0, -0.37 - door_d/2, center_z - box_h/2 + 0.02), mapScale(door_w, door_d, door_t), matBraaiDark)
    addCube(mapPos(0, -0.37 - door_d, center_z - box_h/2 + 0.02), mapScale(door_w, 0.015, door_t + 0.004), matStainless)

    // Grill Rods
    const grill_x_center = -0.18
    for(let i=0; i<10; i++) {
        const gy = box_y - 0.16 + i * 0.033
        addCyl(mapPos(grill_x_center, gy, center_z - 0.05), Vector3.create(0.006, 0.68, 0.006), matGrillSteel, Quaternion.fromEulerDegrees(0, 0, 90))
    }
    
    const ember_x = 0.38
    addCube(mapPos(ember_x, box_y - 0.02, center_z - 0.06), mapScale(0.28, 0.30, 0.02), matBraaiDark)
    addCube(mapPos(ember_x, box_y + 0.12, center_z + 0.06), mapScale(0.28, 0.02, 0.22), matBraaiDark)
    addCube(mapPos(ember_x - 0.13, box_y - 0.02, center_z + 0.06), mapScale(0.02, 0.28, 0.22), matBraaiDark)
    addCube(mapPos(ember_x, box_y - 0.16, center_z + 0.03), mapScale(0.28, 0.02, 0.16), matStainless)
    
    const coal = createBox(braaiGroup, mapPos(ember_x, box_y - 0.02, center_z - 0.03), mapScale(0.22, 0.22, 0.05), matEmber)
    Material.setPbrMaterial(coal, { albedoColor: matEmber, emissiveColor: matEmber, emissiveIntensity: 2.0 })
    const flame = createBox(braaiGroup, mapPos(ember_x, box_y - 0.02, center_z + 0.12), mapScale(0.16, 0.14, 0.14), matFire, Quaternion.fromEulerDegrees(15, 0, 25))
    Material.setPbrMaterial(flame, { albedoColor: matFire, emissiveColor: matFire, emissiveIntensity: 3.0 })
    
    addCube(mapPos(-0.38, box_y - 0.12, center_z - 0.26), mapScale(0.22, 0.24, 0.08), matStainless)

    // 3. Firewood
    const x_start = -0.42, x_step = 0.115, z_start = 0.08, z_step = 0.115
    for (let r = 0; r < 4; r++) {
        const y_offset = -0.05 + (r % 2) * 0.02
        for (let c = 0; c < 5 - (r % 2); c++) {
            const lx = x_start + c * x_step + (r % 2 ? 0.055 : 0)
            const lz = z_start + r * z_step
            addCyl(mapPos(lx, y_offset, lz), Vector3.create(0.1, 0.5, 0.1), matWoodCut, Quaternion.fromEulerDegrees(90, 0, 0))
        }
    }

    // 4. Cabinets
    const buildCab = (x_pos: number, is_left: boolean) => {
        addCube(mapPos(x_pos, 0, 0.44), mapScale(0.95, 0.72, 0.88), matCabinet)
        const door_center_x = x_pos + (is_left ? -0.03 : 0.03)
        addCube(mapPos(door_center_x, -0.365, 0.44), mapScale(0.75, 0.02, 0.70), matBraaiDark)
        for (let s = 0; s < 6; s++) {
            const sz = 0.13 + s * 0.124
            addCube(mapPos(door_center_x, -0.372, sz), mapScale(0.69, 0.012, 0.025), matCabinet, Quaternion.fromEulerDegrees(28, 0, 0))
        }
    }
    buildCab(-1.22, true)
    buildCab(1.22, false)

    // 5. Timber walls
    const buildWall = (x_center: number) => {
        addCube(mapPos(x_center, 0.28, 2.15), mapScale(1.20, 0.04, 2.60), matCabinet)
        for (let i = 0; i < 18; i++) {
            const sz = 0.88 + i * 0.144
            addCube(mapPos(x_center, 0.25, sz), mapScale(1.20, 0.035, 0.052), matTimber)
        }
    }
    buildWall(-1.35)
    buildWall(1.35)
}

export function buildDJAvatar(houseEntity: Entity) {
    const avatarGroup = engine.addEntity()
    Transform.create(avatarGroup, {
        parent: houseEntity,
        // Position behind the DJ booth (DJ booth is at 5.2, 0, 1.0, desk is at 4.55)
        position: Vector3.create(5.15, 0, 1.0),
        scale: Vector3.create(1, 1, 1),
        rotation: Quaternion.fromEulerDegrees(0, -90, 0)
    })

    const matSkin       = Color4.create(0.38, 0.23, 0.15, 1.0)
    const matHair       = Color4.create(0.04, 0.04, 0.04, 1.0)
    const matBeard      = Color4.create(0.09, 0.06, 0.04, 1.0)
    const matTeeWhite   = Color4.create(0.95, 0.95, 0.96, 1.0)
    const matNikeBlack  = Color4.create(0.02, 0.02, 0.02, 1.0)
    const matNikeOrange = Color4.create(0.95, 0.35, 0.04, 1.0)
    const matPants      = Color4.create(0.07, 0.07, 0.08, 1.0)
    const matSneakers   = Color4.create(0.92, 0.92, 0.94, 1.0)
    const matPhonesCush = Color4.create(0.03, 0.03, 0.03, 1.0)
    const matPhonesRim  = Color4.create(0.01, 0.01, 0.01, 1.0)

    const mapPos = (x: number, y: number, z: number) => Vector3.create(x, z, y)

    const addCube = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: Color4, rot?: Quaternion) => {
        createBox(avatarGroup, mapPos(x, y, z), Vector3.create(sx, sz, sy), color, rot)
    }
    const addCyl = (x: number, y: number, z: number, radius: number, depth: number, color: Color4, rot?: Quaternion) => {
        createCylinder(avatarGroup, mapPos(x, y, z), Vector3.create(radius * 2, depth, radius * 2), color, rot) 
    }
    const addSphere = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: Color4, rot?: Quaternion) => {
        createSphere(avatarGroup, mapPos(x, y, z), Vector3.create(sx * 2, sz * 2, sy * 2), color, rot)
    }

    // 1. Sneakers
    addSphere(-0.18, 0.04, 0.06, 0.07, 0.12, 0.05, matSneakers)
    addSphere(-0.18, 0.12, 0.05, 0.06, 0.06, 0.04, matNikeBlack)
    addCube(-0.18, 0.04, 0.01, 0.13, 0.22, 0.02, matNikeOrange)

    addSphere(0.18, 0.04, 0.06, 0.07, 0.12, 0.05, matSneakers)
    addSphere(0.18, 0.12, 0.05, 0.06, 0.06, 0.04, matNikeBlack)
    addCube(0.18, 0.04, 0.01, 0.13, 0.22, 0.02, matNikeOrange)

    // 2. Legs (Pants)
    addCyl(-0.18, 0.00, 0.28, 0.06, 0.45, matPants, Quaternion.fromEulerDegrees(90, 0, 0))
    addCyl(0.18, 0.00, 0.28, 0.06, 0.45, matPants, Quaternion.fromEulerDegrees(90, 0, 0))

    // 3. Hips / Waist (Pants)
    addSphere(0.00, 0.00, 0.52, 0.19, 0.14, 0.12, matPants)

    // 4. Torso (Tee)
    addSphere(0.00, 0.00, 0.72, 0.20, 0.14, 0.16, matTeeWhite) // lower torso
    addSphere(0.00, -0.02, 0.98, 0.23, 0.15, 0.18, matTeeWhite) // upper torso chest

    // Swoosh Logo (approximated on chest)
    addCube(0.04, -0.16, 0.98, 0.06, 0.01, 0.02, matNikeBlack, Quaternion.fromEulerDegrees(0, 0, 15))
    addCube(0.00, -0.16, 0.96, 0.04, 0.01, 0.015, matNikeBlack, Quaternion.fromEulerDegrees(0, 0, -25))

    // 5. Shoulders (Tee Sleeves)
    addSphere(-0.25, -0.02, 1.02, 0.08, 0.08, 0.10, matTeeWhite)
    addSphere(0.25, -0.02, 1.02, 0.08, 0.08, 0.10, matTeeWhite)

    // 6. Arms & Hands (Skin) - Posed for DJing
    // Left Arm (Reaching forward to mixer)
    addCyl(-0.28, 0.06, 0.92, 0.045, 0.25, matSkin, Quaternion.fromEulerDegrees(45, -20, 0)) // Upper
    addCyl(-0.24, 0.18, 0.76, 0.04, 0.25, matSkin, Quaternion.fromEulerDegrees(0, -30, 0))  // Lower
    addSphere(-0.16, 0.24, 0.74, 0.045, 0.05, 0.03, matSkin) // Hand

    // Right Arm (Tweaking a knob, slightly raised)
    addCyl(0.28, 0.06, 0.92, 0.045, 0.25, matSkin, Quaternion.fromEulerDegrees(40, 20, 0)) // Upper
    addCyl(0.22, 0.22, 0.78, 0.04, 0.25, matSkin, Quaternion.fromEulerDegrees(-10, 30, 0)) // Lower
    addSphere(0.12, 0.28, 0.78, 0.045, 0.05, 0.03, matSkin) // Hand

    // 7. Neck & Head
    addCyl(0.00, -0.02, 1.15, 0.05, 0.10, matSkin, Quaternion.fromEulerDegrees(90, 0, 0)) // Neck
    addSphere(0.00, -0.04, 1.28, 0.09, 0.10, 0.11, matSkin) // Head base

    // 8. Facial Hair (Goatee & Fade)
    addSphere(0.00, -0.14, 1.22, 0.04, 0.03, 0.04, matBeard) // Chin Goatee
    addSphere(0.00, -0.14, 1.26, 0.05, 0.02, 0.015, matBeard) // Mustache
    addSphere(-0.09, -0.08, 1.25, 0.015, 0.06, 0.08, matHair) // Sideburn L
    addSphere(0.09, -0.08, 1.25, 0.015, 0.06, 0.08, matHair) // Sideburn R

    // 9. Hair (Textured top fade)
    addSphere(0.00, -0.02, 1.39, 0.095, 0.095, 0.04, matHair)

    // 10. Headphones (Around neck/ears) - Placed over ears
    addCyl(-0.11, -0.04, 1.28, 0.05, 0.02, matPhonesCush, Quaternion.fromEulerDegrees(0, 90, 90)) // L Cush (adjusted rotation for DCL Cylinder)
    addCyl(0.11, -0.04, 1.28, 0.05, 0.02, matPhonesCush, Quaternion.fromEulerDegrees(0, 90, 90))  // R Cush
    addCyl(-0.12, -0.04, 1.28, 0.04, 0.01, matPhonesRim, Quaternion.fromEulerDegrees(0, 90, 90)) // L Cup
    addCyl(0.12, -0.04, 1.28, 0.04, 0.01, matPhonesRim, Quaternion.fromEulerDegrees(0, 90, 90))  // R Cup
    
    // Headphone Band
    addSphere(0.00, -0.02, 1.395, 0.11, 0.06, 0.02, matPhonesRim) // Simple band over top

    // Motion for DJing
    let time = 0
    engine.addSystem((dt) => {
        time += dt
        // Bop up and down to the beat
        const bop = Math.abs(Math.sin(time * 4)) * 0.03
        // Sway slightly left and right
        const sway = Math.sin(time * 2) * 5
        
        const transform = Transform.getMutable(avatarGroup)
        transform.position.y = bop
        // Base rotation is -90 on Y, add sway
        transform.rotation = Quaternion.fromEulerDegrees(0, -90 + sway, 0)
    })
}
