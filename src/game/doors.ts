import { engine, Transform, MeshRenderer, MeshCollider, Material, Entity } from '@dcl/sdk/ecs'
import { Vector3, Color4 } from '@dcl/sdk/math'

let isDoorOpen = false
let paneOL: Entity
let paneIL: Entity
let paneIR: Entity
let paneOR: Entity

// 4-Pane Telescoping Sliding Doors!
// The doorway opening is 9.2m wide (-4.6 to 4.6).
// We break the giant doors into 4 separate 2.3m panes on two different tracks.
const closedPosOL = Vector3.create(-3.45, 2.75, -5.88)
const closedPosIL = Vector3.create(-1.15, 2.75, -5.82)
const closedPosIR = Vector3.create(1.15, 2.75, -5.82)
const closedPosOR = Vector3.create(3.45, 2.75, -5.88)

// When open, they slide and stack neatly behind the 2.4m wide side walls (centered at +/- 5.8)
// This prevents them from sticking out of the sides of the house!
const openPosOL = Vector3.create(-5.75, 2.75, -5.88)
const openPosIL = Vector3.create(-5.75, 2.75, -5.82)
const openPosIR = Vector3.create(5.75, 2.75, -5.82)
const openPosOR = Vector3.create(5.75, 2.75, -5.88)

function createPane(houseEntity: Entity, pos: Vector3, glassColor: Color4): Entity {
  const pane = engine.addEntity()
  Transform.create(pane, {
    parent: houseEntity,
    position: pos,
    // Width 2.35 to give a tiny visual overlap so there are no pixel gaps!
    scale: Vector3.create(2.35, 5.5, 0.04) 
  })
  MeshRenderer.setBox(pane)
  MeshCollider.setBox(pane)
  Material.setPbrMaterial(pane, { albedoColor: glassColor })
  return pane
}

export function setupDoors(houseEntity: Entity) {
  const glassColor = Color4.create(0.9, 0.95, 0.98, 0.4) 
  
  paneOL = createPane(houseEntity, closedPosOL, glassColor)
  paneIL = createPane(houseEntity, closedPosIL, glassColor)
  paneIR = createPane(houseEntity, closedPosIR, glassColor)
  paneOR = createPane(houseEntity, closedPosOR, glassColor)
  
  engine.addSystem(doorSensorSystem)
}

function doorSensorSystem(dt: number) {
  const playerTransform = Transform.getOrNull(engine.PlayerEntity)
  if (!playerTransform) return

  // The house is at Z=25, scaled by 0.9, rotated 180.
  // Front door local Z=-5.9 -> World Z = 25 + (-(-5.9) * 0.9) = 30.31
  const doorLocation = Vector3.create(16, 1, 30.31)
  
  const distance = Vector3.distance(playerTransform.position, doorLocation)
  const shouldBeOpen = distance < 8.0 // Increased detection range for the big house

  if (shouldBeOpen && !isDoorOpen) isDoorOpen = true
  else if (!shouldBeOpen && isDoorOpen) isDoorOpen = false

  const mutOL = Transform.getMutable(paneOL)
  const mutIL = Transform.getMutable(paneIL)
  const mutIR = Transform.getMutable(paneIR)
  const mutOR = Transform.getMutable(paneOR)

  const speed = 4.0 * dt
  // Slide outer panels slightly slower than inner panels for a cool staggered effect!
  mutOL.position = Vector3.lerp(mutOL.position, isDoorOpen ? openPosOL : closedPosOL, speed * 0.8)
  mutOR.position = Vector3.lerp(mutOR.position, isDoorOpen ? openPosOR : closedPosOR, speed * 0.8)
  mutIL.position = Vector3.lerp(mutIL.position, isDoorOpen ? openPosIL : closedPosIL, speed)
  mutIR.position = Vector3.lerp(mutIR.position, isDoorOpen ? openPosIR : closedPosIR, speed)
}
