import { Pool } from 'pg'

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.SUPABASE_DB_URL

let pool: Pool | null = null

if (connectionString) {
  try {
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false, // Required for Supabase cloud PostgreSQL
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })

    pool.on('error', (err) => {
      console.error('[Supabase Postgres Pool Error]:', err)
    })

    console.log('[Supabase Postgres] Configured pool with remote database URL')
  } catch (err) {
    console.error('[Supabase Postgres] Failed to initialize pool:', err)
  }
} else {
  console.log('[Database] No DATABASE_URL provided. Operating in in-memory simulation mode.')
}

export const dbPool = pool

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  if (!pool) {
    throw new Error('Database pool not configured (DATABASE_URL is not set)')
  }
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export function isCloudDatabaseConnected(): boolean {
  return pool !== null
}
