import {
  engine,
  Transform,
  MeshRenderer,
  MeshCollider,
  Material,
  Entity,
  MaterialTransparencyMode,
  pointerEventsSystem,
  InputAction,
  TextShape,
  TextAlignMode
} from '@dcl/sdk/ecs'
import { Vector3, Quaternion, Color4, Color3 } from '@dcl/sdk/math'
import { movePlayerTo } from '~system/RestrictedActions'

// Floor elevations (relative to parent houseEntity)
const GROUND_Y = 0.05
const ROOFTOP_Y = 8.21

// Centered for the enlarged 2+ person cabin
const CAB_CENTER_X = 8.35
const CAB_CENTER_Z = 3.4

const DOOR_DURATION = 0.75 // seconds to slide open/closed
const TRAVEL_DURATION = 3.0 // seconds for cab travel between floors
const AUTO_CLOSE_DELAY = 4.5 // seconds before open doors close if unoccupied
const IN_CAB_DEPARTURE_DELAY = 0.8 // seconds passenger must be in cab before doors auto-close and depart

enum ElevatorFloor {
  GROUND = 0,
  ROOFTOP = 1
}

enum ElevatorState {
  IDLE_OPEN = 'IDLE_OPEN',
  CLOSING_DOORS = 'CLOSING_DOORS',
  MOVING = 'MOVING',
  OPENING_DOORS = 'OPENING_DOORS',
  IDLE_CLOSED = 'IDLE_CLOSED'
}

let cabEntity: Entity
// Ground North Doors (facing patio / +Z)
let doorNorthLeftEntity: Entity
let doorNorthRightEntity: Entity
// Rooftop West Doors (facing VIP deck / -X)
let doorWestLeftEntity: Entity
let doorWestRightEntity: Entity

let interiorButtonEntity: Entity
let interiorStatusText: Entity

let currentFloor: ElevatorFloor = ElevatorFloor.GROUND
let targetFloor: ElevatorFloor = ElevatorFloor.GROUND
let state: ElevatorState = ElevatorState.IDLE_OPEN

let moveProgress = 0 // 0 to 1
let startY = GROUND_Y
let destinationY = GROUND_Y

let doorProgress = 1.0 // 1 = fully open, 0 = fully closed
let idleOpenTimer = 0
let inCabTimer = 0

// Helper to create box entities
function createBox(
  parent: Entity,
  pos: Vector3,
  scale: Vector3,
  color: Color4,
  rot: Quaternion = Quaternion.Identity(),
  emissive?: Color3,
  emissiveIntensity = 0,
  collider = true
): Entity {
  const ent = engine.addEntity()
  Transform.create(ent, { parent, position: pos, scale, rotation: rot })
  MeshRenderer.setBox(ent)
  if (collider) {
    MeshCollider.setBox(ent)
  }
  const transparency = color.a < 1.0 ? MaterialTransparencyMode.MTM_ALPHA_BLEND : MaterialTransparencyMode.MTM_AUTO
  if (emissive && emissiveIntensity > 0) {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      emissiveColor: emissive,
      emissiveIntensity,
      transparencyMode: transparency
    })
  } else {
    Material.setPbrMaterial(ent, {
      albedoColor: color,
      transparencyMode: transparency
    })
  }
  return ent
}

// =========================================================================
// SENSOR DETECTION FUNCTIONS (EXACT LOCAL SPACE CONVERSION)
// =========================================================================

/**
 * Returns the player's position in houseEntity local coordinate space
 */
function getPlayerLocalPos(): Vector3 | null {
  const player = Transform.getOrNull(engine.PlayerEntity)
  if (!player) return null

  // House is at (16, 0.05, 25), rotated 180 degrees around Y, scaled 0.9
  return Vector3.create(
    (16 - player.position.x) / 0.9,
    (player.position.y - 0.05) / 0.9,
    (25 - player.position.z) / 0.9
  )
}

/**
 * Checks if the avatar is standing inside the enlarged 2-person elevator cab
 */
