// Economy, Player Profile, Daily Streak & Bounties System

export interface PlayerQuest {
  id: string
  title: string
  description: string
  target: number
  progress: number
  rewardChips: number
  rewardTrophies: number
  claimed: boolean
}

export interface StreakDayReward {
  day: number
  chips: number
  trophies: number
  specialTitle?: string
}

export const STREAK_SCHEDULE: StreakDayReward[] = [
  { day: 1, chips: 10, trophies: 1 },
  { day: 2, chips: 15, trophies: 2 },
  { day: 3, chips: 25, trophies: 3, specialTitle: 'Apprentice' },
  { day: 4, chips: 35, trophies: 5 },
  { day: 5, chips: 50, trophies: 7 },
  { day: 6, chips: 75, trophies: 10 },
  { day: 7, chips: 150, trophies: 20, specialTitle: 'Crazy 8 Master' }
]

const ALL_QUEST_TEMPLATES = [
  {
    id: 'play_matches',
    title: 'Warm Up',
    description: 'Play 2 rounds of Crazy 8s',
    target: 2,
    rewardChips: 15,
    rewardTrophies: 1
  },
  {
    id: 'play_eights',
    title: 'Crazy Eights',
    description: 'Play 2 Wild 8s or +4 cards',
    target: 2,
    rewardChips: 20,
    rewardTrophies: 2
  },
  {
    id: 'inflict_draws',
    title: 'Draw Attack',
    description: 'Play +2 or +4 attack cards',
    target: 2,
    rewardChips: 20,
    rewardTrophies: 2
  },
  {
    id: 'play_cards',
    title: 'Card Slinger',
    description: 'Play 6 cards at the table',
    target: 6,
    rewardChips: 15,
    rewardTrophies: 1
  },
  {
    id: 'win_round',
    title: 'Winner Winner',
    description: 'Win 1 round of Crazy 8s',
    target: 1,
    rewardChips: 35,
    rewardTrophies: 3
  },
  {
    id: 'declare_safe',
    title: 'Safe Call',
    description: 'Declare low cards before opponents catch you',
    target: 1,
    rewardChips: 15,
    rewardTrophies: 1
  }
]

export interface PlayerProfile {
  chips: number
  trophies: number
  totalWins: number
  soloWins: number
  roundsWon: number
  loginStreak: number
  lastClaimDateStr: string // 'YYYY-MM-DD'
  equippedTitle: string
  equippedDeck: string
  equippedAura: string
  equippedWearable?: string
  unlockedTitles: string[]
  unlockedDecks: string[]
  unlockedAuras: string[]
  unlockedWearables: string[]
  quests: PlayerQuest[]
  lastQuestDateStr: string
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 1)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
}

function generateDailyQuests(): PlayerQuest[] {
  // Pick 3 random quests from the template pool
  const shuffled = [...ALL_QUEST_TEMPLATES].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, 3).map(q => ({
    ...q,
    progress: 0,
    claimed: false
  }))
}

export function createDefaultProfile(): PlayerProfile {
  return {
    chips: 0,
    trophies: 0,
    totalWins: 0,
    soloWins: 0,
    roundsWon: 0,
    loginStreak: 1,
    lastClaimDateStr: '',
    equippedTitle: 'Card Rookie',
    equippedDeck: 'deck_classic',
    equippedAura: 'aura_none',
    unlockedTitles: ['Card Rookie'],
    unlockedDecks: ['deck_classic'],
    unlockedAuras: ['aura_none'],
    unlockedWearables: [],
    quests: generateDailyQuests(),
    lastQuestDateStr: getTodayStr()
  }
}

let profile: PlayerProfile = createDefaultProfile()

