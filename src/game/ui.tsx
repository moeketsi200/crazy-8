import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { CrazyEightsGame, GameMode, TURN_TIME_LIMIT_MS, isBotPlayer } from './logic'
import { update3DTable, resolvePlayerId, getPlayerSeated, setPlayerSeated, getPlayerDisplayName, getTimeSeated, standUpPlayer, exitGame, getLocalSeatedChair, sitPlayerAtOpenChair, BOT_NAMES } from './table'
import { getPlayer } from '@dcl/sdk/src/players'
import { Card, Suit } from './deck'
import { TopHudWidget, DailyRewardsModal, RewardToastBanner, updateRewardToast, showRewardToast } from './rewards_ui'

let activeGame: CrazyEightsGame | null = null
let isPlayerInHouse = false

export let uiNotificationMessage = ''
export let uiNotificationSenderId: string | null = null
export let uiNotificationTimer = 0

export function setupUI(game: CrazyEightsGame) {
  activeGame = game
  ReactEcsRenderer.setUiRenderer(uiComponent)
  
  // Wire up game notifications to our UI!
  game.onNotification = (msg: string, senderId?: string) => {
    uiNotificationMessage = msg
    uiNotificationSenderId = senderId || null
    uiNotificationTimer = 4.5 // Show for 4.5 seconds
  }

  // System to countdown notifications and rewards toast
  engine.addSystem((dt) => {
    if (uiNotificationTimer > 0) {
      uiNotificationTimer -= dt
      if (uiNotificationTimer <= 0) {
        uiNotificationMessage = ''
        uiNotificationSenderId = null
      }
    }
    updateRewardToast(dt)
  })
}

// ----------------------------------------------------
// UI COMPONENTS & ASSETS
// ----------------------------------------------------

function getSuitTexture(suit: Suit, rank?: string): string {
  if (rank === 'Joker' || suit === 'None') return 'assets/images/suits/joker.png'
  switch (suit) {
    case 'Hearts': return 'assets/images/suits/heart.png'
    case 'Diamonds': return 'assets/images/suits/diamond.png'
    case 'Clubs': return 'assets/images/suits/club.png'
    case 'Spades': return 'assets/images/suits/spade.png'
    default: return 'assets/images/suits/joker.png'
  }
}

function getCardRankColor(card: Card): Color4 {
  if (card.suit === 'Hearts' || card.suit === 'Diamonds') {
    // High-luminance neon coral rose for maximum readability against dark backgrounds
    return Color4.fromHexString('#FFAEC0')
  }
  if (card.rank === 'Joker' || card.action === 'Wild') {
    return Color4.fromHexString('#FFD700')
  }
  return Color4.fromHexString('#E0FFFF')
}

function getCardBorderColor(card: Card, isPlayable: boolean): Color4 {
  if (!isPlayable) return Color4.fromHexString('#252B3A')
  if (card.suit === 'Hearts' || card.suit === 'Diamonds') {
    // High-luminance electric neon coral red
    return Color4.fromHexString('#FF2A6D')
  }
  if (card.rank === 'Joker' || card.action === 'Wild') {
    return Color4.fromHexString('#FFD700')
  }
  return Color4.fromHexString('#00F3FF')
}

