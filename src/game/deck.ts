export type Suit = 'Hearts' | 'Diamonds' | 'Clubs' | 'Spades' | 'None'
export type Action = 'Normal' | 'Skip' | 'Reverse' | 'Draw2' | 'Draw4' | 'Wild'

export interface Card {
  id: string         // e.g., 'Hearts-7', 'Joker-1'
  suit: Suit
  rank: string       // '2', '3', 'J', 'A', 'Joker', etc.
  points: number     // Penalty points for the elimination scoreboard
  action: Action     // The special rule this card triggers
}

export function generateDeck(): Card[] {
  const suits: Suit[] = ['Hearts', 'Diamonds', 'Clubs', 'Spades']
  const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']
  const deck: Card[] = []

  // 1. Generate the standard 52 cards
  for (const suit of suits) {
    for (const rank of ranks) {
      let points = parseInt(rank) || 0
      let action: Action = 'Normal'

      // Assign custom actions and point values based on your exact rules
      switch (rank) {
        case '2':
          action = 'Draw2'
          break
        case '7':
          action = 'Skip'
          break
        case '8':
          action = 'Wild'
          points = 8
          break
        case 'J':
          action = 'Reverse'
          points = 11
          break
        case 'Q':
          points = 12
          break
        case 'K':
          points = 13
          break
        case 'A':
          points = 1
          break
      }

      deck.push({
        id: `${suit}-${rank}`,
        suit: suit,
        rank: rank,
        points: points,
        action: action
      })
    }
  }

  // 2. Add the 2 Jokers (Draw 4)
  for (let i = 1; i <= 2; i++) {
    deck.push({
      id: `Joker-${i}`,
      suit: 'None',
      rank: 'Joker',
      points: 25,
      action: 'Draw4'
    })
  }

  return deck
}

// Standard Fisher-Yates algorithm to randomize the deck perfectly
export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}
