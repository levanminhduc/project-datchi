import type { AuthError } from '@supabase/supabase-js'

const PERMANENT_ERROR_CODES = [
  'invalid_grant',
  'refresh_token_revoked',
  'refresh_token_not_found',
  'session_not_found',
  'invalid_refresh_token',
] as const

const RECOVERABLE_ERROR_CODES = [
  'refresh_token_already_used',
  'session_expired',
  'bad_jwt',
] as const

const PERMANENT_ERROR_MESSAGES = [
  'Auth session missing',
  'Invalid Refresh Token',
  'Refresh Token Not Found',
] as const

export function isAuthErrorPermanent(error: AuthError | null): boolean {
  if (!error) return false
  if (error.name === 'AuthSessionMissingError') return true
  if (PERMANENT_ERROR_MESSAGES.some((msg) => error.message?.includes(msg))) return true
  return PERMANENT_ERROR_CODES.some(
    (code) => error.message?.includes(code) || error.code === code
  )
}

export function isAuthError(error: AuthError | null): boolean {
  if (!error) return false
  if (isAuthErrorPermanent(error)) return true
  if (error.status === 401 || error.status === 403) return true
  if (error.message?.includes('Token expired')) return true
  return RECOVERABLE_ERROR_CODES.some(
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
