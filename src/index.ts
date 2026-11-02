import { isServer } from '@dcl/sdk/network'
// These modules define the synced component and room schemas before the engine seals.
import './game/multiplayer'
import './shared/messages'

export async function main() {
  if (isServer()) {
    const { initAuthoritativeServer } = await import('./server/leaderboard')
    await initAuthoritativeServer()
    return
  }

  const { initClientScene } = await import('./client/scene')
  initClientScene()
}
