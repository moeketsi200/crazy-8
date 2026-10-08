import { Card, Suit, generateDeck, shuffleDeck } from './deck'

export type PlayerId = string

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

  public turnDirection: number = 1
  public pendingDraws: number = 0
  public eliminatedPlayers: Set<PlayerId> = new Set()
  public scores: Map<PlayerId, number> = new Map()
  public onRoundEnd?: (eliminated: PlayerId, winner?: PlayerId, scoreBreakdown?: string, roundWinner?: PlayerId) => void

  public safeDeclared: Set<PlayerId> = new Set()
  public onNotification?: (message: string) => void
  public onBotTurnStart?: () => void

  public addPlayer(playerId: PlayerId) {
    if (!this.isStarted && !this.players.has(playerId)) {
      this.players.set(playerId, [])
      this.playerOrder.push(playerId)
      this.scores.set(playerId, 0)
    }
  }

  public startGame() {
    if (this.playerOrder.length < 2) return

    this.drawPile = shuffleDeck(generateDeck())
    this.discardPile = []
    this.pendingDraws = 0
    this.turnDirection = 1
    this.gameOver = false
    this.eliminatedPlayers.clear()
    this.safeDeclared.clear()
    
    this.dealInitialCards()
    this.setupInitialDiscard()
    
    this.isStarted = true
    this.currentTurnIndex = 0
  }

  private dealInitialCards() {
    for (let i = 0; i < 8; i++) {
      const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
      for (const playerId of activePlayers) {
        const hand = this.players.get(playerId)!
        hand.push(this.drawPile.pop()!)
      }
    }
  }

  private setupInitialDiscard() {
    let startingCard = this.drawPile.pop()!
    while (startingCard.action !== 'Normal') {
      this.drawPile.unshift(startingCard)
      startingCard = this.drawPile.pop()!
    }
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
      if (this.onNotification) this.onNotification(`${playerId.toUpperCase()} declares: "I have ${hand!.length} card(s) left!"`)
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

    if (this.isHandVulnerable(targetHand) && !this.safeDeclared.has(targetId)) {
      this.drawOne(targetId)
      this.drawOne(targetId)
      if (this.onNotification) this.onNotification(`🚨 CAUGHT! ${challengerId} caught ${targetId} failing to declare! 2 Penalty Cards!`)
      return true
    } else {
      if (this.onNotification) this.onNotification(`❌ False alarm! ${targetId} is safe.`)
      return false
    }
  }

  public isValidPlay(card: Card): boolean {
    const topCard = this.getTopDiscard()
    if (this.pendingDraws > 0) {
      return this.isValidPlayDuringDrawPenalty(card, topCard)
    }
    return this.isValidPlayNormal(card, topCard)
  }

  private isValidPlayDuringDrawPenalty(card: Card, topCard: Card): boolean {
    if (topCard.action === 'Draw4' && card.action === 'Draw4') return true
    if (topCard.action === 'Draw2' && card.action === 'Draw2') return true
    return false
  }

  private isValidPlayNormal(card: Card, topCard: Card): boolean {
    if (card.action === 'Draw4' || card.action === 'Wild') return true
    return card.suit === this.activeSuit || card.rank === topCard.rank
  }

  private canPlayCard(playerId: PlayerId, cardToPlay?: Card): boolean {
    if (this.playerOrder[this.currentTurnIndex] !== playerId) return false
    if (this.gameOver) return false
    if (!cardToPlay) return false
    if (!this.isValidPlay(cardToPlay)) return false
    return true
  }

  public playCard(playerId: PlayerId, cardIndex: number, newSuitForWild?: Suit): boolean {
    const hand = this.players.get(playerId)!
    const cardToPlay = hand[cardIndex]

    if (!this.canPlayCard(playerId, cardToPlay)) return false

    hand.splice(cardIndex, 1)
    this.discardPile.push(cardToPlay)
    this.safeDeclared.delete(playerId)

    this.handleSuitChange(cardToPlay, newSuitForWild, playerId)
    const skipNext = this.handleActionCardEffects(cardToPlay)

    if (hand.length === 0) {
      this.endRound(playerId)
    } else {
      this.nextTurn(skipNext ? 2 : 1)
    }

    return true
  }

  private handleSuitChange(cardToPlay: Card, newSuitForWild: Suit | undefined, playerId: PlayerId) {
    if (cardToPlay.action === 'Wild' || cardToPlay.action === 'Draw4') {
      this.activeSuit = newSuitForWild || 'Spades'
      if (this.onNotification) {
        this.onNotification(`${playerId.toUpperCase()} changed the suit to ${this.activeSuit.toUpperCase()}!`)
      }
    } else {
      this.activeSuit = cardToPlay.suit
    }
  }

  private handleActionCardEffects(cardToPlay: Card): boolean {
    let skipNext = false
    if (cardToPlay.action === 'Draw2') {
      this.pendingDraws += 2
    } else if (cardToPlay.action === 'Draw4') {
      this.pendingDraws += 4
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
    if (this.playerOrder[this.currentTurnIndex] !== playerId || this.gameOver) return false

    this.safeDeclared.delete(playerId)

    if (this.pendingDraws > 0) {
      for (let i = 0; i < this.pendingDraws; i++) {
        this.drawOne(playerId)
      }
      this.pendingDraws = 0
      this.nextTurn(1)
      return true
    }

    this.drawOne(playerId)
    this.nextTurn(1)
    return true
  }

  private drawOne(playerId: PlayerId) {
    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) return
      const topCard = this.discardPile.pop()!
      this.drawPile = shuffleDeck(this.discardPile)
      this.discardPile = [topCard]
    }
    
    if (this.drawPile.length > 0) {
      const hand = this.players.get(playerId)!
      hand.push(this.drawPile.pop()!)
    }
  }

  private nextTurn(steps: number) {
    const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))
    const numPlayers = activePlayers.length
    
    this.currentTurnIndex = (this.currentTurnIndex + (steps * this.turnDirection)) % numPlayers
    if (this.currentTurnIndex < 0) {
      this.currentTurnIndex += numPlayers
    }

    const currentPlayer = activePlayers[this.currentTurnIndex]
    if (currentPlayer === 'bot' && !this.gameOver) {
      if (this.onBotTurnStart) {
        this.onBotTurnStart()
      } else {
        this.runBotTurn()
      }
    }
  }

  private botTryChallenge() {
    const humanHand = this.players.get('player1')
    if (this.isHandVulnerable(humanHand) && !this.safeDeclared.has('player1')) {
      if (Math.random() <= 0.6) {
        this.challengePlayer('bot', 'player1')
      }
    }
  }

  private botPlayOrDraw(hand: Card[]) {
    const playableIndex = hand.findIndex(c => this.isValidPlay(c))

    if (playableIndex !== -1) {
      const playedCard = hand[playableIndex]
      let chosenSuit: Suit = 'Spades'
      if (playedCard.action === 'Wild' || playedCard.action === 'Draw4') {
        const suitsInHand = hand.filter(c => c.suit !== 'None').map(c => c.suit)
        if (suitsInHand.length > 0) {
          chosenSuit = suitsInHand[0]
        }
      }
      this.playCard('bot', playableIndex, chosenSuit)
    } else {
      this.drawCard('bot')
    }
  }

  private botTryDeclare() {
    const newHand = this.players.get('bot')!
    if (this.isHandVulnerable(newHand) && !this.safeDeclared.has('bot')) {
      if (Math.random() <= 0.7) {
        this.declareLowCards('bot')
      }
    }
  }

  public runBotTurn() {
    const hand = this.players.get('bot')!
    this.botTryChallenge()
    this.botPlayOrDraw(hand)
    this.botTryDeclare()
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
      breakdownLines.push(`${playerId.toUpperCase()}: ${score} pts`)

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
    
    if (this.onNotification) {
      if (winner) {
        this.onNotification(`🏆 GAME OVER! ${winner.toUpperCase()} WINS THE WHOLE GAME! 🏆`)
      } else {
        this.onNotification(`🎉 ${roundWinnerId.toUpperCase()} WENT OUT! 🚨 ${eliminatedPlayer.toUpperCase()} ELIMINATED!`)
      }
    }

    if (this.onRoundEnd) {
      this.onRoundEnd(eliminatedPlayer, winner, scoreBreakdown, roundWinnerId)
    }
  }
}
