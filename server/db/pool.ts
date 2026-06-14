import { existsSync } from 'fs'
import dotenv from 'dotenv'
import { Pool, type PoolConfig } from 'pg'

if (existsSync('.env')) {
  dotenv.config({ override: true })
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL is not set. The backend requires a PostgreSQL connection string to start.'
  )
}

const poolConfig: PoolConfig = {
  connectionString,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  idleTimeoutMillis: Number(process.env.DATABASE_POOL_IDLE_TIMEOUT_MS ?? 30000),
  connectionTimeoutMillis: Number(
    process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS ?? 10000
  ),
}

export const pool = new Pool(poolConfig)

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err)
})

const redactedUrl = connectionString.replace(/:\/\/([^:]+):[^@]*@/, '://$1:****@')
console.log(`PostgreSQL pool initialized for: ${redactedUrl}`)