export function normalizePlayerProfile(value: unknown): PlayerProfile {
  const defaults = createDefaultProfile()
  let candidate = value
  if (typeof candidate === 'string') {
    try {
      candidate = JSON.parse(candidate)
    } catch {
      return defaults
    }
  }
  if (!candidate || typeof candidate !== 'object') return defaults

  const saved = candidate as Partial<PlayerProfile>
  const unlockedStrings = (items: unknown, fallback: string[]) =>
    Array.isArray(items) ? items.filter((item): item is string => typeof item === 'string') : fallback
  const quests = Array.isArray(saved.quests)
    ? saved.quests.filter((quest): quest is PlayerQuest =>
      !!quest && typeof quest.id === 'string' && typeof quest.title === 'string' &&
      typeof quest.description === 'string' && Number.isFinite(quest.target) &&
      Number.isFinite(quest.progress) && Number.isFinite(quest.rewardChips) &&
      Number.isFinite(quest.rewardTrophies) && typeof quest.claimed === 'boolean'
    ).map((quest) => ({
      ...quest,
      target: Math.max(1, Math.floor(quest.target)),
      progress: Math.max(0, Math.min(Math.floor(quest.progress), Math.floor(quest.target))),
      rewardChips: Math.max(0, Math.floor(quest.rewardChips)),
      rewardTrophies: Math.max(0, Math.floor(quest.rewardTrophies))
    }))
    : defaults.quests

  return {
    chips: Number.isFinite(saved.chips) ? Math.max(0, Math.floor(saved.chips!)) : defaults.chips,
    trophies: Number.isFinite(saved.trophies) ? Math.max(0, Math.floor(saved.trophies!)) : defaults.trophies,
    totalWins: Number.isFinite(saved.totalWins) ? Math.max(0, Math.floor(saved.totalWins!)) : defaults.totalWins,
    soloWins: Number.isFinite(saved.soloWins) ? Math.max(0, Math.floor(saved.soloWins!)) : defaults.soloWins,
    roundsWon: Number.isFinite(saved.roundsWon) ? Math.max(0, Math.floor(saved.roundsWon!)) : defaults.roundsWon,
    loginStreak: Number.isFinite(saved.loginStreak) ? Math.max(1, Math.min(7, Math.floor(saved.loginStreak!))) : defaults.loginStreak,
    lastClaimDateStr: typeof saved.lastClaimDateStr === 'string' ? saved.lastClaimDateStr : defaults.lastClaimDateStr,
    equippedTitle: typeof saved.equippedTitle === 'string' ? saved.equippedTitle : defaults.equippedTitle,
    equippedDeck: typeof saved.equippedDeck === 'string' ? saved.equippedDeck : defaults.equippedDeck,
    equippedAura: typeof saved.equippedAura === 'string' ? saved.equippedAura : defaults.equippedAura,
    equippedWearable: typeof saved.equippedWearable === 'string' ? saved.equippedWearable : undefined,
    unlockedTitles: unlockedStrings(saved.unlockedTitles, defaults.unlockedTitles),
    unlockedDecks: unlockedStrings(saved.unlockedDecks, defaults.unlockedDecks),
    unlockedAuras: unlockedStrings(saved.unlockedAuras, defaults.unlockedAuras),
    unlockedWearables: unlockedStrings(saved.unlockedWearables, defaults.unlockedWearables),
    quests: quests.length > 0 ? quests : defaults.quests,
    lastQuestDateStr: typeof saved.lastQuestDateStr === 'string' ? saved.lastQuestDateStr : defaults.lastQuestDateStr
  }
}

export function rollDailyQuests(target: PlayerProfile): boolean {
  const today = getTodayStr()
  if (target.lastQuestDateStr !== today) {
    target.quests = generateDailyQuests()
    target.lastQuestDateStr = today
    return true
  }
  return false
}

export function setProfileFromServer(value: unknown) {
  const previous = profile
  profile = normalizePlayerProfile(value)

  const equippedChanges: Array<{ category: string; itemId: string; item: ShopItem }> = []
  const addEquipped = (category: ShopItem['category'], itemId: string | undefined) => {
    const item = SHOP_CATALOG.find((candidate) => candidate.category === category && candidate.id === itemId) ||
      SHOP_CATALOG.find((candidate) => candidate.category === category)
    if (item) equippedChanges.push({ category, itemId: itemId || '', item })
  }

  if (previous.equippedAura !== profile.equippedAura) addEquipped('aura', profile.equippedAura)
  if (previous.equippedWearable !== profile.equippedWearable) addEquipped('wearable', profile.equippedWearable)
  if (previous.equippedDeck !== profile.equippedDeck) addEquipped('deck', profile.equippedDeck)
  if (previous.equippedTitle !== profile.equippedTitle) addEquipped('title', profile.equippedTitle)
  for (const change of equippedChanges) {
    cosmeticListeners.forEach((listener) => listener(change.category, change.itemId, change.item))
  }
}

