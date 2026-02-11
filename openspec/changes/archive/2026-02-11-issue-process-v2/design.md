## Context

The current thread inventory system (`thread_inventory`) tracks each physical cone with a unique `cone_id`, creating thousands of records. This design made sense for barcode/QR tracking but threads don't have individual labels. The granular tracking adds database overhead without practical benefit.

Current issue flow requires one request per thread color, but BOM defines multiple thread colors per product color (e.g., product "Red" needs Poly Red + Poly White + Cotton Black threads). This forces users to create 3-5 separate issue requests.

**Stakeholders**: Warehouse staff (daily issue/return operations), Production supervisors (quota monitoring)

**Constraints**:
- Must migrate existing `thread_inventory` data
- `meters_per_cone` varies by thread type (from `thread_types` table)
- Lot tracking optional but supported for FEFO
- Existing Weekly Order calculation produces meters; need cone conversion

## Goals / Non-Goals

**Goals:**
- Simplify inventory to quantity-based tracking (full cones + partial cones per thread type)
- Enable issuing multiple thread colors in one request (matching BOM structure)
- Control quota by number of cones instead of meters
- Provide configurable partial cone ratio (default 0.3)
- Maintain lot traceability when needed
- Migrate existing data without loss

**Non-Goals:**
- Individual cone tracking (barcodes/QR codes) — not needed
- Real-time meter tracking — cones are the unit of control
- Complex FEFO logic — simple lot-based priority only
- Mobile scanning interface — desktop quantity input only
- Changing Weekly Order calculation logic — only add cone display

## Decisions

### Decision 1: Quantity-based Stock Model

**Choice**: Create `thread_stock` table with `qty_full_cones` and `qty_partial_cones` columns, grouped by thread_type + warehouse + lot_number.

**Alternatives considered**:
- Option A: Keep cone-based, add quantity view → Still creates many records, doesn't solve core problem
- Option B: Single quantity field with decimal → Loses distinction between full/partial cones

**Rationale**: Explicit full/partial tracking matches physical reality and enables accurate ratio calculation.

### Decision 2: Partial Cone Ratio in Database

**Choice**: Store `partial_cone_ratio` in `system_settings` table as configurable parameter.

**Alternatives considered**:
- Hardcode in application → Requires code change to adjust
- Environment variable → Harder for non-technical users to modify
- Per-thread-type ratio → Over-engineering for current needs

**Rationale**: Database config allows UI-based adjustment. Single ratio is sufficient since partial cones are roughly similar across thread types.

### Decision 3: Multi-line Issue Structure

**Choice**: Two tables: `thread_issues` (header) + `thread_issue_lines` (details per thread color).

**Alternatives considered**:
- Single flat table → Duplicates header info, harder to query
- JSON array in single record → Harder to validate and index

**Rationale**: Normalized structure matches existing patterns in codebase (e.g., `thread_order_weeks` + `thread_order_items`).

### Decision 4: Quota Source

**Choice**: Add `quota_cones` to `thread_order_items`, calculated as `CEIL(total_meters / meters_per_cone)` with user override.

**Alternatives considered**:
- Calculate quota on-the-fly → Inconsistent if meters_per_cone changes
- Separate quota table → Over-engineering

**Rationale**: Stored quota ensures consistency and allows user adjustment based on experience.

### Decision 5: Migration Strategy

**Choice**: Create new tables, migrate data with SQL script, keep old tables for reference (soft deprecation).

**Alternatives considered**:
- In-place ALTER → Risky for production data
- Dual-write during transition → Complex synchronization

**Rationale**: Clean migration with rollback option. Old tables remain read-only for audit/comparison.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Data loss during migration | Backup before migration, keep old tables, validate counts |
| User confusion with new UI | Clear documentation, training session |
| Incorrect partial ratio | Make configurable, start with 0.3 based on business input |
| FEFO complexity | Simple lot ordering by received_date, no complex logic |
| Performance with aggregated queries | Index on thread_type_id + warehouse_id |

## Migration Plan

### Phase 1: Preparation
1. Backup `thread_inventory` table
2. Run migration script to create new tables
3. Populate `thread_stock` from aggregated `thread_inventory`

### Phase 2: Deployment
1. Deploy new API endpoints alongside existing
2. Deploy new UI pages
3. Update delivery receiving to use new stock table

### Phase 3: Validation
1. Compare stock counts: old vs new
2. Test issue/return flow end-to-end
3. Verify quota calculations

### Rollback Strategy
- Keep old tables intact
- Old API endpoints remain functional
- Can revert UI to old pages via feature flag if needed

## Open Questions

1. ~~Partial cone ratio value~~ → Confirmed: 0.3 (30%), configurable
2. ~~Lot number required?~~ → Confirmed: Optional
3. ~~Migrate existing data?~~ → Confirmed: Yes, consolidate to summary
4. Should old issue records be migrated to new structure? → Suggest: No, keep for historical reference only
