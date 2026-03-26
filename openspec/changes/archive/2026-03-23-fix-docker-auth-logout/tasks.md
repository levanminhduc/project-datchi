## 1. Backend — Expand transient DB error codes

- [x] 1.1 Add `PGRST001` and `PGRST002` to the `DB_RETRY_CODES` set in `server/middleware/auth.ts` ← (verify: PGRST002 triggers retry and returns 503 not 401, existing codes still work)

## 2. Frontend — Handle 503 without destroying session

- [x] 2.1 Add 503 handling in `fetchApiRaw()` in `src/services/api.ts`: after getting a 503 response, wait 1500ms, retry the request once, and if the retry also returns 503, throw `ApiError(503, 'Hệ thống đang tải, vui lòng thử lại sau')`. Do NOT touch auth session (no `clearAuthSessionLocal`, no `forceBackToLogin`, no `getRefreshedSession`). ← (verify: 503 retries once then throws ApiError, 401 flow unchanged, session not cleared on 503)
