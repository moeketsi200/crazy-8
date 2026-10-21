import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { CrazyEightsGame } from './logic'
import { update3DTable, resolvePlayerId, getPlayerSeated, setPlayerSeated } from './table'
import { getPlayer } from '@dcl/sdk/src/players'
import { Card } from './deck'

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

  // System to countdown notifications
  engine.addSystem((dt) => {
    if (uiNotificationTimer > 0) {
      uiNotificationTimer -= dt
      if (uiNotificationTimer <= 0) uiNotificationMessage = ''
    }
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

// Helper to reliably check if it is the local player's turn
function isLocalPlayerTurn(game: CrazyEightsGame): boolean {
  if (!game || !game.isStarted || game.gameOver) return false
  const currentTurnPlayer = game.playerOrder[game.currentTurnIndex]
  if (currentTurnPlayer === 'bot') return false
  const myId = resolvePlayerId(game)
  if (currentTurnPlayer === myId || currentTurnPlayer === 'player1') return true
  // In single player vs bot, if current turn is not bot, it is always the local human player
  if (game.playerOrder.length <= 2 && currentTurnPlayer !== 'bot') return true
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

function TopBannerNotification() {
  if (uiNotificationMessage === '') return null
  return (
    <UiEntity
      uiTransform={{ positionType: 'absolute', position: { top: 50 }, width: '80%', height: 60, justifyContent: 'center', alignItems: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#ffaa00dd') }}
    >
      <UiEntity uiText={{ value: uiNotificationMessage, fontSize: 24, color: Color4.Black(), textAlign: 'middle-center' }} />
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

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 15 } }}
      uiBackground={{ color: Color4.fromHexString('#000000cc') }}
    >
      <UiEntity
        uiText={{
          value: isMyTurn ? `YOUR TURN! (Active Suit: ${activeSuit})` : `BOT'S TURN (Active Suit: ${activeSuit})`,
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
                  const myId = resolvePlayerId(activeGame)
                  activeGame.playCard(myId, pendingWildCardIndex, suit as any)
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
  // 1. Whenever game is not started, do not show in-game cards
  if (!activeGame || !activeGame.isStarted) return null

  // 2. Proximity & Seated Check:
  // Show cards only when seated in a chair OR standing right next to the table (< 2.8m).
  // When the player walks away, hide the cards immediately.
  let isNearTable = false
  const playerTransform = Transform.getOrNull(engine.PlayerEntity)
  if (playerTransform) {
    const px = playerTransform.position.x
    const pz = playerTransform.position.z
    // Table center is at world coordinates (16, 25)
    const dx = px - 16
    const dz = pz - 25
    const horizontalDist = Math.sqrt(dx * dx + dz * dz)

    if (horizontalDist <= 2.8) {
      isNearTable = true
    } else {
      // Avatar moved away from the table
      setPlayerSeated(false)
    }
  }

  const isAtTable = isNearTable || getPlayerSeated()
  if (!isAtTable) {
    return null
  }

  // 3. Resolve local player's hand
  const myId = resolvePlayerId(activeGame)
  let myHand = activeGame.players.get(myId) || []
  if (myHand.length === 0 && activeGame.players.has('player1')) {
    myHand = activeGame.players.get('player1') || []
  }
  if (myHand.length === 0) {
    for (const [pId, hand] of activeGame.players.entries()) {
      if (pId !== 'bot' && hand.length > 0) {
        myHand = hand
        break
      }
    }
  }

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: '100%', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end' }}
    >
      <TableArea />
      <TopBannerNotification />
      <GameInfoBar />
      <DeclareButton myHand={myHand} />
      <PlayerHandArea myHand={myHand} />
      <SuitPickerModal />
    </UiEntity>
  )
}


