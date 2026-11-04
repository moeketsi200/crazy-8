import { isServer } from '@dcl/sdk/network'
// These modules define the synced component and room schemas before the engine seals.
import './game/multiplayer'
import './shared/messages'

export async function main() {
  if (isServer()) {
    const { initStorageService } = await import('./server/storage')
    initStorageService()
    return
  }

  const { initClientScene } = await import('./client/scene')
  initClientScene()
}
