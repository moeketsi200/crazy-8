import { Card, Suit, generateDeck, shuffleDeck } from './deck'

export type PlayerId = string
export type GameMode = 'solo' | 'multiplayer'

export const MAX_GAME_PLAYERS = 8

export function isBotPlayer(playerId: PlayerId): boolean {
  return playerId === 'bot' || playerId.startsWith('bot_')
}

export class CrazyEightsGame {
  public players: Map<PlayerId, Card[]> = new Map()
  public playerOrder: PlayerId[] = []
  public drawPile: Card[] = []
  public discardPile: Card[] = []
  public currentTurnIndex: number = 0
  public activeSuit: Suit | null = null
  public isStarted: boolean = false
  public roundNumber: number = 1
  public gameOver: boolean = false
  public matchOver: boolean = false
  public gameMode: GameMode | 'idle' = 'idle'
  public lobbyHostId: PlayerId = ''
  public gameMasterId: PlayerId = ''

  public turnDirection: number = 1
  public pendingDraws: number = 0
  public eliminatedPlayers: Set<PlayerId> = new Set()
  public scores: Map<PlayerId, number> = new Map()
  public onRoundEnd?: (eliminated: PlayerId, winner?: PlayerId, scoreBreakdown?: string, roundWinner?: PlayerId) => void
  public onCardPlayed?: (playerId: PlayerId, card: Card) => void
  public onDeclareSafe?: (playerId: PlayerId) => void

  public safeDeclared: Set<PlayerId> = new Set()
  public queuedPlayers: PlayerId[] = []
  public lobbyEndTime: number = 0
  public onNotification?: (message: string, senderId?: PlayerId) => void
  public lastNotification?: { id: number, message: string, senderId?: string }
  private lastProcessedNotificationId: number = 0

  public notify(message: string, senderId?: PlayerId) {
    this.lastNotification = { id: Date.now(), message, senderId }
    this.lastProcessedNotificationId = this.lastNotification.id
    if (this.onNotification) {
      this.onNotification(message, senderId)
    }
  }

  public startLobby(seconds: number = 30, hostId: PlayerId = '') {
    const resolvedHostId = hostId || this.playerOrder.find((id) => !isBotPlayer(id)) || ''
    this.players.clear()
    this.playerOrder = []
    this.scores.clear()
    this.eliminatedPlayers.clear()
    this.safeDeclared.clear()
    this.queuedPlayers = []
    this.drawPile = []
    this.discardPile = []
    this.activeSuit = null
    this.pendingDraws = 0
    this.currentTurnIndex = 0
    this.isStarted = false
    this.gameOver = false
    this.matchOver = false
    this.gameMode = 'multiplayer'
    this.lobbyHostId = resolvedHostId
    this.gameMasterId = resolvedHostId
    this.lobbyEndTime = Date.now() + (seconds * 1000)
    if (this.lobbyHostId) {
      this.registerPlayer(this.lobbyHostId)
    } else {
      this.onStateChanged?.()
    }
  }

  public tryJoinLobby(playerId: PlayerId): boolean {
    if (!playerId || this.isStarted || this.gameOver || this.lobbyEndTime <= Date.now()) return false
    if (this.playerOrder.includes(playerId)) return true

    const humanCount = this.playerOrder.filter((id) => !isBotPlayer(id)).length
    if (humanCount >= MAX_GAME_PLAYERS) return false

    this.registerPlayer(playerId)
    return true
  }

  public playerNameResolver?: (playerId: PlayerId) => string

  public getDisplayName(playerId: PlayerId): string {
    if (this.playerNameResolver) {
      return this.playerNameResolver(playerId)
    }
    return playerId
  }

  public getCurrentPlayerId(): PlayerId | undefined {
    const activePlayers = this.playerOrder.filter((playerId) => !this.eliminatedPlayers.has(playerId))
    return activePlayers[this.currentTurnIndex]
  }

