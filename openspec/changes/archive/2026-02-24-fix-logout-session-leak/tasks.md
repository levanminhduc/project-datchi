## 1. Add loggedOut flag to useAuth

- [x] 1.1 Add `let loggedOut = false` module-level variable next to `initialized` and `signingOut`
- [x] 1.2 In `init()`, add check: if `loggedOut` is true, call `resetState()` and return early (before `getSession()`)
- [x] 1.3 In `signIn()`, set `loggedOut = false` at the start (before any auth calls)

## 2. Fix signOut to clear localStorage and set loggedOut flag

- [x] 2.1 Add helper function `clearSupabaseTokens()` that removes all localStorage keys matching pattern `sb-` and containing `auth-token`
- [x] 2.2 In `signOut()`, set `loggedOut = true` at the start
- [x] 2.3 In `signOut()`, call `clearSupabaseTokens()` in a finally-like position (after try/catch, before router.push) so tokens are always cleared regardless of signOut success/failure ← (verify: after logout, localStorage has no sb-*-auth-token keys; navigating to protected route redirects to /login; signIn still works after logout)
