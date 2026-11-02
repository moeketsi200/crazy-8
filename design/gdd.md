# Game Design Document: Crazy 8: Last Call

## V0 Vertical Slice

- **Project:** Crazy 8: Last Call, set in the VIP Cyber Lounge
- **Creator:** Rooi (`rooi.dcl.eth`)
- **V0 request:** $1,000
- **Repository:** https://github.com/moeketsi200/crazy-8
- **Test world:** `rooi.dcl.eth` (confirm the shared link points to the build being tested)
- **Document status:** Reapplication draft
- **Last updated:** October 2026

**Known issue:** The previous reviewer could not get the test experience working. The cause is unknown. The creator reports successfully playing a four-player game in the test world, so multiplayer worked in that session. The build/link, date, and steps from that session should be recorded, and the reviewer’s failure still needs to be reproduced or clarified. This report does not yet verify the first-time solo entry path.

## 1. Core Concept and Social Hook

### High concept

Crazy 8: Last Call is a social card match played around a shared table in Decentraland. It currently uses familiar Crazy Eights rules. The project-specific interaction to investigate is a public low-hand declaration: players with three or fewer cards can announce their count, and opponents can inspect and challenge an undeclared low hand for a two-card penalty.

### The Last Call moment

The local implementation allows a player with one, two, or three cards to press a declaration button. The announcement is visible to the group; the one-card declaration is the dramatic **Last Call** moment. Opponents can click a low-card hand marked as undeclared. A successful challenge makes that player draw two cards; an incorrect challenge produces a notification but no listed penalty to the challenger.

Important rule clarification: the current code does not implement a pass-turn declaration deadline or a timed challenge window. A challenge target appears to remain available while that player has three or fewer cards and has not declared. The GDD previously described a missed declaration after passing; that description is not supported by the current code and is removed here. Verify the shared build before treating any local behavior as shipped behavior.

The proposed Decentraland-specific value is the face-to-face, public table moment: opponents see the low-hand status, decide whether to challenge, and can react together over nearby voice chat. This is a design premise, not demonstrated differentiation. Playtesting must establish whether this interaction makes the familiar card game more engaging for groups.

## 2. V0 Hypothesis

> When first-time groups play a complete Crazy Eights round together at a shared Decentraland table, does the public low-hand declaration and challenge create observable player-to-player reactions, and do groups choose to play again?

This is the question V0 will investigate. It is not yet a proven result.

## 3. Current Project Status

The following systems are described in the project. Status distinguishes code present locally from behavior reported or verified in the shared build.

| Feature | Current status | Evidence needed |
| --- | --- | --- |
| Card deck, turns, and win condition | Implemented locally; shared-build verification pending | Complete a round through to its result |
| Action cards and penalty stacking | Implemented locally; shared-build verification pending | Demonstrate actions and resolve a penalty |
| AI bots | Implemented locally; solo-path verification pending | Start alone and finish a round without waiting for other players |
| Chair seating and match entry | Implemented locally; first-time flow verification pending | New player can find the table and start without coaching |
| Multiplayer sync | Implemented locally; creator reports a successful four-player game; independent/repeat verification pending | Record the build/link and session details; repeat with a fresh group and capture a complete round |
| Low-hand declaration and challenge | Implemented locally; shared-build rules and usability verification pending | Demonstrate declaration at 3, 2, and 1 cards; identify when a challenge is allowed; demonstrate correct and incorrect challenges |
| Rematch flow | Needs verification | Complete a round and find a clear next step |

The reason the previous test did not work is not yet known. Ask the reviewer what happened, then reproduce it with a first-time visitor before deciding what to change. Record the exact build/link, test date, spawn position, visible instructions, actions attempted, and point of failure. The creator’s four-player session is evidence that a multiplayer game worked for that group; it does not establish that a first-time visitor can discover and start it without help. Verify the solo entry path and capture a complete shared round as supporting evidence.

## 4. V0 Scope

### Included

