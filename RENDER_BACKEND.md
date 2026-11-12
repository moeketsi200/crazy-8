# Crazy 8 Render backend

Render owns live match state, validates game actions, runs bot turns, and publishes canonical game state to connected players. Player identity is established with Decentraland signed fetch; each WebSocket ticket can be used once and expires after one minute.

## Persistent profiles, leaderboards, and rewards

The headless Decentraland scene still handles player economy requests. By default, profiles and leaderboards use Decentraland Storage. Set `CRAZY8_STORAGE_BACKEND=render` in the World environment to use Render Postgres. On the first read of each profile or the leaderboard, the scene copies the existing Decentraland Storage value into Postgres if the Render database does not already have it. Later reads and writes use Render. The original Decentraland values remain untouched as a recovery copy; temporary Render errors are reported and retried.

Completed round settlements are written to Postgres when `DATABASE_URL` is configured. The headless scene imports rewards and leaderboard results, saves them, then acknowledges the settlement so it can be removed. This lets pending results survive a Render service restart. Without Postgres, the game server keeps settlements in memory only.

The Blueprint defines a small paid Postgres database. A Free Render Postgres database expires 30 days after creation and is not suitable for permanent player data. Review the database plan and billing in Render before syncing the Blueprint.

## Configure and deploy

1. Push the project to a Git repository and create or update the Render Blueprint from `render.yaml`. Syncing the new `crazy8-storage` resource creates a paid Postgres database.
2. Set `CRAZY8_SETTLEMENT_TOKEN` in Render to a long random secret. Keep it private.
3. Keep `GAME_SERVER_HTTP_URL` in `src/game/server_config.ts` and set `CRAZY8_RENDER_URL` in Decentraland Storage → Environment for the World to the service URL, currently `https://crazy-8-so8f.onrender.com`.
4. Set `CRAZY8_SETTLEMENT_TOKEN` in the World environment to the same secret.
5. After the Render database exists and `/healthz` reports `"persistence":"postgres-ready"`, set `CRAZY8_STORAGE_BACKEND=render` in the World environment. The first player-profile and leaderboard reads will import any existing Decentraland Storage values.
6. Add `USE_FETCH` and `USE_WEBSOCKET` to required scene permissions in Creator Hub, then deploy the World update so its server environment and permissions take effect.

For a manual Render service, use build command `npm install --omit=dev` and start command `npm run backend:start`. `GET /healthz` returns HTTP 200 and reports `postgres-ready`, `postgres-unavailable`, or `memory-only`. A 404 at `/` is expected; a 404 at `/healthz` means the service is not running this backend.

The Render service is configured with one free web instance so all WebSocket clients reach the same in-memory match state. Free services can sleep while idle, so the first player after a sleep may wait for a cold start. An always-on service is needed for a live launch. A restart or deploy ends matches currently in progress, while saved profiles, leaderboard data, and pending settlements remain in Postgres.

## Local service commands

- `npm run backend:dev` starts the Render service locally with file watching.
- `npm run backend:start` starts the service without watching files.
- `GET /healthz` reports service health and whether Postgres is ready.

The local service needs `CRAZY8_SETTLEMENT_TOKEN` to support reward lookups. It also needs `DATABASE_URL` to persist profiles or settlements. Set `CRAZY8_RENDER_URL` in the Decentraland World environment to a reachable tunnel or host, and `CRAZY8_STORAGE_BACKEND=render` to use Render for profile and leaderboard data.
