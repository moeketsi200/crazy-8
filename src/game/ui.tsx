import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { CrazyEightsGame, GameMode, isBotPlayer } from './logic'
import { update3DTable, resolvePlayerId, getPlayerSeated, setPlayerSeated, getPlayerDisplayName, getTimeSeated, standUpPlayer, getLocalSeatedChair, sitPlayerAtOpenChair } from './table'
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
        margin: { left: 4, right: 4 },
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
      uiTransform={{ width: '100%', height: 130, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 15 } }}
    >
      {topCard && <PlayingCard card={topCard} isPlayable={true} />}
      <DrawDeckCard 
        onClick={() => {
          if (!activeGame) return
          if (!isMyTurn) return
          if (pendingWildCardIndex !== null) return
          const success = activeGame.drawCard(myId)
          if (success) update3DTable(activeGame)
        }}
      />
    </UiEntity>
  )
}

function parseNotification(msg: string, senderId?: string | null) {
  // Check for declaration: ROOI declares: "I have 3 cards left!"
  const declMatch = msg.match(/(.+?) declares: "I have (\d+)\s*cards?\s*left!"/i) || msg.match(/(.+?) declares: "I have (\d+)\s*card\(s\)\s*left!"/i)
  if (declMatch) {
    const speaker = declMatch[1]
    const count = parseInt(declMatch[2])
    const countStr = count === 1 ? '1 card' : `${count} cards`

    // Resolve userId for avatar snapshot
    let resolvedUserId: string | undefined = senderId || undefined
    if (!resolvedUserId && activeGame) {
      for (const pid of activeGame.playerOrder) {
        if (getPlayerDisplayName(pid).toUpperCase() === speaker.toUpperCase() || pid.toUpperCase() === speaker.toUpperCase()) {
          resolvedUserId = pid
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

    const isBot = !resolvedUserId || resolvedUserId.toLowerCase().includes('bot')

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
    return {
      isDeclaration: false,
      speaker: suitMatch[1],
      action: 'switched suit to ',
      highlight: suitMatch[2],
      suffix: '!',
      icon: '✨',
      userId: undefined,
      isBot: false
    }
  }

  // Check for caught challenge
  if (msg.includes('CAUGHT')) {
    return {
      isDeclaration: false,
      speaker: '🚨 CAUGHT',
      action: msg.replace(/🚨\s*CAUGHT!\s*/i, ''),
      highlight: '',
      suffix: '',
      icon: '🚨',
      userId: undefined,
      isBot: false
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
    userId: undefined,
    isBot: false
  }
}

function TopBannerNotification() {
  if (uiNotificationMessage === '') return null
  const parsed = parseNotification(uiNotificationMessage, uiNotificationSenderId)

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 24 },
        width: 566,
        height: 68,
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

        {/* Text Line: SPEAKER (Cyan) + declares: "I have (White) + COUNT (Gold) + left!" (White) */}
        <UiEntity
          uiTransform={{
            flexDirection: 'row',
            alignItems: 'center',
            flexGrow: 1
          }}
        >
          {parsed.speaker !== '' && (
            <UiEntity
              uiTransform={{ margin: { right: 6 } }}
              uiText={{
                value: parsed.speaker,
                fontSize: 18,
                color: Color4.fromHexString('#00f3ff'),
                textAlign: 'middle-left',
                font: 'sans-serif'
              }}
            />
          )}

          <UiEntity
            uiText={{
              value: parsed.action,
              fontSize: 17,
              color: Color4.fromHexString('#ffffff'),
              textAlign: 'middle-left',
              font: 'sans-serif'
            }}
          />

          {parsed.highlight !== '' && (
            <UiEntity
              uiTransform={{ margin: { left: 4, right: 4 } }}
              uiText={{
                value: parsed.highlight,
                fontSize: 18,
                color: Color4.fromHexString('#ffd700'),
                textAlign: 'middle-left',
                font: 'sans-serif'
              }}
            />
          )}

          {parsed.suffix !== '' && (
            <UiEntity
              uiText={{
                value: parsed.suffix,
                fontSize: 17,
                color: Color4.fromHexString('#ffffff'),
                textAlign: 'middle-left',
                font: 'sans-serif'
              }}
            />
          )}
        </UiEntity>
      </UiEntity>
    </UiEntity>
  )
}

function GameInfoBar() {
  if (!activeGame) return null
  if (activeGame.gameOver) {
    return (
      <UiEntity
        uiTransform={{ width: '100%', height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 15 } }}
        uiBackground={{ color: Color4.fromHexString('#000000cc') }}
      >
        <UiEntity
          uiText={{
            value: `GAME OVER!`,
            fontSize: 18, color: Color4.White(), textAlign: 'middle-center'
          }}
        />
      </UiEntity>
    )
  }

  const isMyTurn = isLocalPlayerTurn(activeGame)
  const activeSuit = activeGame.activeSuit
  const activePlayerId = activeGame.getCurrentPlayerId() || ''
  const turnLabel = isMyTurn ? 'YOUR TURN!' : `${getPlayerDisplayName(activePlayerId).toUpperCase()}'S TURN`
  const penaltyLabel = activeGame.pendingDraws > 0 ? ` • 🔥 PENALTY: +${activeGame.pendingDraws}` : ''

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 15 } }}
      uiBackground={{ color: activeGame.pendingDraws > 0 ? Color4.fromHexString('#8b0000dd') : Color4.fromHexString('#000000cc') }}
    >
      <UiEntity
        uiText={{
          value: `${turnLabel}${penaltyLabel} (Suit: ${activeSuit})`,
          fontSize: 18, color: Color4.White(), textAlign: 'middle-center'
        }}
      />
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
      uiTransform={{ width: 300, height: 50, margin: { bottom: 10 }, justifyContent: 'center', alignItems: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#ff2222ff') }}
      onMouseDown={() => { if (activeGame) activeGame.declareLowCards(myId) }}
    >
      <UiEntity uiText={{ value: `DECLARE ${myHand.length} CARD(S)!`, fontSize: 22, color: Color4.White() }} />
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

  // Cards are strictly visible ONLY if seated at the table!
  const isTableActive = !!(activeGame && activeGame.isStarted && isSeated)

  // Resolve local player's hand
  let myHand: Card[] = []
  if (isTableActive && activeGame) {
    const myId = resolvePlayerId(activeGame)
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
          <TableArea />
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


