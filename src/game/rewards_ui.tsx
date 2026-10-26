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
  STREAK_SCHEDULE
} from './economy'

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
// TOP HUD WIDGET
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
      {/* Chips Pill */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 12, right: 12, top: 6, bottom: 6 },
          margin: { right: 8 }
        }}
        uiBackground={{ color: Color4.fromHexString('#0f172aee') }}
      >
        <UiEntity
          uiText={{
            value: `🪙 ${profile.chips.toLocaleString()} CHIPS`,
            fontSize: 14,
            color: Color4.fromHexString('#ffd700'),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>

      {/* Trophies Pill */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 12, right: 12, top: 6, bottom: 6 },
          margin: { right: 8 }
        }}
        uiBackground={{ color: Color4.fromHexString('#0f172aee') }}
      >
        <UiEntity
          uiText={{
            value: `🏆 ${profile.trophies} TROPHIES`,
            fontSize: 14,
            color: Color4.fromHexString('#00f3ff'),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>

      {/* Streak Pill */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 12, right: 12, top: 6, bottom: 6 },
          margin: { right: 10 }
        }}
        uiBackground={{ color: Color4.fromHexString('#0f172aee') }}
      >
        <UiEntity
          uiText={{
            value: `🔥 DAY ${profile.loginStreak}`,
            fontSize: 14,
            color: Color4.fromHexString('#ff7700'),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>

      {/* Rewards Button */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 14, right: 14, top: 8, bottom: 8 }
        }}
        uiBackground={{
          color: hasPending ? Color4.fromHexString('#ffaa00') : Color4.fromHexString('#00f3ff33')
        }}
        onMouseDown={() => {
          setRewardsModalOpen(!getIsRewardsModalOpen())
        }}
      >
        <UiEntity
          uiText={{
            value: hasPending ? `🎁 REWARDS (!)` : `🎁 REWARDS`,
            fontSize: 14,
            color: hasPending ? Color4.Black() : Color4.White(),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>
    </UiEntity>
  )
}

