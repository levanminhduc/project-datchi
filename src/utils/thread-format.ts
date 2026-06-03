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

function normalizeTexDisplayKey(value: number | string | null | undefined): string {
  return formatTexDisplay(value).toLocaleLowerCase('vi-VN').replace(/\s+/g, ' ').trim()
}

export function formatTexWithLabel(
  texNumber: number | string | null | undefined,
  texLabel: string | null | undefined,
): string {
  const rawTexNumber = String(texNumber ?? '').trim()
  const rawTexLabel = texLabel?.trim()
  const texDisplay = rawTexNumber ? formatTexDisplay(rawTexNumber) : formatTexDisplay(rawTexLabel)

  if (!rawTexLabel) return texDisplay
  const texLabelDisplay = formatTexDisplay(rawTexLabel)
  const texDisplayKey = normalizeTexDisplayKey(texDisplay)
  const texLabelDisplayKey = normalizeTexDisplayKey(texLabelDisplay)
  if (texLabelDisplayKey === texDisplayKey || texLabelDisplayKey.startsWith(`${texDisplayKey} `)) {
    return texLabelDisplay
  }
  return `${texDisplay} - ${rawTexLabel}`
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
