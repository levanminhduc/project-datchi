const SEPARATOR_PATTERN = /^\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)*\|?$/
const NUMERIC_PATTERN = /^-?\d[\d.,\s]*$/

export function isTableRow(line: string): boolean {
  return line.trim().startsWith('|')
}

export function isTableSeparator(line: string): boolean {
  return SEPARATOR_PATTERN.test(line.trim())
}

export function splitTableCells(line: string): string[] {
  let content = line.trim()
  if (content.startsWith('|')) content = content.slice(1)
  if (content.endsWith('|')) content = content.slice(0, -1)
  return content.split('|').map((cell) => cell.trim())
}

export function isNumericCell(text: string): boolean {
  return NUMERIC_PATTERN.test(text.trim())
}
