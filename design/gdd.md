# Game Design Document: Crazy 8 — VIP Cyber Lounge

**Project Name:** Crazy 8: VIP Cyber Lounge  
**Engine & Version:** Decentraland SDK7 (ECS7)  
**Live World Deployment:** [https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth)  
**Author / Studio:** Rooi (`rooi.dcl.eth`)  
**Target Submission:** Decentraland Studio Onboarding — V0: The Vertical Slice ($1,000 USD)  
**Repository:** [https://github.com/moeketsi200/crazy-8](https://github.com/moeketsi200/crazy-8)  

---

## 1. Executive Summary

### 1.1 High Concept
*Crazy 8: VIP Cyber Lounge* reimagines the world-famous shedding card game **Crazy Eights** inside a sleek, two-story luxury cyberpunk penthouse in Decentraland. Players gather around a high-stakes holographic card table on the ground floor or chill on the rooftop terrace, enjoying live DJ vibes, a bubbling hot tub, panoramic glass elevator, and an interactive pool with dynamic splash physics.

### 1.2 Target Audience & Core Experience
- **Decentraland Explorers & Casual Gamers**: Intuitive, easy-to-learn card rules that anyone can pick up in seconds, with zero barrier to entry.
- **Social Hangout & Community Clubs**: A welcoming, atmospheric venue where groups can compete, socialize, celebrate wins, and spend time in-world between rounds.
- **Competitive Players**: High-tension declaration calls, action card counters (skips, reverses, draw-twos, draw-fours), and persistent in-world high-winnings leaderboards.

---

## 2. Core Gameplay Loop

```
+-------------------------------------------------------------+
|                     1. JOIN & SEAT                          |
|  - Approach holographic table, claim seat (up to 6 players)  |
|  - AI Cyber Bots seamlessly fill empty seats if playing solo|
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     2. ROUND START                          |
|  - 5 cards dealt per player from a standard 54-card deck    |
|  - 1 card flipped to seed the discard pile                  |
|  - Turn indicator highlights active player                  |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     3. PLAYER TURN                          |
|  - Match current discard by SUIT or RANK                    |
|  - OR play an 8 WILD card to switch the active suit         |
|  - OR play ACTION CARDS (2 Draw-Two, J Reverse, 7 Skip, Joker)|
|  - If unable to match: draw 1 card from the deck pile       |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                4. DECLARATIONS & BLUFFS                     |
|  - When holding 3 cards or 1 card: Declare status           |
|  - Failure to declare allows opponents to Challenge!        |
|  - Caught bluffers receive a +2 card penalty                |
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     5. WIN & SCORING                        |
|  - First player to shed all cards wins the round!           |
|  - Remaining opponents tally penalty points                 |
|  - Leaderboard updates with victor's avatar name & score    |
+-------------------------------------------------------------+
```

### 2.1 Card System & Rules
- **Deck Composition**: 54 cards (52 standard cards across 4 suits + 2 Jokers).
- **Match Rules**:
  - A card can be legally played if its **Suit** matches the active suit, OR its **Rank** matches the top card.
  - An **8** is completely **WILD** and can be played on any card at any time; the player immediately selects the next active suit.
- **Special Action Cards**:
  - **2 (Draw Two)**: Forces the next player to draw 2 penalty cards, OR they can counter-attack by stacking another 2 (+2) or a Joker (+4)!
  - **Jack (Reverse)**: Reverses the direction of play around the table (clockwise / counter-clockwise).
  - **7 (Skip)**: Skips the turn of the next player in sequence.
  - **Joker (Mega Wild + Draw Four)**: Changes active suit AND forces next player to draw 4 penalty cards, OR they can counter-attack by stacking any 2 (+2) or another Joker (+4)!
- **Bidirectional Penalty Stacking ("Shooting")**:
  - When a Joker (+4) is played, the targeted player can deflect and stack ANY 2 (+2) on top, building a **6-card penalty** for the following player!
  - Vice versa: When a 2 (+2) is played, the next player can counter with another 2 (+2, total 4) OR shoot a Joker (+4, total 6)!
  - Players continue chaining and stacking penalties as long as they hold 2s or Jokers. The first player unable to counter must draw the entire accumulated penalty pool!

### 2.2 The Declaration & Challenge Mechanic
Crazy 8s introduces psychological tension with active declaration calls:
- When a player's hand drops to **3 cards**, they must click **"Declare 3 Cards"**.
- When a player reaches **1 card ("Last Card")**, they must declare before their turn ends.
- If a player fails to declare and passes their turn, any alert opponent at the table can hit **"Challenge!"**. A successful challenge inflicts a **+2 card penalty** onto the forgetful player.
- All announcements broadcast to the in-world table HUD using the player's true Decentraland avatar display name (e.g. `Rooi has 3 cards left!`).

---

## 3. Social & World Design

### 3.1 Ground Floor: The Cyber Lounge
- **Holographic 6-Seat Card Table**: Dark obsidian pedestal with glowing cyan underglow, felt texture, and interactive 3D chair seating system.
- **Interactive Rules & Scoreboard**: Large freestanding high-visibility display with high winnings, live round standings, and match timer.
- **Pioneer DJ Console & Wharfedale Audio**: Detailed turntables, mixer, CDJ screens, and speaker cabinets creating an authentic nightclub atmosphere.
- **Automated Sliding Glass Doors**: Smooth proximity-sensing glass doors with tinted cyan transparency.

### 3.2 Ground Floor Terrace: Chillers Oasis
- **Neon Luxury Pool**: Deep navy basin with glowing cyan rim, animated wading wake, positional water splash sound FX, and surface ripple rings when avatars enter or exit.
- **Heated Boiling Jacuzzi**: Magenta neon trim, turbulent boiling water surface physics, and rising/wobbling bubbles that pop at the surface.
- **South African Braai Stand**: Authentic outdoor kitchen featuring stainless steel trim, dark basalt structure, and glowing ember grill.
- **Sun Loungers & Umbrellas**: Luxury poolside seating facing the scenic Decentraland horizon.

### 3.3 The Rooftop Penthouse & Glass Elevator
- **Panoramic Hydraulic Elevator**: Two-story glass and steel elevator cab connecting the ground terrace to the rooftop. Features smooth vertical transit, floor-level safety doors, overhead luminaire, and automatic call buttons at both landings.
- **Rooftop VIP Deck**: Elevated lounge platform with glass balustrades, perimeter neon accent lighting, rooftop cocktail bar, and panoramic 360-degree views of the metaverse.

---

## 4. Technical Architecture (Decentraland SDK7)

### 4.1 ECS Architecture
The scene is built cleanly on the **Decentraland SDK7 Entity Component System**:
- **Components**: Pure data structures for transforms, mesh renderers, colliders, PBR materials, text shapes, and audio sources.
- **Systems**:
  - `gameEngineSystem`: Manages card turns, AI decision trees, card draw/discard piles, and win checks.
  - `waterSystem`: Detects avatar presence inside pool and jacuzzi bounding boxes; computes particle lifetimes, ripple expansions, and audio triggers.
  - `elevatorSystem`: Handles state-machine transitions (`GroundOpen`, `Ascending`, `RoofOpen`, `Descending`), door tweens, and platform velocity.
  - `boilSystem`: Updates jacuzzi water vertex oscillations and procedural bubble lifecycles.

### 4.2 Asset & Performance Budget
- **Triangle Count**: Carefully optimized primitives and modular assets well within the 10,000 triangle limit per parcel.
- **Textures**: Standardized 512x512 and 1024x1024 compressed textures with power-of-two dimensions and trilinear filtering.
- **Audio**: Lightweight compressed MP3 assets attached to localized 3D entities with spatial falloff (sound drops off naturally with distance).

---

## 5. Retention & Economy Ecosystem (The 6-Phase Player Loop)

### 5.1 The 6-Phase Daily Retention Loop

```
[ 1. ARRIVE AT LOUNGE ] ──▶ Approach `vip_kiosk.glb`
                              ├─ Claim 7-Day Login Streak (+100 to +1,500 🪙 / +10 to +200 🏆)
                              └─ Receive 3 Randomized Daily Bounties
                                    │
[ 2. TABLE SELECTION ] ──▶ Sit at Holographic 6-Seat Card Table
                              ├─ Real Multiplayer Match (if visitors present)
                              └─ 24/7 AI Cyber Bots backfill (zero empty room drop-off)
                                    │
[ 3. PLAY & PROGRESS ] ──▶ Shed cards under Crazy 8 rules
                              ├─ Bidirectional 2/Joker penalty stacking ("Shooting")
                              ├─ Declarations with Cyber Notification Banner
                              └─ Bounty progress updates live in real-time
                                    │
[ 4. ROUND FINISH ] ──▶ Victory Celebration
                              ├─ Winner: +150 🪙 / +20 🏆 | Consolation: +30 🪙 / +5 🏆
                              ├─ 3D Floating Golden Crown (`winner_crown.glb`) spins over victor
                              ├─ 3D Confetti Burst (`confetti_burst.glb`) erupts across table felt
                              └─ Rooftop party strobe lights flash across the parcel
                                    │
[ 5. SPEND & STATUS ] ──▶ Visit VIP Pro Shop & Check Leaderboard
                              ├─ Spend Chips: Custom Decks, Chair Underglow Auras, Player Titles
                              ├─ Win Milestones: Unlock Caps, Graphic Tees & Bomber Jackets
                              └─ Outdoor Billboard updates live with Weekly Hall of Fame
                                    │
[ 6. LOG-OFF HOOK ] ──▶ Stand up / Exit Reminder
                              └─ "🔥 Day X Streak Active! Return tomorrow to claim Day X+1!"
```

### 5.2 Dual-Currency Architecture

| Currency | Purpose | How Players Earn It | Where It Appears |
| :--- | :--- | :--- | :--- |
| **Crazy Chips 🪙** | Liquid wallet currency to spend | Daily streak claims, match wins (+150), consolation (+30), daily bounties | Top-Right HUD & Pro Shop Wallet |
| **Trophies 🏆** | Permanent competitive ranking score | Winning matches (+20), bounty completions (+15 to +35) | Outdoor Billboard & Weekly Hall of Fame |

### 5.3 Hardcore VIP Pro Shop Catalog

#### 🃏 Hardcore Custom Card Decks
* **Classic Standard**: Free (Default blue casino deck).
* **Cyberpunk Neon Deck**: `1,200 🪙` | `40 🏆 req` *(Glowing laser cyan & magenta circuit lines; requires daily dedication).*
* **Gold Foil VIP Deck**: `4,000 🪙` | `150 🏆 req` *(Black obsidian with 24K gold filigree; requires match-winning dedication).*
* **DCL Holographic Deck**: `7,500 🪙` | `350 🏆 req` *(Elite endgame deck for true card sharks with shifting Mana crystals).*

#### 🪑 Hardcore Chair Underglow Auras (`chair_aura_ring.glb`)
* **No Underglow**: Free (Default ambient table glow).
* **Cyan Pulse Ring**: `3,000 🪙` | `75 🏆 req` *(Electric blue floor glow underneath seated chair).*
* **Royal Purple Glow**: `7,000 🪙` | `200 🏆 req` *(Deep, ambient purple aura signaling veteran status).*
* **Golden High-Roller Ring**: `15,000 🪙` | `600 🏆 req` *(24K radiant halo reserved for server champions).*

#### 👑 Player Titles
* **[Card Rookie]**: Free (Default title for newcomers).
* **[Card Shark]**: `500 🪙` | `30 🏆 req` *(Calculating player with razor instincts).*
* **[High Roller]**: `2,000 🪙` | `150 🏆 req` *(Big-stakes table master).*
* **[Crazy 8 Legend]**: `6,000 🪙` | `500 🏆 req` *(Undisputed parcel champion).*

#### 👕 Win Count Milestone Wearables
* **30 Match Wins**: **Electric Streak Snapback Cap** *(Sleek dark cyber cap with glowing neon piping and lightning 8 crest).*
* **60 Match Wins**: **Designer Shades, Gold Chain & Custom Graphic Tee** *(24K gold geometric shades, heavy Cuban link card medallion, and heavyweight streetwear graphic tee).*
* **80 Match Wins**: **VIP Lounge Bomber Jacket** *(Obsidian satin jacket with cyan neon piping, gold ribbed trim, and glowing King of Cards back embroidery).*
* **Weekly #1 Spot**: **The Winner's Floating Crown & Champion Hoodie** *(Grand weekly prize awarded to the Sunday midnight #1 Billboard champion).*

---

## 6. Social & World Design

### 6.1 Ground Floor: The Cyber Lounge
* **Holographic 6-Seat Card Table**: Dark obsidian pedestal with glowing cyan underglow, high-resolution circular cyber felt (`cyber_table_felt.png`), and interactive 3D chair seating with dynamic aura rings.
* **3D VIP Kiosk (`vip_kiosk.glb`)**: Clickable arcade podium opening the 3-tab VIP Rewards & Pro Shop modal.
* **Trophy Showcase (`crazy8_trophy.glb`)**: Rotating 3D champions cup on an illuminated obsidian pedestal.
* **Top Cyber Notification Banner**: Chamfered neon cyan bracket displaying real player avatar snapshots, speech badges, and color-coded card counts.
* **Interactive Rules & Scoreboard**: Large freestanding high-visibility indoor TV display.
* **Pioneer DJ Console & Wharfedale Audio**: Detailed turntables, mixer, CDJ screens, and club audio speakers.
* **Automated Sliding Glass Doors**: Smooth proximity-sensing glass doors with tinted cyan transparency.

### 6.2 Ground Floor Terrace: Chillers Oasis
* **Outdoor Poolside VIP Wearable Showcases**:
  * **Crazy 8 Cyber Hoodie Showcase**: Dark obsidian pedestal, glass enclosure, and rotating holographic diamond emblem by the pool.
  * **Champion Gold Bomber Showcase**: Obsidian pedestal, glass enclosure, and rotating 3D crown emblem.
* **Neon Luxury Pool**: Deep navy basin with glowing cyan rim, animated wading wake, positional water splash sound FX, and surface ripple rings when avatars enter or exit.
* **Heated Boiling Jacuzzi**: Magenta neon trim, turbulent boiling water surface physics, and rising/wobbling bubbles that pop at the surface.
* **South African Braai Stand**: Relocated to the far corner of the outdoor patio deck (X: -8.5, Z: 24.0), placed safely away from both the pool and jacuzzi water overlooking the open horizon.
* **Sun Loungers & Umbrellas**: Luxury poolside seating facing the scenic Decentraland horizon.
* **Outdoor Hall of Fame Billboard**: Live weekly leaderboard displaying #1 King of the Table, #2 High Roller, #3 Card Shark, longest win streak, and 2,500 Chip jackpot.

### 6.3 The Rooftop Penthouse & Glass Elevator
* **Panoramic Hydraulic Elevator**: Two-story glass and steel elevator cab connecting the ground terrace to the rooftop. Features smooth vertical transit, floor-level safety doors, overhead luminaire, and automatic call buttons at both landings.
* **Rooftop VIP Deck**: Elevated lounge platform with glass balustrades, perimeter neon accent lighting, rooftop cocktail bar, and panoramic 360-degree views of the metaverse.

---

## 7. How to Play

1. **Visit the World**: Teleport directly to `rooi.dcl.eth` via [https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth).
2. **Claim Daily Rewards**: Click the VIP Kiosk (`vip_kiosk.glb`) to claim your 7-day streak bonus and inspect your 3 daily bounties.
3. **Join the Table**: Walk into the ground-floor lounge and interact with an open chair around the circular holographic table.
4. **Click Start**: Hit **"Start Round"** on the rules board. Cards are dealt immediately.
5. **Play Your Hand**:
   * Click a valid card in your hand UI to match the top discard card by suit or number.
   * Counter-attack penalties: Stack 2s (+2) or Jokers (+4) to shoot massive draw penalties across the table!
   * Play an 8 anytime to choose the active suit.
   * Click **"Declare 3 Cards"** or **"Last Card"** when low on cards to avoid being challenged!
6. **Celebrate & Shop**:
   * Watch the 3D crown float above the winner's head as confetti erupts.
   * Spend your earned Crazy Chips at the kiosk on custom neon decks, glowing chair auras, and prestigious titles.
   * Inspect the milestone wearable showcases out by the pool terrace.
7. **Protect Your Streak**: Stand up from the table to receive your streak reminder hook: *"Come back tomorrow to keep your streak alive!"*
