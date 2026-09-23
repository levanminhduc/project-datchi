import type { PoolClient, QueryResultRow } from 'pg'
import { pool } from './pool'

export type QueryParams = ReadonlyArray<unknown>

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: QueryParams = []
): Promise<T[]> {
  const result = await pool.query<T>(text, params as unknown[])
  return result.rows
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: QueryParams = []
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows.length > 0 ? rows[0] : null
}

export async function querySingle<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: QueryParams = []
): Promise<T> {
  const rows = await query<T>(text, params)
  if (rows.length !== 1) {
    throw new Error(
      `querySingle expected exactly 1 row but received ${rows.length}`
    )
  }
  return rows[0]
}

export async function queryCount(
  text: string,
  params: QueryParams = []
): Promise<number> {
  const rows = await query<{ count: string | number }>(text, params)
  if (rows.length === 0) return 0
  const raw = rows[0].count
  return typeof raw === 'number' ? raw : parseInt(raw, 10)
}

export async function tx<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    try {
      await client.query('ROLLBACK')
    } catch (rollbackErr) {
      console.error('Failed to rollback transaction:', rollbackErr)
    }
    throw err
  } finally {
    client.release()
  }
}
