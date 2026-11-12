# Game Design Document: Crazy 8: Last Call — VIP Cyber Lounge

## V0 Vertical Slice Overview

- **Project:** Crazy 8: Last Call (set in the VIP Cyber Lounge)
- **Category:** 100% Free-to-Play Social Card Game (Non-Gambling)
- **Creator:** Rooi (`rooi.dcl.eth`)
- **V0 Request:** $1,000 USD
- **Repository:** https://github.com/moeketsi200/crazy-8
- **Live Test World:** `rooi.dcl.eth` — [Jump in Decentraland](https://decentraland.org/jump?realm=rooi.dcl.eth)
- **Document Status:** Updated Reapplication GDD (Pure Social Direction & Retention Plan)
- **Last Updated:** November 2026

> **Unambiguous Non-Gambling Commitment:** Crazy 8: Last Call is strictly a **100% free-to-play social card game**. There is **no betting, no wagering, no entry fees, no spectator betting, and no cash-outs**—now or in any future roadmap. All in-game **Lounge Points**, **Arcade Credits**, **Trophies**, and cosmetic unlocks are earned purely through gameplay, are non-transferable, and hold **zero cash, crypto, or MANA redemption value**.

---

## 1. Prototype Status Update

Following earlier onboarding friction, the solo-versus-bots flow, 3D table seating, and core Crazy Eights match loop were fixed and **verified working smoothly** in `rooi.dcl.eth` during follow-up testing. A solo visitor can sit at the table, launch a round immediately against AI bots, play through action cards and declarations, and finish a match without waiting for other players.

---

## 2. Target Audience & Core Proposition

### Who Is Crazy 8 For?

Crazy 8: Last Call is built specifically for **Decentraland social hangout regulars and Discord community crews** looking for a fast, zero-friction **3–5 minute drop-in tabletop game** inside a shared rooftop venue.

Unlike complex strategy games that require dedicated onboarding or multi-hour commitments, Crazy 8 serves players who want an immediate social icebreaker:
- **Community crews & friend groups** gathering between Decentraland events who want a quick, vocal game around a single circular table (`voiceChat` and `nearbyVoiceChat` enabled).
- **Solo drop-in visitors** who can immediately play a full 8-seat round against AI bots while chatting or waiting for live players to join the lounge.
- **Casual leaderboard climbers** who enjoy short matches, weekly resets, and unlocking table cosmetics solely through play.

### Core Gameplay & Differentiation: The *Last Call* Social Hook

Built on familiar Crazy Eights rules for up to **8 players**, the experience centers on a Decentraland-native spatial table moment:

- **Public Low-Hand Declaration & Challenge:** When a player drops to **1–3 cards**, they can announce their low hand to the table (1 card triggers the signature **Last Call** announcement).
- **Active Opponent Callouts:** Any opponent who spots an undeclared low-card hand (1–3 cards) can challenge that player for an instant **2-card draw penalty** (`CAUGHT!`).
- **Why Decentraland:** Around a shared 3D holographic table with nearby voice chat and avatar visibility, *Last Call* turns a quiet hand-tracking step into live table banter, bluffing, and group reactions.

---

## 3. Retention Strategy ("Why Players Come Back")

To drive repeat visits beyond one-off matches, Crazy 8 pairs short match sessions with a **pure-play progression loop** already persisted server-side via `@dcl/sdk/server` storage and settlement verification:

### Built & Working Progression Systems
- **Rotating Daily Quests:** Players receive 3 daily objectives from a rotating pool (e.g., *Warm Up*, *Crazy Eights*, *Draw Attack*, *Card Slinger*, *Winner Winner*, *Safe Call*) awarding **Lounge Points / Arcade Credits** and **Trophies**.
- **7-Day Return Streaks:** Consecutive daily check-ins build a 7-day streak ladder unlocking escalating Lounge Points, Trophies, and milestone player titles (*Apprentice* on Day 3, *Crazy 8 Master* on Day 7).
- **Weekly & All-Time Multiplayer Leaderboard:** An authoritative server tracks weekly wins (ISO week reset), all-time wins, and rounds won—excluding solo bot matches so competitive rankings reflect real human play.
- **Play-Earned Cosmetic Unlocks:** Players spend non-cashable Arcade Credits / Lounge Points and Trophy milestones to equip custom card deck backs, chair underglow auras, table titles, and wearable badges.

### V0 Social & Retention Enhancements
With Creator Success V0 support, development focuses on **social retention and weekly community rituals**—never wagering:
1. **Copy & Identity Alignment:** Replace remaining legacy `"casino"` / `"chips"` / `"high-stakes"` phrasing across `scene.json` and in-game labels with **Lounge Points / Arcade Credits** so players immediately understand it is a pure social game.
2. **Weekly Lounge League & Community Nights:** Pair the existing weekly leaderboard reset with scheduled weekly crew game nights in Decentraland `#playtesters` and Discord community hubs.
3. **Social Rematch & Crew Loops:** Surface clear end-of-round rematch prompts, table rivalry callouts, and streak-saver reminders to encourage groups to run "one more round" and return across multiple days.

---

## 4. Current Project Status (Code vs. V0 Polish)

| System | Current Status | Notes / Next Step |
| --- | --- | --- |
| Core Crazy Eights rules, action cards (`8`, `2`, `J`, `7`, `Joker`), and penalty stacking | **Working** (`src/game/logic.ts`) | Verified in live test build |
| Instant Solo Mode (fills up to 8 seats with AI bots) | **Working** (`src/game/logic.ts`) | Verified smooth in follow-up test |
| Authoritative Multiplayer Lobby & Turn Sync | **Working** (`src/game/multiplayer.ts`) | Supports up to 8 live human players |
| Low-hand Declaration & 2-Card Penalty Challenge (*Last Call*) | **Working** (`src/game/logic.ts`) | Ready for multi-player `#playtesters` observation |
| Persistent Profiles, Daily Quests, 7-Day Streaks & Cosmetics | **Working** (`src/server/player_economy.ts`, `src/game/economy_sync.ts`) | Copy update planned to rebrand legacy `"chips"`/`"casino"` terms to **Lounge Points / Arcade Credits** |
| Weekly & All-Time Multiplayer Leaderboard + 3D Scoreboards | **Working** (`src/server/player_economy.ts`, `src/game/score_board.ts`) | Weekly ISO resets live; solo/bots excluded |
| Interactive 2-Story Cyber Lounge (Pool, Jacuzzi, Elevator, DJ Deck) | **Working** (`src/game/house.ts`, `elevator.ts`, `water_effects.ts`) | Social hangout backdrop around the table |

---

## 5. V0 Hypothesis & Scope

### V0 Hypothesis

> For Decentraland social hangout regulars and Discord game-night crews playing 3–5 minute matches together, combining the **Last Call** challenge mechanic with **weekly leaderboard resets, daily quests, and play-earned Arcade Credit cosmetics** increases group rematch rates and multi-day return visits—without any betting or monetary incentives.

### Included in V0
- **Pure-Social Copy & Tag Scrub:** Remove all legacy `"casino"`, `"high-stakes"`, and `"chips"` wording in scene metadata, README, and UI strings in favor of **Lounge Points / Arcade Credits** and social tabletop positioning.
- **Multiplayer & Rematch Polish:** Smooth post-match rematch flow and social callouts for group sessions.
- **Structured Community Playtests:** Host repeatable group sessions via Decentraland Discord `#playtesters` and community crews to validate multi-player social dynamics and retention.

### Permanently Excluded (Non-Gambling Policy)
- **No spectator betting or pot splitting**
- **No MANA, token, or cash buy-ins, entry fees, or payouts**
- **No transferable or redeemable cash-value currencies**
- All progression remains strictly free-to-play and compliant with Decentraland Content Policy (Sections 2.1, 3, 5) and Terms of Use.

---

## 6. Playtest & Retention Metrics Plan

### Community Testing Format
- Organize **3–4 scheduled multi-player crew sessions** via Decentraland's `#playtesters` Discord channel (8–15 unique players across sessions).
- Track both immediate table flow and multi-day return behavior across a 7-day window.

### Metrics Recorded
1. **Onboarding & Completion:** Share of first-time visitors who sit, start, and finish a full match unassisted.
2. **Social Hook Engagement:** Frequency of *Last Call* declarations, opponent challenges, and observable voice/text chat reactions per round.
3. **Session Rematch Rate:** Percentage of multiplayer tables that immediately trigger a rematch after round 1.
4. **Return Motivation (Day-1 / Day-7):** Repeat player check-ins driven by daily quests, 7-day streaks, and weekly leaderboard standings, paired with brief player feedback on which progression rewards felt most motivating.

---

## 7. V0 Milestones

1. **Positioning & Copy Cleanup:** Align all metadata, UI labels, and shop descriptions to 100% pure-social **Lounge Points / Arcade Credits** (zero casino/wagering language).
2. **Social Loop Polish:** Refine rematch flow and weekly league visibility around the table.
3. **#playtesters Multiplayer & Retention Pilot:** Run live crew sessions, collect completion, rematch, and multi-day return metrics, and publish a concise findings report.