function isPlayerInsideCab(): boolean {
  const localPos = getPlayerLocalPos()
  if (!localPos || !cabEntity) return false

  const cabY = Transform.get(cabEntity).position.y
  const dx = Math.abs(localPos.x - CAB_CENTER_X)
  const dz = Math.abs(localPos.z - CAB_CENTER_Z)
  const dy = localPos.y - cabY

  // Spacious 2.2m deep (X) x 2.3m wide (Z) cab:
  // Half extents: dx <= 1.05m, dz <= 1.10m. Height: dy between -0.2m and 2.4m
  return dx <= 1.05 && dz <= 1.10 && dy >= -0.2 && dy <= 2.4
}

/**
 * Checks if the avatar is waiting outside the Ground Floor entrance on the runway
 * STRICTLY OUTSIDE THE CAB (z >= 4.45)
 */
function isPlayerAtGroundApproach(): boolean {
  const localPos = getPlayerLocalPos()
  if (!localPos) return false

  const dx = Math.abs(localPos.x - CAB_CENTER_X)
  // Runway is at z between 4.45 and 6.8, in front of North door, ground height y < 4.0
  return dx <= 1.35 && localPos.z >= 4.45 && localPos.z <= 6.8 && localPos.y < 4.0
}

/**
 * Checks if the avatar is waiting outside the Rooftop Floor entrance on the VIP deck
 * STRICTLY OUTSIDE THE CAB (x <= 7.15)
 */
function isPlayerAtRooftopApproach(): boolean {
  const localPos = getPlayerLocalPos()
  if (!localPos) return false

  const dz = Math.abs(localPos.z - CAB_CENTER_Z)
  // VIP entrance threshold is at x between 5.0 and 7.15, rooftop height y > 5.5
  return dz <= 1.35 && localPos.x >= 5.0 && localPos.x <= 7.15 && localPos.y > 5.5
}

// =========================================================================
// ELEVATOR DISPATCH LOGIC
// =========================================================================

export function callElevator(floor: ElevatorFloor) {
  if (state === ElevatorState.MOVING) return

  if (currentFloor === floor) {
    if (state === ElevatorState.IDLE_CLOSED || state === ElevatorState.CLOSING_DOORS) {
      state = ElevatorState.OPENING_DOORS
    }
    idleOpenTimer = 0
    return
  }

  targetFloor = floor
  destinationY = targetFloor === ElevatorFloor.ROOFTOP ? ROOFTOP_Y : GROUND_Y
  startY = Transform.get(cabEntity).position.y

  if (state === ElevatorState.IDLE_OPEN) {
    state = ElevatorState.CLOSING_DOORS
  } else if (doorProgress <= 0.05) {
    state = ElevatorState.MOVING
    moveProgress = 0
  }
}

export function toggleElevatorFromInside() {
  if (state === ElevatorState.MOVING) return
  const nextFloor = currentFloor === ElevatorFloor.GROUND ? ElevatorFloor.ROOFTOP : ElevatorFloor.GROUND
  callElevator(nextFloor)
}

// =========================================================================
// BUILD ELEVATOR SCENE ENTITIES
// =========================================================================

