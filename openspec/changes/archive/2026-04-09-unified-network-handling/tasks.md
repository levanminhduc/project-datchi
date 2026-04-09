## 1. Network Status Composable

- [x] 1.1 Create `src/composables/useNetworkStatus.ts` with module-level singleton state: `isOnline` (ref, init from `navigator.onLine`), `wasOffline` (ref, tracks if user was previously offline)
- [x] 1.2 Implement `initNetworkStatus()` function that registers `window` `online`/`offline` event listeners (with guard against duplicate registration), shows snackbar on transitions using `useSnackbar()`
- [x] 1.3 Export `useNetworkStatus()` returning `{ isOnline, wasOffline }` readonly refs and `initNetworkStatus` function ← (verify: singleton pattern matches useAuth, snackbar messages are Vietnamese, no duplicate listeners on multiple init calls)

## 2. Network Status Banner Component

- [x] 2.1 Create `src/components/ui/feedback/NetworkStatusBanner.vue` using `useNetworkStatus()` composable
- [x] 2.2 Show persistent `AppBanner` with `bg-warning text-white` class and warning text when offline; show `bg-positive text-white` success banner with "Da ket noi lai" for 3 seconds on reconnection, then hide ← (verify: banner uses AppBanner not raw q-banner, Vietnamese messages match spec, 3-second auto-hide works)

## 3. Network Retry in fetchApiRaw

- [x] 3.1 Add `retryOnNetworkError?: boolean` to the `config` parameter type of `fetchApiRaw` in `src/services/api.ts`
- [x] 3.2 In `makeRequest()` catch block, after the existing AbortError check, add network retry logic: detect TypeError, check if method is idempotent (GET/PUT/DELETE) or `retryOnNetworkError` is true, retry up to 2 times with delays [1000ms, 3000ms]
- [x] 3.3 After all retries exhausted, throw `ApiError(503)` with appropriate Vietnamese message based on `navigator.onLine` status ← (verify: AbortError/timeout still throws 408, existing 502/503 retry is unchanged, POST not retried by default, retry delays are [1000, 3000])

## 4. Layout Integration

- [x] 4.1 Import and add `NetworkStatusBanner` in `src/App.vue` inside `q-page-container` before `router-view`
- [x] 4.2 Call `initNetworkStatus()` in `App.vue` setup (alongside existing `initDarkMode()`) ← (verify: banner visible on all routes when offline, no duplicate event listeners, initNetworkStatus called once)

## 5. InfiniteScroll AppSpinner Fix

- [x] 5.1 In `src/components/ui/scroll/InfiniteScroll.vue`, replace `<q-spinner color="primary" size="40px" />` with `<AppSpinner />` (import from `@/components/ui/feedback/AppSpinner.vue`) ← (verify: AppSpinner renders with same default size/color as the replaced q-spinner, no raw q-spinner remains)
