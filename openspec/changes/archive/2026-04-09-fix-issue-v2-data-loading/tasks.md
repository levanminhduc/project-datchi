## 1. Bug #1 — Reload button forces full data refresh

- [x] 1.1 In `src/pages/thread/issues/v2/index.vue`, add `forceReload: boolean = false` parameter to `handleLoadFormData()`. When `forceReload` is `true`, remove entries from `multiColorThreadTypes` for all `selectedColorIds` before computing `newColorIds`, so they are treated as new.
- [x] 1.2 Update the reload button's click handler to call `handleLoadFormData()` with `forceReload = true`. Verify that debounced/watch-triggered calls still pass `forceReload = false` (default). <- (verify: click reload with all colors loaded, confirm network request fires and data updates; confirm debounce-triggered loads still skip already-loaded colors)

## 2. Bug #3 — Polling uses correct warehouse

- [x] 2.1 In `src/pages/thread/issues/v2/index.vue`, function `refreshStockData()`, change the items mapping from `warehouse_id: tt.detected_warehouse_id` to `warehouse_id: selectedWarehouseId.value || tt.detected_warehouse_id ?? undefined` <- (verify: with warehouse selected, polling request sends the selected warehouse_id; without warehouse selected, falls back to detected_warehouse_id)

## 3. Bug #2 — Backend: extend stock-refresh with quota/issued

- [x] 3.1 In `server/validation/issuesV2.ts`, add optional `department` (string) and `ratio` (number, default 1) fields to `StockRefreshSchema`
- [x] 3.2 In `server/routes/issuesV2.ts`, `POST /stock-refresh` handler: after computing stock counts, group items by `color_id` and call `batchGetQuotaCones()`, `batchGetBaseQuotaCones()`, `batchGetConfirmedIssuedGross()` for each color group. Wrap in try/catch so stock is still returned on quota failure.
- [x] 3.3 Extend the response `stocks` array items to include `quota_cones`, `base_quota_cones`, `confirmed_issued_gross` (nullable — `null` on error) <- (verify: POST /stock-refresh returns extended fields; verify graceful fallback when quota functions fail)

## 4. Bug #2 — Frontend: consume extended stock-refresh response

- [x] 4.1 In `src/pages/thread/issues/v2/index.vue`, function `refreshStockData()`: send `department` and `ratio` (from `partialConeRatio`) in the request body
- [x] 4.2 In `refreshStockData()`: after updating `full_cones` and `partial_cones`, also update `quota_cones`, `base_quota_cones`, `confirmed_issued_gross` from the response. Preserve existing values when response fields are `null`. <- (verify: polling updates all five fields in multiColorThreadTypes; null quota fields preserve previous values; tab-return after 30s also triggers full refresh)

## 5. Validation

- [x] 5.1 Run `npm run type-check` and fix any TypeScript errors
- [x] 5.2 Run `npm run lint` and fix any linting errors <- (verify: both type-check and lint pass cleanly)
