import type { AuthError } from '@supabase/supabase-js'

const AUTH_ERROR_CODES = [
  'invalid_grant',
  'refresh_token_revoked',
  'refresh_token_already_used',
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
  'bad_jwt',
  'invalid_refresh_token',
] as const

const AUTH_ERROR_MESSAGES = [
  'Auth session missing',
  'Invalid Refresh Token',
  'Refresh Token Not Found',
  'Token expired',
] as const

export function isAuthError(error: AuthError | null): boolean {
  if (!error) return false
  if (error.name === 'AuthSessionMissingError') return true
  if (error.status === 400 || error.status === 401 || error.status === 403) return true
  if (AUTH_ERROR_MESSAGES.some((msg) => error.message?.includes(msg))) return true
  return AUTH_ERROR_CODES.some(
    (code) => error.message?.includes(code) || error.code === code
  )
}

export function isSessionMissingError(error: AuthError | null): boolean {
  if (!error) return false
  return (
    error.message?.includes('Auth session missing') ||
    error.name === 'AuthSessionMissingError'
  )
}
