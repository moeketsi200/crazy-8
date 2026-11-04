import { initStorageService } from './storage'

/** @deprecated The game authority now runs on Render; this compatibility entrypoint starts storage only. */
export async function initAuthoritativeServer() {
  initStorageService()
}