export function getProfile(): PlayerProfile {
  rollDailyQuests(profile)
  return profile
}

export function canClaimStreak(): boolean {
  const today = getTodayStr()
  return profile.lastClaimDateStr !== today
}

export type GameplayAction = 'card_played' | 'wild_eight' | 'inflict_draw' | 'declare_safe' | 'match_finished' | 'match_won' | 'round_won' | 'solo_won'

export function applyGameplayActionToProfile(target: PlayerProfile, action: GameplayAction, count: number = 1): boolean {
  let updated = false
  if (action === 'match_won') {
    target.totalWins += count
  } else if (action === 'round_won') {
    target.roundsWon += count
  } else if (action === 'solo_won') {
    target.soloWins += count
  }
  for (const quest of target.quests) {
    if (quest.claimed) continue

    if (action === 'card_played' && quest.id === 'play_cards') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    } else if (action === 'wild_eight' && quest.id === 'play_eights') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    } else if (action === 'inflict_draw' && quest.id === 'inflict_draws') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    } else if (action === 'declare_safe' && quest.id === 'declare_safe') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    } else if (action === 'match_finished' && quest.id === 'play_matches') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    } else if (action === 'round_won' && quest.id === 'win_round') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    }
  }
  return updated
}

export function grantCurrencyToProfile(target: PlayerProfile, chips: number, trophies: number) {
  target.chips += Math.max(0, Math.floor(chips))
  target.trophies += Math.max(0, Math.floor(trophies))
}

export function hasUnclaimedRewards(): boolean {
  if (canClaimStreak()) return true
  for (const quest of profile.quests) {
    if (!quest.claimed && quest.progress >= quest.target) return true
  }
  return false
}

// ----------------------------------------------------
// VIP PRO SHOP CATALOG & ITEM DEFINITIONS
// ----------------------------------------------------
export interface ShopItem {
  id: string
  name: string
  category: 'deck' | 'aura' | 'title' | 'wearable'
  priceChips: number
  reqTrophies: number
  reqWins?: number
  description: string
  badgeColor: string
  auraHex?: string
  icon: ShopIconName
}

export type ShopIconName =
  | 'coin'
  | 'trophy'
  | 'flame'
  | 'gift'
  | 'star'
  | 'target'
  | 'shop'
  | 'cards'
  | 'aura'
  | 'crown'
  | 'hanger'
  | 'bolt'
  | 'ring'
  | 'diamond'
  | 'orb'
  | 'shirt'
  | 'cap'
  | 'glasses'
  | 'jacket'
  | 'shark'

