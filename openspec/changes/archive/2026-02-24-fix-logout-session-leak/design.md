## Context

The `useAuth` composable manages authentication state as a singleton (module-level `ref`). On logout, `signOut()` calls `supabase.auth.signOut()`, resets state, and sets `initialized = false`. The router guard (`guards.ts`) calls `await auth.init()` on every navigation. When `initialized` is false, `init()` re-runs, calls `supabase.auth.getSession()`, and if tokens remain in localStorage (due to signOut failure or timing), re-authenticates the user — allowing access to protected pages without login.

Current flow:
```
signOut() → supabase.auth.signOut() [may fail silently]
         → resetState() [isAuthenticated = false]
         → initialized = false [PROBLEM: allows init() to re-run]
         → router.push('/login')

Next navigation → guard → init() → getSession() → finds stale tokens → re-auth → access granted
```

## Goals / Non-Goals

**Goals:**
- After explicit logout, user MUST NOT be able to access protected routes without re-entering credentials
- Logout must be resilient to `supabase.auth.signOut()` failures
- No changes to login flow or backend

**Non-Goals:**
- Server-side token revocation (JWT is stateless by design, would require backend changes)
- Changing JWT expiry time
- Multi-tab logout synchronization (existing auth listener handles this)

## Decisions

### Decision 1: Add `loggedOut` flag to prevent re-authentication

Instead of relying solely on `initialized` to control `init()`, add a `loggedOut` flag:
- `signOut()` sets `loggedOut = true`
- `init()` checks `loggedOut` — if true, calls `resetState()` and returns immediately without calling `getSession()`
- `signIn()` sets `loggedOut = false` before authenticating

**Why not just keep `initialized = true`?** Because `initialized` serves double duty — it prevents duplicate init AND signals whether state has been loaded. Page reload needs `initialized = false` to bootstrap. A separate `loggedOut` flag is cleaner and more intentional.

### Decision 2: Force-clear localStorage tokens in signOut()

After `supabase.auth.signOut()` (whether it succeeds or fails), manually remove Supabase auth keys from localStorage. Supabase stores tokens under keys matching the pattern `sb-<project-ref>-auth-token`. This ensures `getSession()` always returns null after logout.

### Decision 3: Keep `initialized = false` after logout

Still set `initialized = false` so that a fresh `signIn()` → page load cycle works correctly. The `loggedOut` flag is the one that prevents stale re-auth.

## Risks / Trade-offs

- [Risk] Manually clearing localStorage keys depends on Supabase's storage key pattern → Mitigation: Use a pattern match (`sb-*-auth-token`) rather than hardcoding the full key. This pattern has been stable across supabase-js v2.x.
- [Risk] `loggedOut` flag is module-level, not persisted → Mitigation: This is intentional. On full page reload, `loggedOut` resets to false, and `init()` correctly checks for a real session. The flag only needs to survive SPA navigation, not page reloads.
