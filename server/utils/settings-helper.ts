import { queryOne } from '../db/query'

export async function getPartialConeRatio(): Promise<number> {
  try {
    const data = await queryOne<{ value: unknown }>(
      `SELECT value FROM system_settings WHERE key = $1`,
      ['partial_cone_ratio']
    )

    if (!data) {
      return 0.3
    }

    const raw = typeof data.value === 'string' ? data.value : JSON.stringify(data.value)
    return parseFloat(raw) || 0.3
  } catch {
    return 0.3
  }
}