  private scheduleBotTurnIfNeeded() {
    const currentPlayer = this.getCurrentPlayerId()
    if (!currentPlayer || !isBotPlayer(currentPlayer) || this.gameOver) return
    if (this.onBotTurnStart) {
      this.onBotTurnStart(currentPlayer)
    } else {
      this.runBotTurn(currentPlayer)
    }
  }

  public onBotTurnStart?: (botId: PlayerId) => void
  public onStateSync?: () => void
  public onStateChanged?: () => void

  public serialize(): string {
    return JSON.stringify({
      players: Array.from(this.players.entries()),
      playerOrder: this.playerOrder,
      drawPile: this.drawPile,
      discardPile: this.discardPile,
      currentTurnIndex: this.currentTurnIndex,
      activeSuit: this.activeSuit,
      isStarted: this.isStarted,
      roundNumber: this.roundNumber,
      gameOver: this.gameOver,
      matchOver: this.matchOver,
      gameMode: this.gameMode,
      lobbyHostId: this.lobbyHostId,
      gameMasterId: this.gameMasterId,
      turnDirection: this.turnDirection,
      pendingDraws: this.pendingDraws,
      eliminatedPlayers: Array.from(this.eliminatedPlayers),
      scores: Array.from(this.scores.entries()),
      safeDeclared: Array.from(this.safeDeclared),
      lastNotification: this.lastNotification,
      lobbyEndTime: this.lobbyEndTime
    })
  }

  public deserialize(json: string) {
    try {
      const state = JSON.parse(json)
      // Guard: do not overwrite active or valid local state with empty uninitialized data
      if (!state || !Array.isArray(state.playerOrder) || state.playerOrder.length === 0) {
        return
      }
      this.players = new Map(state.players)
      this.playerOrder = state.playerOrder
      this.drawPile = state.drawPile
      this.discardPile = state.discardPile
      this.currentTurnIndex = state.currentTurnIndex
      this.activeSuit = state.activeSuit
      this.isStarted = state.isStarted
      this.roundNumber = state.roundNumber
      this.gameOver = state.gameOver
      this.matchOver = !!state.matchOver
      this.gameMode = state.gameMode || 'idle'
      this.lobbyHostId = state.lobbyHostId || ''
      this.gameMasterId = state.gameMasterId || this.lobbyHostId
      this.turnDirection = state.turnDirection
      this.pendingDraws = state.pendingDraws
      this.eliminatedPlayers = new Set(state.eliminatedPlayers)
      this.scores = new Map(state.scores)
      this.safeDeclared = new Set(state.safeDeclared)
      this.lobbyEndTime = state.lobbyEndTime || 0

      if (state.lastNotification && state.lastNotification.id && state.lastNotification.id > this.lastProcessedNotificationId) {
        this.lastProcessedNotificationId = state.lastNotification.id
        this.lastNotification = state.lastNotification
        if (this.onNotification) {
          this.onNotification(state.lastNotification.message, state.lastNotification.senderId)
        }
      }

      if (this.onStateSync) this.onStateSync()
    } catch (e) {
      console.error("Failed to deserialize game state:", e)
    }
  }

  public addPlayer(playerId: PlayerId) {
    if (!this.players.has(playerId)) {
      this.players.set(playerId, [])
      this.playerOrder.push(playerId)
      this.scores.set(playerId, 0)
      this.onStateChanged?.()
    }
  }

  public registerPlayer(playerId: PlayerId) {
    if (!playerId) return
    if (!this.playerOrder.includes(playerId)) {
      this.playerOrder.push(playerId)
    }
    if (!this.players.has(playerId)) {
      this.players.set(playerId, [])
    }
    if (!this.scores.has(playerId)) {
      this.scores.set(playerId, 0)
    }
    this.eliminatedPlayers.delete(playerId)
    this.onStateChanged?.()
  }