export function buildElevator(houseEntity: Entity) {
  const colObsidian = Color4.fromHexString('#0d0f15')
  const colSteel = Color4.fromHexString('#141720')
  const colTrim = Color4.fromHexString('#0a0c10')
  const colNeonCyan = Color4.fromHexString('#00f3ff')
  const neonCyan = Color3.fromHexString('#00f3ff')
  const glassSmoked = Color4.create(0.12, 0.18, 0.25, 0.38)
  const glassDoor = Color4.create(0.0, 0.85, 1.0, 0.45)

  // =========================================================================
  // 1. STATIONARY SHAFT, WALKWAYS & GUIDES (SPACIOUS 2+ PERSON SIZE)
  // =========================================================================

  // Ground base foundation slab (2.6m x 2.7m)
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X, 0.02, CAB_CENTER_Z),
    Vector3.create(2.6, 0.06, 2.7),
    colObsidian
  )
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X, 0.03, CAB_CENTER_Z),
    Vector3.create(2.64, 0.02, 2.74),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )

  // Ground Illuminated Runway Walkway (connecting patio at z = 5.9 to elevator at z = 4.55)
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X, 0.04, 5.40),
    Vector3.create(2.20, 0.06, 1.70),
    colSteel
  )
  // Glowing cyan runway edge strips
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X - 1.10, 0.05, 5.40),
    Vector3.create(0.04, 0.02, 1.70),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X + 1.10, 0.05, 5.40),
    Vector3.create(0.04, 0.02, 1.70),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )

  // Rooftop VIP transition threshold plate
  createBox(
    houseEntity,
    Vector3.create(7.20, 8.20, CAB_CENTER_Z),
    Vector3.create(0.40, 0.06, 1.60),
    colSteel
  )
  createBox(
    houseEntity,
    Vector3.create(7.20, 8.21, CAB_CENTER_Z),
    Vector3.create(0.40, 0.02, 0.04),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )

  // Twin vertical structural columns (pylons) on exterior back side
  const colZ1 = CAB_CENTER_Z - 1.25
  const colZ2 = CAB_CENTER_Z + 1.25
  const pylonHeight = 11.2
  const pylonCenterY = pylonHeight / 2

  for (const pz of [colZ1, colZ2]) {
    createBox(
      houseEntity,
      Vector3.create(CAB_CENTER_X + 1.20, pylonCenterY, pz),
      Vector3.create(0.22, pylonHeight, 0.22),
      colSteel
    )
    createBox(
      houseEntity,
      Vector3.create(CAB_CENTER_X + 1.20, pylonCenterY, pz),
      Vector3.create(0.04, pylonHeight, 0.06),
      colNeonCyan,
      Quaternion.Identity(),
      neonCyan,
      3.0,
      false
    )
    createBox(
      houseEntity,
      Vector3.create(CAB_CENTER_X + 0.60, 8.20, pz),
      Vector3.create(1.2, 0.12, 0.12),
      colSteel
    )
  }

  // Top Machine Canopy / Crown
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X, 11.1, CAB_CENTER_Z),
    Vector3.create(2.6, 0.26, 2.7),
    colTrim
  )
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X, 11.0, CAB_CENTER_Z),
    Vector3.create(2.64, 0.04, 2.74),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    3.0,
    false
  )

  // =========================================================================
  // 2. THE EXPANDED 2+ PERSON PANORAMIC CAB (2.2m deep x 2.3m wide)
  // =========================================================================
  cabEntity = engine.addEntity()
  Transform.create(cabEntity, {
    parent: houseEntity,
    position: Vector3.create(CAB_CENTER_X, GROUND_Y, CAB_CENTER_Z)
  })

  // Cab Floor (Solid walkable platform: 2.2m in X, 2.3m in Z)
  createBox(
    cabEntity,
    Vector3.create(0, 0.04, 0),
    Vector3.create(2.20, 0.08, 2.30),
    colObsidian,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )

  // Cyan Neon Perimeter Band under cab floor
  createBox(
    cabEntity,
    Vector3.create(0, 0.02, 1.13),
    Vector3.create(2.20, 0.03, 0.04),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )
  createBox(
    cabEntity,
    Vector3.create(0, 0.02, -1.13),
    Vector3.create(2.20, 0.03, 0.04),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )
  createBox(
    cabEntity,
    Vector3.create(1.08, 0.02, 0),
    Vector3.create(0.04, 0.03, 2.30),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )
  createBox(
    cabEntity,
    Vector3.create(-1.08, 0.02, 0),
    Vector3.create(0.04, 0.03, 2.30),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.5,
    false
  )

  // Cab Ceiling / Roof
  createBox(
    cabEntity,
    Vector3.create(0, 2.40, 0),
    Vector3.create(2.20, 0.08, 2.30),
    colSteel,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )

  // Dual Overhead Downlight Luminaire (Soft glowing ceiling panel)
  createBox(
    cabEntity,
    Vector3.create(0, 2.35, 0),
    Vector3.create(1.30, 0.02, 0.90),
    Color4.create(0.9, 0.98, 1.0, 1.0),
    Quaternion.Identity(),
    Color3.create(0.8, 0.95, 1.0),
    2.5,
    false
  )

  // --- PANORAMIC FIXED GLASS WALLS ---
  const wallH = 2.28
  const wallY = 1.22

  // Back Wall (+X, panoramic horizon view)
  createBox(
    cabEntity,
    Vector3.create(1.06, wallY, 0),
    Vector3.create(0.04, wallH, 2.26),
    glassSmoked,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )
  createBox(
    cabEntity,
    Vector3.create(1.01, 1.02, 0),
    Vector3.create(0.04, 0.04, 2.20),
    colSteel
  )

  // South Wall (-Z, with grab bar and interior console)
  createBox(
    cabEntity,
    Vector3.create(0, wallY, -1.11),
    Vector3.create(2.16, wallH, 0.04),
    glassSmoked,
    Quaternion.Identity(),
    undefined,
    0,
    true
  )
  createBox(
    cabEntity,
    Vector3.create(0, 1.02, -1.06),
    Vector3.create(2.10, 0.04, 0.04),
    colSteel
  )

  // --- DOORWAY A: NORTH DOORS (+Z, Ground Entrance facing Patio Runway) ---
  // Doorway posts framing 1.40m wide opening
  createBox(
    cabEntity,
    Vector3.create(0.92, wallY, 1.11),
    Vector3.create(0.36, wallH, 0.08),
    colSteel
  )
  createBox(
    cabEntity,
    Vector3.create(-0.92, wallY, 1.11),
    Vector3.create(0.36, wallH, 0.08),
    colSteel
  )
  createBox(
    cabEntity,
    Vector3.create(0, 2.26, 1.11),
    Vector3.create(2.20, 0.20, 0.08),
    colSteel
  )

  // North Left Door (slides towards -X)
  doorNorthLeftEntity = createBox(
    cabEntity,
    Vector3.create(-1.05, 1.08, 1.13), // Starts open at ground
    Vector3.create(0.74, 2.04, 0.03),
    glassDoor,
    Quaternion.Identity(),
    neonCyan,
    0.8,
    true
  )
  createBox(
    doorNorthLeftEntity,
    Vector3.create(0.32, 0, 0.02),
    Vector3.create(0.03, 0.70, 0.03),
    colSteel
  )

  // North Right Door (slides towards +X)
  doorNorthRightEntity = createBox(
    cabEntity,
    Vector3.create(1.05, 1.08, 1.13), // Starts open at ground
    Vector3.create(0.74, 2.04, 0.03),
    glassDoor,
    Quaternion.Identity(),
    neonCyan,
    0.8,
    true
  )
  createBox(
    doorNorthRightEntity,
    Vector3.create(-0.32, 0, 0.02),
    Vector3.create(0.03, 0.70, 0.03),
    colSteel
  )

  // --- DOORWAY B: WEST DOORS (-X, Rooftop Entrance facing VIP Deck Gateway) ---
  // Doorway posts framing 1.40m wide opening
  createBox(
    cabEntity,
    Vector3.create(-1.06, wallY, 0.92),
    Vector3.create(0.08, wallH, 0.36),
    colSteel
  )
  createBox(
    cabEntity,
    Vector3.create(-1.06, wallY, -0.92),
    Vector3.create(0.08, wallH, 0.36),
    colSteel
  )
  createBox(
    cabEntity,
    Vector3.create(-1.06, 2.26, 0),
    Vector3.create(0.08, 0.20, 2.20),
    colSteel
  )

  // West Left Door (slides towards +Z)
  doorWestLeftEntity = createBox(
    cabEntity,
    Vector3.create(-1.08, 1.08, 0.37), // Starts closed at ground
    Vector3.create(0.03, 2.04, 0.74),
    glassDoor,
    Quaternion.Identity(),
    neonCyan,
    0.8,
    true
  )
  createBox(
    doorWestLeftEntity,
    Vector3.create(-0.02, 0, -0.32),
    Vector3.create(0.03, 0.70, 0.03),
    colSteel
  )

  // West Right Door (slides towards -Z)
  doorWestRightEntity = createBox(
    cabEntity,
    Vector3.create(-1.08, 1.08, -0.37), // Starts closed at ground
    Vector3.create(0.03, 2.04, 0.74),
    glassDoor,
    Quaternion.Identity(),
    neonCyan,
    0.8,
    true
  )
  createBox(
    doorWestRightEntity,
    Vector3.create(-0.02, 0, 0.32),
    Vector3.create(0.03, 0.70, 0.03),
    colSteel
  )

  // =========================================================================
  // 3. CAB INTERIOR CONTROLS & HUD
  // =========================================================================
  createBox(
    cabEntity,
    Vector3.create(0.20, 1.18, -1.07),
    Vector3.create(0.40, 0.54, 0.04),
    colTrim
  )
  createBox(
    cabEntity,
    Vector3.create(0.20, 1.18, -1.06),
    Vector3.create(0.42, 0.56, 0.01),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    2.0,
    false
  )

  interiorStatusText = engine.addEntity()
  Transform.create(interiorStatusText, {
    parent: cabEntity,
    position: Vector3.create(0.20, 1.34, -1.04),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  TextShape.create(interiorStatusText, {
    text: 'VIP ELEVATOR\nAUTO SENSOR ACTIVE',
    fontSize: 1.5,
    textColor: colNeonCyan,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER
  })

  interiorButtonEntity = createBox(
    cabEntity,
    Vector3.create(0.20, 1.05, -1.03),
    Vector3.create(0.26, 0.16, 0.04),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    3.0,
    true
  )
  const btnText = engine.addEntity()
  Transform.create(btnText, {
    parent: interiorButtonEntity,
    position: Vector3.create(0, 0, 0.03),
    rotation: Quaternion.fromEulerDegrees(0, 0, 0)
  })
  TextShape.create(btnText, {
    text: 'TRAVEL',
    fontSize: 1.8,
    textColor: Color4.fromHexString('#0a0c10'),
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER
  })

  pointerEventsSystem.onPointerDown(
    {
      entity: interiorButtonEntity,
      opts: { button: InputAction.IA_PRIMARY, hoverText: 'Travel (Rooftop / Ground)' }
    },
    () => {
      toggleElevatorFromInside()
    }
  )

  // =========================================================================
  // 4. EXTERIOR CALL STATIONS
  // =========================================================================

  // Ground Call Station (Along runway at z = 5.4)
  createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X - 1.30, 0.50, 5.4),
    Vector3.create(0.14, 1.00, 0.14),
    colSteel
  )
  const groundCallBtn = createBox(
    houseEntity,
    Vector3.create(CAB_CENTER_X - 1.30, 1.05, 5.4),
    Vector3.create(0.16, 0.14, 0.16),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    3.0,
    true
  )
  const groundLabel = engine.addEntity()
  Transform.create(groundLabel, {
    parent: houseEntity,
    position: Vector3.create(CAB_CENTER_X - 1.30, 1.25, 5.4),
    rotation: Quaternion.fromEulerDegrees(0, 180, 0)
  })
  TextShape.create(groundLabel, {
    text: 'VIP LIFT\nAUTO / CALL',
    fontSize: 1.4,
    textColor: colNeonCyan,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER
  })

  pointerEventsSystem.onPointerDown(
    {
      entity: groundCallBtn,
      opts: { button: InputAction.IA_PRIMARY, hoverText: 'Call VIP Elevator' }
    },
    () => {
      callElevator(ElevatorFloor.GROUND)
    }
  )

  // Rooftop Call Station (Mounted on VIP Gatepost at z = 2.52)
  const roofCallBtn = createBox(
    houseEntity,
    Vector3.create(7.15, ROOFTOP_Y + 0.65, 2.52),
    Vector3.create(0.10, 0.16, 0.08),
    colNeonCyan,
    Quaternion.Identity(),
    neonCyan,
    3.0,
    true
  )
  const roofLabel = engine.addEntity()
  Transform.create(roofLabel, {
    parent: houseEntity,
    position: Vector3.create(7.15, ROOFTOP_Y + 0.90, 2.52),
    rotation: Quaternion.fromEulerDegrees(0, 90, 0)
  })
  TextShape.create(roofLabel, {
    text: 'VIP LIFT\nAUTO / CALL',
    fontSize: 1.4,
    textColor: colNeonCyan,
    textAlign: TextAlignMode.TAM_MIDDLE_CENTER
  })

  pointerEventsSystem.onPointerDown(
    {
      entity: roofCallBtn,
      opts: { button: InputAction.IA_PRIMARY, hoverText: 'Call VIP Elevator' }
    },
    () => {
      callElevator(ElevatorFloor.ROOFTOP)
    }
  )

  // =========================================================================
  // 5. ELEVATOR SYSTEM LOOP
  // =========================================================================
  engine.addSystem(elevatorSystem)
}

