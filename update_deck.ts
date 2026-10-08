import * as fs from 'fs'

const deckPath = 'src/game/deck.ts'
let content = fs.readFileSync(deckPath, 'utf-8')

content = content.replace("case '8':\n          action = 'Wild'\n          points = 12\n          break", "case '8':\n          action = 'Wild'\n          points = 8\n          break")
content = content.replace("case 'A':\n          points = 11\n          break", "case 'A':\n          points = 1\n          break")
content = content.replace("points: 20,\n      action: 'Draw4'", "points: 25,\n      action: 'Draw4'")

fs.writeFileSync(deckPath, content)
