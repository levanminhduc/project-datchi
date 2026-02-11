/**
 * Shared error helper for extracting error messages.
 * Replaces duplicate getErrorMessage functions across route files.
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  if (err && typeof err === 'object') {
    // Handle Supabase/Postgres errors
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message
    }
    // Handle objects with code/details
    if ('code' in err || 'details' in err) {
      return JSON.stringify(err)
    }
  }
  return 'Lỗi không xác định'
}
