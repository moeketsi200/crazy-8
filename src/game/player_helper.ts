import { getPlayer } from '@dcl/sdk/src/players'

export function getMyPlayerId(): string {
  const p = getPlayer()
  return p && p.userId ? p.userId : 'player1'
}

export function getMyPlayerName(): string {
  const p = getPlayer()
  return p && p.name ? p.name : 'Player 1'
}