/**
 * System handling automatic proximity sensing, door transitions, and passenger transit
 */
function elevatorSystem(dt: number) {
  if (!cabEntity || !doorNorthLeftEntity || !doorNorthRightEntity || !doorWestLeftEntity || !doorWestRightEntity) return

  const cabTransform = Transform.getMutable(cabEntity)
  const dNL = Transform.getMutable(doorNorthLeftEntity)
  const dNR = Transform.getMutable(doorNorthRightEntity)
  const dWL = Transform.getMutable(doorWestLeftEntity)
  const dWR = Transform.getMutable(doorWestRightEntity)

  // Check proximity sensors
  const isInside = isPlayerInsideCab()
  const isGroundWaiting = isPlayerAtGroundApproach()
  const isRooftopWaiting = isPlayerAtRooftopApproach()

  // =========================================================================
  // A. AUTOMATIC PROXIMITY SENSOR TRIGGERS (WHEN ELEVATOR IS PARKED & CLOSED)
  // =========================================================================

  if (state === ElevatorState.IDLE_CLOSED) {
    if (isInside) {
      // Passenger inside: auto-dispatch to opposite floor
      targetFloor = currentFloor === ElevatorFloor.GROUND ? ElevatorFloor.ROOFTOP : ElevatorFloor.GROUND
      destinationY = targetFloor === ElevatorFloor.ROOFTOP ? ROOFTOP_Y : GROUND_Y
      startY = cabTransform.position.y
      state = ElevatorState.MOVING
      moveProgress = 0.0
      updateStatusText('TRAVELING...')
    } else if (isGroundWaiting) {
      // Player is waiting on Ground
      if (currentFloor === ElevatorFloor.GROUND) {
        state = ElevatorState.OPENING_DOORS
      } else {
        // Elevator is at top -> summon down automatically!
        callElevator(ElevatorFloor.GROUND)
        updateStatusText('SENSOR: SUMMONING\nTO GROUND FLOOR')
      }
    } else if (isRooftopWaiting) {
      // Player is waiting on Rooftop
      if (currentFloor === ElevatorFloor.ROOFTOP) {
        state = ElevatorState.OPENING_DOORS
      } else {
        // Elevator is at ground -> summon up automatically!
        callElevator(ElevatorFloor.ROOFTOP)
        updateStatusText('SENSOR: SUMMONING\nTO ROOFTOP VIP')
      }
    }
  }

  // If elevator is at the other floor while player is waiting outside:
  if (state === ElevatorState.IDLE_OPEN && !isInside) {
    if (isGroundWaiting && currentFloor === ElevatorFloor.ROOFTOP) {
      targetFloor = ElevatorFloor.GROUND
      state = ElevatorState.CLOSING_DOORS
      updateStatusText('GROUND SENSOR DETECTED\nCOMING DOWN...')
    } else if (isRooftopWaiting && currentFloor === ElevatorFloor.GROUND) {
      targetFloor = ElevatorFloor.ROOFTOP
      state = ElevatorState.CLOSING_DOORS
      updateStatusText('ROOFTOP SENSOR DETECTED\nCOMING UP...')
    }
  }

  // =========================================================================
  // B. FINITE STATE MACHINE
  // =========================================================================

  switch (state) {
    case ElevatorState.IDLE_OPEN:
      if (isInside) {
        // PASSENGER ENTERED CAB: Start departure delay
        inCabTimer += dt
        const remaining = Math.max(0, IN_CAB_DEPARTURE_DELAY - inCabTimer).toFixed(1)
        updateStatusText(`PASSENGER ON BOARD\nDOORS CLOSING IN ${remaining}s`)

        if (inCabTimer >= IN_CAB_DEPARTURE_DELAY) {
          // Time to close and depart!
          targetFloor = currentFloor === ElevatorFloor.GROUND ? ElevatorFloor.ROOFTOP : ElevatorFloor.GROUND
          state = ElevatorState.CLOSING_DOORS
          updateStatusText('DOORS CLOSING...')
        }
      } else if (isGroundWaiting && currentFloor === ElevatorFloor.GROUND) {
        // Keep doors open while player is approaching on the runway
        idleOpenTimer = 0
        inCabTimer = 0
        updateStatusText('GROUND ENTRANCE\nENTER CAB')
      } else if (isRooftopWaiting && currentFloor === ElevatorFloor.ROOFTOP) {
        // Keep doors open while player is approaching at the VIP gate
        idleOpenTimer = 0
        inCabTimer = 0
        updateStatusText('VIP ROOFTOP\nENTER CAB')
      } else {
        // Nobody inside and nobody waiting: auto-close timer
        inCabTimer = 0
        idleOpenTimer += dt
        if (idleOpenTimer >= AUTO_CLOSE_DELAY) {
          state = ElevatorState.CLOSING_DOORS
          updateStatusText('DOORS CLOSING...')
        }
      }
      break

    case ElevatorState.CLOSING_DOORS:
      // Safety: ONLY reopen if a player OUTSIDE steps into the doorway while closing
      if (!isInside) {
        if ((isGroundWaiting && currentFloor === ElevatorFloor.GROUND) ||
            (isRooftopWaiting && currentFloor === ElevatorFloor.ROOFTOP)) {
          state = ElevatorState.OPENING_DOORS
          break
        }
      }

      doorProgress -= dt / DOOR_DURATION
      if (doorProgress <= 0.0) {
        doorProgress = 0.0
        if (targetFloor !== currentFloor) {
          state = ElevatorState.MOVING
          moveProgress = 0.0
          startY = cabTransform.position.y
          destinationY = targetFloor === ElevatorFloor.ROOFTOP ? ROOFTOP_Y : GROUND_Y
          updateStatusText(targetFloor === ElevatorFloor.ROOFTOP ? 'ASCENDING TO\nROOFTOP VIP...' : 'DESCENDING TO\nGROUND PATIO...')
        } else {
          state = ElevatorState.IDLE_CLOSED
          updateStatusText('VIP ELEVATOR\nREADY')
        }
      }
      break

    case ElevatorState.OPENING_DOORS:
      doorProgress += dt / DOOR_DURATION
      if (doorProgress >= 1.0) {
        doorProgress = 1.0
        state = ElevatorState.IDLE_OPEN
        idleOpenTimer = 0.0
        inCabTimer = 0.0
        updateStatusText(currentFloor === ElevatorFloor.ROOFTOP ? 'ROOFTOP VIP\nWELCOME' : 'GROUND PATIO\nWELCOME')
      }
      break

    case ElevatorState.MOVING:
      moveProgress += dt / TRAVEL_DURATION
      if (moveProgress >= 1.0) {
        moveProgress = 1.0
        cabTransform.position.y = destinationY
        currentFloor = targetFloor
        state = ElevatorState.OPENING_DOORS
        doorProgress = 0.0
        inCabTimer = 0.0

        // Safe landing threshold positioning:
        if (isPlayerInsideCab()) {
          if (currentFloor === ElevatorFloor.ROOFTOP) {
            movePlayerTo({
              newRelativePosition: Vector3.create(10.0, 7.5, 21.94),
              cameraTarget: Vector3.create(16, 7.5, 25)
            })
          } else {
            movePlayerTo({
              newRelativePosition: Vector3.create(8.48, 0.15, 20.0),
              cameraTarget: Vector3.create(8.48, 1.0, 16)
            })
          }
        }
      } else {
        // Smoothstep interpolation for luxurious express cruise
        const t = moveProgress
        const smoothT = t * t * (3 - 2 * t)
        cabTransform.position.y = startY + (destinationY - startY) * smoothT
      }
      break
  }

  // =========================================================================
  // C. UPDATE DOOR POSITIONS (1.4m WIDE DOUBLE-SLIDING DOORWAYS)
  // =========================================================================
  // Closed offset = 0.37, Open offset = 1.05 (gives 1.40m wide doorway clearance)
  const closedOffset = 0.37
  const openOffset = 1.05
  const activeOffset = closedOffset + (openOffset - closedOffset) * doorProgress

  if (currentFloor === ElevatorFloor.GROUND) {
    // At Ground: North doors (+Z) open in front of approaching patio avatar!
    dNL.position.x = -activeOffset
    dNR.position.x = activeOffset
    // West doors remain closed for safety
    dWL.position.z = closedOffset
    dWR.position.z = -closedOffset
  } else {
    // At Rooftop: West doors (-X) open in front of VIP deck gateway!
    dWL.position.z = activeOffset
    dWR.position.z = -activeOffset
    // North doors remain closed for safety
    dNL.position.x = -closedOffset
    dNR.position.x = closedOffset
  }
}

function updateStatusText(msg: string) {
  if (interiorStatusText && TextShape.has(interiorStatusText)) {
    TextShape.getMutable(interiorStatusText).text = msg
  }
}