  public startGame(humanPlayers: PlayerId[], mode: GameMode, hostId: PlayerId = '') {
    this.lobbyEndTime = 0
    const uniquePlayers = Array.from(new Set(humanPlayers.filter((id) => !!id && !isBotPlayer(id) && id.trim().length > 0)))
      .slice(0, MAX_GAME_PLAYERS)

    this.players.clear()
    this.playerOrder = [...uniquePlayers]
    this.scores.clear()

    if (this.playerOrder.length === 0) {
      this.playerOrder = ['player1']
    }

    for (const playerId of this.playerOrder) {
      this.players.set(playerId, [])
      this.scores.set(playerId, 0)
    }

    for (let botNumber = 1; this.playerOrder.length < MAX_GAME_PLAYERS; botNumber++) {
      const botId = `bot_${botNumber}`
      this.playerOrder.push(botId)
      this.players.set(botId, [])
      this.scores.set(botId, 0)
    }

    this.queuedPlayers = []
    this.gameMode = mode
    this.lobbyHostId = hostId || this.lobbyHostId || this.playerOrder.find((id) => !isBotPlayer(id)) || ''
    this.gameMasterId = this.lobbyHostId
    this.drawPile = shuffleDeck(generateDeck())
    this.discardPile = []
    this.pendingDraws = 0
    this.turnDirection = 1
    this.gameOver = false
    this.matchOver = false
    this.eliminatedPlayers.clear()
    this.safeDeclared.clear()
    
    this.dealInitialCards()
    this.setupInitialDiscard()
    
    this.isStarted = true
    this.currentTurnIndex = 0
    this.roundNumber = 1
    this.onStateChanged?.()
  }

  public reshuffleDiscardIntoDraw() {
    if (this.discardPile.length <= 1) return
    const topCard = this.discardPile.pop()!
    this.drawPile = shuffleDeck(this.discardPile)
    this.discardPile = [topCard]
  }

  public joinActiveGame(playerId: PlayerId) {
    if (!playerId) return
    // Joining is only allowed before the match starts; the lobby owns roster changes.
    if (this.isStarted && !this.gameOver) return
    this.registerPlayer(playerId)
  }

  public joinGame(playerId: PlayerId) {
    this.joinActiveGame(playerId)
  }

  public removePlayer(playerId: PlayerId) {
    if (!playerId) return
    this.queuedPlayers = this.queuedPlayers.filter(p => p !== playerId)

    const wasLobbyHost = !this.isStarted && this.lobbyEndTime > 0 && this.lobbyHostId === playerId
    if (this.players.has(playerId)) {
      this.eliminatedPlayers.add(playerId)
      this.players.delete(playerId)
      const orderIdx = this.playerOrder.indexOf(playerId)
      if (orderIdx !== -1) {
        this.playerOrder.splice(orderIdx, 1)
      }

      if (wasLobbyHost) {
        this.lobbyHostId = this.playerOrder.find((id) => !isBotPlayer(id)) || ''
        if (!this.lobbyHostId) {
          this.lobbyEndTime = 0
          this.gameMode = 'idle'
        }
      }

      if (this.gameMasterId === playerId) {
        this.gameMasterId = this.playerOrder.find((id) => !isBotPlayer(id)) || ''
      }

      const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
      if (activePlayers.length <= 1 && this.isStarted && !this.gameOver) {
        const winner = activePlayers[0] || 'bot'
        this.gameOver = true
        this.matchOver = true
        this.isStarted = false
        const winnerName = this.getDisplayName(winner)
        this.onRoundEnd?.(playerId, winner, `${winnerName} wins!`, winner)
      } else if (this.isStarted && activePlayers.length > 0) {
        this.currentTurnIndex = this.currentTurnIndex % activePlayers.length
        const current = activePlayers[this.currentTurnIndex]
        if (isBotPlayer(current)) {
          if (this.onBotTurnStart) {
            this.onBotTurnStart(current)
          } else {
            this.runBotTurn(current)
          }
        }
      }
      this.onStateChanged?.()
    }
  }

