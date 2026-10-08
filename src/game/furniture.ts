import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity, TextShape, TextAlignMode } from '@dcl/sdk/ecs'
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
    const desk_z = 1.16 + 0.02

    // 4-Channel Mixer (Center)
    const mixer = createBox(djGroup, Vector3.create(-0.65, desk_z, 0), Vector3.create(0.35, 0.04, 0.25), colorBlack)
    const mixerGlow = createBox(djGroup, Vector3.create(-0.65, desk_z + 0.021, 0), Vector3.create(0.28, 0.01, 0.20), colorBlack)
    Material.setPbrMaterial(mixerGlow, { albedoColor: colorBlack, emissiveColor: colorNeonPink, emissiveIntensity: 1.2 })

    // CDJs (Left and Right)
    for (const offset of [-0.35, 0.35]) {
        // Deck body
        createBox(djGroup, Vector3.create(-0.65, desk_z, offset), Vector3.create(0.35, 0.04, 0.30), colorBlack)
        // Jog Wheel
        const jogWheel = createCylinder(djGroup, Vector3.create(-0.65, desk_z + 0.02, offset), Vector3.create(0.22, 0.02, 0.22), colorChrome)
        // Glowing ring around jog wheel
        const jogGlow = createCylinder(djGroup, Vector3.create(-0.65, desk_z + 0.021, offset), Vector3.create(0.18, 0.02, 0.18), colorBlack)
        Material.setPbrMaterial(jogGlow, { albedoColor: colorNeonBlue, emissiveColor: colorNeonBlue, emissiveIntensity: 1.0 })
        // Small screen on CDJ
        const cdjScreen = createBox(djGroup, Vector3.create(-0.75, desk_z + 0.025, offset), Vector3.create(0.08, 0.01, 0.15), colorBlack)
        Material.setPbrMaterial(cdjScreen, { albedoColor: colorBlack, emissiveColor: Color4.fromHexString('#ffaa00'), emissiveIntensity: 1.0 })
    }

    // Laptop on Stand
    // Stand
    createBox(djGroup, Vector3.create(-0.85, desk_z + 0.15, 0), Vector3.create(0.15, 0.3, 0.02), colorChrome, Quaternion.fromEulerDegrees(0, 0, -20))
    // Laptop Base
    createBox(djGroup, Vector3.create(-0.85, desk_z + 0.3, 0), Vector3.create(0.2, 0.01, 0.3), colorChrome, Quaternion.fromEulerDegrees(0, 0, 10))
    // Laptop Screen
    const laptopScreen = createBox(djGroup, Vector3.create(-0.95, desk_z + 0.4, 0), Vector3.create(0.01, 0.2, 0.3), colorBlack, Quaternion.fromEulerDegrees(0, 0, -10))
    Material.setPbrMaterial(laptopScreen, { albedoColor: colorBlack, emissiveColor: colorNeonBlue, emissiveIntensity: 2.0 })
    const laptopText = engine.addEntity()
    Transform.create(laptopText, {
        parent: laptopScreen,
        position: Vector3.create(0.01, 0, 0),
        rotation: Quaternion.fromEulerDegrees(0, 90, 0),
        scale: Vector3.create(0.05, 0.05, 0.05)
    })
    TextShape.create(laptopText, {
        text: 'SERATO\n||||||||',
        textColor: colorNeonBlue,
        fontSize: 2
    })

    // Microphone on stand
    createCylinder(djGroup, Vector3.create(-0.65, desk_z + 0.15, -0.6), Vector3.create(0.02, 0.3, 0.02), colorChrome)
    createCylinder(djGroup, Vector3.create(-0.7, desk_z + 0.3, -0.6), Vector3.create(0.03, 0.08, 0.03), colorBlack, Quaternion.fromEulerDegrees(0, 0, -45))

    // 4. BIG CLUB SPEAKERS (Left and Right)
    for (const spkPos of [-1.5, 1.5]) {
        // Subwoofer (Bottom)
        createBox(djGroup, Vector3.create(-1.2, 0.5, spkPos), Vector3.create(0.6, 0.6, 0.6), colorDarkGrey, Quaternion.fromEulerDegrees(0, spkPos > 0 ? -15 : 15, 0))
        // Main Cabinet (Top)
        const topCab = createBox(djGroup, Vector3.create(-1.2, 1.25, spkPos), Vector3.create(0.5, 0.9, 0.5), colorBlack, Quaternion.fromEulerDegrees(0, spkPos > 0 ? -15 : 15, 0))
        
        // Woofer Cone
        createCylinder(topCab, Vector3.create(-0.25, -0.15, 0), Vector3.create(0.02, 0.35, 0.35), colorDarkGrey, Quaternion.fromEulerDegrees(0, 0, 90))
        // Tweeter
        createCylinder(topCab, Vector3.create(-0.25, 0.3, 0), Vector3.create(0.02, 0.15, 0.15), colorChrome, Quaternion.fromEulerDegrees(0, 0, 90))
    }

    // 5. GIANT SCREEN BEHIND DJ
    // Removed because it blocks the rules board and looked like a giant solid pink block.
}