function PlayingCard(props: { key?: string|number, card: Card, isPlayable: boolean, onClick?: () => void }) {
  const { card, isPlayable, onClick } = props
  const isJoker = card.rank === 'Joker' || card.action === 'Draw4'
  const displayRank = isJoker ? '★' : card.rank
  const rankColor = getCardRankColor(card)
  const borderColor = getCardBorderColor(card, isPlayable)
  const cardBg = isPlayable ? Color4.fromHexString('#0c0f16') : Color4.fromHexString('#141720')
  const suitIcon = getSuitTexture(card.suit, card.rank)

  return (
    <UiEntity
      uiTransform={{
        width: 84,
        height: 124,
        margin: { left: 4, right: 4, bottom: isPlayable ? 10 : 0 },
        padding: 2,
      }}
      uiBackground={{ color: borderColor }}
      onMouseDown={onClick}
    >
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: { top: 4, bottom: 4, left: 6, right: 6 }
        }}
        uiBackground={{ color: cardBg }}
      >
        {/* Top Left: Bold Rank & Mini Suit Icon */}
        <UiEntity
          uiTransform={{ width: '100%', height: 26, flexDirection: 'row', alignItems: 'center' }}
        >
          <UiEntity
            uiTransform={{ width: isJoker ? 18 : 22, height: '100%' }}
            uiText={{ value: displayRank, fontSize: isJoker ? 18 : 16, color: rankColor, textAlign: 'middle-left' }}
          />
          <UiEntity
            uiTransform={{ width: 14, height: 14, margin: { left: 2 } }}
            uiBackground={{
              textureMode: 'stretch',
              texture: { src: suitIcon }
            }}
          />
        </UiEntity>
        
        {/* Center: Large High-Resolution Glowing Neon Suit Graphic */}
        <UiEntity
          uiTransform={{
            width: 46,
            height: 46,
            alignSelf: 'center',
            justifyContent: 'center',
            alignItems: 'center'
          }}
          uiBackground={{
            textureMode: 'stretch',
            texture: { src: suitIcon }
          }}
        />

        {/* Subtitle banner for Joker */}
        {isJoker && (
          <UiEntity
            uiTransform={{ width: '100%', height: 14, alignItems: 'center', justifyContent: 'center', positionType: 'absolute', position: { top: 78 } }}
            uiText={{ value: '+4 WILD', fontSize: 10, color: Color4.fromHexString('#FFD700'), textAlign: 'middle-center' }}
          />
        )}

        {/* Bottom Right: Inverted Mini Suit Icon & Rank */}
        <UiEntity
          uiTransform={{ width: '100%', height: 26, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' }}
        >
          <UiEntity
            uiTransform={{ width: 14, height: 14, margin: { right: 2 } }}
            uiBackground={{
              textureMode: 'stretch',
              texture: { src: suitIcon }
            }}
          />
          <UiEntity
            uiTransform={{ width: isJoker ? 18 : 22, height: '100%' }}
            uiText={{ value: displayRank, fontSize: isJoker ? 18 : 16, color: rankColor, textAlign: 'middle-right' }}
          />
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

function DrawDeckCard(props: { onClick?: () => void }) {
  const penalty = activeGame && activeGame.pendingDraws > 0 ? activeGame.pendingDraws : 0
  const isMyTurn = activeGame ? isLocalPlayerTurn(activeGame) : false
  const borderColor = penalty > 0 && isMyTurn ? Color4.fromHexString('#FF2A6D') : Color4.fromHexString('#00f3ff')

  return (
    <UiEntity
      uiTransform={{ width: 84, height: 124, margin: { left: 15, right: 15 }, padding: 2, positionType: 'relative' }}
      uiBackground={{ color: borderColor }}
      onMouseDown={props.onClick}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        uiBackground={{
          textureMode: 'stretch',
          texture: { src: 'assets/images/card_back_logo.png' }
        }}
      >
        {penalty > 0 && (
          <UiEntity
            uiTransform={{
              positionType: 'absolute',
              position: { bottom: 6 },
              width: 76,
              height: 22,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            uiBackground={{ color: Color4.fromHexString('#C91D1Dee') }}
          >
            <UiEntity
              uiTransform={{ width: '100%', height: '100%' }}
              uiText={{ value: `TAKE +${penalty}`, fontSize: 11, color: Color4.White(), textAlign: 'middle-center' }}
            />
          </UiEntity>
        )}
      </UiEntity>
    </UiEntity>
  )
}

// ----------------------------------------------------
// UI STATE
// ----------------------------------------------------
let pendingWildCardIndex: number | null = null
let isGameModePromptOpen = false
let gameModePromptHandler: ((mode: GameMode) => void) | null = null

export function openGameModePrompt(onSelect: (mode: GameMode) => void) {
  gameModePromptHandler = onSelect
  isGameModePromptOpen = true
}

function chooseGameMode(mode: GameMode) {
  const onSelect = gameModePromptHandler
  gameModePromptHandler = null
  isGameModePromptOpen = false
  onSelect?.(mode)
}

// ----------------------------------------------------
// MAIN LAYOUT
// ----------------------------------------------------

// Helper to reliably check if it is the local player's turn
function isLocalPlayerTurn(game: CrazyEightsGame): boolean {
  if (!game || !game.isStarted || game.gameOver) return false
  const currentTurnPlayer = game.getCurrentPlayerId()
  if (!currentTurnPlayer) return false
  if (isBotPlayer(currentTurnPlayer)) return false
  const myId = resolvePlayerId(game)
  if (currentTurnPlayer === myId) return true
  if (currentTurnPlayer === 'player1' && myId === 'player1') return true
  return false
}

function TableArea() {
  if (!activeGame) return null
  const myId = resolvePlayerId(activeGame)
  const isMyTurn = isLocalPlayerTurn(activeGame)
  const topCard = activeGame.getTopDiscard()

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 0, left: 0 },
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <UiEntity
        uiTransform={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { top: 8, bottom: 10, left: 16, right: 16 },
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: Color4.create(0.0, 0.95, 1.0, 0.5)
        }}
        uiBackground={{ color: Color4.create(0.04, 0.06, 0.10, 0.85) }}
      >
        <UiEntity
          uiTransform={{ width: 220, height: 20, margin: { bottom: 6 }, alignItems: 'center', justifyContent: 'center' }}
        >
          <UiEntity
            uiText={{
              value: '🎴 CURRENT TABLE PLAY',
              fontSize: 11,
              color: Color4.fromHexString('#00f3ff'),
              textAlign: 'middle-center'
            }}
          />
        </UiEntity>

        <UiEntity
          uiTransform={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {topCard && (
            <UiEntity
              uiTransform={{
                flexDirection: 'column',
                alignItems: 'center',
                margin: { left: 8, right: 8 }
              }}
            >
              <PlayingCard card={topCard} isPlayable={true} />
              <UiEntity
                uiTransform={{ width: 84, height: 18, margin: { top: 4 }, alignItems: 'center', justifyContent: 'center' }}
                uiText={{ value: 'PLAYED CARD', fontSize: 10, color: Color4.fromHexString('#b9c8dd'), textAlign: 'middle-center' }}
              />
            </UiEntity>
          )}

          <UiEntity
            uiTransform={{
              flexDirection: 'column',
              alignItems: 'center',
              margin: { left: 8, right: 8 }
            }}
          >
            <DrawDeckCard 
              onClick={() => {
                if (!activeGame) return
                if (!isMyTurn) return
                if (pendingWildCardIndex !== null) return
                const success = activeGame.drawCard(myId)
                if (success) update3DTable(activeGame)
              }}
            />
            <UiEntity
              uiTransform={{ width: 84, height: 18, margin: { top: 4 }, alignItems: 'center', justifyContent: 'center' }}
              uiText={{ value: 'DRAW DECK', fontSize: 10, color: Color4.fromHexString('#b9c8dd'), textAlign: 'middle-center' }}
            />
          </UiEntity>
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

function PlayerRosterBar() {
  if (!activeGame || activeGame.playerOrder.length === 0) return null
  if (!activeGame.isStarted && activeGame.gameMode === 'idle') return null

  const myId = resolvePlayerId(activeGame)
  const currentTurnPlayerId = activeGame.isStarted ? (activeGame.getCurrentPlayerId() || '') : ''
  const turnDirection = activeGame.turnDirection // 1 = clockwise, -1 = reversed
  const activePlayers = activeGame.playerOrder.filter(p => !activeGame?.eliminatedPlayers.has(p))
  const isLobby = !activeGame.isStarted && activeGame.lobbyEndTime > Date.now()
  const lobbySeconds = isLobby ? Math.max(0, Math.ceil((activeGame.lobbyEndTime - Date.now()) / 1000)) : 0

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 96, left: 0 },
        width: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <UiEntity
        uiTransform={{
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { top: 6, bottom: 8, left: 14, right: 14 },
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: Color4.create(0.0, 0.95, 1.0, 0.40)
        }}
        uiBackground={{ color: Color4.create(0.05, 0.07, 0.12, 0.88) }}
      >
        {/* Header bar: Title, alive count, direction, and penalty pool */}
        <UiEntity
          uiTransform={{
            width: '100%',
            height: 20,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: { bottom: 6 }
          }}
        >
          <UiEntity
            uiTransform={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <UiEntity
              uiText={{
                value: isLobby
                  ? `👥 LOBBY: ${activeGame.playerOrder.length}/8 PLAYERS (Starts in ${lobbySeconds}s)`
                  : `👥 PLAYERS (${activePlayers.length}/${activeGame.playerOrder.length} Alive)`,
                fontSize: 11,
                color: Color4.fromHexString('#00f3ff'),
                textAlign: 'middle-left'
              }}
            />
          </UiEntity>

          <UiEntity
            uiTransform={{ flexDirection: 'row', alignItems: 'center' }}
          >
            {activeGame.isStarted && (
              <UiEntity
                uiText={{
                  value: turnDirection === 1 ? '↻ CLOCKWISE' : '↺ REVERSED (JACK)',
                  fontSize: 10,
                  color: turnDirection === 1 ? Color4.fromHexString('#ffd700') : Color4.fromHexString('#ff2a6d'),
                  textAlign: 'middle-right'
                }}
              />
            )}
            {activeGame.pendingDraws > 0 && (
              <UiEntity
                uiTransform={{
                  height: 18,
                  padding: { left: 8, right: 8 },
                  margin: { left: 10 },
                  borderRadius: 4,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                uiBackground={{ color: Color4.fromHexString('#c91d1d') }}
              >
                <UiEntity
                  uiText={{
                    value: `🔥 +${activeGame.pendingDraws} PENALTY`,
                    fontSize: 10,
                    color: Color4.White(),
                    textAlign: 'middle-center'
                  }}
                />
              </UiEntity>
            )}
          </UiEntity>
        </UiEntity>

        {/* Players Chips Row */}
        <UiEntity
          uiTransform={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}
        >
          {activeGame.playerOrder.map((pId) => {
            const isMe = pId === myId || (pId === 'player1' && myId === 'player1')
            const isCurrentTurn = activeGame?.isStarted && pId === currentTurnPlayerId
            const isBot = isBotPlayer(pId)
            const hand = activeGame?.players.get(pId) || []
            const cardCount = hand.length
            const isEliminated = activeGame?.eliminatedPlayers.has(pId) || false
            const isSafe = activeGame?.safeDeclared.has(pId) || false
            const isVulnerable = !isEliminated && cardCount > 0 && cardCount <= 3
            const score = activeGame?.scores.get(pId) || 0

            // Resolve name
            let shortName = 'Player'
            if (isMe) {
              shortName = 'YOU'
            } else if (isBot) {
              const num = parseInt(pId.match(/_(\d+)$/)?.[1] || '1', 10)
              shortName = BOT_NAMES[(num - 1) % BOT_NAMES.length] || `Bot ${num}`
            } else {
              const dName = getPlayerDisplayName(pId)
              shortName = dName.length > 8 ? `${dName.slice(0, 7)}…` : dName
            }

            // Avatar userId
            let avatarUserId: string | undefined = undefined
            if (!isBot) {
              avatarUserId = pId === 'player1' ? getPlayer()?.userId : pId
            }

            // Colors
            let chipBorder = Color4.create(0.18, 0.24, 0.36, 0.70)
            let chipBg = Color4.create(0.07, 0.10, 0.16, 0.90)

            if (isEliminated) {
              chipBorder = Color4.create(0.25, 0.25, 0.30, 0.50)
              chipBg = Color4.create(0.05, 0.05, 0.07, 0.60)
            } else if (isCurrentTurn) {
              chipBorder = Color4.fromHexString('#00f3ff')
              chipBg = Color4.create(0.04, 0.18, 0.28, 0.95)
            } else if (isVulnerable && !isSafe) {
              chipBorder = Color4.fromHexString('#ff2a6d')
              chipBg = Color4.create(0.22, 0.05, 0.09, 0.92)
            }

            return (
              <UiEntity
                key={pId}
                uiTransform={{
                  width: 98,
                  height: 64,
                  margin: { left: 3, right: 3, top: 2, bottom: 2 },
                  padding: 4,
                  borderRadius: 8,
                  borderWidth: isCurrentTurn ? 2 : 1,
                  borderColor: chipBorder,
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
                uiBackground={{ color: chipBg }}
              >
                {/* Top: Avatar + Name */}
                <UiEntity
                  uiTransform={{
                    width: '100%',
                    height: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UiEntity
                    uiTransform={{
                      width: 18,
                      height: 18,
                      borderRadius: 9,
                      borderWidth: 1,
                      borderColor: isCurrentTurn ? Color4.fromHexString('#00f3ff') : Color4.fromHexString('#556688'),
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: { right: 3 }
                    }}
                    uiBackground={
                      !isBot && avatarUserId
                        ? { avatarTexture: { userId: avatarUserId } }
                        : { color: Color4.fromHexString('#141f33') }
                    }
                  >
                    {isBot && (
                      <UiEntity
                        uiText={{ value: '🤖', fontSize: 10, textAlign: 'middle-center' }}
                      />
                    )}
                  </UiEntity>

                  <UiEntity
                    uiTransform={{ flexGrow: 1, height: 18, justifyContent: 'center' }}
                    uiText={{
                      value: shortName,
                      fontSize: 11,
                      color: isMe ? Color4.fromHexString('#00f3ff') : Color4.White(),
                      textAlign: 'middle-left'
                    }}
                  />
                </UiEntity>

                {/* Middle: Card count */}
                <UiEntity
                  uiTransform={{
                    width: '100%',
                    height: 18,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <UiEntity
                    uiText={{
                      value: isEliminated ? 'ELIMINATED' : `🎴 ${cardCount} ${cardCount === 1 ? 'card' : 'cards'}`,
                      fontSize: 10,
                      color: isEliminated
                        ? Color4.fromHexString('#777777')
                        : (cardCount === 1 ? Color4.fromHexString('#ff2a6d') : (cardCount <= 3 ? Color4.fromHexString('#ffd700') : Color4.fromHexString('#b9c8dd'))),
                      textAlign: 'middle-center'
                    }}
                  />
                </UiEntity>

                {/* Bottom: Status Tag / Action */}
                {isEliminated ? (
                  <UiEntity
                    uiTransform={{ width: '100%', height: 14, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}
                    uiBackground={{ color: Color4.create(0.15, 0.15, 0.15, 0.8) }}
                  >
                    <UiEntity
                      uiText={{ value: 'OUT', fontSize: 9, color: Color4.fromHexString('#888888'), textAlign: 'middle-center' }}
                    />
                  </UiEntity>
                ) : isCurrentTurn ? (
                  <UiEntity
                    uiTransform={{ width: '100%', height: 14, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}
                    uiBackground={{ color: Color4.fromHexString('#0099ffdd') }}
                  >
                    <UiEntity
                      uiText={{ value: isMe ? '▶ YOUR TURN' : '▶ THINKING', fontSize: 9, color: Color4.White(), textAlign: 'middle-center' }}
                    />
                  </UiEntity>
                ) : isVulnerable && !isSafe ? (
                  <UiEntity
                    uiTransform={{ width: '100%', height: 14, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}
                    uiBackground={{ color: Color4.fromHexString('#ff2a6d') }}
                    onMouseDown={() => {
                      if (activeGame) {
                        activeGame.challengePlayer(myId, pId)
                        update3DTable(activeGame)
                      }
                    }}
                  >
                    <UiEntity
                      uiText={{ value: '🚨 CATCH!', fontSize: 9, color: Color4.White(), textAlign: 'middle-center' }}
                    />
                  </UiEntity>
                ) : isSafe ? (
                  <UiEntity
                    uiTransform={{ width: '100%', height: 14, borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}
                    uiBackground={{ color: Color4.create(0.05, 0.40, 0.25, 0.8) }}
                  >
                    <UiEntity
                      uiText={{ value: '🛡️ SAFE', fontSize: 9, color: Color4.fromHexString('#00ffaa'), textAlign: 'middle-center' }}
                    />
                  </UiEntity>
                ) : (
                  <UiEntity
                    uiTransform={{ width: '100%', height: 14, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <UiEntity
                      uiText={{
                        value: activeGame?.lastPlayerActions.has(pId)
                          ? activeGame.lastPlayerActions.get(pId)!.text
                          : (score > 0 ? `Pts: ${score}` : 'Ready'),
                        fontSize: 9,
                        color: Color4.fromHexString('#88a0c0'),
                        textAlign: 'middle-center'
                      }}
                    />
                  </UiEntity>
                )}
              </UiEntity>
            )
          })}
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

function parseNotification(msg: string, senderId?: string | null) {
  const resolveAvatarUserId = (playerId?: string | null): string | undefined => {
    if (!playerId || isBotPlayer(playerId)) return undefined
    if (playerId === 'player1') return getPlayer()?.userId || undefined
    return playerId
  }

  // Check for declaration: ROOI declares: "I have 3 cards left!"
  const declMatch = msg.match(/(.+?) declares: "I have (\d+)\s*cards?\s*left!"/i) || msg.match(/(.+?) declares: "I have (\d+)\s*card\(s\)\s*left!"/i)
  if (declMatch) {
    const speaker = declMatch[1]
    const count = parseInt(declMatch[2])
    const countStr = count === 1 ? '1 card' : `${count} cards`

    // Resolve userId for avatar snapshot
    let resolvedUserId: string | undefined = resolveAvatarUserId(senderId)
    if (!resolvedUserId && activeGame) {
      for (const pid of activeGame.playerOrder) {
        if (getPlayerDisplayName(pid).toUpperCase() === speaker.toUpperCase() || pid.toUpperCase() === speaker.toUpperCase()) {
          resolvedUserId = resolveAvatarUserId(pid)
          break
        }
      }
    }
    if (!resolvedUserId) {
      const local = getPlayer()
      if (local && (local.name?.toUpperCase() === speaker.toUpperCase() || speaker.toUpperCase() === 'ROOI' || speaker.toUpperCase() === 'PLAYER 1')) {
        resolvedUserId = local.userId
      }
    }

    const isBot = !resolvedUserId

    return {
      isDeclaration: true,
      speaker,
      action: 'declares: "I have ',
      highlight: countStr,
      suffix: ' left!"',
      icon: '🎴',
      userId: isBot ? undefined : resolvedUserId,
      isBot
    }
  }

  // Check for suit change: PLAYER changed the suit to HEARTS!
  const suitMatch = msg.match(/(.+?) changed the suit to (.+?)!/i)
  if (suitMatch) {
    const avatarUserId = resolveAvatarUserId(senderId)
    return {
      isDeclaration: false,
      speaker: suitMatch[1],
      action: 'switched suit to ',
      highlight: suitMatch[2],
      suffix: '!',
      icon: '✨',
      userId: avatarUserId,
      isBot: !avatarUserId
    }
  }

  // Check for caught challenge
  if (msg.includes('CAUGHT')) {
    const avatarUserId = resolveAvatarUserId(senderId)
    return {
      isDeclaration: false,
      speaker: '🚨 CAUGHT',
      action: msg.replace(/🚨\s*CAUGHT!\s*/i, ''),
      highlight: '',
      suffix: '',
      icon: '🚨',
      userId: avatarUserId,
      isBot: !avatarUserId
    }
  }

  // Generic fallback
  return {
    isDeclaration: false,
    speaker: '',
    action: msg,
    highlight: '',
    suffix: '',
    icon: '⚡',
    userId: resolveAvatarUserId(senderId),
    isBot: !resolveAvatarUserId(senderId)
  }
}

function TopBannerNotification() {
  if (uiNotificationMessage === '') return null
  const parsed = parseNotification(uiNotificationMessage, uiNotificationSenderId)
  const messageText = parsed.speaker
    ? `${parsed.speaker} ${parsed.action}${parsed.highlight}${parsed.suffix}`
    : `${parsed.action}${parsed.highlight}${parsed.suffix}`

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 24, left: 0 },
        width: '100%',
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row'
      }}
    >
      <UiEntity
        uiTransform={{
          width: 560,
          height: 72,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row'
        }}
        uiBackground={{
          textureMode: 'stretch',
          texture: { src: 'assets/images/declaration_banner_frame.png' }
        }}
      >
        <UiEntity
          uiTransform={{
            width: '100%',
            height: '100%',
            flexDirection: 'row',
            alignItems: 'center',
            padding: { left: 22, right: 28 }
          }}
        >
          {/* Circular Avatar Container with Cyan Rim & Speech Badge */}
          <UiEntity
            uiTransform={{
              width: 44,
              height: 44,
              alignItems: 'center',
              justifyContent: 'center',
              margin: { left: 10, right: 14 }
            }}
          >
            {/* Avatar Face (Real Snapshot) or Cyber Bot Icon */}
            <UiEntity
              uiTransform={{
                width: 42,
                height: 42,
                borderRadius: 21,
                borderWidth: 1.5,
                borderColor: Color4.fromHexString('#00f3ff'),
                alignItems: 'center',
                justifyContent: 'center'
              }}
              uiBackground={
                parsed.userId
                  ? { avatarTexture: { userId: parsed.userId } }
                  : { color: Color4.fromHexString('#141f33') }
              }
            >
              {!parsed.userId && (
                <UiEntity
                  uiText={{
                    value: parsed.icon || '🤖',
                    fontSize: 22,
                    textAlign: 'middle-center'
                  }}
                />
              )}
            </UiEntity>

            {/* Speech Bubble Icon Badge at bottom-right corner of avatar */}
            <UiEntity
              uiTransform={{
                positionType: 'absolute',
                position: { bottom: -2, right: -2 },
                width: 18,
                height: 18
              }}
              uiBackground={{
                textureMode: 'stretch',
                texture: { src: 'assets/images/speech_badge.png' }
              }}
            />
          </UiEntity>

          {/* Keep the whole announcement in one wrapped text box so fragments cannot overlap. */}
          <UiEntity
            uiTransform={{
              width: 430,
              height: 54,
              alignItems: 'center',
              justifyContent: 'flex-start',
              margin: { right: 8 }
            }}
            uiText={{
              value: messageText,
              fontSize: 16,
              color: parsed.isDeclaration ? Color4.fromHexString('#ffd700') : Color4.fromHexString('#ffffff'),
              textAlign: 'middle-left',
              textWrap: 'wrap',
              font: 'sans-serif'
            }}
          />
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

function getSuitBadgeTheme(suit: Suit | null): { text: Color4, border: Color4, bg: Color4 } {
  switch (suit) {
    case 'Hearts':
    case 'Diamonds':
      return {
        text: Color4.fromHexString('#FFAEC0'),
        border: Color4.fromHexString('#FF2A6D'),
        bg: Color4.create(0.24, 0.04, 0.09, 0.92)
      }
    case 'Clubs':
    case 'Spades':
      return {
        text: Color4.fromHexString('#E0FFFF'),
        border: Color4.fromHexString('#00F3FF'),
        bg: Color4.create(0.03, 0.14, 0.24, 0.92)
      }
    default:
      return {
        text: Color4.fromHexString('#FFF275'),
        border: Color4.fromHexString('#FFD700'),
        bg: Color4.create(0.24, 0.20, 0.04, 0.92)
      }
  }
}

function GameInfoBar() {
  if (!activeGame) return null
  if (activeGame.gameOver) {
    return (
      <UiEntity
        uiTransform={{
          height: 48,
          padding: { left: 24, right: 24 },
          margin: { bottom: 12 },
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 24,
          borderWidth: 2,
          borderColor: Color4.fromHexString('#FFD700')
        }}
        uiBackground={{ color: Color4.create(0.06, 0.08, 0.14, 0.95) }}
      >
        <UiEntity
          uiText={{
            value: `🏆 MATCH COMPLETE`,
            fontSize: 16,
            color: Color4.fromHexString('#FFD700'),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>
    )
  }

  const isMyTurn = isLocalPlayerTurn(activeGame)
  const activeSuit = activeGame.activeSuit || 'Spades'
  const activePlayerId = activeGame.getCurrentPlayerId() || ''
  const hasPenalty = activeGame.pendingDraws > 0
  const isBot = isBotPlayer(activePlayerId)
  
  const suitColors = getSuitBadgeTheme(activeGame.activeSuit)
  const suitIcon = getSuitTexture(activeSuit)

  const secondsRemaining = activeGame.turnDeadlineAt > 0
    ? Math.max(0, Math.ceil((activeGame.turnDeadlineAt - Date.now()) / 1000))
    : TURN_TIME_LIMIT_MS / 1000

  // Turn Theme Colors
  let bannerBorder = Color4.create(0.18, 0.24, 0.36, 0.75)
  let bannerBg = Color4.create(0.05, 0.07, 0.12, 0.92)

  if (hasPenalty && isMyTurn) {
    bannerBorder = Color4.fromHexString('#FF2A6D') // Neon Red Alert
    bannerBg = Color4.create(0.22, 0.04, 0.08, 0.95)
  } else if (isMyTurn) {
    bannerBorder = Color4.fromHexString('#00F3FF') // Electric Cyan Glow
    bannerBg = Color4.create(0.03, 0.14, 0.22, 0.95)
  }

  return (
    <UiEntity
      uiTransform={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        height: 52,
        padding: { left: 16, right: 16, top: 4, bottom: 4 },
        margin: { bottom: 12 },
        borderRadius: 26,
        borderWidth: isMyTurn ? 2 : 1.5,
        borderColor: bannerBorder
      }}
      uiBackground={{ color: bannerBg }}
    >
      {/* 1. Left Status Pill: Your Turn / Opponent Turn */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 14, right: 14 },
          height: 38,
          borderRadius: 19,
          margin: { right: 10 }
        }}
        uiBackground={{
          color: isMyTurn
            ? (hasPenalty ? Color4.fromHexString('#C91D1Dee') : Color4.fromHexString('#0099FFee'))
            : Color4.create(0.12, 0.16, 0.24, 0.85)
        }}
      >
        <UiEntity
          uiTransform={{
            width: 20,
            height: 20,
            margin: { right: 6 },
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <UiEntity
            uiText={{
              value: isMyTurn ? (hasPenalty ? '🔥' : '⚡') : (isBot ? '🤖' : '⏳'),
              fontSize: 15,
              textAlign: 'middle-center'
            }}
          />
        </UiEntity>

        <UiEntity
          uiText={{
            value: isMyTurn
              ? (hasPenalty ? `TAKE OR COUNTER +${activeGame.pendingDraws}` : 'YOUR TURN!')
              : `${getPlayerDisplayName(activePlayerId).toUpperCase()}'S TURN`,
            fontSize: 14,
            color: Color4.White(),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>

      {/* 2. Middle: Active Required Suit Badge with Icon */}
      <UiEntity
        uiTransform={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 12, right: 14 },
          height: 38,
          borderRadius: 19,
          borderWidth: 1.5,
          borderColor: suitColors.border,
          margin: { right: isBot ? 0 : 8 }
        }}
        uiBackground={{ color: suitColors.bg }}
      >
        <UiEntity
          uiTransform={{
            width: 20,
            height: 20,
            margin: { right: 6 }
          }}
          uiBackground={{
            textureMode: 'stretch',
            texture: { src: suitIcon }
          }}
        />
        <UiEntity
          uiText={{
            value: `SUIT: ${(activeGame.activeSuit || 'ANY').toUpperCase()}`,
            fontSize: 13,
            color: suitColors.text,
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>

      {/* 3. Right: Turn Countdown Timer (for human turns) */}
      {!isBot && (
        <UiEntity
          uiTransform={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: { left: 12, right: 12 },
            height: 38,
            borderRadius: 19,
            borderWidth: 1,
            borderColor: secondsRemaining <= 5 ? Color4.fromHexString('#FF2A6D') : Color4.create(0.2, 0.4, 0.6, 0.6)
          }}
          uiBackground={{
            color: secondsRemaining <= 5 ? Color4.create(0.3, 0.05, 0.05, 0.9) : Color4.create(0.08, 0.12, 0.20, 0.9)
          }}
        >
          <UiEntity
            uiText={{
              value: `⏱ ${secondsRemaining}s`,
              fontSize: 13,
              color: secondsRemaining <= 5 ? Color4.fromHexString('#FF2A6D') : Color4.fromHexString('#00F3FF'),
              textAlign: 'middle-center'
            }}
          />
        </UiEntity>
      )}
    </UiEntity>
  )
}

function DeclareButton({ myHand }: { myHand: Card[] }) {
  if (!activeGame || activeGame.gameOver) return null
  const myId = resolvePlayerId(activeGame)
  const isVulnerable = myHand.length > 0 && myHand.length <= 3
  const hasDeclared = activeGame.safeDeclared.has(myId)
  
  if (!isVulnerable || hasDeclared) return null

  return (
    <UiEntity
      uiTransform={{
        width: 340,
        height: 48,
        margin: { bottom: 12 },
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 24,
        borderWidth: 2,
        borderColor: Color4.fromHexString('#FFD700')
      }}
      uiBackground={{ color: Color4.fromHexString('#C91D1Dee') }}
      onMouseDown={() => { if (activeGame) activeGame.declareLowCards(myId) }}
    >
      <UiEntity
        uiText={{
          value: `🚨 DECLARE ${myHand.length} CARD${myHand.length === 1 ? '' : 'S'}! (CLICK)`,
          fontSize: 16,
          color: Color4.White(),
          textAlign: 'middle-center'
        }}
      />
    </UiEntity>
  )
}

function PlayerHandArea({ myHand }: { myHand: Card[] }) {
  if (!activeGame) return null
  const myId = resolvePlayerId(activeGame)
  const isMyTurn = isLocalPlayerTurn(activeGame)
  const isChoosingSuit = pendingWildCardIndex !== null

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 20 } }}
    >
      {myHand.map((card, index) => {
        const canPlay = isMyTurn && !isChoosingSuit && activeGame?.isValidPlay(card, myId)

        return (
          <PlayingCard
            key={index}
            card={card}
            isPlayable={!!canPlay}
            onClick={() => {
              if (canPlay && activeGame) {
                if (card.action === 'Wild' || card.action === 'Draw4') {
                  pendingWildCardIndex = index
                } else {
                  const success = activeGame.playCard(myId, index)
                  if (success) update3DTable(activeGame)
                }
              }
            }}
          />
        )
      })}
    </UiEntity>
  )
}

function SuitPickerModal() {
  if (pendingWildCardIndex === null) return null

  const suits: Array<{ suit: Suit, label: string, color: Color4, border: Color4, icon: string }> = [
    { suit: 'Hearts', label: 'HEARTS', color: Color4.fromHexString('#FFAEC0'), border: Color4.fromHexString('#FF2A6D'), icon: 'assets/images/suits/heart.png' },
    { suit: 'Diamonds', label: 'DIAMONDS', color: Color4.fromHexString('#FFAEC0'), border: Color4.fromHexString('#FF2A6D'), icon: 'assets/images/suits/diamond.png' },
    { suit: 'Clubs', label: 'CLUBS', color: Color4.fromHexString('#E0FFFF'), border: Color4.fromHexString('#00F3FF'), icon: 'assets/images/suits/club.png' },
    { suit: 'Spades', label: 'SPADES', color: Color4.fromHexString('#E0FFFF'), border: Color4.fromHexString('#00F3FF'), icon: 'assets/images/suits/spade.png' }
  ]

  return (
    <UiEntity
      uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#000000dd') }}
    >
      <UiEntity uiText={{ value: 'CHOOSE YOUR SUIT!', fontSize: 28, color: Color4.White() }} uiTransform={{ margin: { bottom: 25 } }} />
      <UiEntity uiTransform={{ flexDirection: 'row' }}>
        {suits.map((item) => {
          return (
            <UiEntity
              key={item.suit}
              uiTransform={{
                width: 96,
                height: 110,
                margin: 10,
                padding: 2,
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              uiBackground={{ color: item.border }}
              onMouseDown={() => {
                if (activeGame && pendingWildCardIndex !== null) {
                  const myId = resolvePlayerId(activeGame)
                  activeGame.playCard(myId, pendingWildCardIndex, item.suit)
                  pendingWildCardIndex = null
                  update3DTable(activeGame)
                }
              }}
            >
              <UiEntity
                uiTransform={{
                  width: '100%',
                  height: '100%',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 6
                }}
                uiBackground={{ color: Color4.fromHexString('#0c0f16') }}
              >
                <UiEntity
                  uiTransform={{ width: 50, height: 50, margin: { bottom: 8 } }}
                  uiBackground={{
                    textureMode: 'stretch',
                    texture: { src: item.icon }
                  }}
                />
                <UiEntity
                  uiTransform={{ width: '100%', height: 20 }}
                  uiText={{ value: item.label, fontSize: 13, color: item.color, textAlign: 'middle-center' }}
                />
              </UiEntity>
            </UiEntity>
          )
        })}
      </UiEntity>
    </UiEntity>
  )
}

function GameModeModal() {
  if (!isGameModePromptOpen) return null

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
      uiBackground={{ color: Color4.fromHexString('#000000dd') }}
    >
      <UiEntity
        uiTransform={{
          width: 540,
          height: 330,
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
          borderWidth: 2,
          borderColor: Color4.fromHexString('#00f3ff')
        }}
        uiBackground={{ color: Color4.fromHexString('#101725ff') }}
      >
        <UiEntity
          uiTransform={{ width: '100%', height: 42, margin: { bottom: 8 }, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: 'START A CRAZY 8s GAME', fontSize: 26, color: Color4.White(), textAlign: 'middle-center' }}
        />
        <UiEntity
          uiTransform={{ width: '100%', height: 44, margin: { bottom: 24 }, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: 'Choose how you want to play', fontSize: 17, color: Color4.fromHexString('#b9c8dd'), textAlign: 'middle-center' }}
        />
        <UiEntity uiTransform={{ width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
          <UiEntity
            uiTransform={{ width: 210, height: 82, margin: { right: 12 }, alignItems: 'center', justifyContent: 'center' }}
            uiBackground={{ color: Color4.fromHexString('#10B981') }}
            onMouseDown={() => chooseGameMode('solo')}
          >
            <UiEntity
              uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              uiText={{ value: 'SOLO\nYOU + 7 BOTS', fontSize: 17, color: Color4.White(), textAlign: 'middle-center' }}
            />
          </UiEntity>
          <UiEntity
            uiTransform={{ width: 210, height: 82, margin: { left: 12 }, alignItems: 'center', justifyContent: 'center' }}
            uiBackground={{ color: Color4.fromHexString('#0099FF') }}
            onMouseDown={() => chooseGameMode('multiplayer')}
          >
            <UiEntity
              uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
              uiText={{ value: 'MULTIPLAYER\n30 SECOND LOBBY', fontSize: 17, color: Color4.White(), textAlign: 'middle-center' }}
            />
          </UiEntity>
        </UiEntity>
        <UiEntity
          uiTransform={{ width: 150, height: 34, margin: { top: 16 }, alignItems: 'center', justifyContent: 'center' }}
          onMouseDown={() => chooseGameModePromptCancel()}
        >
          <UiEntity uiText={{ value: 'CANCEL', fontSize: 14, color: Color4.fromHexString('#b9c8dd'), textAlign: 'middle-center' }} />
        </UiEntity>
        <UiEntity
          uiTransform={{ width: '100%', height: 24, margin: { top: 8 }, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: 'Special action cards cannot be your final card.', fontSize: 13, color: Color4.fromHexString('#ffd166'), textAlign: 'middle-center' }}
        />
      </UiEntity>
    </UiEntity>
  )
}

function chooseGameModePromptCancel() {
  isGameModePromptOpen = false
  gameModePromptHandler = null
}

function LiveMatchFeed() {
  if (!activeGame || activeGame.actionHistory.length === 0) return null
  if (!activeGame.isStarted && activeGame.gameMode === 'idle') return null

  const recent = activeGame.actionHistory.slice(0, 4)
  const myId = resolvePlayerId(activeGame)

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 205, left: 16 },
        width: 250,
        flexDirection: 'column',
        padding: 8,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: Color4.create(0.0, 0.95, 1.0, 0.45)
      }}
      uiBackground={{ color: Color4.create(0.04, 0.06, 0.10, 0.88) }}
    >
      {/* Header */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 18,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: { bottom: 6 }
        }}
      >
        <UiEntity
          uiTransform={{ flexDirection: 'row', alignItems: 'center' }}
        >
          <UiEntity
            uiTransform={{ width: 8, height: 8, borderRadius: 4, margin: { right: 6 } }}
            uiBackground={{ color: Color4.fromHexString('#00ffaa') }}
          />
          <UiEntity
            uiText={{
              value: 'LIVE MATCH FEED',
              fontSize: 10,
              color: Color4.fromHexString('#00f3ff'),
              textAlign: 'middle-left'
            }}
          />
        </UiEntity>
        <UiEntity
          uiText={{
            value: 'REAL-TIME',
            fontSize: 9,
            color: Color4.fromHexString('#6d8099'),
            textAlign: 'middle-right'
          }}
        />
      </UiEntity>

      {/* Action entries */}
      {recent.map((entry, idx) => {
        const isLatest = idx === 0
        const isMe = entry.playerId === myId || (entry.playerId === 'player1' && myId === 'player1')
        const bg = isLatest ? Color4.create(0.08, 0.16, 0.24, 0.9) : Color4.create(0.06, 0.08, 0.12, 0.7)
        const border = isLatest ? Color4.fromHexString('#00f3ff88') : Color4.create(0.15, 0.20, 0.30, 0.4)

        return (
          <UiEntity
            key={entry.id}
            uiTransform={{
              width: '100%',
              height: 24,
              flexDirection: 'row',
              alignItems: 'center',
              padding: { left: 6, right: 6 },
              margin: { top: 2, bottom: 2 },
              borderRadius: 4,
              borderWidth: 1,
              borderColor: border
            }}
            uiBackground={{ color: bg }}
          >
            <UiEntity
              uiTransform={{ flexGrow: 1, height: '100%', justifyContent: 'center' }}
              uiText={{
                value: entry.text,
                fontSize: 10,
                color: isLatest ? (isMe ? Color4.fromHexString('#00f3ff') : Color4.White()) : Color4.fromHexString('#9cb0c9'),
                textAlign: 'middle-left'
              }}
            />
          </UiEntity>
        )
      })}
    </UiEntity>
  )
}

function uiComponent() {
  // Proximity & Seated Check:
  // Strict rule: Hand cards are ONLY shown if the avatar is actually SEATED in a chair!
  const isSeated = getPlayerSeated()

  let isNearTable = false
  const playerTransform = Transform.getOrNull(engine.PlayerEntity)
  if (playerTransform) {
    const px = playerTransform.position.x
    const pz = playerTransform.position.z
    // Table center is at world coordinates (16, 25)
    const dx = px - 16
    const dz = pz - 25
    const horizontalDist = Math.sqrt(dx * dx + dz * dz)

    if (horizontalDist <= 4.0) {
      isNearTable = true
    }

    // Strict Chair-Anchor Check: If avatar stands up with WASD/Space, unseat immediately!
    if (isSeated) {
      const seatedChair = getLocalSeatedChair()
      if (seatedChair) {
        const chairDx = px - seatedChair.sitPosition.x
        const chairDz = pz - seatedChair.sitPosition.z
        const distFromChair = Math.sqrt(chairDx * chairDx + chairDz * chairDz)
        if (distFromChair > 0.6 && Date.now() - getTimeSeated() > 1000) {
          standUpPlayer()
        }
      } else if (horizontalDist > 3.0) {
        standUpPlayer()
      }
    }
  }

  // Standing up releases the chair, but doesn't leave the match. Only Exit Game removes the player.
  const myId = activeGame ? resolvePlayerId(activeGame) : ''
  const isInActiveGame = !!(activeGame && activeGame.gameMode !== 'idle' && activeGame.players.has(myId))
  const isTableActive = !!(activeGame && activeGame.isStarted && activeGame.players.has(myId))

  // Resolve local player's hand
  let myHand: Card[] = []
  if (isTableActive && activeGame) {
    myHand = activeGame.players.get(myId) || []
    if (myHand.length === 0 && activeGame.players.has('player1') && (myId === 'player1' || !myId)) {
      myHand = activeGame.players.get('player1') || []
    }
  }

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        positionType: 'relative',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end'
      }}
    >
      {/* Permanent Economy HUD in Top Right */}
      <TopHudWidget />

      {/* Leave Table / Stand Up Button (Only when seated at table) */}
      {isSeated && (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { top: 75, left: 24 },
            width: 140,
            height: 38,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          uiBackground={{ color: Color4.create(0.12, 0.14, 0.20, 0.90) }}
          onMouseDown={() => {
            standUpPlayer()
          }}
        >
          <UiEntity
            uiTransform={{ width: '100%', height: '100%' }}
            uiText={{ value: '🚪 LEAVE TABLE', fontSize: 13, color: Color4.fromHexString('#ff4444'), textAlign: 'middle-center' }}
          />
        </UiEntity>
      )}

      {/* Match membership lasts until the player explicitly exits, even after standing up. */}
      {isInActiveGame && (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { top: 75, left: 174 },
            width: 132,
            height: 38,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          uiBackground={{ color: Color4.create(0.28, 0.08, 0.10, 0.96) }}
          onMouseDown={() => exitGame()}
        >
          <UiEntity
            uiTransform={{ width: '100%', height: '100%' }}
            uiText={{ value: 'EXIT GAME', fontSize: 13, color: Color4.fromHexString('#ff7777'), textAlign: 'middle-center' }}
          />
        </UiEntity>
      )}

      {/* Spectator Indicator (when standing near table unseated) */}
      {!isSeated && isNearTable && activeGame && activeGame.lobbyEndTime > Date.now() && (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            position: { bottom: 25 },
            width: 380,
            height: 42,
            alignItems: 'center',
            justifyContent: 'center'
          }}
          uiBackground={{ color: Color4.create(0.08, 0.10, 0.16, 0.95) }}
          onMouseDown={() => {
            if (!activeGame) return
            if (!getPlayerSeated() && !sitPlayerAtOpenChair()) {
              showRewardToast('No chair is available at this table.')
              return
            }
            const myId = resolvePlayerId(activeGame)
            const alreadyJoined = activeGame.playerOrder.includes(myId)
            if (!alreadyJoined && !activeGame.tryJoinLobby(myId)) {
              showRewardToast('This lobby is full or the 30-second join window has closed.')
              return
            }
            update3DTable(activeGame)
            showRewardToast(alreadyJoined ? 'You are already in this lobby.' : 'You joined the lobby. The game starts when the timer ends.')
          }}
        >
          <UiEntity
            uiTransform={{ width: '100%', height: '100%' }}
            uiText={{ value: '👉 Click Here to Join Lobby!', fontSize: 13, color: Color4.fromHexString('#00f3ff'), textAlign: 'middle-center' }}
          />
        </UiEntity>
      )}

      {/* Rewards Toast notification */}
      <RewardToastBanner />

      {/* Daily Rewards & Bounties Modal (when opened) */}
      <DailyRewardsModal />

      {/* Game Notifications */}
      <TopBannerNotification />

      {/* In-Game Player Roster Bar (Who's playing, turn order & card counts) */}
      {(isTableActive || isInActiveGame) && <PlayerRosterBar />}

      {/* In-Game Played Card & Table Area (Centered in the MIDDLE of the screen) */}
      {isTableActive && <TableArea />}

      {/* Real-Time Live Match Action Feed (Who played, drew, skipped, caught) */}
      {(isTableActive || isInActiveGame) && <LiveMatchFeed />}

      {/* In-Game Table Controls (STRICTLY shown only when seated) */}
      {isTableActive && (
        <UiEntity
          uiTransform={{
            width: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-end'
          }}
        >
          <GameInfoBar />
          <DeclareButton myHand={myHand} />
          <PlayerHandArea myHand={myHand} />
          <SuitPickerModal />
        </UiEntity>
      )}

      <GameModeModal />
    </UiEntity>
  )
}


