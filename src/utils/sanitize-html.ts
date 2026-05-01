import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = [
  'p', 'br', 'hr',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'strong', 'em', 'u', 's', 'code', 'pre', 'blockquote',
  'ul', 'ol', 'li',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'span', 'div',
]

const ALLOWED_ATTR = ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'style']

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if ((node as Element).tagName === 'A') {
    (node as Element).setAttribute('rel', 'noopener noreferrer')
    ;(node as Element).setAttribute('target', '_blank')
  }
})

export function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick'],
  })
}
