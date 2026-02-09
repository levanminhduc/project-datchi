/**
 * Shared error helper for extracting error messages.
 * Replaces duplicate getErrorMessage functions across route files.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  return String(err)
}
