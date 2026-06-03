export function formatStyleDisplay(
  styleCode: string | null | undefined,
  styleName: string | null | undefined,
): string {
  const code = styleCode?.trim() || ''
  const name = styleName?.trim() || ''
  if (!code) return name || '-'
  if (!name || name === code) return code
  return `${code} - ${name}`
}

export function formatTexDisplay(texNumber: number | string | null | undefined): string {
  const tex = String(texNumber ?? '').trim()
  if (!tex) return 'Tex ?'
  const hasTexPrefix = /^tex(?:\s+|(?=\d)|$)/i.test(tex)
  if (!hasTexPrefix) return `Tex ${tex}`
  const value = tex.replace(/^tex/i, '').trim()
  return value ? `Tex ${value}` : 'Tex'
}

export function formatThreadTypeDisplay(
  supplierName: string | null | undefined,
  texNumber: number | string | null | undefined,
  colorName: string | null | undefined,
  fallbackName?: string,
): string {
  const supplier = supplierName?.trim()
  const color = colorName?.trim()
  if (!supplier) return fallbackName || '-'
  const parts = [supplier, formatTexDisplay(texNumber)]
  if (color) parts.push(color)
  return parts.join(' - ')
}
