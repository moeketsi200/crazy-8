# Crazy 8: Last Call — VIP Cyber Lounge

A **100% free-to-play** multiplayer **Crazy Eights** social card game built for **Decentraland SDK7**, designed for Decentraland hangout regulars and community crews inside a two-story cyberpunk penthouse lounge. Drop into a fast 3–5 minute match with friends or AI bots around a holographic table, call out opponents in *Last Call* challenges, earn play-only **Lounge Points / Arcade Credits**, and hang out across a rooftop terrace with a bubbling jacuzzi, dynamic pool physics, and a panoramic glass elevator.

[![Play in Decentraland](https://img.shields.io/badge/Decentraland-Play%20Now-ff2d55?style=for-the-badge&logo=decentraland)](https://decentraland.org/jump?realm=rooi.dcl.eth)
[![SDK7](https://img.shields.io/badge/Engine-SDK7%20(ECS7)-00f3ff?style=for-the-badge)](https://docs.decentraland.org/creator/scenes-sdk7/)
[![Author](https://img.shields.io/badge/Creator-Rooi-gold?style=for-the-badge)](https://decentraland.org/jump?realm=rooi.dcl.eth)

> **Pure Social Card Game (No Gambling):** Crazy 8 has **no betting, no wagering, no entry fees, and no cash-outs** (now or later). All progression points, trophies, streaks, and cosmetic unlocks are earned strictly through play and hold zero cash or MANA value.

---

## 🌐 Live World Deployment

**Jump directly into the live scene:**  
👉 **[https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth)**

---

## 🎮 Key Features

- **Multiplayer Crazy Eights (Up to 8 Players)**:
  - Full 54-card deck including action cards:
    - **8 (Wild Card)**: Change active suit anytime.
    - **2 (Draw Two)**: Next player draws 2 penalty cards.
    - **J (Reverse)**: Reverses round turn order.
    - **7 (Skip)**: Skips the next player's turn.
    - **Joker (Mega Wild)**: Forces next player to draw 4 penalty cards and changes suit.
  - **Instant Solo Bots & Multiplayer Lobby**: Jump straight into a full 8-seat round against AI bots when arriving alone, or host a live multiplayer match with friends and community crews.
  - **Low-Hand Declaration & *Last Call* Challenge**: Players down to 1–3 cards must declare their low hand (1 card = **Last Call**). Any opponent who catches an undeclared low hand can trigger a 2-card penalty challenge (`CAUGHT!`).
  - **Display Name Resolution**: Displays true Decentraland avatar profile names (e.g., `Rooi`, `Cyber Bot`) in announcements, challenges, and leaderboards instead of raw wallet hashes.

- **Free-to-Play Progression & Retention**:
  - **Daily Quests & 7-Day Streaks**: Rotating daily gameplay objectives and consecutive-day streak bonuses awarding play-earned **Lounge Points / Arcade Credits**, **Trophies**, and unlockable titles.
  - **Play-Earned Cosmetic Unlocks**: Unlock custom holographic card decks, chair underglow auras, player titles, and lounge wearable previews solely through gameplay progression.
  - **Persistent Weekly & All-Time Leaderboards**: Authoritative server persistence (`@dcl/sdk/server` Storage + Render settlement verification) tracks weekly wins, all-time multiplayer wins, and rounds won across restarts (bots and solo rounds excluded from competitive rankings).

- **Cyber VIP Penthouse Social Hangout**:
  - **Ground Floor Lounge**: Holographic circular card table, Pioneer-inspired CDJ DJ console, club sound system, rules info board, and live wins leaderboard.
  - **Chillers Oasis Patio**:
    - **Neon Luxury Pool**: Multi-ring surface ripples, droplet physics, wading wake, and 3D positional water splash audio.
    - **Heated Bubbling Jacuzzi**: Magenta neon perimeter, boiling surface water physics, and rising/wobbling bubbles.
    - **South African Braai Stand**: Architectural dark basalt outdoor kitchen with glowing ember grill.
  - **Panoramic Glass Elevator**: Functional 2-story elevator with floor-level safety doors, call buttons, and vertical collision transport between the Ground Patio and Rooftop.
  - **Rooftop VIP Terrace**: Elevated viewpoint with glass balustrades, neon perimeter accents, and rooftop lounge space.

---

## 📖 Game Design Document (GDD)

For the pure-social positioning, target audience, retention strategy, V0 scope, and `#playtesters` plan, see the design document:
📄 **[design/gdd.md](design/gdd.md)**

---

## 🛠️ Local Development & Preview

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or v20 recommended)
- [Creator Hub](https://decentraland.org/download/creator-hub) or Decentraland CLI

### Running the Scene
```bash
# Clone the repository
git clone git@github.com:moeketsi200/crazy-8.git
cd crazy-8

# Install dependencies
npm install

# Start local Decentraland preview
npm run start
```

### Type Checking & Building
```bash
# Type check TypeScript
npx tsc --noEmit

# Bundle production scene
npm run build
```

The authoritative-server setup uses `@dcl/sdk/server` storage during preview and deployment; deploy the scene to the configured World (`rooi.dcl.eth`) to run persistent profiles and leaderboards.

### Publishing to Decentraland World
```bash
npm run deploy -- --target-content https://worlds-content-server.decentraland.org
```

---

## 📂 Project Structure

```
crazy-8/
├── assets/
│   ├── Audio/                   # 3D spatial sound effects (splash.mp3, cards, elevator)
│   ├── images/                  # Textures (suits, cyber table felt, logo, dark hex, thumbnail)
│   └── scene/                   # Composite scene metadata
├── design/
│   └── gdd.md                   # Official Game Design Document (Pure Social V0)
├── src/
│   ├── client/
│   │   └── scene.ts             # Client scene bootstrap & room sync
│   ├── game/
│   │   ├── logic.ts             # Core Crazy 8s rules, card deck, AI bot decision trees
│   │   ├── table.ts             # 3D table seating, player name resolution, card transforms
│   │   ├── ui.tsx               # React-ECS in-world card hand HUD & action buttons
│   │   ├── economy.ts           # Daily quests, 7-day streaks, titles & cosmetic catalog
│   │   ├── economy_sync.ts      # Client-server profile & reward synchronization
│   │   ├── rewards_ui.tsx       # Quests, streaks & cosmetic shop UI
│   │   ├── multiplayer.ts       # Authoritative lobby & multiplayer room orchestration
│   │   ├── elevator.ts          # Panoramic elevator state machine, doors & physics
│   │   ├── water_effects.ts     # Pool splash audio, surface ripples, droplet particles
│   │   ├── house.ts             # Penthouse architecture, pool, jacuzzi boil & bubbles
│   │   ├── score_board.ts       # Outdoor & indoor weekly/all-time wins leaderboards
│   │   ├── furniture.ts         # DJ console, audio gear, braai stand, media credenza
│   │   ├── lights.ts            # Suspended halo chandelier & cove neon lighting
│   │   └── doors.ts             # Sliding glass patio doors with alpha blending
│   ├── server/
│   │   ├── player_economy.ts    # Authoritative profile, quest, streak & leaderboard storage
│   │   ├── leaderboard.ts       # Leaderboard initialization helpers
│   │   └── storage.ts           # Server persistence wrappers
│   ├── shared/
│   │   └── messages.ts          # Shared room message schemas
│   └── index.ts                 # Main scene entry point
├── scene.json                   # Decentraland scene manifest (realm metadata & thumbnails)
└── package.json                 # SDK7 dependencies (@dcl/sdk, @dcl/js-runtime)
```

---

## 🏆 Decentraland Creator Program

- **Target Grant:** V0: The Vertical Slice ($1,000 USD)
- **Positioning:** 100% Free-to-Play Social Card Game (Non-Gambling)
- **Realm Jump URL:** [https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth)
- **License:** MIT
