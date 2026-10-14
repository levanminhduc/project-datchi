import { AiToolError } from './types'

export function normalizeTex(raw: string): string {
  const tex = raw.trim().replace(/^tex\s*/i, '').replace(/\s+/g, '')
  if (!/^\d+(\/\d+)?$/.test(tex)) throw new AiToolError('invalid_input', 'Tex chỉ gồm số, ví dụ 40 hoặc 40/2')
  return tex
}

export function texMatches(value: string | null, tex: string): boolean {
  if (value == null) return false
  return value.trim() === tex || new RegExp(`(^|[^0-9/])${tex}($|[^0-9/])`).test(value)
}
