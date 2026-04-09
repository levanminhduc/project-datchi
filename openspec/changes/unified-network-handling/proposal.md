## Why

The app has fragmented network error handling: `fetchApi` retries HTTP 502/503 but ignores network-level failures (TypeError when fetch itself throws), there is no global offline indicator visible across the app, and reconnection notifications are absent. Users on unstable connections get cryptic errors instead of clear feedback, and failed requests are not retried even when the network recovers.

## What Changes

- New composable `useNetworkStatus` providing reactive `isOnline`/`wasOffline` state via browser online/offline events, with snackbar notifications on transitions
- New `NetworkStatusBanner` component showing a persistent warning banner when offline and a brief success state on reconnection
- Network-level retry logic in `fetchApiRaw` for TypeError/network failures (max 2 retries, idempotent methods only by default)
- Integration of `NetworkStatusBanner` into the main layout so it is visible app-wide
- Minor fix: replace raw `q-spinner` with `AppSpinner` in `InfiniteScroll` component

## Capabilities

### New Capabilities
- `network-status`: Centralized network status detection (online/offline), reactive composable, and global offline banner component
- `network-retry`: Network-level failure retry logic in fetchApiRaw (distinct from existing HTTP 503 retry)

### Modified Capabilities
- `frontend-503-handling`: Adding network-level (TypeError) retry alongside existing HTTP 503 retry in the same fetchApiRaw function. The existing 503 behavior is unchanged; this adds a new error category.

## Impact

- **Frontend code**: `src/services/api.ts` (fetchApiRaw retry logic), new composable, new component, layout integration
- **UI**: Global offline banner visible on all pages when network is down
- **User experience**: Clear Vietnamese-language feedback on network status transitions
- **No backend changes**: All changes are frontend-only
- **No breaking changes**: Existing fetchApi behavior preserved; new retry is additive
- **No new dependencies**: Uses browser-native `navigator.onLine` and `online`/`offline` events
