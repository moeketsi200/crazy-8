import ReactEcs, { UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import {
  getProfile,
  canClaimStreak,
  claimDailyStreak,
  claimQuest,
  hasUnclaimedRewards,
  getIsRewardsModalOpen,
  setRewardsModalOpen,
  getActiveRewardsTab,
  setActiveRewardsTab,
  getActiveShopCategory,
  setActiveShopCategory,
  SHOP_CATALOG,
  isItemUnlocked,
  isItemEquipped,
  buyShopItem,
  equipShopItem,
  getStreakReminderMessage,
  STREAK_SCHEDULE
} from './economy'
import type { ShopIconName } from './economy'

const ICON_ATLAS = 'assets/images/crazy8_ui_icon_atlas.png'
const ICON_INDEX: Record<ShopIconName, number> = {
  coin: 0,
  trophy: 1,
  flame: 2,
  gift: 3,
  star: 4,
  target: 5,
  shop: 6,
  cards: 7,
  aura: 8,
  crown: 9,
  hanger: 10,
  bolt: 11,
  ring: 12,
  diamond: 13,
  orb: 14,
  shirt: 15,
  cap: 16,
  glasses: 17,
  jacket: 18,
  shark: 19
}

function iconUvs(name: ShopIconName): number[] {
  const index = ICON_INDEX[name]
  const column = index % 4
  const row = Math.floor(index / 4)
  const left = column / 4
  const right = (column + 1) / 4
  const top = 1 - row / 5
  const bottom = 1 - (row + 1) / 5
  return [left, bottom, left, top, right, top, right, bottom]
}

function RewardsIcon({
  name,
  size,
  tint,
  marginRight = 5
}: {
  name: ShopIconName
  size: number
  tint: string
  marginRight?: number
}) {
  return (
    <UiEntity
      uiTransform={{ width: size, height: size, margin: { right: marginRight } }}
      uiBackground={{
        color: Color4.fromHexString(tint),
        textureMode: 'stretch',
        texture: { src: ICON_ATLAS },
        uvs: iconUvs(name)
      }}
    />
  )
}

function IconMetric({
  icon,
  value,
  tint,
  width = 48,
  fontSize = 13
}: {
  icon: ShopIconName
  value: string
  tint: string
  width?: number
  fontSize?: number
}) {
  return (
    <UiEntity uiTransform={{ height: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
      <RewardsIcon name={icon} size={13} tint={tint} marginRight={3} />
      <UiEntity
        uiTransform={{ width, height: 18 }}
        uiText={{ value, fontSize, color: Color4.fromHexString(tint), textAlign: 'middle-left', font: 'sans-serif' }}
      />
    </UiEntity>
  )
}

// Notification trigger for UI
let rewardToastMsg = ''
let rewardToastTimer = 0

export function showRewardToast(msg: string) {
  rewardToastMsg = msg
  rewardToastTimer = 3.5
}

export function updateRewardToast(dt: number) {
  if (rewardToastTimer > 0) {
    rewardToastTimer -= dt
    if (rewardToastTimer <= 0) rewardToastMsg = ''
  }
}

// ----------------------------------------------------
// TOP HUD WIDGET (4 Sci-Fi Buttons in Top Right)
// ----------------------------------------------------
export function TopHudWidget() {
  const profile = getProfile()
  const hasPending = hasUnclaimedRewards()

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 16, right: 20 },
        flexDirection: 'row',
        alignItems: 'center',
        padding: 4
      }}
    >
      {/* 1. Chips Pill (Click to open Pro Shop) */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 34,
          padding: { left: 12, right: 12 },
          margin: { right: 8 },
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: Color4.fromHexString('#ffd700aa')
        }}
        uiBackground={{ color: Color4.fromHexString('#0b1422ea') }}
        onMouseDown={() => {
          setActiveRewardsTab('shop')
          setRewardsModalOpen(true)
        }}
      >
        <RewardsIcon name="coin" size={15} tint="#ffd700" />
        <UiEntity
          uiTransform={{ width: 104, height: 18 }}
          uiText={{
            value: `${profile.chips.toLocaleString()} CHIPS`,
            fontSize: 13,
            color: Color4.fromHexString('#ffd700'),
            textAlign: 'middle-center',
            font: 'sans-serif'
          }}
        />
      </UiEntity>

      {/* 2. Trophies Pill (Click to open Streak & Trophies) */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 34,
          padding: { left: 12, right: 12 },
          margin: { right: 8 },
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: Color4.fromHexString('#00f3ffaa')
        }}
        uiBackground={{ color: Color4.fromHexString('#0b1422ea') }}
        onMouseDown={() => {
          setActiveRewardsTab('streak')
          setRewardsModalOpen(true)
        }}
      >
        <RewardsIcon name="trophy" size={15} tint="#00f3ff" />
        <UiEntity
          uiTransform={{ width: 108, height: 18 }}
          uiText={{
            value: `${profile.trophies} TROPHIES`,
            fontSize: 13,
            color: Color4.fromHexString('#00f3ff'),
            textAlign: 'middle-center',
            font: 'sans-serif'
          }}
        />
      </UiEntity>

      {/* 3. Streak Pill (Click to open Streak) */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 34,
          padding: { left: 12, right: 12 },
          margin: { right: 10 },
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: Color4.fromHexString('#ff7700aa')
        }}
        uiBackground={{ color: Color4.fromHexString('#0b1422ea') }}
        onMouseDown={() => {
          setActiveRewardsTab('streak')
          setRewardsModalOpen(true)
        }}
      >
        <RewardsIcon name="flame" size={15} tint="#ff7700" />
        <UiEntity
          uiTransform={{ width: 70, height: 18 }}
          uiText={{
            value: `DAY ${profile.loginStreak}`,
            fontSize: 13,
            color: Color4.fromHexString('#ff7700'),
            textAlign: 'middle-center',
            font: 'sans-serif'
          }}
        />
      </UiEntity>

      {/* 4. Rewards Button */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          height: 34,
          padding: { left: 14, right: 14 },
          borderRadius: 6,
          borderWidth: 1.5,
          borderColor: hasPending ? Color4.fromHexString('#ffd700') : Color4.fromHexString('#00f3ff')
        }}
        uiBackground={{
          color: hasPending ? Color4.fromHexString('#f59e0bdd') : Color4.fromHexString('#063d4add')
        }}
        onMouseDown={() => {
          setRewardsModalOpen(!getIsRewardsModalOpen())
        }}
      >
        <RewardsIcon name="gift" size={15} tint={hasPending ? '#0b1422' : '#ffffff'} />
        <UiEntity
          uiTransform={{ width: hasPending ? 70 : 62, height: 18 }}
          uiText={{
            value: hasPending ? 'REWARDS (!)' : 'REWARDS',
            fontSize: 13,
            color: hasPending ? Color4.Black() : Color4.White(),
            textAlign: 'middle-center',
            font: 'sans-serif'
          }}
        />
      </UiEntity>
    </UiEntity>
  )
}

