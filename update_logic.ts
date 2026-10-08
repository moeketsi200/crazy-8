import * as fs from 'fs'

const logicPath = 'src/game/logic.ts'
let content = fs.readFileSync(logicPath, 'utf-8')

// Add round tracking
if (!content.includes('public roundNumber: number = 1')) {
    content = content.replace('public isStarted: boolean = false', 'public isStarted: boolean = false\n  public roundNumber: number = 1')
}

// Add onRoundEnd callback
if (!content.includes('public onRoundEnd')) {
    content = content.replace('public scores: Map<string, number> = new Map()', 'public scores: Map<string, number> = new Map()\n  public onRoundEnd?: (eliminated: string, winner?: string) => void')
}

// Ensure start game only includes NON-eliminated players
content = content.replace(
    'for (const playerId of this.playerOrder) {',
    'const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))\n      for (const playerId of activePlayers) {'
)

// Also filter in the addPlayer logic? No, addPlayer is once per session.
// Update playerOrder.length to activePlayers.length in nextTurn
content = content.replace(
    'const numPlayers = this.playerOrder.length',
    'const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))\n    const numPlayers = activePlayers.length'
)
// Wrap index properly
content = content.replace(
    'this.currentTurnIndex = (this.currentTurnIndex + (steps * this.turnDirection)) % numPlayers',
    'this.currentTurnIndex = (this.currentTurnIndex + (steps * this.turnDirection)) % numPlayers' // same
)
content = content.replace(
    "const currentPlayer = this.playerOrder[this.currentTurnIndex]",
    "const currentPlayer = activePlayers[this.currentTurnIndex]"
)

// In endRound: only score active players
content = content.replace(
    'for (const playerId of this.playerOrder) {',
    'const activePlayers = this.playerOrder.filter(p => !this.eliminatedPlayers.has(p))\n    for (const playerId of activePlayers) {'
)

// Call onRoundEnd
content = content.replace(
    'this.eliminatedPlayers.add(eliminatedPlayer)',
    'this.eliminatedPlayers.add(eliminatedPlayer)\n    \n    const remaining = activePlayers.filter(p => p !== eliminatedPlayer)\n    let winner\n    if (remaining.length === 1) winner = remaining[0]\n    \n    if (this.onRoundEnd) this.onRoundEnd(eliminatedPlayer, winner)'
)

fs.writeFileSync(logicPath, content)