  public startNextRound() {
    if (this.matchOver) return
    // Add any queued players who joined mid-game into the active player roster!
    if (this.queuedPlayers.length > 0) {
      for (const qp of this.queuedPlayers) {
        if (!this.playerOrder.includes(qp)) {
          this.addPlayer(qp)
        }
      }
      this.queuedPlayers = []
    }

    const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
    if (activePlayers.length < 2) return

    this.drawPile = shuffleDeck(generateDeck())
    this.discardPile = []
    this.pendingDraws = 0
    this.turnDirection = 1
    this.gameOver = false
    this.safeDeclared.clear()
    
    // Clear hands
    for (const playerId of activePlayers) {
      this.players.set(playerId, [])
    }
    
    this.dealInitialCards()
    this.setupInitialDiscard()
    
    this.isStarted = true
    this.currentTurnIndex = 0
    this.roundNumber++
    this.onStateChanged?.()
    this.scheduleBotTurnIfNeeded()
  }

  private dealInitialCards() {
    const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
    if (activePlayers.length === 0) return
    const cardsPerPlayer = Math.min(8, Math.floor((this.drawPile.length - 1) / activePlayers.length))
    for (let cardNumber = 0; cardNumber < cardsPerPlayer; cardNumber++) {
      for (const playerId of activePlayers) {
        const hand = this.players.get(playerId)!
        hand.push(this.drawPile.pop()!)
      }
    }
  }

  private setupInitialDiscard() {
    const normalCardIndex = this.drawPile.findIndex((card) => card.action === 'Normal')
    const startingCard = normalCardIndex === -1
      ? this.drawPile.pop()!
      : this.drawPile.splice(normalCardIndex, 1)[0]
    this.discardPile.push(startingCard)
    this.activeSuit = startingCard.suit
  }

  public getTopDiscard(): Card {
    return this.discardPile[this.discardPile.length - 1]
  }

  public declareLowCards(playerId: PlayerId): boolean {
    const hand = this.players.get(playerId)
    if (this.isHandVulnerable(hand)) {
      this.safeDeclared.add(playerId)
      if (this.onDeclareSafe) this.onDeclareSafe(playerId)
      const count = hand!.length
      const cardStr = count === 1 ? '1 card' : `${count} cards`
      const displayName = this.getDisplayName(playerId).toUpperCase()
      this.notify(`${displayName} declares: "I have ${cardStr} left!"`, playerId)
      this.onStateChanged?.()
      return true
    }
    return false
  }

  private isHandVulnerable(hand: Card[] | undefined): boolean {
    return !!(hand && hand.length > 0 && hand.length <= 3)
  }

  public challengePlayer(challengerId: PlayerId, targetId: PlayerId): boolean {
    if (this.gameOver) return false
    const targetHand = this.players.get(targetId)
    if (!targetHand) return false

    const challengerName = this.getDisplayName(challengerId).toUpperCase()
    const targetName = this.getDisplayName(targetId).toUpperCase()

    if (this.isHandVulnerable(targetHand) && !this.safeDeclared.has(targetId)) {
      this.drawOne(targetId)
      this.drawOne(targetId)
      this.notify(`🚨 CAUGHT! ${challengerName} caught ${targetName} failing to declare! 2 Penalty Cards!`, challengerId)
      this.onStateChanged?.()
      return true
    } else {
      this.notify(`❌ False alarm! ${targetName} is safe.`, challengerId)
      this.onStateChanged?.()
      return false
    }
  }

  public isValidPlay(card: Card, playerId?: PlayerId): boolean {
    const hand = playerId ? this.players.get(playerId) : undefined
    if (hand && hand.length === 1 && card.action !== 'Normal') return false
    const topCard = this.getTopDiscard()
    if (this.pendingDraws > 0) {
      return this.isValidPlayDuringDrawPenalty(card, topCard)
    }
    return this.isValidPlayNormal(card, topCard)
  }

  private isValidPlayDuringDrawPenalty(card: Card, topCard: Card): boolean {
    // Bidirectional penalty stacking:
    // When facing a draw penalty (from a Joker or a 2):
    // - Any 2 (of any suit) can be played (+2 added to penalty pile)
    // - Any Joker (Draw4) can be played (+4 added to penalty pile)
    if (card.action === 'Draw2' || card.action === 'Draw4') {
      return true
    }
    return false
  }

