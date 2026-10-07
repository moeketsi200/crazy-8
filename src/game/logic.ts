import { Card, Suit, generateDeck, shuffleDeck, Action } from './deck'

export class CrazyEightsGame {
  public players: Map<string, Card[]> = new Map()
  public playerOrder: string[] = []
  public drawPile: Card[] = []
  public discardPile: Card[] = []
  public currentTurnIndex: number = 0
  public activeSuit: Suit | null = null
  public isStarted: boolean = false
  public gameOver: boolean = false

  // New state machine rules
  public turnDirection: number = 1 // 1 for clockwise, -1 for counter-clockwise
  public pendingDraws: number = 0
  public eliminatedPlayers: Set<string> = new Set()
  public scores: Map<string, number> = new Map()

  public addPlayer(playerId: string) {
    if (!this.isStarted && !this.players.has(playerId)) {
      this.players.set(playerId, [])
      this.playerOrder.push(playerId)
      this.scores.set(playerId, 0)
    }
  }

  public startGame() {
    if (this.playerOrder.length < 2) {
      console.log("Need at least 2 players to start!")
      return
    }

    this.drawPile = shuffleDeck(generateDeck())
    this.discardPile = []
    this.pendingDraws = 0
    this.turnDirection = 1
    this.gameOver = false
    this.eliminatedPlayers.clear()
    
    // Deal 8 cards to each player (Oasis Rules)
    for (let i = 0; i < 8; i++) {
      for (const playerId of this.playerOrder) {
        const hand = this.players.get(playerId)!
        hand.push(this.drawPile.pop()!)
      }
    }

    // Flip first card to discard pile
    let startingCard = this.drawPile.pop()!
    
    // If the starting card is an action card or Joker, keep burying it
    while (startingCard.action !== 'Normal') {
      this.drawPile.unshift(startingCard)
      startingCard = this.drawPile.pop()!
    }
    
    this.discardPile.push(startingCard)
    this.activeSuit = startingCard.suit
    this.isStarted = true
    this.currentTurnIndex = 0
  }

  public getTopDiscard(): Card {
    return this.discardPile[this.discardPile.length - 1]
  }

  public isValidPlay(card: Card): boolean {
    const topCard = this.getTopDiscard()
    
    // If there are pending draws, you MUST play a matching draw card, or draw
    if (this.pendingDraws > 0) {
      // You can stack Draw2 on Draw2, or Draw4 on Draw4.
      if (topCard.action === 'Draw4' && card.action === 'Draw4') return true
      if (topCard.action === 'Draw2' && card.action === 'Draw2') return true
      return false // Cannot play anything else
    }

    // A Joker (Draw4) can be played on anything
    if (card.action === 'Draw4') return true

    // An 8 (Wild) can be played on anything (except if there are pending draws, handled above)
    if (card.action === 'Wild') return true
    
    // Otherwise, must match the current active suit or the rank of the top card
    return card.suit === this.activeSuit || card.rank === topCard.rank
  }

  public playCard(playerId: string, cardIndex: number, newSuitForWild?: Suit): boolean {
    if (this.playerOrder[this.currentTurnIndex] !== playerId) return false
    if (this.gameOver) return false

    const hand = this.players.get(playerId)!
    const cardToPlay = hand[cardIndex]

    if (!cardToPlay || !this.isValidPlay(cardToPlay)) return false

    // Remove from hand and add to discard
    hand.splice(cardIndex, 1)
    this.discardPile.push(cardToPlay)

    // Handle Active Suit changes
    if (cardToPlay.action === 'Wild') {
      this.activeSuit = newSuitForWild || cardToPlay.suit 
    } else if (cardToPlay.action !== 'Draw4') {
      this.activeSuit = cardToPlay.suit
    }

    // Handle Action Cards
    let skipNext = false
    if (cardToPlay.action === 'Draw2') {
      this.pendingDraws += 2
    } else if (cardToPlay.action === 'Draw4') {
      this.pendingDraws += 4
    } else if (cardToPlay.action === 'Reverse') {
      this.turnDirection *= -1
    } else if (cardToPlay.action === 'Skip') {
      skipNext = true
    }

    // Check for Win
    if (hand.length === 0) {
      this.endRound()
      return true
    }

    this.nextTurn(skipNext ? 2 : 1)
    return true
  }

  public drawCard(playerId: string): boolean {
    if (this.playerOrder[this.currentTurnIndex] !== playerId) return false
    if (this.gameOver) return false

    // If there are pending draws, take them ALL and end turn
    if (this.pendingDraws > 0) {
      for (let i = 0; i < this.pendingDraws; i++) {
        this.drawOne(playerId)
      }
      this.pendingDraws = 0
      this.nextTurn(1)
      return true
    }

    // Normal draw
    this.drawOne(playerId)
    this.nextTurn(1)
    return true
  }

  private drawOne(playerId: string) {
    // Reshuffle discard if draw pile is empty
    if (this.drawPile.length === 0) {
      if (this.discardPile.length <= 1) return // No cards left
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
    const numPlayers = this.playerOrder.length
    // Advance index by (steps * direction), wrapping around safely with modulo
    this.currentTurnIndex = (this.currentTurnIndex + (steps * this.turnDirection)) % numPlayers
    if (this.currentTurnIndex < 0) {
      this.currentTurnIndex += numPlayers
    }

    // Simple Bot AI!
    const currentPlayer = this.playerOrder[this.currentTurnIndex]
    if (currentPlayer === 'bot' && !this.gameOver) {
      this.runBotTurn()
    }
  }

  private runBotTurn() {
    const hand = this.players.get('bot')!
    
    // Find a playable card
    let playableIndex = -1
    for (let i = 0; i < hand.length; i++) {
      if (this.isValidPlay(hand[i])) {
        playableIndex = i
        break
      }
    }

    if (playableIndex !== -1) {
      // Play it!
      const playedCard = hand[playableIndex]
      // Bot picks a random suit for Wilds and Jokers based on its hand
      let chosenSuit: Suit = 'Spades'
      if (playedCard.action === 'Wild' || playedCard.action === 'Draw4') {
        const suitsInHand = hand.filter(c => c.suit !== 'None').map(c => c.suit)
        if (suitsInHand.length > 0) {
          chosenSuit = suitsInHand[0] // pick the first available suit it has
        }
      }
      
      this.playCard('bot', playableIndex, chosenSuit)
    } else {
      // Draw 
      this.drawCard('bot')
    }
  }

  private endRound() {
    this.gameOver = true
    
    // Calculate scores
    let highestScore = -1
    let eliminatedPlayer = ''

    for (const playerId of this.playerOrder) {
      const hand = this.players.get(playerId)!
      let score = 0
      for (const card of hand) {
        score += card.points
      }
      this.scores.set(playerId, score)

      if (score > highestScore) {
        highestScore = score
        eliminatedPlayer = playerId
      }
    }

    console.log(`Game Over! Highest score: ${eliminatedPlayer} with ${highestScore} points. They are eliminated!`)
    this.eliminatedPlayers.add(eliminatedPlayer)
  }
}
