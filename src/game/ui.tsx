import ReactEcs, { ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { Color4, Vector3 } from '@dcl/sdk/math'
import { engine, Transform } from '@dcl/sdk/ecs'
import { CrazyEightsGame } from './logic'
import { update3DTable, resolvePlayerId, getPlayerSeated, setPlayerSeated, getPlayerDisplayName } from './table'
import { getPlayer } from '@dcl/sdk/src/players'
import { Card, Suit } from './deck'

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
  const activePlayerId = activeGame.playerOrder[activeGame.currentTurnIndex]
  const turnLabel = isMyTurn ? 'YOUR TURN!' : `${getPlayerDisplayName(activePlayerId).toUpperCase()}'S TURN`

  return (
    <UiEntity
      uiTransform={{ width: '100%', height: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: { bottom: 15 } }}
      uiBackground={{ color: Color4.fromHexString('#000000cc') }}
    >
      <UiEntity
        uiText={{
          value: `${turnLabel} (Active Suit: ${activeSuit})`,
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