  private isValidPlayNormal(card: Card, topCard: Card): boolean {
    if (card.action === 'Draw4' || card.action === 'Wild') return true
    return card.suit === this.activeSuit || card.rank === topCard.rank
  }

  private canPlayCard(playerId: PlayerId, cardToPlay?: Card): boolean {
    if (this.getCurrentPlayerId() !== playerId) return false
    if (this.gameOver) return false
    if (!cardToPlay) return false
    if (!this.isValidPlay(cardToPlay, playerId)) return false
    return true
  }

  public playCard(playerId: PlayerId, cardIndex: number, newSuitForWild?: Suit): boolean {
    const hand = this.players.get(playerId)
    if (!hand) return false
    const cardToPlay = hand[cardIndex]

    if (!this.canPlayCard(playerId, cardToPlay)) return false

    hand.splice(cardIndex, 1)
    this.discardPile.push(cardToPlay)
    this.safeDeclared.delete(playerId)

    if (this.onCardPlayed) {
      this.onCardPlayed(playerId, cardToPlay)
    }

    this.handleSuitChange(cardToPlay, newSuitForWild, playerId)
    const skipNext = this.handleActionCardEffects(cardToPlay, playerId)

    if (hand.length === 0) {
      this.endRound(playerId)
    } else {
      this.nextTurn(skipNext ? 2 : 1)
    }

    this.onStateChanged?.()
    return true
  }

  private handleSuitChange(cardToPlay: Card, newSuitForWild: Suit | undefined, playerId: PlayerId) {
    if (cardToPlay.action === 'Wild' || cardToPlay.action === 'Draw4') {
      this.activeSuit = newSuitForWild || 'Spades'
      const name = this.getDisplayName(playerId).toUpperCase()
      this.notify(`${name} changed the suit to ${this.activeSuit.toUpperCase()}!`, playerId)
    } else {
      this.activeSuit = cardToPlay.suit
    }
  }

