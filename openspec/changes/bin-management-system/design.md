## Context

The thread inventory system currently uses two parallel stock tracking mechanisms:
- `thread_inventory`: Tracks individual cones with unique `cone_id`, status lifecycle (AVAILABLE → HARD_ALLOCATED → etc.)
- `thread_stock`: Tracks aggregate quantities (qty_full_cones, qty_partial_cones) per thread_type/warehouse/lot_number

Issue V2 reads availability from `thread_inventory` (`getStockAvailability`) but delivery receiving writes to `thread_stock`. This dual-source architecture creates sync risks.

In the physical warehouse, returned cones of the same color (possibly different tex/supplier) are grouped into bins/containers. The system has no concept of bins or physical location tracking.

`thread_stock` was created in migration `20260211` with minimal production data, making this the ideal time to replace it.

Key existing components affected:
- `server/routes/stock.ts` — CRUD for `thread_stock` (to be replaced by `bins.ts`)
- `server/routes/issuesV2.ts` — `getStockAvailability()`, `deductStock()`, `addStockBack()` (to query/modify `bin_items`)
- `server/routes/weeklyOrder.ts` — `POST /deliveries/:id/receive` (to write `bin_items` instead of `thread_stock`)
- `src/services/stockService.ts` — frontend API client (to be replaced by `binService.ts`)
- `src/components/qr/` — existing QR infrastructure (to be reused for bin labels)

## Goals / Non-Goals

**Goals:**
- Single source of truth for stock quantities via `bins` + `bin_items`
- Physical location tracking (which bin is where in the warehouse)
- QR code on bins for quick scanning (view contents, pick stock)
- Integrate with existing Issue V2 flow (deduct from bins) and delivery receiving (receive into bins)
- Full audit trail via `bin_transactions`
- Estimate equivalent full cones from partial cones using `partial_cone_ratio`

**Non-Goals:**
- Individual cone tracking (no QR per cone — only count quantities)
- Tracing which PO a cone originally came from when it's in a bin
- Weight/meter tracking per cone in bins (only cone count)
- Bin capacity limits or bin type management
- Warehouse zone/aisle/rack hierarchy (bins have freeform `location` string)
- Migrating `thread_inventory` cone-level data (Issue V2 will stop using it for stock checks)

## Decisions

### D1: Bins replace `thread_stock` as single source of truth

**Decision**: `bin_items` replaces `thread_stock`. Stock availability is computed by summing `bin_items` grouped by `thread_type_id`.

**Why**: Eliminates dual-source sync issues. `thread_stock` is new with minimal data, so migration cost is low.

**Alternatives considered**:
- Keep `thread_stock` and add bins as supplementary layer → rejected due to sync complexity
- Make bins optional (some stock in thread_stock, some in bins) → rejected due to partial adoption confusion

### D2: `bin_items` uses aggregated rows (one per thread_type per bin)

**Decision**: Each bin has at most one `bin_items` row per `thread_type_id` + `is_partial` combination. Adding stock increments `qty_cones`; removing stock decrements it.

**Why**: Simple deduction logic. History is captured in `bin_transactions`, not in multiple `bin_items` rows.

**Alternatives considered**:
- Separate rows per receiving event → more rows, complex deduction logic, marginal benefit since transactions log history

### D3: Issue V2 deducts from `bin_items` (not `thread_inventory`)

**Decision**: `deductStock()` decrements `bin_items.qty_cones` instead of changing `thread_inventory` cone status. `getStockAvailability()` sums `bin_items` instead of counting `thread_inventory` rows.

**Why**: Aligns with the "bins as single source" principle. Individual cone tracking is no longer needed for stock operations.

**Alternatives considered**:
- Keep deducting from `thread_inventory` and also deduct from `bin_items` → double bookkeeping, sync risk

### D4: Bins are grouped by color (mandatory), mixed tex/supplier allowed

**Decision**: Each bin has a `color_id` FK. All items in the bin must match this color. Different tex numbers and suppliers are allowed within the same bin.

**Why**: Matches physical warehouse practice — same-color cones go in same container regardless of tex/supplier.

### D5: Bin codes are auto-generated sequential

**Decision**: Format `BIN-NNNNN` (e.g., `BIN-00001`). Generated server-side using a sequence or max+1 pattern.

**Why**: Simple, scannable, no ambiguity. QR code content = bin_code string.

### D6: Reuse existing QR infrastructure

**Decision**: Reuse `QrLabelSingle`, `QrPrintDialog`, `QrScannerDialog` components. Create a new `BinQrLabel.vue` template for bin-specific label layout.

**Why**: Full QR scanning and printing infrastructure already exists. Only need a new label template.

### D7: `v_stock_summary` view rebuilt on `bin_items`

**Decision**: Drop the existing `v_stock_summary` (based on `thread_stock`) and recreate it querying `bin_items`. Same output columns for backward compatibility with dashboard.

**Why**: Dashboard and reports should work without changes.

## Risks / Trade-offs

- **[Data migration]** Existing `thread_stock` records must be migrated to bins → Create a default "UNASSIGNED" bin per warehouse to hold migrated stock. Users can redistribute later.
- **[Mandatory bin selection]** Receiving delivery now requires bin selection, adding a step → Provide "quick create bin" option in the receiving UI to minimize friction.
- **[Stock accuracy during transition]** If Issue V2 switches to `bin_items` but some stock hasn't been migrated → Migration script runs first; create UNASSIGNED bins for all existing `thread_stock` data before switching logic.
- **[Performance]** `getStockAvailability()` now sums across multiple bins instead of counting cones → Add index on `bin_items(thread_type_id, is_partial)`. Volume is low (hundreds of bins, not millions of cones).

## Migration Plan

1. Create new tables (`bins`, `bin_items`, `bin_transactions`) via migration
2. Migrate `thread_stock` data: for each record, create a bin named `UNASSIGNED-{warehouse_code}` and corresponding `bin_items`
3. Replace `v_stock_summary` view to query `bin_items`
4. Update backend routes: `issuesV2.ts`, `weeklyOrder.ts`
5. Create `bins.ts` routes
6. Update frontend: new bin pages, modify delivery receiving, modify issue flow
7. Deprecate `stock.ts` routes (keep temporarily for backward compatibility if needed)
8. Drop `thread_stock` table in a later migration (after verifying all references removed)

**Rollback**: If issues arise, revert migration (restore `thread_stock`, restore old `v_stock_summary` view). Backend route changes can be reverted via git.
