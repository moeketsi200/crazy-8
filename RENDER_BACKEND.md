# Crazy 8 Render backend

The Render service now owns live match state, validates every game action, runs bot turns, and sends the canonical game state to connected players. Player identity is established with Decentraland signed fetch; the WebSocket ticket can be used once and expires after one minute.

The Decentraland headless scene process remains enabled as a small Storage service. Render cannot write to Decentraland Storage directly, so it retains completed round settlements in memory and the headless process fetches those settlements over a server-only, bearer-token-protected endpoint before changing a saved player profile or the existing persistent leaderboard. Processed settlement IDs prevent duplicate rewards and leaderboard wins.

## Deploy

1. Push this project to a Git repository and create a Render Blueprint from it. Render reads `render.yaml` and builds from the repository root.
2. Set `CRAZY8_SETTLEMENT_TOKEN` when Render prompts for the secret. Use a long random value and keep it private.
3. The Blueprint creates `https://crazy8-game-server.onrender.com`. If Render assigns a different host, update `GAME_SERVER_HTTP_URL` in `src/game/server_config.ts` and redeploy the World.
4. In Decentraland Storage → Environment for the World, set `CRAZY8_RENDER_URL` to `https://crazy8-game-server.onrender.com` and set `CRAZY8_SETTLEMENT_TOKEN` to the exact same secret as Render.
5. Add `USE_FETCH` and `USE_WEBSOCKET` to the scene's required permissions in Creator Hub before deploying the World update.

The Render service is configured with one free instance so all WebSocket clients reach the same in-memory match state. Free services can sleep when idle; the first player after a sleep may wait for a cold start. Use an always-on paid instance for a live launch. A Render restart or deploy ends matches currently in progress; completed settlements remain available to the DCL Storage service only while the Render process stays up.

## Local service commands

- `npm run backend:dev` starts the Render service locally with file watching.
- `npm run backend:start` starts the service without watching files.
- `GET /healthz` reports service health.

The local service needs `CRAZY8_SETTLEMENT_TOKEN` to support DCL Storage reward claims. Local clients also need the HTTP URL in `src/game/server_config.ts` to point at the tunnel or host where the service is reachable.
