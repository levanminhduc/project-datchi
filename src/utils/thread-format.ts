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
