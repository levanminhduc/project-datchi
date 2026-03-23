## Why

Issue V2 page shows stock = 0 for all thread types, while Weekly Order page shows correct stock values. This is because Issue V2 queries `thread_stock` table (empty) instead of `thread_inventory` table (has data). Both features should use the same data source for consistency.

## What Changes

- **Modify `getStockAvailability()` function** in Issue V2 backend to query `thread_inventory` instead of `thread_stock`
- **Count available cones** by filtering `status = 'AVAILABLE'` and grouping by `is_partial`
- **Maintain same return signature**: `{ full_cones: number, partial_cones: number }`

## Capabilities

### New Capabilities

(None - this is a bug fix/data source alignment)

### Modified Capabilities

- `thread-issue-v2`: Change stock data source from `thread_stock` to `thread_inventory`

## Impact

- **Backend**: `server/routes/issuesV2.ts` - `getStockAvailability()` function
- **Database**: Queries `thread_inventory` table instead of `thread_stock`
- **No frontend changes** - API response format remains the same
- **No breaking changes** - Just fixing the data source
