## Context

The Issue V2 page (`/thread/issues/v2`) loads form data for thread issuance across multiple colors. Three data loading paths exist: initial load (`handleLoadFormData` via `GET /api/issues/v2/form-data`), polling (`refreshStockData` via `POST /api/issues/v2/stock-refresh` every 20s), and tab-return (same as polling after 30s hidden). Three bugs cause stale/incorrect data display.

Files involved:
- `src/pages/thread/issues/v2/index.vue` — Frontend page with `handleLoadFormData()` and `refreshStockData()`
- `server/routes/issuesV2.ts` — Backend `POST /stock-refresh` endpoint (line ~1894)
- `server/validation/issuesV2.ts` — `StockRefreshSchema` + `StockRefreshItemSchema` (line ~210)
- `server/utils/issue-v2-batch-quota.ts` — `batchGetQuotaCones()`, `batchGetBaseQuotaCones()`
- `server/utils/issue-v2-batch-stock.ts` — `batchGetConfirmedIssuedGross()`

## Goals / Non-Goals

**Goals:**
- Reload button fully re-fetches data for all currently loaded colors
- Polling refreshes quota, base quota, and confirmed issued gross alongside stock counts
- Polling uses the user-selected warehouse instead of only the auto-detected warehouse

**Non-Goals:**
- Changing polling interval (stays at 20s)
- Changing tab-return threshold (stays at 30s)
- Adding new UI elements or changing page layout
- Modifying the initial load path (`GET /api/issues/v2/form-data`) — it works correctly

## Decisions

### D1: Force-reload via parameter, not separate function

Add `forceReload: boolean = false` parameter to `handleLoadFormData()`. When `true`, clear `multiColorThreadTypes` entries for selected colors before computing `newColorIds`. This reuses the existing load logic without duplicating code.

**Alternative considered:** Create a separate `reloadFormData()` function. Rejected because it would duplicate the entire load flow, violating DRY.

### D2: Extend existing stock-refresh endpoint, not create new one

Add `department` (optional) to `StockRefreshSchema`. After computing stock counts, also call `batchGetQuotaCones`, `batchGetBaseQuotaCones`, `batchGetConfirmedIssuedGross` (all already imported in `issuesV2.ts`). Return extended response shape with additional fields.

**Alternative considered:** Create a separate `/full-refresh` endpoint. Rejected because it would duplicate the stock computation logic and require two endpoints doing similar work.

### D3: Response shape is backward-compatible

New fields (`quota_cones`, `base_quota_cones`, `confirmed_issued_gross`) are added alongside existing `full_cones`/`partial_cones`. No existing consumers break.

### D4: Batch quota functions require ratio and color context

The batch functions need additional context: `ratio` (from `partialConeRatio`, already available in the frontend state) and per-color grouping (since quota is per PO+Style+Color). The backend endpoint already groups items by `color_id`, so quota computation fits naturally into the existing loop. The `ratio` value needs to be sent from frontend or derived from config. Since the frontend already has `partialConeRatio`, send it in the request body.

### D5: Warehouse fix is a one-line frontend change

Change `warehouse_id: tt.detected_warehouse_id` to `warehouse_id: selectedWarehouseId.value || tt.detected_warehouse_id` in the `refreshStockData()` items mapping. No backend changes needed.

## Risks / Trade-offs

**[Performance] Polling now makes additional DB queries for quota/issued** -- The three batch functions add ~3 extra queries per color group per poll. Mitigated by: batch functions already use `Promise.all` internally; typical usage is 1-3 colors; 20s interval is generous. Monitor response times.

**[Partial failure] Quota/issued fetch could fail while stock succeeds** -- If batch quota functions throw, the entire stock-refresh fails. Mitigated by: wrap quota computation in try/catch, return `null` for quota fields on error, still return stock data. Frontend handles `null` gracefully (shows "--" or keeps previous value).

**[Schema change] Adding `department` and `ratio` to StockRefreshSchema** -- Existing callers that omit these fields still work because both are optional. No breaking change.