// ----------------------------------------------------
// DAILY REWARDS & BOUNTIES MODAL
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
      uiBackground={{ color: Color4.fromHexString('#000000bb') }}
    >
      {/* Modal Dialog Box */}
      <UiEntity
        uiTransform={{
          width: 760,
          height: 490,
          flexDirection: 'column',
          alignItems: 'center',
          padding: 16
        }}
        uiBackground={{ color: Color4.fromHexString('#0b0f19fc') }}
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
          <UiEntity
            uiText={{
              value: `⭐ CRAZY 8 VIP REWARDS ⭐`,
              fontSize: 22,
              color: Color4.fromHexString('#ffd700'),
              textAlign: 'middle-left'
            }}
          />

          {/* Close Button */}
          <UiEntity
            uiTransform={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            uiBackground={{ color: Color4.fromHexString('#ff2255') }}
            onMouseDown={() => setRewardsModalOpen(false)}
          >
            <UiEntity
              uiText={{
                value: `✕`,
                fontSize: 20,
                color: Color4.White(),
                textAlign: 'middle-center'
              }}
            />
          </UiEntity>
        </UiEntity>

        {/* Tab Selection */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 40,
            flexDirection: 'row',
            margin: { bottom: 16 }
          }}
        >
          {/* Streak Tab Button */}
          <UiEntity
            uiTransform={{
              width: '50%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            uiBackground={{
              color: activeTab === 'streak'
                ? Color4.fromHexString('#ffd700')
                : Color4.fromHexString('#1e293b')
            }}
            onMouseDown={() => setActiveRewardsTab('streak')}
          >
            <UiEntity
              uiText={{
                value: `🔥 7-DAY LOGIN STREAK`,
                fontSize: 16,
                color: activeTab === 'streak' ? Color4.Black() : Color4.White(),
                textAlign: 'middle-center'
              }}
            />
          </UiEntity>

          {/* Bounties Tab Button */}
          <UiEntity
            uiTransform={{
              width: '50%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            uiBackground={{
              color: activeTab === 'bounties'
                ? Color4.fromHexString('#00f3ff')
                : Color4.fromHexString('#1e293b')
            }}
            onMouseDown={() => setActiveRewardsTab('bounties')}
          >
            <UiEntity
              uiText={{
                value: `🎯 DAILY BOUNTIES`,
                fontSize: 16,
                color: activeTab === 'bounties' ? Color4.Black() : Color4.White(),
                textAlign: 'middle-center'
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
                height: 250,
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: { bottom: 20 }
              }}
            >
              {STREAK_SCHEDULE.map((s) => {
                const isCurrent = profile.loginStreak === s.day
                const isPast = profile.loginStreak > s.day
                const isClaimedToday = isCurrent && !canClaim

                let cardBg = Color4.fromHexString('#151c2e')
                let borderColor = Color4.fromHexString('#2d3748')
                let titleColor = Color4.White()

                if (isPast || isClaimedToday) {
                  cardBg = Color4.fromHexString('#062414')
                  borderColor = Color4.fromHexString('#10b981')
                  titleColor = Color4.fromHexString('#10b981')
                } else if (isCurrent) {
                  cardBg = Color4.fromHexString('#2a2305')
                  borderColor = Color4.fromHexString('#ffd700')
                  titleColor = Color4.fromHexString('#ffd700')
                }

                return (
                  <UiEntity
                    key={s.day}
                    uiTransform={{
                      width: 96,
                      height: 240,
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 8
                    }}
                    uiBackground={{ color: cardBg }}
                  >
                    {/* Day Number */}
                    <UiEntity
                      uiText={{
                        value: `DAY ${s.day}`,
                        fontSize: 15,
                        color: titleColor,
                        textAlign: 'top-center'
                      }}
                    />

                    {/* Reward details */}
                    <UiEntity
                      uiTransform={{
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%'
                      }}
                    >
                      <UiEntity
                        uiText={{
                          value: `🪙\n+${s.chips}`,
                          fontSize: 13,
                          color: Color4.fromHexString('#ffd700'),
                          textAlign: 'middle-center'
                        }}
                      />
                      <UiEntity
                        uiText={{
                          value: `🏆 +${s.trophies}`,
                          fontSize: 12,
                          color: Color4.fromHexString('#00f3ff'),
                          textAlign: 'middle-center'
                        }}
                      />
                      {s.specialTitle && (
                        <UiEntity
                          uiTransform={{ margin: { top: 6 } }}
                          uiText={{
                            value: `👑\n${s.specialTitle}`,
                            fontSize: 10,
                            color: Color4.fromHexString('#ff00aa'),
                            textAlign: 'middle-center'
                          }}
                        />
                      )}
                    </UiEntity>

                    {/* Status Label */}
                    <UiEntity
                      uiText={{
                        value: (isPast || isClaimedToday) ? '✓ CLAIMED' : isCurrent ? 'READY' : 'LOCKED',
                        fontSize: 11,
                        color: (isPast || isClaimedToday) ? Color4.fromHexString('#10b981') : isCurrent ? Color4.fromHexString('#ffd700') : Color4.Gray(),
                        textAlign: 'bottom-center'
                      }}
                    />
                  </UiEntity>
                )
              })}
            </UiEntity>

            {/* Streak Claim Button */}
            <UiEntity
              uiTransform={{
                width: 360,
                height: 50,
                alignItems: 'center',
                justifyContent: 'center'
              }}
              uiBackground={{
                color: canClaim
                  ? Color4.fromHexString('#ffd700')
                  : Color4.fromHexString('#222f3e')
              }}
              onMouseDown={() => {
                if (canClaim) {
                  const res = claimDailyStreak()
                  if (res.success && res.reward) {
                    showRewardToast(`🎉 Claimed Day ${res.reward.day}: +${res.reward.chips} Chips, +${res.reward.trophies} Trophies!`)
                  }
                }
              }}
            >
              <UiEntity
                uiText={{
                  value: canClaim
                    ? `CLAIM DAY ${profile.loginStreak} REWARD!`
                    : `CLAIMED TODAY! (Next reward in 24h)`,
                  fontSize: 16,
                  color: canClaim ? Color4.Black() : Color4.fromHexString('#94a3b8'),
                  textAlign: 'middle-center'
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
                    height: 84,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 12,
                    margin: { bottom: 10 }
                  }}
                  uiBackground={{ color: Color4.fromHexString('#131a2c') }}
                >
                  {/* Quest info */}
                  <UiEntity
                    uiTransform={{
                      flexDirection: 'column',
                      justifyContent: 'center',
                      width: 440
                    }}
                  >
                    <UiEntity
                      uiText={{
                        value: `${q.title} (${q.progress}/${q.target})`,
                        fontSize: 16,
                        color: Color4.White(),
                        textAlign: 'middle-left'
                      }}
                    />
                    <UiEntity
                      uiText={{
                        value: q.description,
                        fontSize: 12,
                        color: Color4.fromHexString('#94a3b8'),
                        textAlign: 'middle-left'
                      }}
                    />

                    {/* Progress Bar Container */}
                    <UiEntity
                      uiTransform={{
                        width: '100%',
                        height: 8,
                        margin: { top: 6 }
                      }}
                      uiBackground={{ color: Color4.fromHexString('#222d45') }}
                    >
                      <UiEntity
                        uiTransform={{
                          width: `${pct}%`,
                          height: '100%'
                        }}
                        uiBackground={{
                          color: isReady
                            ? Color4.fromHexString('#10b981')
                            : Color4.fromHexString('#00f3ff')
                        }}
                      />
                    </UiEntity>
                  </UiEntity>

                  {/* Reward badges */}
                  <UiEntity
                    uiTransform={{
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 120
                    }}
                  >
                    <UiEntity
                      uiText={{
                        value: `+${q.rewardChips} 🪙`,
                        fontSize: 14,
                        color: Color4.fromHexString('#ffd700'),
                        textAlign: 'middle-center'
                      }}
                    />
                    <UiEntity
                      uiText={{
                        value: `+${q.rewardTrophies} 🏆`,
                        fontSize: 12,
                        color: Color4.fromHexString('#00f3ff'),
                        textAlign: 'middle-center'
                      }}
                    />
                  </UiEntity>

                  {/* Action Button */}
                  <UiEntity
                    uiTransform={{
                      width: 120,
                      height: 42,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    uiBackground={{
                      color: q.claimed
                        ? Color4.fromHexString('#1e293b')
                        : isReady
                        ? Color4.fromHexString('#10b981')
                        : Color4.fromHexString('#334155')
                    }}
                    onMouseDown={() => {
                      if (isReady) {
                        const success = claimQuest(q.id)
                        if (success) {
                          showRewardToast(`🎉 Bounty Complete: +${q.rewardChips} Chips, +${q.rewardTrophies} Trophies!`)
                        }
                      }
                    }}
                  >
                    <UiEntity
                      uiText={{
                        value: q.claimed ? `CLAIMED` : isReady ? `CLAIM!` : `${pct}%`,
                        fontSize: 14,
                        color: isReady ? Color4.White() : Color4.fromHexString('#94a3b8'),
                        textAlign: 'middle-center'
                      }}
                    />
                  </UiEntity>
                </UiEntity>
              )
            })}
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
        justifyContent: 'center'
      }}
      uiBackground={{ color: Color4.fromHexString('#10b981ee') }}
    >
      <UiEntity
        uiText={{
          value: rewardToastMsg,
          fontSize: 18,
          color: Color4.White(),
          textAlign: 'middle-center'
        }}
      />
    </UiEntity>
  )
}
