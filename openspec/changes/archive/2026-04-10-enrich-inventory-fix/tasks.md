## 1. Extract shared enrichment helper

- [x] 1.1 Create `server/routes/weekly-order/enrich-helper.ts` with `enrichWithInventory(rows, options)` function, `SummaryRow` and `EnrichedRow` types extracted from inline implementation in `calculation.ts` `/enrich-inventory` handler
- [x] 1.2 Add `preserveAdditionalOrder` option (default `false`) — when `true`, preserves `row.additional_order` instead of resetting to `0`

## 2. Refactor `/enrich-inventory` handler

- [x] 2.1 In `server/routes/weekly-order/calculation.ts`, replace inline enrichment logic in `/enrich-inventory` handler with call to `enrichWithInventory(summaryData, { preserveAdditionalOrder: false })`
- [x] 2.2 Remove now-unused `getPartialConeRatio` import

## 3. Add inventory re-enrichment to save endpoint

- [x] 3.1 In `POST /:id/results` handler, after quota enrichment (lines 185-199) and before DB upsert (lines 208-221), call `enrichWithInventory(summaryData, { preserveAdditionalOrder: true })` <- (verify: save endpoint enriches inventory; `total_final > 0` for rows with available inventory; delivery records are created)

## 4. Validation

- [x] 4.1 Run `npm run type-check` — zero TS errors
- [x] 4.2 Run `npm run lint` — zero lint errors
