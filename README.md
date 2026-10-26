# Crazy 8: VIP Cyber Lounge

A high-stakes multiplayer **Crazy Eights** card game built for **Decentraland SDK7**, set within a luxury two-story cyberpunk penthouse lounge. Challenge friends or AI bots around a holographic table, trigger dynamic card action effects, and socialize in a rooftop terrace with a bubbling jacuzzi, dynamic pool splash physics, and a panoramic glass elevator.

[![Play in Decentraland](https://img.shields.io/badge/Decentraland-Play%20Now-ff2d55?style=for-the-badge&logo=decentraland)](https://decentraland.org/jump?realm=rooi.dcl.eth)
[![SDK7](https://img.shields.io/badge/Engine-SDK7%20(ECS7)-00f3ff?style=for-the-badge)](https://docs.decentraland.org/creator/scenes-sdk7/)
[![Author](https://img.shields.io/badge/Creator-Rooi-gold?style=for-the-badge)](https://decentraland.org/jump?realm=rooi.dcl.eth)

---

## 🌐 Live World Deployment

**Jump directly into the live scene:**  
👉 **[https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth)**

---

## 🎮 Key Features

- **Multiplayer Crazy Eights (Up to 6 Players)**:
  - Full 54-card deck including action cards:
    - **8 (Wild Card)**: Change active suit anytime.
    - **2 (Draw Two)**: Next player draws 2 penalty cards.
    - **J (Reverse)**: Reverses round turn order.
    - **7 (Skip)**: Skips the next player's turn.
    - **Joker (Mega Wild)**: Forces next player to draw 4 penalty cards and changes suit.
  - **Dynamic AI Backfill**: Play solo instantly against intelligent Cyber Bots or seat up to 6 live Decentraland players.
  - **Declaration & Challenge System**: Declare when holding 3 cards or 1 card ("Last Card"). Opponents can hit **Challenge** to catch unannounced turns and inflict a +2 card penalty!
  - **Display Name Resolution**: Displays true Decentraland avatar profile names (e.g., `Rooi`, `Cyber Bot`) in card announcements, challenges, and leaderboards instead of raw 42-character wallet hashes.

- **Cyber VIP Penthouse Architecture**:
  - **Ground Floor Lounge**: Holographic circular card table, Pioneer-inspired CDJ DJ console, club sound system, rules info board, and high winnings leaderboard.
  - **Chillers Oasis Patio**:
    - **Neon Luxury Pool**: Multi-ring surface ripples, droplet physics, wading wake, and 3D positional water splash audio.
    - **Heated Bubbling Jacuzzi**: Magenta neon perimeter, chaotic boiling surface water physics, and rising/wobbling bubbles.
    - **South African Braai Stand**: Architectural dark basalt outdoor kitchen with glowing ember grill.
  - **Panoramic Glass Elevator**: Fully functional 2-story elevator with floor-level safety doors, call buttons, and vertical collision transport between the Ground Patio and Rooftop.
  - **Rooftop VIP Terrace**: Elevated viewpoint with glass balustrades, neon perimeter accents, and rooftop bar.

---

## 📖 Game Design Document (GDD)

For complete game mechanics, math balance, social systems, and the V0 vs V1 technical roadmap, see the official design document:  
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

### Publishing to Decentraland World
```bash
npm run deploy -- --target-content https://worlds-content-server.decentraland.org
```

---

## 📂 Project Structure

```
crazy-8/
├── assets/
│   ├── Audio/               # 3D spatial sound effects (splash.mp3, cards, elevator)
│   ├── images/              # Textures (suits, cyber table felt, logo, dark hex, thumbnail)
│   └── scene/               # Composite scene metadata
├── design/
│   └── gdd.md               # Official Game Design Document (V0 Submission)
├── src/
│   ├── game/
│   │   ├── logic.ts         # Core Crazy 8s rules, card deck, AI bot decision trees
│   │   ├── table.ts         # 3D table seating, player name resolution, card transforms
│   │   ├── ui.tsx           # React-ECS in-world card hand HUD & action buttons
│   │   ├── elevator.ts      # Panoramic elevator state machine, doors & physics
│   │   ├── water_effects.ts # Pool splash audio, surface ripples, droplet particles
│   │   ├── house.ts         # Penthouse architecture, pool, jacuzzi boil & bubbles
│   │   ├── score_board.ts   # Outdoor high winnings billboard & indoor TV scoreboard
│   │   ├── furniture.ts     # DJ console, audio gear, braai stand, media credenza
│   │   ├── lights.ts        # Suspended halo chandelier & cove neon lighting
│   │   └── doors.ts         # Sliding glass patio doors with alpha blending
│   └── index.ts             # Main scene entry point
├── scene.json               # Decentraland scene manifest (realm metadata & thumbnails)
└── package.json             # SDK7 dependencies (@dcl/sdk, @dcl/js-runtime)
```

---

## 🏆 Decentraland Creator Program

- **Target Grant:** V0: The Vertical Slice ($1,000 USD)
- **Studio Onboarding Form:** [Decentraland V0 Application Form](https://docs.google.com/forms/d/e/1FAIpQLSc2xYxbrn75q2SjX-_MGyWmjQaEVOGVDg8-Uj9iXMMYA_zT_A/viewform)
- **Realm Jump URL:** [https://decentraland.org/jump?realm=rooi.dcl.eth](https://decentraland.org/jump?realm=rooi.dcl.eth)
- **License:** MIT
