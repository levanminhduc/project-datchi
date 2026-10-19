export const RESULT_LIMIT_BYTES = 200 * 1024

function byteSize(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value) ?? 'null', 'utf8')
}

function trimArray(items: unknown[], budget: number): unknown[] {
  let low = 0
  let high = items.length
  while (low < high) {
    const middle = Math.ceil((low + high) / 2)
    if (byteSize(items.slice(0, middle)) <= budget) low = middle
    else high = middle - 1
  }
  return items.slice(0, low)
}

export function limitResult(result: unknown, limit = RESULT_LIMIT_BYTES): { result: unknown; truncated: boolean } {
  if (byteSize(result) <= limit) return { result, truncated: false }
  if (Array.isArray(result)) return { result: trimArray(result, limit), truncated: true }
  if (!result || typeof result !== 'object') return { result: null, truncated: true }

  const output: Record<string, unknown> = { ...(result as Record<string, unknown>) }
  const arrayKeys = Object.keys(output)
    .filter((key) => Array.isArray(output[key]))
    .sort((a, b) => byteSize(output[b]) - byteSize(output[a]))

  for (const key of arrayKeys) {
    if (byteSize(output) <= limit) break
    const items = output[key]
    if (!Array.isArray(items)) continue
    const others = byteSize({ ...output, [key]: [] })
    output[key] = trimArray(items, Math.max(limit - others, 2))
  }
  return { result: output, truncated: true }
}
