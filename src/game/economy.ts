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
  { day: 1, chips: 100, trophies: 10 },
  { day: 2, chips: 150, trophies: 20 },
  { day: 3, chips: 250, trophies: 35, specialTitle: 'Apprentice' },
  { day: 4, chips: 350, trophies: 50 },
  { day: 5, chips: 500, trophies: 75 },
  { day: 6, chips: 750, trophies: 100 },
  { day: 7, chips: 1500, trophies: 200, specialTitle: 'Crazy 8 Master' }
]

const ALL_QUEST_TEMPLATES = [
  {
    id: 'play_matches',
    title: 'Warm Up',
    description: 'Play 2 rounds of Crazy 8s',
    target: 2,
    rewardChips: 150,
    rewardTrophies: 15
  },
  {
    id: 'play_eights',
    title: 'Crazy Eights',
    description: 'Play 2 Wild 8s or +4 cards',
    target: 2,
    rewardChips: 200,
    rewardTrophies: 20
  },
  {
    id: 'inflict_draws',
    title: 'Draw Attack',
    description: 'Play +2 or +4 attack cards',
    target: 2,
    rewardChips: 200,
    rewardTrophies: 20
  },
  {
    id: 'play_cards',
    title: 'Card Slinger',
    description: 'Play 6 cards at the table',
    target: 6,
    rewardChips: 150,
    rewardTrophies: 15
  },
  {
    id: 'win_round',
    title: 'Winner Winner',
    description: 'Win 1 round of Crazy 8s',
    target: 1,
    rewardChips: 350,
    rewardTrophies: 35
  },
  {
    id: 'declare_safe',
    title: 'Safe Call',
    description: 'Declare low cards before opponents catch you',
    target: 1,
    rewardChips: 150,
    rewardTrophies: 15
  }
]

