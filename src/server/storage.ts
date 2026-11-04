import { isServer } from '@dcl/sdk/network'
import { setupPersistentPlayerEconomy } from './player_economy'

export function initStorageService() {
  if (!isServer()) return
  setupPersistentPlayerEconomy()
  console.log('[Server] DCL Storage profile service is ready.')
}
