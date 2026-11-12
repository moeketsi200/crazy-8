import { Pool } from 'pg'

export interface PlayerSettlement {
  settlementId: string
  matchId: string
  playerId: string
  playerName: string
  gameMode: 'solo' | 'multiplayer'
  actions: Array<{ action: 'card_played' | 'wild_eight' | 'inflict_draw' | 'declare_safe'; count: number }>
  roundWinner: boolean
  matchWinner: boolean
}

export type StorageNamespace = 'player' | 'scene'

let pool: Pool | undefined
let schemaReady: Promise<void> | undefined

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL)
}

export async function getDatabaseStatus(): Promise<'postgres-ready' | 'postgres-unavailable' | 'memory-only'> {
  if (!isDatabaseConfigured()) return 'memory-only'
  try {
    await ensureSchema()
    return 'postgres-ready'
  } catch (error) {
    console.error('[Render] Postgres health check failed:', error)
    return 'postgres-unavailable'
  }
}

function getPool(): Pool | undefined {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) return undefined
  if (!pool) pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5_000 })
  return pool
}

async function ensureSchema(): Promise<Pool> {
  const database = getPool()
  if (!database) throw new Error('Render Postgres is not configured.')
  if (!schemaReady) {
    schemaReady = database.query(`
      CREATE TABLE IF NOT EXISTS crazy8_storage (
        namespace text NOT NULL,
        player_id text NOT NULL,
        storage_key text NOT NULL,
        value jsonb NOT NULL,
        updated_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (namespace, player_id, storage_key)
      );
      CREATE TABLE IF NOT EXISTS crazy8_settlements (
        settlement_id text NOT NULL,
        player_id text NOT NULL,
        payload jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        PRIMARY KEY (settlement_id, player_id)
      );
      CREATE INDEX IF NOT EXISTS crazy8_settlements_player_created_idx
        ON crazy8_settlements (player_id, created_at);
    `).then(() => undefined).catch((error) => {
      schemaReady = undefined
      throw error
    })
  }
  await schemaReady
  return database
}

export async function getStoredValue(
  namespace: StorageNamespace,
  playerId: string,
  key: string
): Promise<{ found: boolean; value?: unknown }> {
  const database = await ensureSchema()
  const result = await database.query<{ value: unknown }>(
    'SELECT value FROM crazy8_storage WHERE namespace = $1 AND player_id = $2 AND storage_key = $3',
    [namespace, namespace === 'player' ? playerId : '', key]
  )
  if (!result.rowCount) return { found: false }
  return { found: true, value: result.rows[0].value }
}

export async function setStoredValue(
  namespace: StorageNamespace,
  playerId: string,
  key: string,
  value: unknown,
  onlyIfMissing = false
): Promise<{ saved: boolean; created: boolean }> {
  const database = await ensureSchema()
  const normalizedPlayerId = namespace === 'player' ? playerId : ''
  const conflict = onlyIfMissing ? 'DO NOTHING' : 'DO UPDATE SET value = EXCLUDED.value, updated_at = now()'
  const result = await database.query(
    `INSERT INTO crazy8_storage (namespace, player_id, storage_key, value)
     VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (namespace, player_id, storage_key) ${conflict}
     RETURNING 1`,
    [namespace, normalizedPlayerId, key, JSON.stringify(value)]
  )
  return { saved: true, created: Boolean(result.rowCount) }
}

export async function saveSettlements(settlements: PlayerSettlement[]): Promise<void> {
  if (!settlements.length) return
  const database = await ensureSchema()
  const client = await database.connect()
  try {
    await client.query('BEGIN')
    for (const settlement of settlements) {
      await client.query(
        `INSERT INTO crazy8_settlements (settlement_id, player_id, payload)
         VALUES ($1, $2, $3::jsonb)
         ON CONFLICT (settlement_id, player_id) DO NOTHING`,
        [settlement.settlementId, settlement.playerId.toLowerCase(), JSON.stringify(settlement)]
      )
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function getSettlements(playerId: string, settlementId = ''): Promise<PlayerSettlement[]> {
  const database = await ensureSchema()
  const result = await database.query<{ payload: PlayerSettlement }>(
    settlementId
      ? 'SELECT payload FROM crazy8_settlements WHERE player_id = $1 AND settlement_id = $2 ORDER BY created_at'
      : 'SELECT payload FROM crazy8_settlements WHERE player_id = $1 ORDER BY created_at',
    settlementId ? [playerId.toLowerCase(), settlementId] : [playerId.toLowerCase()]
  )
  return result.rows.map((row) => row.payload)
}

export async function acknowledgeSettlement(playerId: string, settlementId: string): Promise<boolean> {
  const database = await ensureSchema()
  const result = await database.query(
    'DELETE FROM crazy8_settlements WHERE player_id = $1 AND settlement_id = $2',
    [playerId.toLowerCase(), settlementId]
  )
  return Boolean(result.rowCount)
}
