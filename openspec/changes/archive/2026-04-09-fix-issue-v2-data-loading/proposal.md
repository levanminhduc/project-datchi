## Why

The Issue V2 page (`/thread/issues/v2`) has three data loading bugs that cause stale or incorrect data to be displayed. The reload button silently does nothing when all colors are already loaded, polling only refreshes stock counts while ignoring quota/issued changes, and polling queries the wrong warehouse. These bugs cause operators to make decisions based on outdated information, leading to incorrect thread issuance.

## What Changes

- **Fix reload button**: Add a `forceReload` parameter to `handleLoadFormData()` so the reload button clears existing data before re-fetching, bypassing the early-return optimization
- **Extend stock-refresh to include quota/issued**: Modify `POST /api/issues/v2/stock-refresh` backend endpoint to also compute and return `quota_cones`, `base_quota_cones`, and `confirmed_issued_gross` using existing batch utility functions; update frontend `refreshStockData()` to send `department` and apply all returned fields
- **Fix polling warehouse selection**: Change `refreshStockData()` to use `selectedWarehouseId.value` (user-selected warehouse) instead of always using `tt.detected_warehouse_id`

## Capabilities

### New Capabilities

_None — all changes are bug fixes to existing capabilities._

### Modified Capabilities

- `issue-v2-tabbed-layout`: Stock refresh polling now includes quota/issued data and respects user-selected warehouse; reload button correctly re-fetches all loaded data

## Impact

- **Frontend**: `src/pages/thread/issues/v2/index.vue` — `handleLoadFormData()`, `refreshStockData()` functions
- **Backend**: `server/routes/issuesV2.ts` — `POST /api/issues/v2/stock-refresh` endpoint response shape extended
- **Validation**: `server/validation/issuesV2.ts` — `StockRefreshSchema` updated to accept `department` field
- **No breaking changes**: Extended response is backward-compatible (new fields are additive)
- **No database changes**: Uses existing batch utility functions from `server/utils/issue-v2-batch-quota.ts` and `server/utils/issue-v2-batch-stock.ts`
