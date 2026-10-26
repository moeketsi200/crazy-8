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
  unlockedTitles: string[]
  unlockedDecks: string[]
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
  equippedDeck: 'Classic',
  unlockedTitles: ['Card Rookie'],
  unlockedDecks: ['Classic'],
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

// Modal open/close state
let isRewardsModalOpen = false
let activeRewardsTab: 'streak' | 'bounties' = 'streak'

export function getIsRewardsModalOpen(): boolean {
  return isRewardsModalOpen
}

export function setRewardsModalOpen(open: boolean) {
  isRewardsModalOpen = open
}

export function getActiveRewardsTab(): 'streak' | 'bounties' {
  return activeRewardsTab
}

export function setActiveRewardsTab(tab: 'streak' | 'bounties') {
  activeRewardsTab = tab
}
