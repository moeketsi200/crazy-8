import { isServer } from '@dcl/sdk/network'
import { setupPersistentPlayerEconomy } from './player_economy'

export function initStorageService() {
  if (!isServer()) return
  setupPersistentPlayerEconomy()
  console.log('[Server] Player economy service initialized; CRAZY8_STORAGE_BACKEND selects DCL Storage or Render.')
}
