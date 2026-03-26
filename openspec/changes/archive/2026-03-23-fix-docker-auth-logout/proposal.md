## Why

When the backend runs in Docker, PostgREST occasionally returns `PGRST002` ("Could not query the database for the schema cache") during the auth middleware's employee status lookup. This error code is not recognized as a transient DB error, so the middleware returns HTTP 401 instead of 503. The frontend interprets 401 as "session expired", triggers token refresh (which also hits 401 for the same reason), and force-redirects the user to the login page — even though the actual session is perfectly valid.

## What Changes

- Add `PGRST002` (and other missing PostgREST transient codes) to the `DB_RETRY_CODES` set in `server/middleware/auth.ts` so the auth middleware retries the query and returns 503 (not 401) when the database is temporarily unreachable.
- Update the frontend `fetchApiRaw()` in `src/services/api.ts` to distinguish 503 from 401 — on 503, show a user-friendly "system unavailable" message and retry, instead of clearing the session and redirecting to login.

## Capabilities

### New Capabilities

- `transient-db-error-handling`: Backend correctly classifies all PostgREST transient error codes and returns 503 instead of 401 for DB connectivity issues.
- `frontend-503-handling`: Frontend distinguishes 503 (system temporarily unavailable) from 401 (auth failure), showing appropriate feedback without destroying the user's session.

### Modified Capabilities

(none)

## Impact

- `server/middleware/auth.ts` — `DB_RETRY_CODES` set, `isTransientDbError` function
- `src/services/api.ts` — `fetchApiRaw()` response handling logic
- No database changes, no API contract changes, no breaking changes
