# Game Design Document: Crazy 8: Last Call

## V0 Vertical Slice

- **Project:** Crazy 8: Last Call, set in the VIP Cyber Lounge
- **Creator:** Rooi (`rooi.dcl.eth`)
- **V0 request:** $1,000
- **Repository:** https://github.com/moeketsi200/crazy-8
- **Test world:** `rooi.dcl.eth` (confirm the shared link points to the build being tested)
- **Document status:** Reapplication draft
- **Last updated:** October 2026

**Known issue:** The previous reviewer could not get the test experience working. The cause is unknown and must be reproduced before choosing a fix.

## 1. Core Concept and Social Hook

### High concept

Crazy 8: Last Call is a social card match played around a shared table in Decentraland. Players use familiar Crazy Eights rules, with the existing declaration-and-challenge mechanic as the moment we want to test.

### The Last Call moment

The current design asks a player to declare at three cards and again at one card. The one-card announcement is called **Last Call**. If a player passes a turn without declaring, another player may challenge; a successful challenge makes the player draw two cards.

The current GDD does not specify a timed challenge window or a penalty for an incorrect challenge. Those behaviors must be checked in the build before they are described as rules. This V0 proposal does not add either rule.

The design premise is that players gathered at one table can notice and react to the announcement and challenge. Playtesting will determine whether that creates meaningful interaction.

## 2. V0 Hypothesis

> For first-time groups playing at a shared Decentraland table, does the existing Last Call declaration-and-challenge moment prompt player interaction and make the group choose a rematch?

This is the question V0 will investigate. It is not yet a proven result.

## 3. Current Project Status

The following systems are described in the project. Their behavior in the submitted test build has not yet been verified end-to-end.

| Feature | Current status | Evidence needed |
| --- | --- | --- |
| Card deck, turns, and win condition | Implemented locally; shared-build verification pending | Complete a round through to its result |
| Action cards and penalty stacking | Implemented locally; shared-build verification pending | Demonstrate actions and resolve a penalty |
| AI bots | Implemented locally; solo-path verification pending | Start alone and finish a round without waiting for other players |
| Chair seating and match entry | Implemented locally; first-time flow verification pending | New player can find the table and start without coaching |
| Multiplayer sync | Implemented locally; live multiplayer verification pending | Two or more players complete a round together |
| Three-card and Last Call declarations | Described in current design; implementation verification pending | Demonstrate a declaration and the result of a successful challenge |
| Rematch flow | Needs verification | Complete a round and find a clear next step |

The reason the previous test did not work is not yet known. Ask the reviewer what happened, then reproduce it with a first-time visitor before deciding what to change.

## 4. V0 Scope

### Included

- Diagnose the test-entry or match-start failure before selecting a fix.
- Make only the changes needed for a visitor to enter and complete a round.
- Verify the existing solo bot path, if it works in the shared build, so a reviewer arriving alone can try the game.
- Verify a complete match with real players.
- Observe how players respond to the current Last Call mechanic.
- Provide a clear round result and rematch choice if the current flow needs it.
- Run small playtest sessions with 8–10 first-time players recruited through Decentraland's `#playtesters` channel.

### Outside V0

These systems may remain in the project as setting or existing work. They are not V0 development or evaluation goals:

- Rooftop, elevator, pool, jacuzzi, and additional venue interactions
- Daily economy, shop, currencies, streaks, bounties, and persistent rewards
- New action cards or changes to the challenge rules
- 3D cards attached to avatars
- Spectator betting and tournament systems
- Additional wearable releases

Decentraland's MVP guidance recommends validating a basic player experience through successive prototypes. This V0 therefore focuses on one playable table loop before expanding the surrounding systems. See [MVP guidelines](https://docs.decentraland.org/creator/scenes-sdk7/designing-the-experience/mvp-guidelines).

## 5. Core Match Loop

1. A player enters the lounge and finds the table.
2. The player starts or joins a match.
3. Players take turns playing or drawing cards under the current rules.
4. Players declare at low hand counts; the one-card moment is Last Call.
5. A round ends with a winner and a clear choice to play again.

The exact start instructions will be written after the test-entry flow has been reproduced and confirmed.

## 6. Playtest Plan

### Format

- Recruit 8–10 unique first-time players through `#playtesters`.
- Run several small sessions so players can play with real opponents.
- Share a direct link and short instructions that match the verified build.
- Observe the first attempt without coaching; ask brief follow-up questions after the round.

### Record these three outcomes

1. How many players started and finished a round without help?
2. Did Last Call lead to conversation, a challenge, or another player reaction?
3. How many groups chose to play a rematch?

Report the observed counts and comments, such as `7/10 completed a round without help`. These pilot results are for learning; they are not a promise of broad retention or a comparison with other games.

### Evidence to include with a reapplication

- A confirmed playable link and simple entry instructions
- A short recording showing a real match from entry through the result
- A concise findings report with participant counts, observed friction, Last Call reactions, rematch choices, and known limitations

A recording supports the playable link; it does not replace it.

## 7. V0 Milestones

1. **Ask and reproduce:** Request details from the reviewer and reproduce the failure with a first-time visitor.
2. **Stabilize:** Make the smallest fix supported by the reproduction.
3. **Playtest:** Run sessions with 8–10 first-time players and record the three outcomes above.
4. **Report:** Summarize what worked, what needs improvement, and the next step.

The V0 is complete when the shared build supports a demonstrated full match and the playtest results have been documented.

## 8. Later Roadmap

The VIP Cyber Lounge, venue interactions, economy, cosmetics, and community events remain part of the longer-term vision. Their next steps will be chosen after the table loop and Last Call hypothesis have been tested.
