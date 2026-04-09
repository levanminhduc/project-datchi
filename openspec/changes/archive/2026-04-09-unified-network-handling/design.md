## Context

The app currently handles network issues in several disconnected places:

- `fetchApiRaw` (src/services/api.ts) retries HTTP 502/503 once after 1500ms, but when `fetch()` itself throws a TypeError (DNS failure, no connectivity, CORS preflight failure), the error propagates unhandled to callers.
- `useAuth` preserves auth session on network errors (NetworkError class exists), but there is no user-facing notification.
- `useRealtime` has its own exponential backoff reconnect for WebSocket channels.
- `useOfflineSync` + `offlineQueue` store handle IndexedDB-based offline queuing for specific thread operations, with a `SyncStatus.vue` icon -- but this is scoped to thread pages, not app-wide.
- There is no global offline indicator. Users on unstable connections see cryptic TypeErrors or timeouts with no guidance.

The main layout is `src/App.vue` (not a separate layout file). It uses `q-layout` > `q-header` > `q-page-container` > `router-view`. All composables follow singleton pattern with module-level state.

**AppBanner** wraps `q-banner` with props: `inline`, `dense`, `rounded`, `dark`. It does NOT have a `type` prop for styling (no built-in warning/error/success variants) -- styling must be done via CSS classes.

**AppSpinner** wraps `q-spinner-dots` with `size` (default "40px") and `color` (default "primary").

## Goals / Non-Goals

**Goals:**
- Centralized, reactive `isOnline` state accessible from any component/composable
- Global offline banner visible on all pages (not just thread pages)
- Network-level retry in `fetchApiRaw` so transient connectivity blips are handled transparently
- Clear Vietnamese-language feedback on network transitions (offline/online)

**Non-Goals:**
- Server-side heartbeat/ping mechanism (too complex, browser events sufficient for MVP)
- Queuing failed requests for replay when back online (useOfflineSync already handles this for specific operations)
- Replacing or modifying `useOfflineSync`/`offlineQueue` -- those remain for their specific use case
- Retry logic for non-fetch operations (Supabase realtime, auth refresh)
- Progressive offline support (service worker, cache API)

## Decisions

### 1. Singleton composable with module-level state

Use `useNetworkStatus()` with module-level `ref`s (same pattern as `useAuth`). This ensures all components share the same reactive state without a Pinia store.

**Alternative considered:** Pinia store -- rejected because the project uses composable singletons for cross-cutting state (useAuth, useDarkMode, useSidebar), not Pinia. Following existing patterns.

### 2. Browser online/offline events only (no heartbeat)

Rely on `navigator.onLine` + `window.addEventListener('online'/'offline')`. These fire reliably for complete connectivity loss (WiFi off, cable unplugged). They do NOT detect "connected but no internet" -- that is acceptable for MVP.

**Alternative considered:** Periodic fetch to a health endpoint -- rejected as over-engineering. The retry logic in fetchApiRaw already covers the case where the browser thinks it is online but requests fail.

### 3. Network retry in makeRequest catch block

Add retry logic inside `fetchApiRaw`'s `makeRequest` function catch block. Detect network errors by checking for TypeError (the standard error when fetch fails due to network). Retry up to 2 times with delays [1000ms, 3000ms]. Only retry idempotent methods (GET, PUT, DELETE) by default.

**Alternative considered:** Wrapping at the `fetchApi` level -- rejected because `fetchApiRaw` is the lower-level primitive and the right place for transport-level retry. The existing 502/503 retry is already at this level.

### 4. Banner placement in App.vue q-page-container

Place `NetworkStatusBanner` inside `q-page-container` but before `router-view`. This positions it below the header bar but above page content, visible on all pages.

**Alternative considered:** Inside `q-header` -- rejected because it would shift the toolbar and look jarring. Below the header is standard for status banners.

### 5. Use CSS classes on AppBanner for warning/success styling

Since AppBanner has no `type` prop, apply Quasar utility classes (`bg-warning text-white`, `bg-positive text-white`) directly on the component for offline/reconnected states.

**Alternative considered:** Adding a `type` prop to AppBanner -- out of scope for this change; would require modifying the shared component.

### 6. POST retry opt-in via config parameter

POST requests are not retried by default (not idempotent -- could create duplicate records). Callers can opt in by passing `{ retryOnNetworkError: true }` in the config parameter of `fetchApiRaw`.

## Risks / Trade-offs

- **[navigator.onLine false positives]** Browser may report `onLine: true` when behind a captive portal or when DNS fails. Mitigation: the fetchApiRaw retry catches actual network failures regardless of navigator.onLine status.
- **[Retry delays block UI]** The 1s + 3s retry delays mean a request could take up to ~4 extra seconds. Mitigation: this only happens on actual network failures (TypeError), not on slow-but-working connections. The delays are intentionally short.
- **[Duplicate POST risk if opted in]** If a caller opts POST into network retry and the server received the first request but the response was lost, the retry would create a duplicate. Mitigation: POST retry is opt-in only, and the default is off.

## Open Questions

None -- the scope is well-defined and all decisions are straightforward.