export const SHOP_CATALOG: ShopItem[] = [
  // 1. Hardcore Custom Card Decks
  {
    id: 'deck_classic',
    name: 'Classic Standard',
    category: 'deck',
    priceChips: 0,
    reqTrophies: 0,
    description: 'Standard casino midnight blue deck',
    badgeColor: '#00f3ff',
    icon: 'cards'
  },
  {
    id: 'deck_cyberpunk',
    name: 'Cyberpunk Neon Deck',
    category: 'deck',
    priceChips: 1200,
    reqTrophies: 40,
    description: 'Requires daily dedication. Glowing laser cyan & magenta circuit lines',
    badgeColor: '#00f3ff',
    icon: 'bolt'
  },
  {
    id: 'deck_gold_vip',
    name: 'Gold Foil VIP Deck',
    category: 'deck',
    priceChips: 4000,
    reqTrophies: 150,
    description: 'Requires serious match-winning dedication. Black obsidian with 24K gold filigree',
    badgeColor: '#ffd700',
    icon: 'crown'
  },
  {
    id: 'deck_dcl_holo',
    name: 'DCL Holographic Deck',
    category: 'deck',
    priceChips: 7500,
    reqTrophies: 350,
    description: 'An elite endgame deck for true card sharks with shifting Mana crystals',
    badgeColor: '#b026ff',
    icon: 'star'
  },

  // 2. Hardcore Chair Underglow Auras (chair_aura_ring.glb)
  {
    id: 'aura_none',
    name: 'No Underglow',
    category: 'aura',
    priceChips: 0,
    reqTrophies: 0,
    description: 'Default ambient table underglow',
    badgeColor: '#888888',
    auraHex: '#00000000',
    icon: 'ring'
  },
  {
    id: 'aura_cyan',
    name: 'Cyan Pulse Ring',
    category: 'aura',
    priceChips: 3000,
    reqTrophies: 75,
    description: 'Electric blue floor glow underneath your chair',
    badgeColor: '#00f3ff',
    auraHex: '#00f3ff',
    icon: 'diamond'
  },
  {
    id: 'aura_purple',
    name: 'Royal Purple Glow',
    category: 'aura',
    priceChips: 7000,
    reqTrophies: 200,
    description: 'Deep, ambient purple aura signaling veteran status',
    badgeColor: '#b026ff',
    auraHex: '#b026ff',
    icon: 'orb'
  },
  {
    id: 'aura_gold',
    name: 'Golden High-Roller Ring',
    category: 'aura',
    priceChips: 15000,
    reqTrophies: 600,
    description: 'Only the top veterans on the server will ever sit on this 24K halo',
    badgeColor: '#ffd700',
    auraHex: '#ffd700',
    icon: 'star'
  },

  // 3. Player Titles
  {
    id: 'title_rookie',
    name: 'Card Rookie',
    category: 'title',
    priceChips: 0,
    reqTrophies: 0,
    description: 'Fresh face in the Crazy 8 VIP Lounge',
    badgeColor: '#888888',
    icon: 'star'
  },
  {
    id: 'title_shark',
    name: 'Card Shark',
    category: 'title',
    priceChips: 500,
    reqTrophies: 30,
    description: 'Calculating player with razor instincts',
    badgeColor: '#00f3ff',
    icon: 'shark'
  },
  {
    id: 'title_high_roller',
    name: 'High Roller',
    category: 'title',
    priceChips: 2000,
    reqTrophies: 150,
    description: 'Plays big stakes and never backs down',
    badgeColor: '#ffd700',
    icon: 'coin'
  },
  {
    id: 'title_legend',
    name: 'Crazy 8 Legend',
    category: 'title',
    priceChips: 6000,
    reqTrophies: 500,
    description: 'Master of the table with Parcel-wide renown',
    badgeColor: '#ff0055',
    icon: 'crown'
  },

  // 4. Milestone Head & Face Accessories (Retained)
  {
    id: 'wearable_electric_cap',
    name: 'Electric Streak Cap',
    category: 'wearable',
    priceChips: 0,
    reqTrophies: 0,
    reqWins: 30,
    description: 'Unlocked at 30 Match Wins. Features glowing neon piping and lightning 8 emblem',
    badgeColor: '#00f3ff',
    icon: 'cap'
  },
  {
    id: 'wearable_shades_chain',
    name: 'Designer Shades & Chain',
    category: 'wearable',
    priceChips: 0,
    reqTrophies: 0,
    reqWins: 60,
    description: 'Unlocked at 60 Match Wins. 24K gold geometric shades, Cuban chain & custom card medallion',
    badgeColor: '#ffd700',
    icon: 'glasses'
  },

  // 5. Fitted Streetwear & Club Clothing (Purchasable with Crazy Chips)
  {
    id: 'wearable_holo_card_tee',
    name: 'Holo Card Tee',
    category: 'wearable',
    priceChips: 1500,
    reqTrophies: 40,
    description: 'Deep navy tee with iridescent holographic playing card graphic and glowing cyan 8s',
    badgeColor: '#00f3ff',
    icon: 'shirt'
  },
  {
    id: 'wearable_high_roller_tee',
    name: 'High Roller Tee',
    category: 'wearable',
    priceChips: 2800,
    reqTrophies: 100,
    description: 'Vintage off-white cream tee with 4 luxury casino suit emblems and High Roller typography',
    badgeColor: '#ffd700',
    icon: 'shirt'
  },
  {
    id: 'wearable_crest_bomber',
    name: 'C8 Crest Bomber',
    category: 'wearable',
    priceChips: 5500,
    reqTrophies: 250,
    description: 'Sleek obsidian satin bomber with gold zipper and glowing cyan C8 neon chest crest',
    badgeColor: '#00f3ff',
    icon: 'jacket'
  },
  {
    id: 'wearable_vip_club_bomber',
    name: 'VIP Club Bomber',
    category: 'wearable',
    priceChips: 10000,
    reqTrophies: 500,
    description: 'Grand champion jacket: obsidian satin with gold ribbing, glowing seam piping & illuminated King crown',
    badgeColor: '#ff0055',
    icon: 'jacket'
  }
]

