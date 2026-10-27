import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { CrazyEightsGame } from './game/logic'
import { setup3DTable, getPlayerDisplayName, update3DTable, resolvePlayerId } from './game/table'
import { setupDoors } from './game/doors'
import { buildHouse } from './game/house'
import { buildFurniture } from './game/furniture'
import { buildBeachSeats } from './game/beach_seats'
import { buildLights } from './game/lights'
import { buildRooftop } from './game/rooftop'
import { setupWaterEffects } from './game/water_effects'
import { setupUI } from './game/ui'
import { buildInfoBoard, showGameButton } from './game/info_board'
import { buildScoreBoard, updateScoreBoardText, updateHighWinningsText, renderOutdoorHallOfFame } from './game/score_board'
import { setupMultiplayer, pushGameState } from './game/multiplayer'
import { reportGameplayAction, addChips, addTrophies } from './game/economy'
import { showRewardToast } from './game/rewards_ui'
import {
  setupVipKiosk,
  setupTrophyShowcase,
  setupVictoryCelebration,
  triggerVictoryCelebration,
  setupWearableShowcases
} from './game/models_integration'
import { setupWearablesSystem } from './game/wearables'

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

    // 3.6. Place 3D VIP Kiosk, Showcase Trophy, Victory FX & Wearable Pedestals
    setupVipKiosk(houseEntity)
    setupTrophyShowcase(houseEntity)
    setupVictoryCelebration(houseEntity)
    setupWearableShowcases(houseEntity)
    setupWearablesSystem()

    // 4. Start the Crazy 8 Game Backend
    const gameEngine = new CrazyEightsGame()

    // 5. Setup the Draw Pile, Discard Pile, and clickable Chairs (registers players & bot)!
    setup3DTable(gameEngine, houseEntity)

    // 4.5 Set up Multiplayer Sync (now serializes with players already present)
    setupMultiplayer(gameEngine)
    gameEngine.onStateChanged = () => {
      pushGameState(gameEngine)
    }
    gameEngine.onStateSync = () => {
      update3DTable(gameEngine)
    }

    // Connect gameplay events to the retention & economy quest system
    gameEngine.onCardPlayed = (playerId, card) => {
      const myId = resolvePlayerId(gameEngine)
      if (playerId === myId || playerId === 'player1') {
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
      const myId = resolvePlayerId(gameEngine)
      if (playerId === myId || playerId === 'player1') {
        reportGameplayAction('declare_safe')
      }
    }

    gameEngine.onRoundEnd = (eliminated, winner, scoreBreakdown, roundWinner) => {
      const myId = resolvePlayerId(gameEngine)
      reportGameplayAction('match_finished')

      const winnerName = winner ? getPlayerDisplayName(winner) : ''
      const eliminatedName = eliminated ? getPlayerDisplayName(eliminated) : 'None'
      const roundWinnerName = roundWinner ? getPlayerDisplayName(roundWinner) : ''

      if (winner || roundWinner) {
        triggerVictoryCelebration()
      }

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
        renderOutdoorHallOfFame(winnerName, gameEngine.roundNumber)
        showGameButton('START NEW GAME', 'START')
      } else {
        updateScoreBoardText(`SCOREBOARD\n\n🎉 ${roundWinnerName} WENT OUT! 🎉\n\nRound ${gameEngine.roundNumber} Over!\n\nEliminated: ${eliminatedName}\n\nScores:\n${scoreBreakdown || ''}\n\nWaiting for next round...`)
        renderOutdoorHallOfFame(roundWinnerName, gameEngine.roundNumber)
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