## Why

After logout, users can navigate back to protected pages (e.g., homepage) without re-entering credentials. The `signOut()` function resets `initialized = false`, causing `init()` to re-run on next navigation. If `supabase.auth.signOut()` fails silently (error is swallowed by empty catch), localStorage tokens remain — `getSession()` finds them, re-authenticates the user, and the router guard allows access.

## What Changes

- Fix `signOut()` in `useAuth.ts` to keep `initialized = true` after logout, preventing `init()` from re-running and re-authenticating with stale tokens
- Force-clear Supabase auth localStorage keys in `signOut()` regardless of whether `supabase.auth.signOut()` succeeds or fails
- Add a `loggedOut` flag so `init()` never re-authenticates after explicit logout — only `signIn()` clears this flag

## Capabilities

### New Capabilities
- `secure-logout`: Ensure logout fully clears session state and prevents re-authentication without explicit login

### Modified Capabilities

## Impact

- `src/composables/useAuth.ts` — signOut function, init function, state management
- No backend changes needed
- No database changes needed
- No new dependencies