export function isItemUnlocked(itemId: string): boolean {
  const item = SHOP_CATALOG.find(i => i.id === itemId)
  if (!item) return false
  if (item.category === 'deck') return profile.unlockedDecks.includes(itemId)
  if (item.category === 'aura') return profile.unlockedAuras.includes(itemId)
  if (item.category === 'title') return profile.unlockedTitles.includes(item.name)
  if (item.category === 'wearable') {
    if (item.reqWins !== undefined && profile.totalWins >= item.reqWins) return true
    return profile.unlockedWearables.includes(itemId)
  }
  return false
}

export function isItemEquipped(itemId: string): boolean {
  const item = SHOP_CATALOG.find(i => i.id === itemId)
  if (!item) return false
  if (item.category === 'deck') return profile.equippedDeck === itemId
  if (item.category === 'aura') return profile.equippedAura === itemId
  if (item.category === 'title') return profile.equippedTitle === item.name
  if (item.category === 'wearable') return profile.equippedWearable === itemId
  return false
}

// Listeners for cosmetic changes
type CosmeticChangeListener = (category: string, itemId: string, item: ShopItem) => void
const cosmeticListeners: CosmeticChangeListener[] = []

export function onCosmeticEquipped(listener: CosmeticChangeListener) {
  cosmeticListeners.push(listener)
}

export type EconomyRequestAction = 'load' | 'claimStreak' | 'claimQuest' | 'buyItem' | 'equipItem'

export interface EconomyActionResult {
  success: boolean
  message: string
  result?: unknown
}

function isItemUnlockedForProfile(target: PlayerProfile, itemId: string): boolean {
  const item = SHOP_CATALOG.find(candidate => candidate.id === itemId)
  if (!item) return false
  if (item.category === 'deck') return target.unlockedDecks.includes(itemId)
  if (item.category === 'aura') return target.unlockedAuras.includes(itemId)
  if (item.category === 'title') return target.unlockedTitles.includes(item.name)
  if (item.category === 'wearable') {
    if (item.reqWins !== undefined && target.totalWins >= item.reqWins) return true
    return target.unlockedWearables.includes(itemId)
  }
  return false
}

function claimDailyStreakForProfile(target: PlayerProfile): { success: boolean; reward?: StreakDayReward } {
  const today = getTodayStr()
  if (target.lastClaimDateStr === today) return { success: false }

  const yesterday = getYesterdayStr()
  if (target.lastClaimDateStr === yesterday) {
    target.loginStreak = (target.loginStreak % 7) + 1
  } else {
    target.loginStreak = 1
  }

  target.lastClaimDateStr = today
  const reward = STREAK_SCHEDULE[target.loginStreak - 1]
  grantCurrencyToProfile(target, reward.chips, reward.trophies)

  if (reward.specialTitle && !target.unlockedTitles.includes(reward.specialTitle)) {
    target.unlockedTitles.push(reward.specialTitle)
    target.equippedTitle = reward.specialTitle
  }

  return { success: true, reward }
}

