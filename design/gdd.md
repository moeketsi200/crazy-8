# Game Design Document: Crazy 8 — VIP Cyber Lounge

**Project Name:** Crazy 8: VIP Cyber Lounge  
**Engine & Version:** Decentraland SDK7 (ECS7)  
**Live World Deployment:** [https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth)  
**Author / Studio:** Rooi (`rooi.dcl.eth`)  
**Target Submission:** Decentraland Studio Onboarding — V0: The Vertical Slice ($1,000 USD)  
**Repository:** [https://github.com/moeketsi200/crazy-8](https://github.com/moeketsi200/crazy-8)  
**Last Updated:** October 2026  

---

## 1. Executive Summary

### 1.1 High Concept
*Crazy 8: VIP Cyber Lounge* reimagines the world-famous shedding card game **Crazy Eights** inside a sleek, two-story luxury cyberpunk penthouse in Decentraland. Players gather around a high-stakes holographic card table on the ground floor or chill on the outdoor pool terrace, enjoying live DJ vibes from resident NPC **DJ Crazy 8**, a bubbling hot tub, panoramic hydraulic glass elevator, and an interactive pool with dynamic splash physics.

### 1.2 Target Audience & Core Experience
- **Decentraland Explorers & Casual Gamers**: Intuitive, easy-to-learn card rules that anyone can pick up in seconds, with zero barrier to entry.
- **Social Hangout & Community Clubs**: A welcoming, atmospheric venue where groups can compete, socialize, celebrate wins, and spend time in-world between rounds.
- **Competitive Players**: High-tension declaration calls, action card counters (skips, reverses, draw-twos, draw-fours), bidirectional penalty stacking ("Shooting"), and persistent in-world high-winnings leaderboards.
- **Wearable Collectors & Fashionistas**: A full 6-piece bespoke 3D streetwear collection—including snapbacks, gold chains, graphic tees, satin bombers, and a floating champion crown—all modeled, rigged to the official Decentraland avatar armature, and previewable in-world.

---

## 2. Core Gameplay Loop

```
+-------------------------------------------------------------+
|                     1. JOIN & SEAT                          |
|  - Approach holographic table, claim seat (up to 6 players)  |
|  - Dynamic floor aura rings illuminate under active chairs  |
|  - AI Cyber Bots seamlessly fill empty seats if playing solo|
+------------------------------+------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|                     2. ROUND START                          |
|  - 5 cards dealt per player from a standard 54-card deck    |
|  - 1 card flipped to seed the central discard pile          |
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
|  - 3D Winner Crown spins overhead; Confetti burst erupts    |
|  - Winner earns Crazy Chips 🪙 & Trophies 🏆               |
|  - Hall of Fame Billboard updates victor's name & stats     |
+-------------------------------------------------------------+
```

### 2.1 Card System & Rules
- **Deck Composition**: 54 cards (52 standard cards across 4 suits + 2 Jokers).
- **Match Rules**:
  - A card can be legally played if its **Suit** matches the active suit, OR its **Rank** matches the top discard card.
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
- All announcements broadcast to the in-world table HUD and notification banner using the player's true Decentraland avatar display name (e.g. `Rooi has 3 cards left!`).

---

## 3. Social & World Design

### 3.1 Ground Floor: The Cyber Lounge
- **Holographic 6-Seat Card Table**: Dark obsidian pedestal with glowing cyan underglow, high-resolution circular cyber felt (`cyber_table_felt.png`), 3D poker chip stacks (`chip_stacks.glb`), and an interactive chair seating system.
- **Dynamic Chair Aura Underglows (`chair_aura_ring.glb`)**: Floor halos that illuminate beneath seated players, displaying their equipped VIP aura tier (Cyan Pulse, Royal Purple, Golden High-Roller).
- **3D VIP Kiosk (`vip_kiosk.glb`)**: Clickable arcade terminal opening the 3-tab VIP Rewards & Pro Shop modal (Daily Streak Claims, Active Bounties, Cosmetic Catalog).
- **Rotating Trophy Showcase (`crazy8_trophy.glb`)**: Illuminated obsidian pedestal showcasing the rotating 3D Champions Cup.
- **Top Cyber Notification Banner**: Chamfered neon cyan bracket displaying real player avatar snapshots, speech badges, and color-coded card counts.
- **Interactive Rules & Scoreboard**: Large freestanding high-visibility indoor TV display showing core game rules, high winnings, and round timers.
- **Resident NPC — DJ Crazy 8**: Authentic nightclub setup featuring Pioneer turntables, mixer, CDJ displays, and Wharfedale speaker stacks. Resident DJ avatar is an official Decentraland `AvatarShape` dressed in base streetwear and the custom **C8 Crest Bomber**, dynamically swaying to the club beat.
- **Automated Sliding Glass Doors**: Smooth proximity-sensing double glass doors with tinted cyan transparency.

### 3.2 Ground Floor Terrace: Chillers Oasis
- **4 VIP Wearable Showcase Pedestals Gallery**: Positioned directly behind the poolside sun loungers (at `Z = 23.5`), featuring rotating 3D models inside illuminated glass cylinders with interactive inspect-to-equip prompts:
  - 🧢 **Electric Streak Snapback Cap** (`electric_cap.glb`) — *30 Match Wins Milestone* (X: 0.0, Z: 23.5)
  - 🕶️ **Designer Shades & Gold Chain** (`shades_chain.glb`) — *60 Match Wins Milestone* (X: 2.5, Z: 23.5)
  - 👕 **Holo Card Streetwear Tee** (`crazy8_holo_card_tee.glb`) — *Pro Shop Showcase* (X: 5.0, Z: 23.5)
  - 🧥 **VIP Club Satin Bomber** (`crazy8_vip_club_bomber.glb`) — *High Roller Milestone* (X: 7.5, Z: 23.5)
- **4 Poolside Sun Loungers & Umbrellas**: Luxury wood loungers with cream cushions paired with shade umbrellas, placed directly in front of each showcase pedestal facing the pool.
- **South African Braai Stand**: Relocated to the far corner of the outdoor patio deck (`X: -8.5, Z: 24.0`), placed safely away from both the pool and jacuzzi water overlooking the open horizon. Features dark basalt masonry, stainless steel grill trim, and glowing ember physics.
- **Neon Luxury Pool**: Deep navy basin with glowing cyan rim, animated wading wake, positional water splash sound FX, and surface ripple rings when avatars enter or exit.
- **Heated Boiling Jacuzzi**: Magenta neon trim, turbulent boiling water surface physics, and rising/wobbling bubbles that pop at the surface.
- **Outdoor Hall of Fame Billboard**: Live weekly leaderboard displaying #1 King of the Table, #2 High Roller, #3 Card Shark, longest win streak, and the 2,500 Chip weekly jackpot.

### 3.3 The Rooftop Penthouse & Glass Elevator
- **Panoramic Hydraulic Elevator**: Two-story glass and steel elevator cab connecting the ground terrace to the rooftop (`Y = 8.21`). Features smooth vertical transit, floor-level safety doors, overhead luminaire, and automatic call buttons at both landings.
- **Rooftop VIP Deck**: Elevated lounge platform with glass balustrades, perimeter neon accent lighting, rooftop cocktail bar, comfortable loungers, and panoramic 360-degree views of the metaverse.

---

## 4. Retention & Economy Ecosystem (The 6-Phase Player Loop)

### 4.1 The 6-Phase Daily Retention Loop

```
[ 1. ARRIVE AT LOUNGE ] ──▶ Approach `vip_kiosk.glb`
                              ├─ Claim 7-Day Login Streak (+100 to +1,500 🪙 / +10 to +200 🏆)
                              └─ Receive 3 Randomized Daily Bounties
                                    │
[ 2. TABLE SELECTION ] ──▶ Sit at Holographic 6-Seat Card Table
                              ├─ Real Multiplayer Match (if visitors present)
                              ├─ Dynamic Chair Aura activates under seat
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

### 4.2 Dual-Currency Architecture

| Currency | Purpose | How Players Earn It | Where It Appears |
| :--- | :--- | :--- | :--- |
| **Crazy Chips 🪙** | Liquid wallet currency to spend | Daily streak claims, match wins (+150), consolation (+30), daily bounties | Top-Right HUD & Pro Shop Wallet |
| **Trophies 🏆** | Permanent competitive ranking score | Winning matches (+20), bounty completions (+15 to +35) | Outdoor Billboard & Weekly Hall of Fame |

### 4.3 VIP Pro Shop Catalog & Wearables Collection

#### 🃏 Custom Card Decks
* **Classic Standard**: Free (Default blue casino deck).
* **Cyberpunk Neon Deck**: `1,200 🪙` | `40 🏆 req` *(Glowing laser cyan & magenta circuit lines; requires daily dedication).*
* **Gold Foil VIP Deck**: `4,000 🪙` | `150 🏆 req` *(Black obsidian with 24K gold filigree; requires match-winning dedication).*
* **DCL Holographic Deck**: `7,500 🪙` | `350 🏆 req` *(Elite endgame deck for true card sharks with shifting Mana crystals).*

#### 🪑 Chair Underglow Auras (`chair_aura_ring.glb`)
* **No Underglow**: Free (Default ambient table glow).
* **Cyan Pulse Ring**: `3,000 🪙` | `75 🏆 req` *(Electric blue floor glow underneath seated chair).*
* **Royal Purple Glow**: `7,000 🪙` | `200 🏆 req` *(Deep, ambient purple aura signaling veteran status).*
* **Golden High-Roller Ring**: `15,000 🪙` | `600 🏆 req` *(24K radiant halo reserved for server champions).*

#### 👑 Player Titles
* **[Card Rookie]**: Free (Default title for newcomers).
* **[Card Shark]**: `500 🪙` | `30 🏆 req` *(Calculating player with razor instincts).*
* **[High Roller]**: `2,000 🪙` | `150 🏆 req` *(Big-stakes table master).*
* **[Crazy 8 Legend]**: `6,000 🪙` | `500 🏆 req` *(Undisputed parcel champion).*

#### 🎽 Bespoke 6-Piece Streetwear & Wearables Collection

All wearables are modeled and exported as standalone GLBs, cleanly rigged to the official Decentraland avatar armature:

| Wearable Item | Category | Unlock Condition / Price | Mesh Specs | Design Features |
| :--- | :---: | :---: | :---: | :--- |
| **Electric Streak Cap** (`electric_cap.glb`) | Hat | **30 Match Wins** Milestone | 582 tris | Matte dark snapback, 6 cyan neon seams, glowing brim piping, and lightning 8 front crest. |
| **High Roller Shades & Gold Chain** (`shades_chain.glb`) | Eyewear | **60 Match Wins** Milestone | 582 tris | Geometric 24K gold sunglasses with dark tint, paired with heavy Cuban link chain and playing card medallion. |
| **High Roller Streetwear Tee** (`crazy8_high_roller_tee.glb`) | Upper Body | `1,500 🪙` • `40 🏆` | 428 tris | Cream heavyweight streetwear tee, 4-star gold insignia, and "CRAZY 8 HIGH ROLLER" chest art. Naturally open cuffs. |
| **Holo Card Tee** (`crazy8_holo_card_tee.glb`) | Upper Body | `2,500 🪙` • `75 🏆` | 428 tris | Oversized obsidian streetwear tee featuring holographic shifting cyan/magenta cyber card art and sleeve piping. |
| **VIP Club Bomber Jacket** (`crazy8_vip_club_bomber.glb`) | Upper Body | **80 Wins** • `10,000 🪙` • `500 🏆` | 596 tris | Black satin bomber with electric cyan neon piping, 24K gold ribbed collar/cuffs, and bold "CRAZY 8 VIP CLUB" back embroidery. |
| **C8 Crest Bomber Jacket** (`crazy8_crest_bomber.glb`) | Upper Body | **Club Resident Exclusive** | 596 tris | Signature club jacket worn by DJ Crazy 8; features glowing King of Cards cyber insignia on reverse. |
| **The Winner's Floating Crown** (`winner_crown.glb`) | Accessory | **Weekly #1 Spot** on Billboard | 320 tris | 3D radiant gold crown with spinning Mana gems that floats over round victors and leaderboard kings. |

---

## 5. Technical Architecture (Decentraland SDK7)

### 5.1 ECS Architecture & Key Systems
The scene strictly follows the **Decentraland SDK7 Entity Component System**:
- **Components**: Pure data structures for transforms, mesh renderers, mesh colliders, PBR materials, text shapes, visibility, and audio sources.
- **Core Systems**:
  - `gameEngineSystem`: Manages card dealing, turn progression, AI decision trees, card draw/discard piles, declaration timeouts, and victory detection.
  - `waterSystem`: Detects avatar presence inside pool and jacuzzi bounding boxes; triggers localized water splash sound FX and surface ripple ring expansions.
  - `elevatorSystem`: Handles state-machine transitions (`GroundOpen`, `Ascending`, `RoofOpen`, `Descending`), door tweens, and platform velocity.
  - `boilSystem`: Updates jacuzzi water vertex oscillations and procedural bubble lifecycles.
  - `economySystem`: Manages streak verification, daily bounty tracking, cosmetic unlocks, and local storage state persistence.
  - `wearablesSystem`: Handles in-world wearable attachments (`AvatarAttach`) and showcase pedestal inspection routines.

### 5.2 Wearable Rigging & Optimization Pipeline
- **Clean Armature Inheritance**: Garments are derived directly from Decentraland's official `ShapeA_uBody_BaseMesh` (`AvatarShape_A.blend`), preserving 100% of all 62 standard avatar vertex groups (`Avatar_RightArm`, `Avatar_LeftArm`, `Avatar_Spine`, `Avatar_Neck`, etc.) with zero unweighted vertices.
- **Natural Open Openings**: Sleeve cuffs, collar lines, and waistlines remain naturally open. Decentraland's engine handles skin clipping automatically via `"hides": ["upper_body"]`, eliminating tearing and sleeve twists.
- **Local Normal Offsets**: Normal inflation is calculated in local mesh space (`0.9 cm` for tees, `1.6 cm` for jackets), eliminating the 100× matrix inversion scaling distortion.
- **Strict Budget Compliance**:
  - All garments: **<600 triangles** (Decentraland limit is 1,500 triangles per accessory/clothing item).
  - Atlased 512×512 textures with dedicated base color and emission maps.
  - Single-mesh clean GLBs with 0 stray geometry, 0 extraneous cameras, and 0 placeholder cubes.

---

## 6. How to Play & First-Time Player Guide

1. **Visit the World**: Teleport directly to `rooi.dcl.eth` via [https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth).
2. **Claim Daily Rewards**: Click the VIP Kiosk (`vip_kiosk.glb`) to claim your 7-day login streak bonus and inspect your 3 daily bounties.
3. **Join the Table**: Walk into the ground-floor lounge, vibe to **DJ Crazy 8**, and interact with an open chair around the circular holographic table.
4. **Click Start**: Hit **"Start Round"** on the rules board. Cards are dealt immediately.
5. **Play Your Hand**:
   - Click a valid card in your hand UI to match the top discard card by suit or rank.
   - Counter-attack penalties: Stack 2s (+2) or Jokers (+4) to shoot massive draw penalties across the table!
   - Play an 8 anytime to choose the active suit.
   - Click **"Declare 3 Cards"** or **"Last Card"** when low on cards to avoid being challenged!
6. **Celebrate & Shop**:
   - Watch the 3D crown float above the winner's head as confetti erupts.
   - Spend your earned Crazy Chips at the kiosk on custom neon decks, glowing chair auras, and prestigious titles.
   - Walk outside to the pool terrace to inspect and try on the milestone wearable showcases behind the sun loungers.
7. **Protect Your Streak**: Stand up from the table to receive your streak reminder hook: *"Come back tomorrow to keep your streak alive!"*
