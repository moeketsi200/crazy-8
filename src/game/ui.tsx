import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { CrazyEightsGame } from './logic'
import { update3DTable, getPlayerSeated, setPlayerSeated, getTimeSeated } from './table'
import { getPlayer } from '@dcl/sdk/src/players'
import { Card } from './deck'
import { TopHudWidget, DailyRewardsModal, RewardToastBanner, updateRewardToast } from './rewards_ui'

let activeGame: CrazyEightsGame | null = null
let isPlayerInHouse = false

export let uiNotificationMessage = ''
export let uiNotificationTimer = 0

export function setupUI(game: CrazyEightsGame) {
  activeGame = game
  ReactEcsRenderer.setUiRenderer(uiComponent)
  
  // Wire up game notifications to our UI!
  game.onNotification = (msg: string) => {
    uiNotificationMessage = msg
    uiNotificationTimer = 4.0 // Show for 4 seconds
  }

  // System to countdown notifications and rewards toast
  engine.addSystem((dt) => {
    if (uiNotificationTimer > 0) {
      uiNotificationTimer -= dt
      if (uiNotificationTimer <= 0) uiNotificationMessage = ''
    }
    updateRewardToast(dt)
  })
}

// ----------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------

function getCardSymbol(card: Card): string {
  switch (card.suit) {
    case 'Hearts': return '♥'
    case 'Diamonds': return '♦'
    case 'Clubs': return '♣'
    case 'Spades': return '♠'
    default: return card.rank === 'Joker' ? '★' : ''
  }
}

function getCardColor(card: Card): Color4 {
  return (card.suit === 'Hearts' || card.suit === 'Diamonds') 
    ? Color4.fromHexString('#ff007b') 
    : Color4.fromHexString('#00f3ff')
}

function PlayingCard(props: { key?: string|number, card: Card, isPlayable: boolean, onClick?: () => void }) {
  const { card, isPlayable, onClick } = props
  const color = getCardColor(card)
  const symbol = getCardSymbol(card)
  const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds'
  const neonAccent = isRed ? Color4.fromHexString('#ff007b') : Color4.fromHexString('#00f3ff')
  const borderColor = isPlayable ? neonAccent : Color4.fromHexString('#232838')
  const cardBg = isPlayable ? Color4.fromHexString('#0b0e14') : Color4.fromHexString('#141720')

  return (
    <UiEntity
      uiTransform={{
        width: 82,
        height: 122,
        margin: { left: 5, right: 5 },
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
          padding: 6
        }}
        uiBackground={{ color: cardBg }}
      >
        {/* Top Left Rank/Suit */}
        <UiEntity
          uiTransform={{ width: '100%', height: 32 }}
          uiText={{ value: `${card.rank}\n${symbol}`, fontSize: 13, color: color, textAlign: 'top-left' }}
        />
        
        {/* Center Huge Suit */}
        <UiEntity
          uiTransform={{ width: '100%', height: 42, alignItems: 'center', justifyContent: 'center' }}
          uiText={{ value: symbol, fontSize: 44, color: color, textAlign: 'middle-center' }}
        />

        {/* Bottom Right Rank/Suit */}
        <UiEntity
          uiTransform={{ width: '100%', height: 32 }}
          uiText={{ value: `${card.rank}\n${symbol}`, fontSize: 13, color: color, textAlign: 'bottom-right' }}
        />
      </UiEntity>
    </UiEntity>
  )
}

function DrawDeckCard(props: { onClick?: () => void }) {
  return (
    <UiEntity
      uiTransform={{ width: 82, height: 122, margin: { left: 15, right: 15 }, padding: 2 }}
      uiBackground={{ color: Color4.fromHexString('#00f3ff') }}
      onMouseDown={props.onClick}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: '100%' }}
        uiBackground={{
          textureMode: 'stretch',
          texture: { src: 'assets/images/card_back_logo.png' }
        }}
      />
    </UiEntity>
  )
}

// ----------------------------------------------------
// UI STATE
// ----------------------------------------------------
let pendingWildCardIndex: number | null = null

// ----------------------------------------------------
// MAIN LAYOUT
// ----------------------------------------------------

