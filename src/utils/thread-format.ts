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

export function formatThreadTypeDisplay(
  supplierName: string | null | undefined,
  texNumber: number | string | null | undefined,
  colorName: string | null | undefined,
  fallbackName?: string,
): string {
  if (!supplierName) return fallbackName || '-'
  const parts = [supplierName, `TEX ${texNumber ?? '?'}`]
  if (colorName) parts.push(colorName)
  return parts.join(' - ')
}
