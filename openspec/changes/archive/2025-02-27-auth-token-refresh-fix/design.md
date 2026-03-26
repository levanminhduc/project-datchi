# Design: Auth Token Refresh Fix

## Architecture Decision: Use `getUser()` over `getSession()`

### Context
- `getSession()` only reads from localStorage, does NOT validate or refresh token
- `getUser()` makes a request to Supabase Auth server, validates token, and triggers refresh if needed

### Decision
Replace `getSession()` with `getUser()` in auth initialization flow.

### Consequences
- **Pro**: Token is always validated before use
- **Pro**: Triggers auto-refresh when token is about to expire
- **Con**: Adds one extra network request on init

---

## Architecture Decision: 401 Retry in fetchApi()

### Context
- Current `fetchApi()` throws immediately on 401
- No attempt to refresh token and retry

### Decision
Add retry logic: on 401 → call `getRefreshedSession()` (single-flight helper) → retry request once.

### Consequences
- **Pro**: Seamless token refresh for users
- **Pro**: Reduces "session expired" errors
- **Pro**: Single-flight prevents race conditions
- **Con**: Slightly more complex fetchApi logic

---

## Architecture Decision: Setup auth listener BEFORE init

### Context
- Current flow: `init()` runs → then `setupAuthListener()`
- If token refreshes during init, event is missed

### Decision
Call `setupAuthListener()` at the START of `init()`.

### Consequences
- **Pro**: Never miss auth state changes
- **Con**: None significant

---

## Data Flow (After Fix)

```
┌─────────────────────────────────────────────────────────────┐
│                    FIXED AUTH FLOW                          │
└─────────────────────────────────────────────────────────────┘

  Page Load
      │
      ▼
  useAuth.init()
      │
      ├── 1. setupAuthListener() ◄── FIRST (never miss events)
      │
      ├── 2. supabase.auth.getUser() ◄── Validates + refreshes token
      │       │
      │       ├── Token valid → continue
      │       └── Token invalid/expired → SDK auto-refreshes
      │                                   │
      │                                   ├── Refresh OK → new token
      │                                   ├── Auth error → signOut + resetState()
      │                                   └── Network error → resetState() only
      │
      ├── 3. fetchCurrentEmployee() with valid token
      │
      └── 4. Set authenticated state

  During Session
      │
      ├── fetchApi() gọi API
      │       │
      │       ├── 200-299 → OK
      │       │
      │       └── 401 → getRefreshedSession() → retry once
      │                   │
      │                   ├── Refresh OK → retry succeeds
      │                   ├── Auth error (invalid_grant, etc.) → signOut + redirect login
      │                   └── Network error → show "Lỗi kết nối" (NO redirect)
      │
      └── onAuthStateChange listens for:
              │
              ├── TOKEN_REFRESHED → update employee + permissions
              │
              └── SIGNED_OUT → resetState() + redirect login
```

---

## Migration Strategy
- No database migration needed
- No breaking API changes
- Frontend-only changes
- Can be deployed without coordination

---

## Architecture Decision: Single-Flight Refresh with Centralized Logout

### Context
- With `REFRESH_TOKEN_ROTATION=true`, each refresh token can only be used ONCE
- Multiple concurrent 401 responses calling `refreshSession()` simultaneously creates a race
- Only one will succeed, others will fail → random logouts
- If each caller handles logout separately → multiple toasts/redirects

### Decision
Implement single-flight pattern with CENTRALIZED logout handling:

```typescript
// api.ts
let refreshPromise: Promise<Session | null> | null = null
let isLoggingOut = false

async function getRefreshedSession(): Promise<Session> {
  if (refreshPromise) {
    return refreshPromise  // All callers share same promise
  }

  refreshPromise = supabase.auth.refreshSession()
    .then(({ data, error }) => {
      refreshPromise = null

      if (error) {
        if (isAuthError(error)) {
          // Auth error: always throw session-expired message
          // Only call signOut once (gated by isLoggingOut)
          if (!isLoggingOut) {
            isLoggingOut = true
            supabase.auth.signOut({ scope: 'local' })
          }
          throw new Error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại')
        }
        // Network/transient error - don't logout, throw network message
        throw new Error('Lỗi kết nối, vui lòng thử lại')
      }

      return data.session!
    })

  return refreshPromise
}

function isAuthError(error: AuthError): boolean {
  return ['invalid_grant', 'refresh_token_revoked', 'session_not_found']
    .includes(error.code)
}
```

### Consequences
- **Pro**: Only one refresh request per expiry window
- **Pro**: Only one logout/toast/redirect on failure
- **Pro**: Network errors don't cause unnecessary logout
- **Con**: Slightly more complex code

---

## Architecture Decision: Unify Auth Request Paths

### Context
- `fetchApi()` handles most API calls
- `authenticatedFetch()` handles notification, permission management
- Both need same refresh/retry logic for "fix triệt để"

### Decision
Share the same `getRefreshedSession()` function across both paths.

### Consequences
- **Pro**: Consistent behavior across all auth requests
- **Pro**: Single point of maintenance
- **Con**: Coupling between api.ts and authService.ts

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Infinite retry loop | Retry only once, then throw |
| Race condition in concurrent requests | Single-flight `refreshPromise` pattern |
| Multiple logout toasts/redirects | Centralized logout with `isLoggingOut` flag |
| Over-eager logout on network error | Classify errors: only auth errors trigger logout |
| Storage key change breaks existing sessions | Keep default key, only add explicit config |
| Stale token in storage after fail | Call `signOut({ scope: 'local' })` on unrecoverable fail |

---

## Rollback Plan
- Revert 4 frontend files
- No data migration to rollback
