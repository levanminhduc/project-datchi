const ALLOWED_TAGS = new Set(['b', 'strong', 'i', 'em', 'u', 'br', 'p', 'ul', 'ol', 'li'])

export function sanitizeHtml(input: string): string {
  return input.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/gi, (match, tag) => {
    const lowerTag = tag.toLowerCase()
    if (!ALLOWED_TAGS.has(lowerTag)) return ''
    const isClosing = match.startsWith('</')
    return isClosing ? `</${lowerTag}>` : `<${lowerTag}>`
  })
}
