# Game Design Document: Crazy 8: Last Call (V0 Vertical Slice)

**Project Name:** Crazy 8: Last Call  
**Target Submission:** Decentraland Studio Onboarding — V0: The Vertical Slice ($1,000 USD)  
**Author / Studio:** Rooi (`rooi.dcl.eth`)  
**Live Build Realm:** `rooi.dcl.eth`  
**Repository:** [https://github.com/moeketsi200/crazy-8](https://github.com/moeketsi200/crazy-8)  
**Last Updated:** October 2026  

---

## 1. Core Concept & The Social Hook

### 1.1 High Concept
*Crazy 8: Last Call* is a social tabletop shedding card game built natively for Decentraland. While the basic matching rules (suit or rank) are instantly familiar to anyone, the game’s defining signature mechanic is **"Last Call"**—a public declaration and challenge system that creates bluffing, psychological tension, and active table talk between live avatars.

### 1.2 The Signature Moment: "Last Call"
In traditional digital card apps, declarations happen automatically in silent menus. In *Crazy 8: Last Call*, this moment is the social heartbeat of the table:
1. **The Declaration**: When a player holds **3 cards** or **1 card ("Last Call")**, they must publicly declare their status before their turn ends.
2. **The Window**: If a player forgets or bluffs, a 5-second challenge window opens for opponents.
3. **The Challenge**: Any alert opponent at the table can hit **"Challenge!"**.
   - If the player failed to declare: **The bluffer draws a +2 card penalty.**
   - If the challenge was false/wrong: **The challenger draws a +1 card penalty.**
4. **Why this matters in Decentraland**: The penalty creates real stakes. Players watch each other's card counts, call bluffs in proximity voice/text chat, and celebrate caught bluffs together. It turns a quiet card game into a lively party table.

---

## 2. V0 Hypothesis & Validation Goals

### 2.1 The Core Hypothesis
> **V0 Hypothesis:**  
> *"Does the public 'Last Call' declaration-and-challenge mechanic create meaningful table interaction between first-time players and motivate them to play a rematch?"*

### 2.2 What V0 Funding ($1,000) Tests & Solves
The $1,000 V0 funding is strictly dedicated to validating the core table loop:
1. **Frictionless Unassisted Start**: Ensuring a group of first-time players (or a solo reviewer arriving alone with bot fallback) can enter the scene, sit, and start a complete round in under 15 seconds without developer guidance.
2. **Signature Moment Clarity**: Refining audio-visual feedback when a "Last Call" is declared or challenged so the entire table instantly understands what happened.
3. **The Rematch Loop**: Testing whether groups naturally choose to start a rematch immediately after round completion.

---

## 3. Feature Status: What Works vs. What V0 Tests

To provide full transparency to the review committee, the project is structured into three clear stages:

| Feature / System | Status Today | V0 Focus (Testing with Funding) | Out of Scope (Future Roadmap) |
| :--- | :---: | :---: | :---: |
| **54-Card Turn Engine** | ✅ Working | Verified with 2–6 players | — |
| **Penalty Stacking (2s & Jokers)** | ✅ Working | Balance check during playtests | — |
| **Chair Seating & Camera Anchor** | ✅ Working | Verify camera framing during hand play | — |
| **Solo Fallback (AI Bots)** | ✅ Working | Ensures a solo reviewer can always play a full round | — |
| **Unassisted Start / Lobby Flow** | 🟡 In Progress | **Primary V0 Priority**: 1-click start, zero confusion | — |
| **"Last Call" & Challenge FX** | 🟡 In Progress | **Primary V0 Priority**: Obvious audio/visual table cues | — |
| **Rematch Prompt** | 🟡 In Progress | **Primary V0 Priority**: Seamless post-round restart | — |
| **Penthouse / Terrace Venue** | 📦 Built (Background) | Ambient backdrop only | Phase 2 Expansion |
| **Jacuzzi / Pool Water Physics** | 📦 Built (Background) | Ambient backdrop only | Phase 2 Expansion |
| **Chips / Trophies Daily Economy** | 📦 Built (Background) | Ambient backdrop only | Phase 2 Expansion |
| **Wearable Pro Shop & Models** | 📦 Built (Background) | Ambient backdrop only | Phase 3 Creator Economy |

> *Note: While architectural models and visual props already exist in the scene, they are treated as ambient staging. The V0 grant evaluation is strictly measured on the table gameplay.*

---

## 4. Playtest Plan: Decentraland `#playtesters`

Following the Creator Success team's recommendation, V0 validation will be conducted directly through the official Decentraland Discord `#playtesters` channel.

### 4.1 Playtest Format
- **Participants**: 2 cohorts of 4–5 players (8–10 total unique first-time players).
- **Setup**: Players receive a direct jump link to `rooi.dcl.eth` and a 2-line instruction: *"Click a chair to sit. Shed your cards, and remember to declare Last Call when down to 1 card."*
- **Role of the Developer**: Silent observer. No coaching or intervention.

### 4.2 Measurable Success Signals (Target Thresholds)
Rather than ungrounded marketing metrics, V0 success will be evaluated against 3 clear player behaviors:

1. **Onboarding Autonomy**: **≥ 8 out of 10** players sit, understand whose turn it is, and finish a complete round without host intervention.
2. **Mechanic Engagement**: **≥ 6 out of 10** players actively declare "Last Call" or challenge an opponent during a match.
3. **Social Retention / Rematch**: **≥ 6 out of 10** players vote to play a rematch immediately after the first game concludes.

### 4.3 Deliverables at the End of V0
- A 2-minute unedited gameplay clip showing a real 4-player playtest match from start to finish.
- A concise Playtest Findings Report documenting player feedback, observed friction points, and rematch rate.
- A clean, bug-free build ready for community game nights.

---

## 5. How a Match Plays (The Core Loop)

```
[ 1. APPROACH & SIT ]
   └─ Walk up to table. Click an open chair.
   └─ Instant prompt: "Play Solo vs Bots" or "Host Group Match".
   └─ Seated avatar faces the felt with optimized camera framing.

[ 2. DEAL & MATCH ]
   └─ 5 cards dealt per hand. Top discard revealed.
   └─ Active turn highlighted on table felt and player hand UI.
   └─ Play valid Suit, Rank, or 8 (Wild).
   └─ Counter-attack: Stack 2s (+2) or Jokers (+4) to deflect penalties!

[ 3. THE "LAST CALL" MOMENT ]
   └─ 3 Cards Left: Click "Declare 3 Cards".
   └─ 1 Card Left: Click "Last Call!".
   └─ Missed declaration? Opponents have 5 seconds to CHALLENGE.
   └─ Caught bluffer draws +2; false challenger draws +1.

[ 4. FINISH & REMATCH ]
   └─ First player to shed all cards wins.
   └─ Clear table-wide notification: "Winner: [Avatar Name]".
   └─ 1-Click "Play Again" button appears immediately.
```
