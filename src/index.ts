import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { CrazyEightsGame } from './game/logic'
import { setup3DTable } from './game/table'
import { setupDoors } from './game/doors'
import { buildHouse } from './game/house'
import { buildFurniture } from './game/furniture'
import { buildBeachSeats } from './game/beach_seats'
import { buildLights } from './game/lights'
import { setupUI } from './game/ui'
import { buildInfoBoard, showGameButton } from './game/info_board'
import { buildScoreBoard, updateScoreBoardText, updateHighWinningsText } from './game/score_board'
import { setupMultiplayer, pushGameState } from './game/multiplayer'

export function main() {
    // 1. Build the architectural shell (Now at 90% scale!)
    const houseEntity = buildHouse()

    // 2. Build the interior furniture (DJ Booth, Media Unit)
    buildFurniture(houseEntity)
    
    buildBeachSeats(houseEntity)

    // 3. Build the glowing accent lights
    buildLights(houseEntity)
    
    // 3.5. Build the Rules Info Board
    
    buildScoreBoard(houseEntity)

    // 4. Start the Crazy 8 Game Backend
    const gameEngine = new CrazyEightsGame()

    // 4.5 Set up Multiplayer Sync
    setupMultiplayer(gameEngine)
    gameEngine.onStateChanged = () => {
      pushGameState(gameEngine)
    }

    gameEngine.onRoundEnd = (eliminated, winner, scoreBreakdown, roundWinner) => {
      if (winner) {
        updateScoreBoardText(`SCOREBOARD\n\n🏆 WINNER: ${winner.toUpperCase()} 🏆\n\nRound ${gameEngine.roundNumber} Over!\n\nLast Eliminated: ${eliminated.toUpperCase()}\n\nScores:\n${scoreBreakdown || ''}`)
        updateHighWinningsText(`HIGH WINNINGS\n\n🏆 ${winner.toUpperCase()} 🏆\n\nSecured the bag in Round ${gameEngine.roundNumber}!`)
        showGameButton('START NEW GAME', 'START')
      } else {
        updateScoreBoardText(`SCOREBOARD\n\n🎉 ${roundWinner?.toUpperCase()} WENT OUT! 🎉\n\nRound ${gameEngine.roundNumber} Over!\n\nEliminated: ${eliminated.toUpperCase()}\n\nScores:\n${scoreBreakdown || ''}\n\nWaiting for next round...`)
        updateHighWinningsText(`HIGH WINNINGS\n\nRound ${gameEngine.roundNumber} Winner:\n${roundWinner?.toUpperCase()}\n\nGame still in progress!`)
        showGameButton('CONTINUE\n(Next Round)', 'CONTINUE')
      }
    }

    // 5. Setup the Draw Pile, Discard Pile, and clickable Chairs!
    setup3DTable(gameEngine, houseEntity)

    // Set up the Rules Board and 3D Start Button
    buildInfoBoard(houseEntity, gameEngine)

    // Set up the 2D UI for the player's hand!
    setupUI(gameEngine)

    // 6. Spawn the automatic sliding doors
    setupDoors(houseEntity)
}