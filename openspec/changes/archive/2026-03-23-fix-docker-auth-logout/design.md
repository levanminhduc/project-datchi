## Context

The backend auth middleware (`server/middleware/auth.ts`) queries Supabase (PostgREST) to fetch employee status during JWT verification. When PostgREST encounters transient database issues, it returns error codes like `PGRST002`. The middleware has a `DB_RETRY_CODES` set and `isTransientDbError()` function to handle known transient errors — retrying the query and returning 503 instead of 401.

Currently `DB_RETRY_CODES` contains: `PGRST000`, `PGRST503`, `57P01`, `57P03`, `08006`. The code `PGRST002` (schema cache failure) is missing. In Docker environments, network latency between containers and the host Supabase instance makes `PGRST002` occur more frequently.

On the frontend, `fetchApiRaw()` in `src/services/api.ts` treats any 401 as a signal to refresh the token and eventually kick the user to login. It has no special handling for 503 — a 503 response falls through to the generic error path, but the session is preserved (which is correct). However, there is no user-friendly feedback for 503 nor any retry mechanism.

## Goals / Non-Goals

**Goals:**
- Backend returns 503 (not 401) when PostgREST returns `PGRST002` or similar transient errors
- Backend retries the DB query for `PGRST002` before failing
- Frontend shows a user-friendly transient error message on 503 without destroying the user session
- Frontend retries the request on 503 before giving up

**Non-Goals:**
- Fixing the underlying PostgREST connectivity issue in Docker (infrastructure concern)
- Changing the JWT verification logic
- Adding health-check or circuit-breaker patterns (future work)

## Decisions

### Decision 1: Expand DB_RETRY_CODES with all known PostgREST transient codes

**Choice**: Add `PGRST002` and `PGRST001` to the existing `DB_RETRY_CODES` set.

**Rationale**: `PGRST002` (schema cache query failure) and `PGRST001` (connection pool timeout) are both transient and recoverable. The existing retry logic with exponential backoff (300ms × attempt) handles these correctly once the codes are recognized.

**Alternative considered**: Catch-all for any `PGRSTxxx` code → rejected because some PGRST codes are permanent errors (e.g., `PGRST204` = column not found).

### Decision 2: Frontend 503 handling with retry in fetchApiRaw

**Choice**: Add 503 handling in `fetchApiRaw()` — wait briefly, retry once, then throw an `ApiError` with a user-friendly message. Never touch the auth session on 503.

**Rationale**: 503 means the backend is temporarily unavailable. The session is valid. Retrying once after a short delay covers the common case where PostgREST recovers within 1-2 seconds. If it's still down, the user sees an informative error ("Hệ thống đang tải, vui lòng thử lại") rather than "Phiên hết hạn".

**Alternative considered**: Automatic retry with exponential backoff (up to 3 retries) → rejected as it could mask prolonged outages and confuse users with long loading times.

## Risks / Trade-offs

- **[Risk]** Adding too many PGRST codes could mask real errors → **Mitigation**: Only add codes that are explicitly documented as transient by PostgREST. Keep the allowlist approach.
- **[Risk]** Single 503 retry might not be enough if PostgREST takes longer to recover → **Mitigation**: The backend already retries 2 times (300ms, 600ms). Combined with 1 frontend retry after 1.5s, total recovery window is ~2.5s which covers most transient cases.
- **[Trade-off]** User sees brief "system loading" instead of instant error → Acceptable UX for preventing false logouts.
