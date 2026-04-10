## Why

`POST /:id/results` saved weekly order results using stale inventory data. The endpoint enriched quota data but skipped re-calling `enrichWithInventory()`, so `equivalent_cones` remained at its last-fetched value. When the page was submitted without a prior manual enrich call, `equivalent_cones = 0` caused `sl_can_dat = 0`, `total_final = 0`, and the delivery creation step silently produced no delivery records.

## What Changes

- Extract shared `enrichWithInventory()` function from inline code in `/enrich-inventory` handler into `server/routes/weekly-order/enrich-helper.ts`
- Refactor `calculation.ts` `/enrich-inventory` handler to call the shared helper
- Add `enrichWithInventory()` call inside `POST /:id/results` after quota enrichment and before DB upsert, with `preserveAdditionalOrder: true` so user-entered additional orders are not reset

## Capabilities

### New Capabilities

_None — bug fix only._

### Modified Capabilities

- `weekly-order-save-results`: Save endpoint now always re-enriches inventory data before persisting, ensuring `equivalent_cones`, `sl_can_dat`, and `total_final` are current at the time of save

## Impact

- **Backend (new file)**: `server/routes/weekly-order/enrich-helper.ts` — extracted `enrichWithInventory()` with `SummaryRow` and `EnrichedRow` type definitions
- **Backend (modified)**: `server/routes/weekly-order/calculation.ts` — `/enrich-inventory` handler refactored; `POST /:id/results` handler adds inventory enrichment step before upsert
- **No frontend changes**
- **No database changes**
- **No breaking changes**: API response shapes unchanged