function buyItemForProfile(target: PlayerProfile, itemId: string): EconomyActionResult {
  const item = SHOP_CATALOG.find(candidate => candidate.id === itemId)
  if (!item) return { success: false, message: 'Item not found' }
  if (isItemUnlockedForProfile(target, itemId)) return { success: false, message: 'Item already unlocked!' }
  if (item.reqWins !== undefined) {
    return { success: false, message: `Unlocked by winning matches! (${target.totalWins}/${item.reqWins} Wins)` }
  }
  if (target.trophies < item.reqTrophies) {
    return { success: false, message: `Need ${item.reqTrophies} Trophies to unlock! (You have ${target.trophies})` }
  }
  if (target.chips < item.priceChips) {
    return { success: false, message: `Need ${item.priceChips.toLocaleString()} Chips! (You have ${target.chips.toLocaleString()})` }
  }

  target.chips -= item.priceChips
  if (item.category === 'deck') {
    target.unlockedDecks.push(itemId)
    target.equippedDeck = itemId
  } else if (item.category === 'aura') {
    target.unlockedAuras.push(itemId)
    target.equippedAura = itemId
  } else if (item.category === 'title') {
    target.unlockedTitles.push(item.name)
    target.equippedTitle = item.name
  } else {
    target.unlockedWearables.push(itemId)
    target.equippedWearable = itemId
  }
  return { success: true, message: `Unlocked & Equipped ${item.name}!` }
}

function equipItemForProfile(target: PlayerProfile, itemId: string): EconomyActionResult {
  const item = SHOP_CATALOG.find(candidate => candidate.id === itemId)
  if (!item) return { success: false, message: 'Item not found' }
  if (!isItemUnlockedForProfile(target, itemId)) return { success: false, message: 'Item is not unlocked yet!' }

  if (item.category === 'deck') target.equippedDeck = itemId
  else if (item.category === 'aura') target.equippedAura = itemId
  else if (item.category === 'title') target.equippedTitle = item.name
  else if (target.equippedWearable === itemId) {
    target.equippedWearable = undefined
    return { success: true, message: `Unequipped ${item.name}` }
  } else target.equippedWearable = itemId

  return { success: true, message: `Equipped ${item.name}!` }
}

export function applyEconomyRequestToProfile(
  target: PlayerProfile,
  action: Exclude<EconomyRequestAction, 'load'>,
  itemId = '',
  questId = ''
): EconomyActionResult {
  rollDailyQuests(target)
  if (action === 'claimStreak') {
    const claimed = claimDailyStreakForProfile(target)
    return claimed.success
      ? { success: true, message: 'Daily streak claimed!', result: { reward: claimed.reward } }
      : { success: false, message: 'You have already claimed today’s streak reward.' }
  }
  if (action === 'claimQuest') {
    const quest = target.quests.find(candidate => candidate.id === questId)
    if (!quest || quest.claimed || quest.progress < quest.target) {
      return { success: false, message: 'This bounty is not ready to claim.' }
    }
    quest.claimed = true
    grantCurrencyToProfile(target, quest.rewardChips, quest.rewardTrophies)
    return { success: true, message: `Bounty Complete: +${quest.rewardChips} Chips, +${quest.rewardTrophies} Trophies!` }
  }
  if (action === 'buyItem') return buyItemForProfile(target, itemId)
  return equipItemForProfile(target, itemId)
}

export function getStreakReminderMessage(): string {
  const nextDay = (profile.loginStreak % 7) + 1
  const nextReward = STREAK_SCHEDULE[nextDay - 1]
  return `Day ${profile.loginStreak} streak active! Return tomorrow to claim Day ${nextDay} (+${nextReward.chips} chips).`
}

// Modal open/close state
let isRewardsModalOpen = false
let activeRewardsTab: 'streak' | 'bounties' | 'shop' = 'streak'
let activeShopCategory: 'all' | 'deck' | 'aura' | 'title' | 'wearable' = 'all'

export function getIsRewardsModalOpen(): boolean {
  return isRewardsModalOpen
}

export function setRewardsModalOpen(open: boolean) {
  isRewardsModalOpen = open
}

export function getActiveRewardsTab(): 'streak' | 'bounties' | 'shop' {
  return activeRewardsTab
}

export function setActiveRewardsTab(tab: 'streak' | 'bounties' | 'shop') {
  activeRewardsTab = tab
}

export function getActiveShopCategory(): 'all' | 'deck' | 'aura' | 'title' | 'wearable' {
  return activeShopCategory
}

export function setActiveShopCategory(category: 'all' | 'deck' | 'aura' | 'title' | 'wearable') {
  activeShopCategory = category
}
