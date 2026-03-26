export function sanitizeFilterValue(input: string): string {
  return input.replace(/[^a-zA-Z0-9À-ỹ\s._%-]/g, '')
}
