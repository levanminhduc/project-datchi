## Approach

Extract the inventory enrichment logic already present in `calculation.ts` `/enrich-inventory` handler into a standalone helper module. The extracted function accepts a `preserveAdditionalOrder` option so the same code path handles both the standalone enrich endpoint (which resets `additional_order` to 0) and the save endpoint (which must preserve user-entered values).

The save endpoint calls the helper after its quota enrichment pass and before the DB upsert, matching the order: quota → inventory → persist → deliver.

## Module: `enrich-helper.ts`

**File**: `server/routes/weekly-order/enrich-helper.ts`

```
enrichWithInventory(rows, options)
  options.preserveAdditionalOrder: boolean (default false)

Types:
  SummaryRow   — input row shape (from thread_order_results.summary_data)
  EnrichedRow  — output row shape with full_cones, partial_cones, equivalent_cones, sl_can_dat, total_final
```

**Logic (unchanged from original inline implementation):**
1. Collect unique `thread_type_id` values from rows
2. Fetch color lookup for rows that have `thread_color`
3. Batch RPC call `fn_count_colored_cones` for colored thread types
4. Batch RPC call `fn_count_available_cones` for non-colored thread types
5. Build inventory map keyed by `{thread_type_id}_{color_name}` (colored) or `{thread_type_id}_` (non-colored)
6. Map each row to enriched row, computing:
   - `equivalent_cones` from inventory map
   - `sl_can_dat = total_cones - equivalent_cones`
   - `additional_order = preserveAdditionalOrder ? row.additional_order || 0 : 0`
   - `total_final = sl_can_dat + additional_order`

## Save Endpoint Change (`POST /:id/results`)

**File**: `server/routes/weekly-order/calculation.ts`

Order of operations after this change:
1. Lines 185-199: Quota enrichment (`total_meters` → `quota_cones`)
2. Lines 201-205: `enrichWithInventory(summaryData, { preserveAdditionalOrder: true })`
3. Lines 208-221: DB upsert with fully enriched `summary_data`
4. Lines 224+: Delivery creation using enriched `total_final` values

The `preserveAdditionalOrder: true` flag ensures the user-entered `additional_order` values from the frontend are not zeroed out during enrichment.

## References

- Existing pattern: `/enrich-inventory` POST handler in `calculation.ts` (pre-refactor inline version)
- Batch RPC functions: `fn_count_colored_cones`, `fn_count_available_cones` (existing DB functions)
- Delivery creation: unchanged — uses `total_final` from enriched summary data (lines 224+)
