import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4 } from '@dcl/sdk/math'
import { CrazyEightsGame } from './logic'
import { update3DTable } from './table'
import { Card } from './deck'

let activeGame: CrazyEightsGame | null = null

export function setupUI(game: CrazyEightsGame) {
  activeGame = game
  ReactEcsRenderer.setUiRenderer(uiComponent)
}

// ----------------------------------------------------
// UI COMPONENTS
// ----------------------------------------------------

function PlayingCard(props: { key?: string|number, card: Card, isPlayable: boolean, onClick?: () => void }) {
  const { card, isPlayable, onClick } = props
  
  const isRed = card.suit === 'Hearts' || card.suit === 'Diamonds'
  const color = isRed ? Color4.Red() : Color4.Black()
  
  let symbol = ''
  if (card.suit === 'Hearts') symbol = '♥'
  if (card.suit === 'Diamonds') symbol = '♦'
  if (card.suit === 'Clubs') symbol = '♣'
  if (card.suit === 'Spades') symbol = '♠'
  if (card.suit === 'None' && card.rank === 'Joker') symbol = '★'

  // Gray out the card slightly if it's not playable, but keep the pristine white if it is!
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

function uiComponent() {
  if (!activeGame) return null

  const myHand = activeGame.players.get('player1') || []
  const isMyTurn = activeGame.playerOrder[activeGame.currentTurnIndex] === 'player1'
  const activeSuit = activeGame.activeSuit
  const topCard = activeGame.getTopDiscard()

  return (
    <UiEntity
      uiTransform={{
        width: '100%',
        height: '100%',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-end',
      }}
    >
      {/* Table Area (Top Card & Draw Deck) */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 130,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          margin: { bottom: 15 }
        }}
      >
        {topCard && (
          <PlayingCard card={topCard} isPlayable={true} />
        )}

        <DrawDeckCard 
          onClick={() => {
            if (isMyTurn && activeGame && pendingWildCardIndex === null) {
              const success = activeGame.drawCard('player1')
              if (success) update3DTable(activeGame)
            }
          }}
        />
      </UiEntity>

      {/* Game Info Bar */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 35,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          margin: { bottom: 15 }
        }}
        uiBackground={{ color: Color4.fromHexString('#000000cc') }}
      >
        <UiEntity
          uiText={{
            value: isMyTurn ? `YOUR TURN! (Active Suit: ${activeSuit})` : `OPPONENT'S TURN (Active Suit: ${activeSuit})`,
            fontSize: 18,
            color: Color4.White(),
            textAlign: 'middle-center'
          }}
        />
      </UiEntity>

      {/* Player Hand Area */}
      <UiEntity
        uiTransform={{
          width: '100%',
          height: 140,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          margin: { bottom: 20 }
        }}
      >
        {myHand.map((card, index) => {
          const canPlay = isMyTurn && activeGame?.isValidPlay(card) && pendingWildCardIndex === null

          return (
            <PlayingCard
              key={index}
              card={card}
              isPlayable={!!canPlay}
              onClick={() => {
                if (canPlay && activeGame) {
                  // If it's an 8 (Wild), open the suit picker instead of playing immediately!
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

      {/* SUIT PICKER MODAL */}
      {pendingWildCardIndex !== null && (
        <UiEntity
          uiTransform={{
            positionType: 'absolute',
            width: '100%',
            height: '100%',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          uiBackground={{ color: Color4.fromHexString('#000000dd') }}
        >
          <UiEntity
            uiText={{ value: 'CALL YOUR SUIT!', fontSize: 30, color: Color4.White() }}
            uiTransform={{ margin: { bottom: 30 } }}
          />
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
                  <UiEntity
                    uiTransform={{ width: '100%', height: '100%' }}
                    uiText={{ value: symbol, fontSize: 50, color: color, textAlign: 'middle-center' }}
                  />
                </UiEntity>
              )
            })}
          </UiEntity>
        </UiEntity>
      )}
    </UiEntity>
  )
}
