import { engine } from '@dcl/sdk/ecs'
import { isServer } from '@dcl/sdk/network'
import { Storage } from '@dcl/sdk/server'
import {
  applyEconomyRequestToProfile,
  applyGameplayActionToProfile,
  createDefaultProfile,
  grantCurrencyToProfile,
  normalizePlayerProfile,
  rollDailyQuests
} from '../game/economy'
import type { EconomyActionResult, EconomyRequestAction, PlayerProfile } from '../game/economy'
import { CrazyEightsGame, isBotPlayer } from '../game/logic'
import { sceneRoom } from '../shared/messages'

const PLAYER_PROFILE_KEY = 'crazy8_player_profile_v1'
const PROFILE_FLUSH_INTERVAL_MS = 10_000

function isWalletAddress(value: string): boolean {
  return /^0x[a-f0-9]{40}$/i.test(value)
}

export function setupPersistentPlayerEconomy(game: CrazyEightsGame) {
  if (!isServer()) return

  const profiles = new Map<string, PlayerProfile>()
  const dirtyProfiles = new Set<string>()
  const saveQueued = new Set<string>()
  const queues = new Map<string, Promise<unknown>>()
  let lastFlushAt = Date.now()

  function serialize<T>(playerId: string, operation: () => Promise<T>): Promise<T> {
    const previous = queues.get(playerId) || Promise.resolve()
    const current = previous.catch(() => undefined).then(operation)
    queues.set(playerId, current)
    void current.finally(() => {
      if (queues.get(playerId) === current) queues.delete(playerId)
    }).catch(() => undefined)
    return current
  }

  async function loadProfile(playerId: string): Promise<{ profile: PlayerProfile; saved: boolean }> {
    const cached = profiles.get(playerId)
    if (cached) return { profile: cached, saved: !dirtyProfiles.has(playerId) }

    const stored = await Storage.player.get<string>(playerId, PLAYER_PROFILE_KEY)
    const profile = stored === null ? createDefaultProfile() : normalizePlayerProfile(stored)
    const rolledQuests = rollDailyQuests(profile)
    profiles.set(playerId, profile)

    if (stored === null || rolledQuests) {
      const saved = await saveProfile(playerId, profile)
      return { profile, saved }
    }
    return { profile, saved: true }
  }

  async function saveProfile(playerId: string, profile: PlayerProfile): Promise<boolean> {
    try {
      const saved = await Storage.player.set(playerId, PLAYER_PROFILE_KEY, JSON.stringify(profile))
      if (saved) {
        dirtyProfiles.delete(playerId)
        return true
      }
      dirtyProfiles.add(playerId)
      console.error(`[Server] Profile save did not persist for ${playerId}; it will retry.`)
      return false
    } catch (error) {
      dirtyProfiles.add(playerId)
      console.error(`[Server] Profile save failed for ${playerId}; it will retry.`, error)
      return false
    }
  }

  async function sendProfile(
    playerId: string,
    requestId: number,
    profileJson: string,
    success: boolean,
    message = '',
    result: unknown = {}
  ) {
    try {
      await sceneRoom.send('economyProfile', {
        requestId,
        success,
        message,
        profileJson,
        resultJson: JSON.stringify(result)
      }, { to: [playerId] })
    } catch (error) {
      console.error(`[Server] Could not send profile update to ${playerId}:`, error)
    }
  }

  async function updateFromGameplay(playerId: string, actions: Array<{ action: 'card_played' | 'wild_eight' | 'inflict_draw' | 'declare_safe'; count?: number }>) {
    if (!isWalletAddress(playerId) || isBotPlayer(playerId)) return
    try {
      await serialize(playerId, async () => {
        const { profile } = await loadProfile(playerId)
        rollDailyQuests(profile)
        for (const entry of actions) applyGameplayActionToProfile(profile, entry.action, entry.count ?? 1)
        if (!dirtyProfiles.has(playerId)) dirtyProfiles.add(playerId)
        await sendProfile(playerId, 0, JSON.stringify(profile), true)
      })
    } catch (error) {
      console.error(`[Server] Could not update gameplay progress for ${playerId}:`, error)
    }
  }

  sceneRoom.onMessage('economyAction', (data, context) => {
    const playerId = context?.from?.toLowerCase()
    if (!playerId || !isWalletAddress(playerId)) return

    const requestId = Number.isFinite(data.requestId) ? data.requestId : 0
    if (data.action !== 'load' && data.action !== 'claimStreak' && data.action !== 'claimQuest' &&
        data.action !== 'buyItem' && data.action !== 'equipItem') {
      void sendProfile(playerId, requestId, '', false, 'Unknown profile action.')
      return
    }
    const action = data.action as EconomyRequestAction

    void serialize(playerId, async () => {
      try {
        const loaded = await loadProfile(playerId)
        const current = loaded.profile
        if (action === 'load') {
          await sendProfile(
            playerId,
            requestId,
            JSON.stringify(current),
            loaded.saved,
            loaded.saved ? '' : 'Profile storage is temporarily unavailable. Retrying…'
          )
          return
        }

        const draft = normalizePlayerProfile(current)
        const result: EconomyActionResult = applyEconomyRequestToProfile(draft, action, data.itemId, data.questId)
        const draftJson = JSON.stringify(draft)
        const currentJson = JSON.stringify(current)
        const needsSave = result.success || draftJson !== currentJson

        if (needsSave) {
          const saved = await saveProfile(playerId, draft)
          if (saved) {
            profiles.set(playerId, draft)
            await sendProfile(playerId, requestId, draftJson, result.success, result.message, result.result)
          } else {
            await sendProfile(playerId, requestId, currentJson, false, 'Could not save that change. Please try again.')
          }
        } else {
          await sendProfile(playerId, requestId, currentJson, false, result.message, result.result)
        }
      } catch (error) {
        console.error(`[Server] Could not process profile action for ${playerId}:`, error)
        await sendProfile(playerId, requestId, '', false, 'Could not load your saved profile. Please try again.')
      }
    })
  })

  const previousOnCardPlayed = game.onCardPlayed
  game.onCardPlayed = (playerId, card) => {
    previousOnCardPlayed?.(playerId, card)
    if (isBotPlayer(playerId)) return
    const actions: Array<{ action: 'card_played' | 'wild_eight' | 'inflict_draw' }> = [{ action: 'card_played' }]
    if (card.rank === '8' || card.action === 'Wild' || card.action === 'Draw4') actions.push({ action: 'wild_eight' })
    if (card.action === 'Draw2' || card.action === 'Draw4') actions.push({ action: 'inflict_draw' })
    void updateFromGameplay(playerId.toLowerCase(), actions)
  }

  const previousOnDeclareSafe = game.onDeclareSafe
  game.onDeclareSafe = (playerId) => {
    previousOnDeclareSafe?.(playerId)
    void updateFromGameplay(playerId.toLowerCase(), [{ action: 'declare_safe' }])
  }

  const previousOnRoundEnd = game.onRoundEnd
  game.onRoundEnd = (eliminated, winner, scoreBreakdown, roundWinner) => {
    previousOnRoundEnd?.(eliminated, winner, scoreBreakdown, roundWinner)
    const result = game.lastRoundResult
    if (!result) return

    for (const playerId of new Set(game.playerOrder.map(id => id.toLowerCase()))) {
      if (!isWalletAddress(playerId) || isBotPlayer(playerId)) continue
      void serialize(playerId, async () => {
        try {
          const { profile } = await loadProfile(playerId)
          rollDailyQuests(profile)
          applyGameplayActionToProfile(profile, 'match_finished')
          if (result.roundWinner?.toLowerCase() === playerId) applyGameplayActionToProfile(profile, 'round_won')

          const isOverallWinner = result.winner?.toLowerCase() === playerId
          grantCurrencyToProfile(profile, isOverallWinner ? (result.gameMode === 'solo' ? 30 : 150) : 30,
            isOverallWinner ? (result.gameMode === 'solo' ? 5 : 20) : 5)
          if (isOverallWinner) {
            applyGameplayActionToProfile(profile, 'match_won')
            if (result.gameMode === 'solo') applyGameplayActionToProfile(profile, 'solo_won')
          }

          const saved = await saveProfile(playerId, profile)
          await sendProfile(playerId, 0, JSON.stringify(profile), saved,
            saved ? '' : 'Your round reward is waiting for the server storage to reconnect.')
        } catch (error) {
          console.error(`[Server] Could not award round rewards to ${playerId}:`, error)
        }
      })
    }
  }

  engine.addSystem(() => {
    const now = Date.now()
    if (now - lastFlushAt < PROFILE_FLUSH_INTERVAL_MS) return
    lastFlushAt = now

    for (const playerId of dirtyProfiles) {
      if (saveQueued.has(playerId)) continue
      saveQueued.add(playerId)
      void serialize(playerId, async () => {
        try {
          const profile = profiles.get(playerId)
          if (profile && dirtyProfiles.has(playerId)) await saveProfile(playerId, profile)
        } catch (error) {
          console.error(`[Server] Could not flush profile progress for ${playerId}:`, error)
        } finally {
          saveQueued.delete(playerId)
        }
      })
    }
  })
}
