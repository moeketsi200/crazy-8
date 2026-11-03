import { engine } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import { sceneRoom } from '../shared/messages'
import { setProfileFromServer } from './economy'
import type { EconomyActionResult, EconomyRequestAction } from './economy'

const LOAD_RETRY_MS = 2_500
const REQUEST_TIMEOUT_MS = 20_000

interface PendingRequest {
  resolve: (result: EconomyActionResult) => void
  deadline: number
}

let isSetup = false
let nextRequestId = Date.now()
let lastLoadRequestAt = 0
let profileLoaded = false
const pendingRequests = new Map<number, PendingRequest>()

function sendRequest(requestId: number, action: EconomyRequestAction, itemId = '', questId = '') {
  void sceneRoom.send('economyAction', { requestId, action, itemId, questId }).catch((error) => {
    console.error('[Economy] Could not send profile request:', error)
  })
}

export function setupEconomyClient() {
  if (isServer() || isSetup) return
  isSetup = true

  sceneRoom.onMessage('economyProfile', (data) => {
    if (data.profileJson) {
      try {
        setProfileFromServer(JSON.parse(data.profileJson))
        if (data.success) profileLoaded = true
      } catch (error) {
        console.error('[Economy] Could not read the saved player profile:', error)
      }
    }

    if (data.requestId <= 0) return
    const pending = pendingRequests.get(data.requestId)
    if (!pending) return
    pendingRequests.delete(data.requestId)

    let result: unknown
    try {
      result = data.resultJson ? JSON.parse(data.resultJson) : undefined
    } catch {
      result = undefined
    }
    pending.resolve({ success: data.success, message: data.message, result })
  })

  engine.addSystem(() => {
    const now = Date.now()
    if (!profileLoaded && now - lastLoadRequestAt >= LOAD_RETRY_MS) {
      lastLoadRequestAt = now
      sendRequest(0, 'load')
    }

    for (const [requestId, pending] of pendingRequests) {
      if (now < pending.deadline) continue
      pendingRequests.delete(requestId)
      pending.resolve({ success: false, message: 'The server did not respond. Please try again.' })
    }
  })
}

export function requestEconomyAction(
  action: Exclude<EconomyRequestAction, 'load'>,
  itemId = '',
  questId = ''
): Promise<EconomyActionResult> {
  const requestId = ++nextRequestId
  return new Promise((resolve) => {
    pendingRequests.set(requestId, { resolve, deadline: Date.now() + REQUEST_TIMEOUT_MS })
    sendRequest(requestId, action, itemId, questId)
  })
}