export interface PlayerProfile {
  chips: number
  trophies: number
  loginStreak: number
  lastClaimDateStr: string // 'YYYY-MM-DD'
  equippedTitle: string
  equippedDeck: string
  equippedAura: string
  unlockedTitles: string[]
  unlockedDecks: string[]
  unlockedAuras: string[]
  unlockedWearables: string[]
  quests: PlayerQuest[]
  lastQuestDateStr: string
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getYesterdayStr(): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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

// Initial default player profile
const profile: PlayerProfile = {
  chips: 250, // Welcome bonus chips
  trophies: 25,
  loginStreak: 1,
  lastClaimDateStr: '', // Not claimed yet today
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

export function getProfile(): PlayerProfile {
  // Check if quests need rolling over
  const today = getTodayStr()
  if (profile.lastQuestDateStr !== today) {
    profile.quests = generateDailyQuests()
    profile.lastQuestDateStr = today
  }
  return profile
}

export function canClaimStreak(): boolean {
  const today = getTodayStr()
  return profile.lastClaimDateStr !== today
}

export function claimDailyStreak(): { success: boolean; reward?: StreakDayReward } {
  if (!canClaimStreak()) return { success: false }

  const today = getTodayStr()
  const yesterday = getYesterdayStr()

  if (profile.lastClaimDateStr === yesterday) {
    // Consecutive day
    profile.loginStreak = (profile.loginStreak % 7) + 1
  } else if (profile.lastClaimDateStr === '') {
    // First time claim
    profile.loginStreak = 1
  } else {
    // Missed days - reset to day 1
    profile.loginStreak = 1
  }

  profile.lastClaimDateStr = today
  const reward = STREAK_SCHEDULE[profile.loginStreak - 1]
  
  profile.chips += reward.chips
  profile.trophies += reward.trophies

  if (reward.specialTitle && !profile.unlockedTitles.includes(reward.specialTitle)) {
    profile.unlockedTitles.push(reward.specialTitle)
    profile.equippedTitle = reward.specialTitle
  }

  return { success: true, reward }
}

export function claimQuest(questId: string): boolean {
  const quest = profile.quests.find(q => q.id === questId)
  if (!quest || quest.claimed || quest.progress < quest.target) return false

  quest.claimed = true
  profile.chips += quest.rewardChips
  profile.trophies += quest.rewardTrophies
  return true
}

export type GameplayAction = 'card_played' | 'wild_eight' | 'inflict_draw' | 'declare_safe' | 'match_finished' | 'match_won'

export function reportGameplayAction(action: GameplayAction, count: number = 1) {
  let updated = false
  for (const quest of profile.quests) {
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
    } else if (action === 'match_won' && quest.id === 'win_round') {
      quest.progress = Math.min(quest.target, quest.progress + count)
      updated = true
    }
  }
  return updated
}

export function addChips(amount: number) {
  profile.chips += amount
}

export function addTrophies(amount: number) {
  profile.trophies += amount
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
  description: string
  badgeColor: string
  auraHex?: string
  iconLabel?: string
}

export const SHOP_CATALOG: ShopItem[] = [
  // 1. Card Decks
  {
    id: 'deck_classic',
    name: 'Classic Standard',
    category: 'deck',
    priceChips: 0,
    reqTrophies: 0,
    description: 'Standard casino midnight blue deck',
    badgeColor: '#00f3ff',
    iconLabel: '🃏'
  },
  {
    id: 'deck_cyberpunk',
    name: 'Cyberpunk Neon',
    category: 'deck',
    priceChips: 750,
    reqTrophies: 20,
    description: 'Glowing laser cyan & magenta circuit lines',
    badgeColor: '#00f3ff',
    iconLabel: '⚡'
  },
  {
    id: 'deck_gold_vip',
    name: 'Gold Foil VIP',
    category: 'deck',
    priceChips: 2200,
    reqTrophies: 100,
    description: 'Black obsidian card with metallic 24K gold filigree',
    badgeColor: '#ffd700',
    iconLabel: '👑'
  },
  {
    id: 'deck_dcl_holo',
    name: 'DCL Holographic',
    category: 'deck',
    priceChips: 3800,
    reqTrophies: 250,
    description: 'Decentraland Mana prismatic holographic sheen',
    badgeColor: '#b026ff',
    iconLabel: '✨'
  },

  // 2. Chair Underglow Auras
  {
    id: 'aura_none',
    name: 'No Underglow',
    category: 'aura',
    priceChips: 0,
    reqTrophies: 0,
    description: 'Default ambient table underglow',
    badgeColor: '#888888',
    auraHex: '#00000000',
    iconLabel: '🔘'
  },
  {
    id: 'aura_cyan',
    name: 'Cyan Cyber Glow',
    category: 'aura',
    priceChips: 1200,
    reqTrophies: 50,
    description: 'Floor ring glows laser cyan when seated',
    badgeColor: '#00f3ff',
    auraHex: '#00f3ff',
    iconLabel: '💠'
  },
  {
    id: 'aura_purple',
    name: 'Neon Violet Glow',
    category: 'aura',
    priceChips: 2500,
    reqTrophies: 120,
    description: 'Floor ring pulses royal violet when seated',
    badgeColor: '#b026ff',
    auraHex: '#b026ff',
    iconLabel: '🔮'
  },
  {
    id: 'aura_gold',
    name: 'High-Roller Gold',
    category: 'aura',
    priceChips: 5000,
    reqTrophies: 350,
    description: 'Floor ring shines 24K radiant gold when seated',
    badgeColor: '#ffd700',
    auraHex: '#ffd700',
    iconLabel: '🌟'
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
    iconLabel: '🌱'
  },
  {
    id: 'title_shark',
    name: 'Card Shark',
    category: 'title',
    priceChips: 500,
    reqTrophies: 30,
    description: 'Calculating player with razor instincts',
    badgeColor: '#00f3ff',
    iconLabel: '🦈'
  },
  {
    id: 'title_high_roller',
    name: 'High Roller',
    category: 'title',
    priceChips: 2000,
    reqTrophies: 150,
    description: 'Plays big stakes and never backs down',
    badgeColor: '#ffd700',
    iconLabel: '💰'
  },
  {
    id: 'title_legend',
    name: 'Crazy 8 Legend',
    category: 'title',
    priceChips: 6000,
    reqTrophies: 500,
    description: 'Master of the table with Parcel-wide renown',
    badgeColor: '#ff0055',
    iconLabel: '👑'
  },

  // 4. Wearables (Showcase Preview Items)
  {
    id: 'wearable_cyber_hoodie',
    name: 'Crazy 8 Cyber Hoodie',
    category: 'wearable',
    priceChips: 10000,
    reqTrophies: 600,
    description: 'Lounge-exclusive dark hoodie with glowing 8 emblem on back',
    badgeColor: '#00f3ff',
    iconLabel: '👗'
  },
  {
    id: 'wearable_gold_bomber',
    name: 'Champion Gold Bomber',
    category: 'wearable',
    priceChips: 15000,
    reqTrophies: 1000,
    description: 'Awarded to the Weekly Billboard #1 Champion on Sundays',
    badgeColor: '#ffd700',
    iconLabel: '🧥'
  }
]

export function isItemUnlocked(itemId: string): boolean {
  const item = SHOP_CATALOG.find(i => i.id === itemId)
  if (!item) return false
  if (item.category === 'deck') return profile.unlockedDecks.includes(itemId)
  if (item.category === 'aura') return profile.unlockedAuras.includes(itemId)
  if (item.category === 'title') return profile.unlockedTitles.includes(item.name)
  if (item.category === 'wearable') return profile.unlockedWearables.includes(itemId)
  return false
}

export function isItemEquipped(itemId: string): boolean {
  const item = SHOP_CATALOG.find(i => i.id === itemId)
  if (!item) return false
  if (item.category === 'deck') return profile.equippedDeck === itemId
  if (item.category === 'aura') return profile.equippedAura === itemId
  if (item.category === 'title') return profile.equippedTitle === item.name
  return false
}

// Listeners for cosmetic changes
type CosmeticChangeListener = (category: string, itemId: string, item: ShopItem) => void
const cosmeticListeners: CosmeticChangeListener[] = []

export function onCosmeticEquipped(listener: CosmeticChangeListener) {
  cosmeticListeners.push(listener)
}

export function buyShopItem(itemId: string): { success: boolean; message: string } {
  const item = SHOP_CATALOG.find(i => i.id === itemId)
  if (!item) return { success: false, message: 'Item not found' }

  if (isItemUnlocked(itemId)) {
    return { success: false, message: 'Item already owned!' }
  }

  if (profile.trophies < item.reqTrophies) {
    return {
      success: false,
      message: `Need ${item.reqTrophies} Trophies to unlock! (You have ${profile.trophies})`
    }
  }

  if (profile.chips < item.priceChips) {
    return {
      success: false,
      message: `Need ${item.priceChips.toLocaleString()} Chips! (You have ${profile.chips.toLocaleString()})`
    }
  }

  // Deduct chips
  profile.chips -= item.priceChips

  if (item.category === 'deck') {
    profile.unlockedDecks.push(itemId)
    profile.equippedDeck = itemId
  } else if (item.category === 'aura') {
    profile.unlockedAuras.push(itemId)
    profile.equippedAura = itemId
  } else if (item.category === 'title') {
    profile.unlockedTitles.push(item.name)
    profile.equippedTitle = item.name
  } else if (item.category === 'wearable') {
    profile.unlockedWearables.push(itemId)
  }

  // Notify listeners
  cosmeticListeners.forEach(fn => fn(item.category, itemId, item))

  return { success: true, message: `Unlocked & Equipped ${item.name}!` }
}

export function equipShopItem(itemId: string): { success: boolean; message: string } {
  const item = SHOP_CATALOG.find(i => i.id === itemId)
  if (!item) return { success: false, message: 'Item not found' }

  if (!isItemUnlocked(itemId)) {
    return { success: false, message: 'Item is not unlocked yet!' }
  }

  if (item.category === 'deck') {
    profile.equippedDeck = itemId
  } else if (item.category === 'aura') {
    profile.equippedAura = itemId
  } else if (item.category === 'title') {
    profile.equippedTitle = item.name
  }

  cosmeticListeners.forEach(fn => fn(item.category, itemId, item))
  return { success: true, message: `Equipped ${item.name}!` }
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