- **Playable prototype gate:** reproduce and diagnose the failed test entry; verify from a fresh visitor account that the deployed link loads, the table and instructions are findable, solo mode starts, and a full round reaches a result and restart choice. Capture a short unedited recording of this flow.
- **Multiplayer evidence:** the creator reports having played with four people successfully. Record which build/link and entry steps were used, and capture a complete shared round if available. During V0, repeat with a fresh group and record any sync, entry, turn, or completion failures.
- **Mechanic gate:** verify declarations at 3/2/1 cards and the challenge rules in the shared build. Correct the documentation or implementation if they differ. Do not add new rules until the current mechanic is understood.
- **Playtest:** after the gates pass, run sessions with 8–10 first-time players recruited through Decentraland's `#playtesters` channel. Observe without coaching before asking follow-up questions.
- **Decision:** use the recorded observations to decide whether to retain, revise, or remove the declaration-and-challenge hook for the next prototype.

### Outside V0

These systems may remain in the project as setting or existing work. They are not V0 development or evaluation goals; they must not delay the playable table prototype:

- Rooftop, elevator, pool, jacuzzi, and additional venue interactions
- Daily economy, shop, currencies, streaks, bounties, and persistent rewards
- New action cards or changes to the challenge rules
- 3D cards attached to avatars
- Spectator betting and tournament systems
- Additional wearable releases

Decentraland's MVP guidance recommends validating a basic player experience through successive prototypes. This V0 therefore focuses on one playable table loop before expanding the surrounding systems. See [MVP guidelines](https://docs.decentraland.org/creator/scenes-sdk7/designing-the-experience/mvp-guidelines).

## 5. Core Match Loop

1. A visitor enters the lounge and can find the rules and table without coaching.
2. The visitor starts a solo game or joins a multiplayer lobby.
3. Players take turns playing or drawing cards under the verified rules.
4. When a hand reaches three or fewer cards, the player can declare; at one card, the announcement is Last Call. Opponents can challenge an undeclared low hand under the current implementation.
5. The round shows its result and a clear next action.

The exact player instructions and challenge timing must be updated after the deployed flow and rules have been reproduced and confirmed.

## 6. Playtest Plan

### Format

- Recruit 8–10 unique first-time players through `#playtesters`.
- Run several small sessions so players can play with real opponents.
- Share a direct link and short instructions that match the verified build.
- Observe the first attempt without coaching; ask brief follow-up questions after the round.

### Record these outcomes

1. How many first-time players entered, started, and finished a round without help? Where did others get stuck?
2. Did a declaration or challenge occur? Did it lead to conversation, voice-chat reaction, strategy change, or another observable player response?
3. How many groups chose a rematch, and what reason did they give?

Report raw counts with denominators and brief anonymized observations, such as `7/10 completed a round without help` or `3/4 groups chose a rematch`. Separate observed behavior from player-reported reasons. These pilot results are for learning; they are not a promise of broad retention or a comparison with other games.

### Evidence to include with a reapplication

- A confirmed playable link and simple entry instructions
- A short recording showing a real match from entry through the result
- A concise findings report with participant counts, observed friction, Last Call reactions, rematch choices, and known limitations

A recording supports the playable link; it does not replace it.

## 7. V0 Milestones

1. **Diagnose:** Request details from the reviewer and reproduce the failure using the exact deployed link and a first-time visitor.
2. **Make it playable:** Fix the reproduced blocker, then pass the solo completion gate and capture the flow.
3. **Verify multiplayer and rules:** Complete a shared round and document what the declaration/challenge system actually permits.
4. **Playtest and decide:** Run the first-time sessions, report the outcomes, and state whether evidence supports keeping or changing the social hook.

The prototype is ready for the hypothesis test only when a fresh visitor can complete a solo round in the deployed build and two players can complete a shared round. V0 is complete when those gates, playtest results, and a keep/revise/remove decision are documented. If the build gate fails, report the blocker and do not present the social hypothesis as tested.

## 8. Later Roadmap

The VIP Cyber Lounge, venue interactions, economy, cosmetics, and community events remain part of the longer-term vision. Their next steps will be chosen after the table loop and Last Call hypothesis have been tested.