function TableArea() {
  if (!activeGame) return null
  const player = getPlayer()
  const myId = player ? player.userId : 'player1'
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === myId
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

function parseNotification(msg: string) {
  // Check for declaration: ROOI declares: "I have 3 cards left!"
  const declMatch = msg.match(/(.+?) declares: "I have (\d+)\s*cards?\s*left!"/i) || msg.match(/(.+?) declares: "I have (\d+)\s*card\(s\)\s*left!"/i)
  if (declMatch) {
    const speaker = declMatch[1]
    const count = parseInt(declMatch[2])
    const countStr = count === 1 ? '1 card' : `${count} cards`
    return {
      speaker,
      action: 'declares: "I have ',
      highlight: countStr,
      suffix: ' left!"',
      icon: '🎴'
    }
  }

  // Check for suit change: PLAYER changed the suit to HEARTS!
  const suitMatch = msg.match(/(.+?) changed the suit to (.+?)!/i)
  if (suitMatch) {
    return {
      speaker: suitMatch[1],
      action: 'switched suit to ',
      highlight: suitMatch[2],
      suffix: '!',
      icon: '✨'
    }
  }

  // Check for caught challenge
  if (msg.includes('CAUGHT')) {
    return {
      speaker: '🚨 CAUGHT',
      action: msg.replace(/🚨\s*CAUGHT!\s*/i, ''),
      highlight: '',
      suffix: '',
      icon: '🚨'
    }
  }

  // Generic fallback
  return {
    speaker: '',
    action: msg,
    highlight: '',
    suffix: '',
    icon: '⚡'
  }
}

function TopBannerNotification() {
  if (uiNotificationMessage === '') return null
  const parsed = parseNotification(uiNotificationMessage)

  return (
    <UiEntity
      uiTransform={{
        positionType: 'absolute',
        position: { top: 28 },
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2
      }}
      uiBackground={{ color: Color4.fromHexString('#00f3ff') }}
    >
      <UiEntity
        uiTransform={{
          height: '100%',
          flexDirection: 'row',
          alignItems: 'center',
          padding: { left: 16, right: 20, top: 4, bottom: 4 }
        }}
        uiBackground={{ color: Color4.fromHexString('#090d16fa') }}
      >
        {/* Left Tech Bracket */}
        <UiEntity
          uiTransform={{ margin: { right: 8 } }}
          uiText={{ value: '⟨', fontSize: 24, color: Color4.fromHexString('#00f3ff'), textAlign: 'middle-center' }}
        />

        {/* Circular Avatar / Badge Icon */}
        <UiEntity
          uiTransform={{
            width: 40,
            height: 40,
            alignItems: 'center',
            justifyContent: 'center',
            margin: { right: 12 }
          }}
          uiBackground={{ color: Color4.fromHexString('#162238') }}
        >
          <UiEntity
            uiText={{
              value: parsed.icon,
              fontSize: 20,
              textAlign: 'middle-center'
            }}
          />
        </UiEntity>

        {/* Text Segments: Speaker (Cyan) + Action (White) + Highlight (Gold) + Suffix */}
        <UiEntity
          uiTransform={{
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {parsed.speaker !== '' && (
            <UiEntity
              uiTransform={{ margin: { right: 6 } }}
              uiText={{
                value: parsed.speaker,
                fontSize: 17,
                color: Color4.fromHexString('#00f3ff'),
                textAlign: 'middle-left'
              }}
            />
          )}

          <UiEntity
            uiText={{
              value: parsed.action,
              fontSize: 16,
              color: Color4.fromHexString('#e2e8f0'),
              textAlign: 'middle-left'
            }}
          />

          {parsed.highlight !== '' && (
            <UiEntity
              uiTransform={{ margin: { left: 4, right: 4 } }}
              uiText={{
                value: parsed.highlight,
                fontSize: 17,
                color: Color4.fromHexString('#ffd700'),
                textAlign: 'middle-left'
              }}
            />
          )}

          {parsed.suffix !== '' && (
            <UiEntity
              uiText={{
                value: parsed.suffix,
                fontSize: 16,
                color: Color4.fromHexString('#e2e8f0'),
                textAlign: 'middle-left'
              }}
            />
          )}
        </UiEntity>

        {/* Right Tech Bracket */}
        <UiEntity
          uiTransform={{ margin: { left: 12 } }}
          uiText={{ value: '⟩', fontSize: 24, color: Color4.fromHexString('#00f3ff'), textAlign: 'middle-center' }}
        />
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

  const myId = getPlayer()?.userId || 'player1';
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === myId
  const activeSuit = activeGame.activeSuit

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 15 } }}
      uiBackground={{ color: Color4.fromHexString('#000000cc') }}
    >
      <UiEntity
        uiText={{
          value: isMyTurn ? `YOUR TURN! (Active Suit: ${activeSuit})` : `OPPONENT'S TURN (Active Suit: ${activeSuit})`,
          fontSize: 18, color: Color4.White(), textAlign: 'middle-center'
        }}
      />
    </UiEntity>
  )
}