// ----------------------------------------------------
// DAILY REWARDS & BOUNTIES MODAL (Sci-Fi Cyber Theme)
// ----------------------------------------------------
export function DailyRewardsModal() {
  if (!getIsRewardsModalOpen()) return null

  const profile = getProfile()
  const activeTab = getActiveRewardsTab()
  const canClaim = canClaimStreak()

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 0, left: 0 },
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      uiBackground={{ color: Color4.fromHexString('#000000cc') }}
    >
      {/* Modal Dialog Box */}
      <UiEntity
        uiTransform={{
          width: 760,
          height: 520,
          flexDirection: 'column',
          alignItems: 'center',
          padding: 18,
          borderRadius: 10,
          borderWidth: 1.5,
          borderColor: Color4.fromHexString('#00f3ff55')
        }}
        uiBackground={{ color: Color4.fromHexString('#080f1efa') }}
      >
        {/* Header Bar */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 48,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            margin: { bottom: 12 }
          }}
        >
          <UiEntity uiTransform={{ flexDirection: 'row', alignItems: 'center' }}>
            <RewardsIcon name="star" size={17} tint="#ffd700" />
            <UiEntity
              uiTransform={{ width: 360, height: 30 }}
              uiText={{
                value: 'CRAZY 8 VIP REWARDS',
                fontSize: 22,
                color: Color4.fromHexString('#ffd700'),
                textAlign: 'middle-left',
                font: 'sans-serif'
              }}
            />
            <RewardsIcon name="star" size={17} tint="#ffd700" marginRight={0} />
          </UiEntity>

          {/* Close Hazard Button */}
          <UiEntity
            uiTransform={{
              width: 32,
              height: 32,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            uiBackground={{
              textureMode: 'stretch',
              texture: { src: 'assets/images/btn_close_hazard.png' }
            }}
            onMouseDown={() => {
              setRewardsModalOpen(false)
              showRewardToast(getStreakReminderMessage())
            }}
          />
        </UiEntity>

        {/* Tab Selection */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 40,
            flexDirection: 'row',
            justifyContent: 'space-between',
            margin: { bottom: 16 }
          }}
        >
          {/* 1. Streak Tab Button */}
          <UiEntity
            uiTransform={{
              width: '32.5%',
              height: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              borderWidth: activeTab === 'streak' ? 0 : 1,
              borderColor: Color4.fromHexString('#ffd70055')
            }}
            uiBackground={{
              color: activeTab === 'streak'
                ? Color4.fromHexString('#ffd700')
                : Color4.fromHexString('#101726')
            }}
            onMouseDown={() => setActiveRewardsTab('streak')}
          >
            <RewardsIcon name="flame" size={16} tint={activeTab === 'streak' ? '#0b1422' : '#ffd700'} />
            <UiEntity
              uiTransform={{ width: 112, height: 18 }}
              uiText={{
                value: '7-DAY STREAK',
                fontSize: 14,
                color: activeTab === 'streak' ? Color4.Black() : Color4.fromHexString('#ffd700'),
                textAlign: 'middle-center',
                font: 'sans-serif'
              }}
            />
          </UiEntity>

          {/* 2. Bounties Tab Button */}
          <UiEntity
            uiTransform={{
              width: '32.5%',
              height: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              borderWidth: activeTab === 'bounties' ? 0 : 1,
              borderColor: Color4.fromHexString('#00f3ff55')
            }}
            uiBackground={{
              color: activeTab === 'bounties'
                ? Color4.fromHexString('#00f3ff')
                : Color4.fromHexString('#101726')
            }}
            onMouseDown={() => setActiveRewardsTab('bounties')}
          >
            <RewardsIcon name="target" size={16} tint={activeTab === 'bounties' ? '#0b1422' : '#00f3ff'} />
            <UiEntity
              uiTransform={{ width: 88, height: 18 }}
              uiText={{
                value: 'BOUNTIES',
                fontSize: 14,
                color: activeTab === 'bounties' ? Color4.Black() : Color4.fromHexString('#00f3ff'),
                textAlign: 'middle-center',
                font: 'sans-serif'
              }}
            />
          </UiEntity>

          {/* 3. Pro Shop Tab Button */}
          <UiEntity
            uiTransform={{
              width: '32.5%',
              height: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              borderWidth: activeTab === 'shop' ? 0 : 1,
              borderColor: Color4.fromHexString('#ff005555')
            }}
            uiBackground={{
              color: activeTab === 'shop'
                ? Color4.fromHexString('#ff0055')
                : Color4.fromHexString('#101726')
            }}
            onMouseDown={() => setActiveRewardsTab('shop')}
          >
            <RewardsIcon name="shop" size={16} tint={activeTab === 'shop' ? '#ffffff' : '#ff5588'} />
            <UiEntity
              uiTransform={{ width: 92, height: 18 }}
              uiText={{
                value: 'PRO SHOP',
                fontSize: 14,
                color: activeTab === 'shop' ? Color4.White() : Color4.fromHexString('#ff5588'),
                textAlign: 'middle-center',
                font: 'sans-serif'
              }}
            />
          </UiEntity>
        </UiEntity>

        {/* TAB 1: 7-DAY STREAK CONTENT */}
        {activeTab === 'streak' && (
          <UiEntity
            uiTransform={{
              width: '100%',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* 7 Days Row */}
            <UiEntity
              uiTransform={{
                width: '100%',
                height: 255,
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: { bottom: 18 }
              }}
            >
              {STREAK_SCHEDULE.map((s) => {
                const isCurrent = profile.loginStreak === s.day
                const isPast = profile.loginStreak > s.day
                const isClaimedToday = isCurrent && !canClaim
                const isDay7 = s.day === 7

                let cardBg = Color4.fromHexString('#0f172a')
                let borderColor = Color4.fromHexString('#1e293b')
                let borderWidth = 1
                let titleColor = Color4.fromHexString('#94a3b8')

                if (isPast || isClaimedToday) {
                  cardBg = Color4.fromHexString('#062414')
                  borderColor = Color4.fromHexString('#10b981')
                  borderWidth = 2
                  titleColor = Color4.fromHexString('#10b981')
                } else if (isDay7) {
                  cardBg = Color4.fromHexString('#22092c')
                  borderColor = Color4.fromHexString('#d946ef')
                  borderWidth = 2
                  titleColor = Color4.White()
                } else if (isCurrent) {
                  cardBg = Color4.fromHexString('#2a2305')
                  borderColor = Color4.fromHexString('#ffd700')
                  borderWidth = 2
                  titleColor = Color4.fromHexString('#ffd700')
                }

                return (
                  <UiEntity
                    key={s.day}
                    uiTransform={{
                      width: 96,
                      height: 250,
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 8,
                      borderRadius: 6,
                      borderWidth,
                      borderColor
                    }}
                    uiBackground={{ color: cardBg }}
                  >
                    {/* Day Number */}
                    <UiEntity
                      uiText={{
                        value: `DAY ${s.day}`,
                        fontSize: 14,
                        color: titleColor,
                        textAlign: 'top-center',
                        font: 'sans-serif'
                      }}
                    />

                    {/* Reward Center details */}
                    <UiEntity
                      uiTransform={{
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%'
                      }}
                    >
                      {/* Day 7 Crown vs Locked Padlock vs Claimed Coin */}
                      {isDay7 ? (
                        <UiEntity
                          uiTransform={{
                            width: 32,
                            height: 34,
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: { top: 4, bottom: 6 }
                          }}
                        >
                          <RewardsIcon name="crown" size={28} tint="#ffd700" marginRight={0} />
                        </UiEntity>
                      ) : (isPast || isClaimedToday || (isCurrent && canClaim)) ? (
                        <UiEntity
                          uiTransform={{
                            width: 32,
                            height: 34,
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: { top: 8, bottom: 4 }
                          }}
                        >
                          <RewardsIcon name="coin" size={24} tint="#ffd700" marginRight={0} />
                        </UiEntity>
                      ) : (
                        <UiEntity
                          uiTransform={{
                            width: 32,
                            height: 34,
                            margin: { top: 6, bottom: 6 }
                          }}
                          uiBackground={{
                            textureMode: 'stretch',
                            texture: { src: 'assets/images/icon_lock.png' }
                          }}
                        />
                      )}

                      <IconMetric icon="coin" value={`+${s.chips}`} tint="#ffd700" width={42} fontSize={15} />
                      <IconMetric icon="trophy" value={`+${s.trophies}`} tint="#00f3ff" width={42} fontSize={13} />
                      {s.specialTitle && (
                        <UiEntity
                          uiTransform={{ margin: { top: 4 } }}
                          uiText={{
                            value: s.specialTitle,
                            fontSize: 10,
                            color: isDay7 ? Color4.fromHexString('#ec4899') : Color4.fromHexString('#ff9900'),
                            textAlign: 'middle-center',
                            font: 'sans-serif'
                          }}
                        />
                      )}
                    </UiEntity>

                    {/* Status Label */}
                    <UiEntity
                      uiText={{
                        value: (isPast || isClaimedToday) ? '✔ CLAIMED' : isCurrent ? (canClaim ? 'READY' : 'LOCKED') : 'LOCKED',
                        fontSize: 11,
                        color: (isPast || isClaimedToday) ? Color4.fromHexString('#10b981') : (isCurrent && canClaim) ? Color4.fromHexString('#ffd700') : Color4.fromHexString('#64748b'),
                        textAlign: 'bottom-center',
                        font: 'sans-serif'
                      }}
                    />
                  </UiEntity>
                )
              })}
            </UiEntity>

            {/* Sci-Fi Streak Claim Button */}
            <UiEntity
              uiTransform={{
                width: 340,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              uiBackground={{
                textureMode: 'stretch',
                texture: { src: 'assets/images/btn_claim_frame.png' }
              }}
              onMouseDown={() => {
                if (canClaim) {
                  const res = claimDailyStreak()
                  if (res.success && res.reward) {
                    showRewardToast(`Claimed Day ${res.reward.day}: +${res.reward.chips} Chips, +${res.reward.trophies} Trophies!`)
                  }
                }
              }}
            >
              <UiEntity
                uiText={{
                  value: canClaim
                    ? `CLAIM DAY ${profile.loginStreak} REWARD!`
                    : `CLAIMED TODAY! (Next reward in 24h)`,
                  fontSize: 15,
                  color: canClaim ? Color4.fromHexString('#ffd700') : Color4.fromHexString('#e2e8f0'),
                  textAlign: 'middle-center',
                  font: 'sans-serif'
                }}
              />
            </UiEntity>
          </UiEntity>
        )}

        {/* TAB 2: DAILY BOUNTIES CONTENT */}
        {activeTab === 'bounties' && (
          <UiEntity
            uiTransform={{
              width: '100%',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {profile.quests.map((q) => {
              const isReady = !q.claimed && q.progress >= q.target
              const pct = Math.min(100, Math.floor((q.progress / q.target) * 100))

              return (
                <UiEntity
                  key={q.id}
                  uiTransform={{
                    width: '100%',
                    height: 86,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: { left: 16, right: 16, top: 10, bottom: 10 },
                    margin: { bottom: 12 },
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isReady ? Color4.fromHexString('#10b981') : Color4.fromHexString('#00f3ff77')
                  }}
                  uiBackground={{ color: Color4.fromHexString('#0a1320ee') }}
                >
                  {/* Quest info (Left) */}
                  <UiEntity
                    uiTransform={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      width: 420
                    }}
                  >
                    <UiEntity
                      uiText={{
                        value: `${q.title} (${q.progress}/${q.target})`,
                        fontSize: 16,
                        color: Color4.White(),
                        textAlign: 'middle-left',
                        font: 'sans-serif'
                      }}
                    />
                    <UiEntity
                      uiText={{
                        value: q.description,
                        fontSize: 12,
                        color: Color4.fromHexString('#94a3b8'),
                        textAlign: 'middle-left',
                        font: 'sans-serif'
                      }}
                    />

                    {/* Progress Bar Container */}
                    <UiEntity
                      uiTransform={{
                        width: '100%',
                        height: 6,
                        margin: { top: 8 },
                        borderRadius: 3
                      }}
                      uiBackground={{ color: Color4.fromHexString('#172338') }}
                    >
                      <UiEntity
                        uiTransform={{
                          width: `${pct}%`,
                          height: '100%',
                          borderRadius: 3
                        }}
                        uiBackground={{
                          color: isReady
                            ? Color4.fromHexString('#10b981')
                            : Color4.fromHexString('#00f3ff')
                        }}
                      />
                    </UiEntity>
                  </UiEntity>

                  {/* Reward badges (Middle) */}
                  <UiEntity
                    uiTransform={{
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 110
                    }}
                  >
                    <IconMetric icon="coin" value={`+${q.rewardChips}`} tint="#ffd700" width={58} fontSize={15} />
                    <IconMetric icon="trophy" value={`+${q.rewardTrophies}`} tint="#00f3ff" width={58} fontSize={13} />
                  </UiEntity>

                  {/* Action Button or Circular Gauge (Right) */}
                  {q.claimed ? (
                    <UiEntity
                      uiTransform={{
                        width: 96,
                        height: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6
                      }}
                      uiBackground={{ color: Color4.fromHexString('#1e293b') }}
                    >
                      <UiEntity
                        uiText={{
                          value: `CLAIMED`,
                          fontSize: 13,
                          color: Color4.fromHexString('#64748b'),
                          textAlign: 'middle-center',
                          font: 'sans-serif'
                        }}
                      />
                    </UiEntity>
                  ) : isReady ? (
                    <UiEntity
                      uiTransform={{
                        width: 96,
                        height: 38,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: Color4.fromHexString('#10b981')
                      }}
                      uiBackground={{ color: Color4.fromHexString('#059669') }}
                      onMouseDown={() => {
                        const success = claimQuest(q.id)
                        if (success) {
                          showRewardToast(`Bounty Complete: +${q.rewardChips} Chips, +${q.rewardTrophies} Trophies!`)
                        }
                      }}
                    >
                      <UiEntity
                        uiText={{
                          value: `CLAIM!`,
                          fontSize: 14,
                          color: Color4.White(),
                          textAlign: 'middle-center',
                          font: 'sans-serif'
                        }}
                      />
                    </UiEntity>
                  ) : (
                    /* Circular Sci-Fi Gauge */
                    <UiEntity
                      uiTransform={{
                        width: 52,
                        height: 52,
                        borderRadius: 26,
                        borderWidth: 2,
                        borderColor: Color4.fromHexString('#00f3ff'),
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      uiBackground={{ color: Color4.fromHexString('#061d2d') }}
                    >
                      <UiEntity
                        uiText={{
                          value: `${pct}%`,
                          fontSize: 13,
                          color: Color4.fromHexString('#00f3ff'),
                          textAlign: 'middle-center',
                          font: 'sans-serif'
                        }}
                      />
                    </UiEntity>
                  )}
                </UiEntity>
              )
            })}
          </UiEntity>
        )}

        {/* TAB 3: VIP PRO SHOP */}
        {activeTab === 'shop' && (
          <UiEntity
            uiTransform={{
              width: '100%',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {/* Sub-Category Filter Bar */}
            <UiEntity
              uiTransform={{
                width: '100%',
                height: 32,
                flexDirection: 'row',
                justifyContent: 'center',
                margin: { bottom: 12 }
              }}
            >
              {(
                [
                  { id: 'all', icon: 'star', label: 'ALL' },
                  { id: 'deck', icon: 'cards', label: 'CARDS' },
                  { id: 'aura', icon: 'aura', label: 'AURAS' },
                  { id: 'title', icon: 'crown', label: 'TITLES' },
                  { id: 'wearable', icon: 'hanger', label: 'GEAR' }
                ] as const
              ).map(cat => {
                const isSelected = getActiveShopCategory() === cat.id
                return (
                  <UiEntity
                    key={cat.id}
                    uiTransform={{
                      padding: { left: 12, right: 12, top: 4, bottom: 4 },
                      margin: { left: 4, right: 4 },
                      flexDirection: 'row',
                      borderRadius: 4,
                      borderWidth: isSelected ? 1.5 : 1,
                      borderColor: isSelected
                        ? Color4.fromHexString('#ff0055')
                        : Color4.fromHexString('#ffffff22'),
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    uiBackground={{
                      color: isSelected
                        ? Color4.fromHexString('#ff005544')
                        : Color4.fromHexString('#0d1726aa')
                    }}
                    onMouseDown={() => setActiveShopCategory(cat.id)}
                  >
                    <RewardsIcon name={cat.icon} size={13} tint={isSelected ? '#ff5588' : '#a0aec0'} />
                    <UiEntity
                      uiTransform={{ width: cat.id === 'all' ? 32 : cat.id === 'wearable' ? 44 : 48, height: 18 }}
                      uiText={{
                        value: cat.label,
                        fontSize: 12,
                        color: isSelected ? Color4.fromHexString('#ff5588') : Color4.fromHexString('#a0aec0'),
                        textAlign: 'middle-left',
                        font: 'sans-serif'
                      }}
                    />
                  </UiEntity>
                )
              })}
            </UiEntity>

            {/* Shop Items 2-Column Grid */}
            <UiEntity
              uiTransform={{
                width: '100%',
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'space-between'
              }}
            >
              {SHOP_CATALOG.filter(
                item => getActiveShopCategory() === 'all' || item.category === getActiveShopCategory()
              )
                .slice(0, 6)
                .map(item => {
                  const unlocked = isItemUnlocked(item.id)
                  const equipped = isItemEquipped(item.id)
                  const canAfford = profile.chips >= item.priceChips && profile.trophies >= item.reqTrophies

                  return (
                    <UiEntity
                      key={item.id}
                      uiTransform={{
                        width: 350,
                        height: 96,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 8,
                        margin: { bottom: 6 },
                        borderRadius: 6,
                        borderWidth: 1.5,
                        borderColor: equipped
                          ? Color4.fromHexString('#10b981aa')
                          : unlocked
                          ? Color4.fromHexString('#00f3ffaa')
                          : Color4.fromHexString('#ffd70044')
                      }}
                      uiBackground={{
                        color: Color4.fromHexString('#0b1424fa')
                      }}
                    >
                      {/* Left: Icon Badge */}
                      <UiEntity
                        uiTransform={{
                          width: 44,
                          height: 44,
                          borderRadius: 22,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderWidth: 1.5,
                          borderColor: Color4.fromHexString(item.badgeColor)
                        }}
                        uiBackground={{ color: Color4.fromHexString('#06111f') }}
                      >
                        <RewardsIcon name={item.icon} size={25} tint={item.badgeColor} marginRight={0} />
                      </UiEntity>

                      {/* Center Info */}
                      <UiEntity
                        uiTransform={{
                          width: 190,
                          height: 74,
                          flexDirection: 'column',
                          justifyContent: 'center',
                          margin: { left: 8 }
                        }}
                      >
                        <UiEntity
                          uiTransform={{ width: 190, height: 18 }}
                          uiText={{
                            value: item.name,
                            fontSize: 13,
                            color: Color4.fromHexString(item.badgeColor),
                            textAlign: 'middle-left',
                            font: 'sans-serif'
                          }}
                        />
                        <UiEntity
                          uiTransform={{ width: 190, height: 38 }}
                          uiText={{
                            value: item.description,
                            fontSize: 10,
                            color: Color4.fromHexString('#94a3b8'),
                            textAlign: 'middle-left',
                            font: 'sans-serif'
                          }}
                        />
                        {item.reqWins !== undefined ? (
                          <IconMetric
                            icon="trophy"
                            value={`${profile.totalWins}/${item.reqWins} WINS`}
                            tint={unlocked ? '#00f3ff' : '#ffd700'}
                            width={132}
                            fontSize={10}
                          />
                        ) : item.priceChips === 0 ? (
                          <UiEntity
                            uiTransform={{ width: 64, height: 18 }}
                            uiText={{
                              value: 'FREE',
                              fontSize: 10,
                              color: unlocked ? Color4.fromHexString('#00f3ff') : Color4.fromHexString('#ffd700'),
                              textAlign: 'middle-left',
                              font: 'sans-serif'
                            }}
                          />
                        ) : (
                          <UiEntity uiTransform={{ flexDirection: 'row', alignItems: 'center', height: 18 }}>
                            <IconMetric
                              icon="coin"
                              value={`${item.priceChips.toLocaleString()}`}
                              tint={unlocked ? '#00f3ff' : '#ffd700'}
                              width={48}
                              fontSize={10}
                            />
                            <IconMetric
                              icon="trophy"
                              value={`${item.reqTrophies}`}
                              tint={unlocked ? '#00f3ff' : '#ffd700'}
                              width={36}
                              fontSize={10}
                            />
                          </UiEntity>
                        )}
                      </UiEntity>

                      {/* Right: Action Button */}
                      <UiEntity
                        uiTransform={{
                          width: 88,
                          height: 32,
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: equipped
                            ? Color4.fromHexString('#10b981')
                            : unlocked
                            ? Color4.fromHexString('#00f3ff')
                            : canAfford
                            ? Color4.fromHexString('#ffd700')
                            : Color4.fromHexString('#475569')
                        }}
                        uiBackground={{
                          color: equipped
                            ? Color4.fromHexString('#062414fa')
                            : unlocked
                            ? Color4.fromHexString('#00f3ff22')
                            : canAfford
                            ? Color4.fromHexString('#ffd70033')
                            : Color4.fromHexString('#1e293b')
                        }}
                        onMouseDown={() => {
                          if (equipped) {
                            const res = equipShopItem(item.id)
                            showRewardToast(res.message)
                            return
                          }
                          if (item.reqWins !== undefined) {
                            if (unlocked) {
                              const res = equipShopItem(item.id)
                              showRewardToast(res.message)
                            } else {
                              showRewardToast(`Win ${item.reqWins - profile.totalWins} more matches to unlock ${item.name}!`)
                            }
                            return
                          }
                          if (unlocked) {
                            const res = equipShopItem(item.id)
                            showRewardToast(res.message)
                          } else if (canAfford) {
                            const res = buyShopItem(item.id)
                            showRewardToast(res.message)
                          } else {
                            showRewardToast(`Need ${item.priceChips.toLocaleString()} Chips & ${item.reqTrophies} trophies!`)
                          }
                        }}
                      >
                        <UiEntity
                          uiText={{
                            value: equipped
                              ? '✔ EQUIPPED'
                              : unlocked
                              ? 'EQUIP'
                              : item.reqWins !== undefined
                              ? `${profile.totalWins}/${item.reqWins} WINS`
                              : canAfford
                              ? 'BUY'
                              : 'LOCKED',
                            fontSize: 11,
                            color: equipped
                              ? Color4.fromHexString('#10b981')
                              : unlocked
                              ? Color4.fromHexString('#00f3ff')
                              : canAfford
                              ? Color4.fromHexString('#ffd700')
                              : Color4.fromHexString('#94a3b8'),
                            textAlign: 'middle-center',
                            font: 'sans-serif'
                          }}
                        />
                      </UiEntity>
                    </UiEntity>
                  )
                })}
            </UiEntity>
          </UiEntity>
        )}
      </UiEntity>
    </UiEntity>
  )
}

// Reward Toast Banner
export function RewardToastBanner() {
  if (rewardToastMsg === '') return null
  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 80 },
        width: 500,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: Color4.fromHexString('#10b981')
      }}
      uiBackground={{ color: Color4.fromHexString('#062414fa') }}
    >
      <UiEntity
        uiText={{
          value: rewardToastMsg,
          fontSize: 17,
          color: Color4.White(),
          textAlign: 'middle-center',
          font: 'sans-serif'
        }}
      />
    </UiEntity>
  )
}
