import { engine, Transform, Entity } from '@dcl/sdk/ecs'
import { Vector3, Quaternion } from '@dcl/sdk/math'
import { CrazyEightsGame, RoundResult } from './game/logic'
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
import { buildScoreBoard, updateScoreBoardText, renderOutdoorHallOfFame } from './game/score_board'
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
    setupWearableShowcases()
    setupWearablesSystem()

    // 4. Start the Crazy 8 Game Backend
    const gameEngine = new CrazyEightsGame()
    let lastHandledRoundResultId = 0
    let autoContinueAt = 0
    renderOutdoorHallOfFame(gameEngine)

    // 5. Setup the Draw Pile, Discard Pile, and clickable Chairs (registers players & bot)!
    setup3DTable(gameEngine, houseEntity)

    // 4.5 Set up Multiplayer Sync (now serializes with players already present)
    setupMultiplayer(gameEngine)
    gameEngine.onStateChanged = () => {
      pushGameState(gameEngine)
    }
    gameEngine.onStateSync = () => {
      update3DTable(gameEngine)
      const result = gameEngine.lastRoundResult
      if (result && result.id > lastHandledRoundResultId) {
        lastHandledRoundResultId = result.id
        showRoundResult(result, true)
      }
    }

    const showRoundResult = (result: RoundResult, grantLocalRewards: boolean) => {
      const myId = resolvePlayerId(gameEngine)
      const winnerName = result.winner ? getPlayerDisplayName(result.winner) : ''
      const eliminatedName = result.eliminated ? getPlayerDisplayName(result.eliminated) : 'Unknown'
      const roundWinnerName = result.roundWinner ? getPlayerDisplayName(result.roundWinner) : 'No round winner'
      const isSolo = result.gameMode === 'solo'
      const isWatchingSolo = isSolo && !result.winner && gameEngine.eliminatedPlayers.has(myId)

      if (result.winner || result.roundWinner) triggerVictoryCelebration()

      if (grantLocalRewards && gameEngine.playerOrder.includes(myId)) {
        reportGameplayAction('match_finished')
        if (result.roundWinner === myId) reportGameplayAction('round_won')
        if (result.winner === myId) {
          reportGameplayAction('match_won')
          if (isSolo) reportGameplayAction('solo_won')
          const chips = isSolo ? 30 : 150
          const trophies = isSolo ? 5 : 20
          addChips(chips)
          addTrophies(trophies)
          showRewardToast(isSolo
            ? `🏆 YOU BEAT THE BOTS! +${chips} Chips & +${trophies} Trophies!`
            : `🏆 MATCH WON! +${chips} Chips & +${trophies} Trophies!`)
        } else {
          addChips(30)
          addTrophies(5)
          showRewardToast(result.roundWinner === myId
            ? 'Round won! +30 Chips & +5 Trophies.'
            : 'Good game! +30 Chips & +5 Trophies.')
        }
      }

      const scoreLines = result.scoreBreakdown ? `\n\nROUND SCORES\n${result.scoreBreakdown}` : ''
      if (result.winner) {
        const headline = isSolo && result.winner === myId
          ? '🏆 YOU BEAT THE BOTS!'
          : `🏆 OVERALL WINNER: ${winnerName.toUpperCase()}`
        updateScoreBoardText(`MATCH COMPLETE\n\n${headline}\n\nRound ${result.roundNumber} finished.\nLast eliminated: ${eliminatedName}${scoreLines}`)
        showGameButton('START NEW GAME', 'START')
        autoContinueAt = 0
      } else if (isWatchingSolo) {
        updateScoreBoardText(`YOU ARE OUT — MATCH STILL IN PROGRESS\n\nRound ${result.roundNumber} complete.\nRound winner: ${roundWinnerName}\nYou were eliminated. The bots will finish the remaining rounds; the overall winner will appear here.${scoreLines}`)
        showGameButton('BOTS FINISHING THE MATCH', 'WAITING')
        if (gameEngine.gameMasterId === myId) autoContinueAt = Date.now() + 2500
      } else {
        updateScoreBoardText(`ROUND ${result.roundNumber} COMPLETE\n\nRound winner: ${roundWinnerName}\nEliminated: ${eliminatedName}\nThe match continues. Choose Continue for the next round.${scoreLines}`)
        showGameButton('CONTINUE\n(NEXT ROUND)', 'CONTINUE')
      }

      renderOutdoorHallOfFame(gameEngine)
    }

    gameEngine.onRoundEnd = (eliminated, winner, scoreBreakdown, roundWinner) => {
      // The result is recorded in the synchronized game state before this callback.
      const result = gameEngine.lastRoundResult || {
        id: lastHandledRoundResultId + 1,
        roundNumber: gameEngine.roundNumber,
        eliminated,
        winner,
        roundWinner,
        scoreBreakdown: scoreBreakdown || '',
        gameMode: gameEngine.gameMode
      }
      lastHandledRoundResultId = result.id
      showRoundResult(result, true)
    }

    engine.addSystem(() => {
      const myId = resolvePlayerId(gameEngine)
      if (gameEngine.gameMasterId === myId && gameEngine.applyTurnTimeout()) {
        update3DTable(gameEngine)
      }

      if (!autoContinueAt || Date.now() < autoContinueAt) return
      autoContinueAt = 0
      if (gameEngine.gameMasterId !== myId || gameEngine.gameMode !== 'solo' ||
          !gameEngine.gameOver || gameEngine.matchOver || !gameEngine.eliminatedPlayers.has(myId)) return
      gameEngine.startNextRound()
      if (!gameEngine.isStarted) return
      update3DTable(gameEngine)
      updateScoreBoardText(`SOLO MATCH — ROUND ${gameEngine.roundNumber}\n\nYou are eliminated and watching. The bots are playing the remaining rounds.\nThe overall winner will appear here.`)
    })

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

    // Set up the Rules Board and 3D Start Button
    buildInfoBoard(houseEntity, gameEngine)

    // Set up the 2D UI for the player's hand!
    setupUI(gameEngine)

    // 6. Spawn the automatic sliding doors
    setupDoors(houseEntity)
}