  private handleActionCardEffects(cardToPlay: Card, playerId?: PlayerId): boolean {
    let skipNext = false
    if (cardToPlay.action === 'Draw2' || cardToPlay.action === 'Draw4') {
      const added = cardToPlay.action === 'Draw4' ? 4 : 2
      const wasPending = this.pendingDraws
      this.pendingDraws += added
      if (wasPending > 0) {
        this.notify(`🔥 PENALTY STACKED! Draw pool is now +${this.pendingDraws} cards!`, playerId)
      } else {
        this.notify(`⚡ ${cardToPlay.rank} played! Counter with a 2 or Joker, or draw +${this.pendingDraws}!`, playerId)
      }
    } else if (cardToPlay.action === 'Reverse') {
      const activePlayersCount = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p)).length
      if (activePlayersCount === 2) {
        skipNext = true
      } else {
        this.turnDirection *= -1
      }
    } else if (cardToPlay.action === 'Skip') {
      skipNext = true
    }
    return skipNext
  }

  public drawCard(playerId: PlayerId): boolean {
    if (this.getCurrentPlayerId() !== playerId || this.gameOver) return false

    this.safeDeclared.delete(playerId)

    if (this.pendingDraws > 0) {
      const count = this.pendingDraws
      for (let i = 0; i < count; i++) {
        this.drawOne(playerId)
      }
      this.pendingDraws = 0
      const name = this.getDisplayName(playerId).toUpperCase()
      this.notify(`💥 ${name} drew ${count} penalty cards!`, playerId)
      this.nextTurn(1)
      this.onStateChanged?.()
      return true
    }

    this.drawOne(playerId)
    this.nextTurn(1)
    this.onStateChanged?.()
    return true
  }

  private drawOne(playerId: PlayerId) {
    if (this.drawPile.length === 0) {
      this.reshuffleDiscardIntoDraw()
    }
    
    if (this.drawPile.length > 0) {
      const hand = this.players.get(playerId)
      if (hand) {
        hand.push(this.drawPile.pop()!)
      }
    }
  }

  private nextTurn(steps: number) {
    const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
    const numPlayers = activePlayers.length
    
    this.currentTurnIndex = (this.currentTurnIndex + (steps * this.turnDirection)) % numPlayers
    if (this.currentTurnIndex < 0) {
      this.currentTurnIndex += numPlayers
    }

    this.scheduleBotTurnIfNeeded()
  }

  private botTryChallenge(botId: PlayerId) {
    for (const pId of this.playerOrder) {
      if (!isBotPlayer(pId) && !this.eliminatedPlayers.has(pId)) {
        const pHand = this.players.get(pId)
        if (this.isHandVulnerable(pHand) && !this.safeDeclared.has(pId)) {
          if (Math.random() <= 0.6) {
            this.challengePlayer(botId, pId)
            break
          }
        }
      }
    }
  }

  private botPlayOrDraw(botId: PlayerId, hand: Card[]) {
    const playableIndex = hand.findIndex(c => this.isValidPlay(c, botId))

    if (playableIndex !== -1) {
      const playedCard = hand[playableIndex]
      let chosenSuit: Suit = 'Spades'
      if (playedCard.action === 'Wild' || playedCard.action === 'Draw4') {
        const suitsInHand = hand.filter(c => c.suit !== 'None').map(c => c.suit)
        if (suitsInHand.length > 0) {
          chosenSuit = suitsInHand[0]
        }
      }
      this.playCard(botId, playableIndex, chosenSuit)
    } else {
      this.drawCard(botId)
    }
  }

  private botTryDeclare(botId: PlayerId) {
    const newHand = this.players.get(botId)
    if (this.isHandVulnerable(newHand) && !this.safeDeclared.has(botId)) {
      if (Math.random() <= 0.7) {
        this.declareLowCards(botId)
      }
    }
  }

  public runBotTurn(botId: PlayerId = 'bot') {
    const hand = this.players.get(botId)
    if (!hand || !isBotPlayer(botId) || this.getCurrentPlayerId() !== botId || this.gameOver) return
    this.botTryChallenge(botId)
    this.botPlayOrDraw(botId, hand)
    this.botTryDeclare(botId)
  }

  private calculateScores(): { highestScore: number, eliminatedPlayer: PlayerId, scoreBreakdown: string } {
    let highestScore = -1
    let eliminatedPlayer: PlayerId = ''
    let breakdownLines: string[] = []

    const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
    for (const playerId of activePlayers) {
      const hand = this.players.get(playerId)!
      const score = hand.reduce((sum, card) => sum + card.points, 0)
      this.scores.set(playerId, score)
      const name = this.getDisplayName(playerId).toUpperCase()
      breakdownLines.push(`${name}: ${score} pts`)

      if (score > highestScore) {
        highestScore = score
        eliminatedPlayer = playerId
      }
    }

    return { highestScore, eliminatedPlayer, scoreBreakdown: breakdownLines.join('\n') }
  }

  private endRound(roundWinnerId: PlayerId) {
    this.gameOver = true
    
    const { highestScore, eliminatedPlayer, scoreBreakdown } = this.calculateScores()

    console.log(`Game Over! Highest score: ${eliminatedPlayer} with ${highestScore} points. They are eliminated!`)
    this.eliminatedPlayers.add(eliminatedPlayer)
    
    const remaining = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
    let winner = remaining.length === 1 ? remaining[0] : undefined
    this.matchOver = !!winner
    
    const roundWinnerName = this.getDisplayName(roundWinnerId).toUpperCase()
    const eliminatedName = this.getDisplayName(eliminatedPlayer).toUpperCase()
    if (winner) {
      const winnerName = this.getDisplayName(winner).toUpperCase()
      this.notify(`🏆 GAME OVER! ${winnerName} WINS THE WHOLE GAME! 🏆`, winner)
    } else {
      this.notify(`🎉 ${roundWinnerName} WENT OUT! 🚨 ${eliminatedName} ELIMINATED!`, roundWinnerId)
    }

    if (this.onRoundEnd) {
      this.onRoundEnd(eliminatedPlayer, winner, scoreBreakdown, roundWinnerId)
    }
  }
}