function DeclareButton({ myHand }: { myHand: Card[] }) {
  if (!activeGame || activeGame.gameOver) return null
  const isVulnerable = myHand.length > 0 && myHand.length <= 3
  const hasDeclared = activeGame.safeDeclared.has(getPlayer()?.userId || 'player1')
  
  if (!isVulnerable || hasDeclared) return null

  return (
    <UiEntity
      uiTransform={{ width: 300, height: 50, margin: { bottom: 10 }, justifyContent: 'center', alignItems: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#ff2222ff') }}
      onMouseDown={() => { if (activeGame) activeGame.declareLowCards(getPlayer()?.userId || 'player1') }}
    >
      <UiEntity uiText={{ value: `DECLARE ${myHand.length} CARD(S)!`, fontSize: 22, color: Color4.White() }} />
    </UiEntity>
  )
}

function PlayerHandArea({ myHand }: { myHand: Card[] }) {
  if (!activeGame) return null
  const myId = getPlayer()?.userId || 'player1';
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === myId && !activeGame.gameOver
  const isChoosingSuit = pendingWildCardIndex !== null

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 140, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 20 } }}
    >
      {myHand.map((card, index) => {
        const canPlay = isMyTurn && !isChoosingSuit && activeGame?.isValidPlay(card)

        return (
          <PlayingCard
            key={index}
            card={card}
            isPlayable={!!canPlay}
            onClick={() => {
              if (canPlay && activeGame) {
                if (card.action === 'Wild') {
                  pendingWildCardIndex = index
                } else {
                  const success = activeGame.playCard(getPlayer()?.userId || 'player1', index)
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

  return (
    <UiEntity
      uiTransform={{ positionType: 'absolute', width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#000000dd') }}
    >
      <UiEntity uiText={{ value: 'CALL YOUR SUIT!', fontSize: 30, color: Color4.White() }} uiTransform={{ margin: { bottom: 30 } }} />
      <UiEntity uiTransform={{ flexDirection: 'row' }}>
        {['Hearts', 'Diamonds', 'Clubs', 'Spades'].map((suit) => {
          let symbol = ''
          let color = Color4.Black()
          if (suit === 'Hearts') { symbol = '♥'; color = Color4.Red() }
          if (suit === 'Diamonds') { symbol = '♦'; color = Color4.Red() }
          if (suit === 'Clubs') { symbol = '♣'; color = Color4.Black() }
          if (suit === 'Spades') { symbol = '♠'; color = Color4.Black() }

          return (
            <UiEntity
              key={suit}
              uiTransform={{ width: 80, height: 80, margin: 10 }}
              uiBackground={{ color: Color4.White() }}
              onMouseDown={() => {
                if (activeGame && pendingWildCardIndex !== null) {
                  activeGame.playCard(getPlayer()?.userId || 'player1', pendingWildCardIndex, suit as any)
                  pendingWildCardIndex = null
                  update3DTable(activeGame)
                }
              }}
            >
              <UiEntity uiTransform={{ width: '100%', height: '100%' }} uiText={{ value: symbol, fontSize: 50, color: color, textAlign: 'middle-center' }} />
            </UiEntity>
          )
        })}
      </UiEntity>
    </UiEntity>
  )
}

function uiComponent() {
  // Check if player is seated
  const playerTransform = Transform.getOrNull(engine.PlayerEntity)
  if (playerTransform) {
    const pos = playerTransform.position
    const tableCenter = Vector3.create(16, pos.y, 25)
    const dist = Vector3.distance(pos, tableCenter)

    // Chairs are at ~2m radius. Give 3.5m leeway so we don't accidentally hide it due to camera/avatar offsets!
    // We add a 1 second grace period to prevent teleport race conditions!
    if (dist > 3.5 && Date.now() - getTimeSeated() > 1000) {
      setPlayerSeated(false)
    }
  }

  const isTableActive = !!(activeGame && activeGame.isStarted && getPlayerSeated())
  const myId = getPlayer()?.userId || 'player1'
  const myHand = isTableActive ? (activeGame!.players.get(myId) || []) : []

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

      {/* Rewards Toast notification */}
      <RewardToastBanner />

      {/* Daily Rewards & Bounties Modal (when opened) */}
      <DailyRewardsModal />

      {/* Game Notifications */}
      <TopBannerNotification />

      {/* In-Game Table Controls (Only when seated and game started) */}
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
    </UiEntity>
  )
}


