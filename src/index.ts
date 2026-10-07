import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { CrazyEightsGame } from './game/logic'
import { setup3DTable } from './game/table'
import { setupDoors } from './game/doors'
import { buildHouse } from './game/house'
import { buildFurniture } from './game/furniture'
import { buildLights } from './game/lights'
import { setupUI } from './game/ui'

export function main() {
    // 1. Build the architectural shell (Now at 90% scale!)
    const houseEntity = buildHouse()

    // 2. Build the interior furniture (DJ Booth, Media Unit)
    buildFurniture(houseEntity)

    // 3. Build the glowing accent lights
    buildLights(houseEntity)

    // 4. Start the Crazy 8 Game Backend
    const gameEngine = new CrazyEightsGame()

    // 5. Setup the Draw Pile, Discard Pile, and clickable Chairs!
    setup3DTable(gameEngine, houseEntity)

    // Set up the 2D UI for the player's hand!
    setupUI(gameEngine)

    // 6. Spawn the automatic sliding doors
    setupDoors(houseEntity)
}