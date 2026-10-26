import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { CrazyEightsGame } from './game/logic'
import { setup3DTable, getPlayerDisplayName } from './game/table'
import { setupDoors } from './game/doors'
import { buildHouse } from './game/house'
import { buildFurniture } from './game/furniture'
import { buildBeachSeats } from './game/beach_seats'
import { buildLights } from './game/lights'
import { buildRooftop } from './game/rooftop'
import { setupWaterEffects } from './game/water_effects'
import { setupUI } from './game/ui'
import { buildInfoBoard, showGameButton } from './game/info_board'
import { buildScoreBoard, updateScoreBoardText, updateHighWinningsText } from './game/score_board'
import { setupMultiplayer, pushGameState } from './game/multiplayer'
import { reportGameplayAction, addChips, addTrophies } from './game/economy'
import { showRewardToast } from './game/rewards_ui'

export function main() {
    // 1. Build the architectural shell (Now at 90% scale!)
    const houseEntity = buildHouse()

    // 2. Build the interior furniture (DJ Booth, Media Unit)
    buildFurniture(houseEntity)
    
    buildBeachSeats(houseEntity)

    // 3. Build the glowing accent lights
    buildLights(houseEntity)

    // 3.2. Build Rooftop VIP Deck / Terrace
    buildRooftop(houseEntity)

    // 3.3. Water Splash & Ripple Audio/Visual System for Pool & Jacuzzi
    setupWaterEffects(houseEntity)
    
    // 3.5. Build the Rules Info Board
    
    buildScoreBoard(houseEntity)

    // 4. Start the Crazy 8 Game Backend
    const gameEngine = new CrazyEightsGame()

    // 5. Setup the Draw Pile, Discard Pile, and clickable Chairs (registers players & bot)!
    setup3DTable(gameEngine, houseEntity)

    // 4.5 Set up Multiplayer Sync (now serializes with players already present)
    setupMultiplayer(gameEngine)
    gameEngine.onStateChanged = () => {
      pushGameState(gameEngine)
    }

    // Connect gameplay events to the retention & economy quest system
    gameEngine.onCardPlayed = (playerId, card) => {
      const myId = 'player1'
      if (playerId === myId) {
        reportGameplayAction('card_played')
        if (card.rank === '8' || card.action === 'Wild' || card.action === 'Draw4') {
          reportGameplayAction('wild_eight')
        }
        if (card.action === 'Draw2' || card.action === 'Draw4') {
          reportGameplayAction('inflict_draw')
        }
      }
    }

    gameEngine.onDeclareSafe = (playerId) => {
      if (playerId === 'player1') {
        reportGameplayAction('declare_safe')
      }
    }

    gameEngine.onRoundEnd = (eliminated, winner, scoreBreakdown, roundWinner) => {
      const myId = 'player1'
      reportGameplayAction('match_finished')

      if (roundWinner === myId || winner === myId) {
        reportGameplayAction('match_won')
        addChips(150)
        addTrophies(20)
        showRewardToast('🏆 VICTORY! +150 Chips & +20 Trophies!')
      } else {
        addChips(30)
        addTrophies(5)
        showRewardToast('Good game! +30 Chips & +5 Trophies!')
      }

      if (winner) {
        updateScoreBoardText(`SCOREBOARD\n\n🏆 WINNER: ${winnerName} 🏆\n\nRound ${gameEngine.roundNumber} Over!\n\nLast Eliminated: ${eliminatedName}\n\nScores:\n${scoreBreakdown || ''}`)
        updateHighWinningsText(`HIGH WINNINGS\n\n🏆 ${winnerName} 🏆\n\nSecured the bag in Round ${gameEngine.roundNumber}!`)
        showGameButton('START NEW GAME', 'START')
      } else {
        updateScoreBoardText(`SCOREBOARD\n\n🎉 ${roundWinnerName} WENT OUT! 🎉\n\nRound ${gameEngine.roundNumber} Over!\n\nEliminated: ${eliminatedName}\n\nScores:\n${scoreBreakdown || ''}\n\nWaiting for next round...`)
        updateHighWinningsText(`HIGH WINNINGS\n\nRound ${gameEngine.roundNumber} Winner:\n${roundWinnerName}\n\nGame still in progress!`)
        showGameButton('CONTINUE\n(Next Round)', 'CONTINUE')
      }
    }

    // Set up the Rules Board and 3D Start Button
    buildInfoBoard(houseEntity, gameEngine)

    // Set up the 2D UI for the player's hand!
    setupUI(gameEngine)

    // 6. Spawn the automatic sliding doors
    setupDoors(houseEntity)
}