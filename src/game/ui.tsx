import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { CrazyEightsGame } from './logic'
import { update3DTable } from './table'
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
  return (card.suit === 'Hearts' || card.suit === 'Diamonds') ? Color4.Red() : Color4.Black()
}

function PlayingCard(props: { key?: string|number, card: Card, isPlayable: boolean, onClick?: () => void }) {
  const { card, isPlayable, onClick } = props
  const color = getCardColor(card)
  const symbol = getCardSymbol(card)
  const bgColor = isPlayable ? Color4.White() : Color4.fromHexString('#aaaaaaff')

  return (
    <UiEntity
      uiTransform={{
        width: 80,
        height: 120,
        margin: { left: 5, right: 5 },
        padding: 2, // Creates a crisp black border!
      }}
      uiBackground={{ color: Color4.Black() }}
      onMouseDown={onClick}
    >
      <UiEntity
        uiTransform={{
          width: '100%',
          height: '100%',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: 4
        }}
        uiBackground={{ color: bgColor }}
      >
        {/* Top Left Rank/Suit */}
        <UiEntity
          uiTransform={{ width: '100%', height: 35 }}
          uiText={{ value: `${card.rank}\n${symbol}`, fontSize: 14, color: color, textAlign: 'top-left' }}
        />
        
        {/* Center Huge Suit */}
        <UiEntity
          uiTransform={{ width: '100%', height: 40 }}
          uiText={{ value: symbol, fontSize: 45, color: color, textAlign: 'middle-center' }}
        />

        {/* Bottom Right Rank/Suit */}
        <UiEntity
          uiTransform={{ width: '100%', height: 35 }}
          uiText={{ value: `${card.rank}\n${symbol}`, fontSize: 14, color: color, textAlign: 'bottom-right' }}
        />
      </UiEntity>
    </UiEntity>
  )
}

function DrawDeckCard(props: { onClick?: () => void }) {
  return (
    <UiEntity
      uiTransform={{ width: 80, height: 120, margin: { left: 15, right: 15 }, padding: 3 }}
      uiBackground={{ color: Color4.White() }} // Outer white border
      onMouseDown={props.onClick}
    >
      <UiEntity
        uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
        uiBackground={{ color: Color4.fromHexString('#b30000ff') }} // Deep Casino Red
      >
        <UiEntity
          uiTransform={{ width: '85%', height: '85%', padding: 2 }}
          uiBackground={{ color: Color4.White() }} // Inner white ring
        >
          <UiEntity
            uiTransform={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
            uiBackground={{ color: Color4.fromHexString('#b30000ff') }}
          >
            <UiEntity
              uiText={{ value: 'DRAW\nDECK', fontSize: 16, color: Color4.White(), textAlign: 'middle-center' }}
            />
          </UiEntity>
        </UiEntity>
      </UiEntity>
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
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === 'player1'
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
          const success = activeGame.drawCard('player1')
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
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === 'player1'
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
  if (!activeGame) return null
  const isVulnerable = myHand.length > 0 && myHand.length <= 3
  const hasDeclared = activeGame.safeDeclared.has('player1')
  
  if (!isVulnerable || hasDeclared) return null

  return (
    <UiEntity
      uiTransform={{ width: 300, height: 50, margin: { bottom: 10 }, justifyContent: 'center', alignItems: 'center' }}
      uiBackground={{ color: Color4.fromHexString('#ff2222ff') }}
      onMouseDown={() => { if (activeGame) activeGame.declareLowCards('player1') }}
    >
      <UiEntity uiText={{ value: `DECLARE ${myHand.length} CARD(S)!`, fontSize: 22, color: Color4.White() }} />
    </UiEntity>
  )
}

function PlayerHandArea({ myHand }: { myHand: Card[] }) {
  if (!activeGame) return null
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === 'player1'
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
                  const success = activeGame.playCard('player1', index)
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
                  activeGame.playCard('player1', pendingWildCardIndex, suit as any)
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
  if (!activeGame || !activeGame.isStarted) return null

  const myHand = activeGame.players.get('player1') || []

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
