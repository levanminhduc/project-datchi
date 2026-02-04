---
spec_version: "1.0"
feature: "inventory-supplier-breakdown"
level: 2
status: "implemented"
created: "2026-02-04"
updated: "2026-02-04"
tags: ["inventory", "supplier", "dialog", "drill-down"]
---

<!-- @SECTION:OVERVIEW -->
# Thread Inventory Supplier Breakdown

Enhance the warehouse allocation dialog (`ConeWarehouseBreakdownDialog.vue`) to display supplier breakdown alongside warehouse breakdown. Show Color -> Supplier -> Cone counts (full/partial) to help users understand inventory distribution by vendor.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: View Supplier Breakdown in Dialog (P1) MVP

As a warehouse manager, I want to see supplier breakdown when viewing thread type details so that I can identify which vendors supplied the inventory.

**Independent Test**: Click any row in cone summary table, verify breakdown dialog opens showing supplier section with code, name, and cone counts.

**Inferred from**: User requirement to show supplier distribution per thread type
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Handle NULL Suppliers (P1) MVP

As a warehouse manager, I want inventory without a linked supplier to show "Không xác định" so that I know which cones need supplier data cleanup.

**Independent Test**: For cones without `lot.supplier_id` or `thread_type.supplier_id`, verify the supplier section displays "Không xác định" (NULL supplier fallback).
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P2 status=done mvp=false -->
### US-003: Preserve Existing Warehouse Breakdown (P2)

As a warehouse manager, I want the existing warehouse breakdown to remain unchanged so that I can still view warehouse distribution.

**Independent Test**: Verify warehouse breakdown table displays identical data and behavior as before this enhancement.
<!-- @END:STORY:US-003 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:api story=US-001 -->
### API Enhancement

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN the API endpoint `/api/inventory/summary/by-cone/:id/warehouses` is called, THE SYSTEM SHALL return a `supplier_breakdown` array alongside existing `data` (warehouse breakdown).
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: THE SYSTEM SHALL include for each supplier: `supplier_id`, `supplier_code`, `supplier_name`, `full_cones`, `partial_cones`, `partial_meters`.
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: THE SYSTEM SHALL use COALESCE logic to determine supplier: first prefer `lots.supplier_id`, then fallback to `thread_types.supplier_id`.
<!-- @END:AC:AC-003 -->

<!-- @END:CRITERIA_GROUP:api -->

<!-- @CRITERIA_GROUP:null_handling story=US-002 -->
### NULL Supplier Handling

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: IF supplier_id is NULL after COALESCE, THEN THE SYSTEM SHALL group those cones under a single "unknown supplier" entry with `supplier_code: null` and `supplier_name: "Không xác định"`.
<!-- @END:AC:AC-004 -->

<!-- @END:CRITERIA_GROUP:null_handling -->

<!-- @CRITERIA_GROUP:frontend story=US-001 -->
### Frontend Display

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN the breakdown dialog opens, THE SYSTEM SHALL display a supplier section with q-table showing supplier breakdown data.
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: THE SYSTEM SHALL display each supplier row with: code, name, full_cones, partial_cones.
<!-- @END:AC:AC-006 -->

<!-- @END:CRITERIA_GROUP:frontend -->

<!-- @CRITERIA_GROUP:backward_compat story=US-003 -->
### Backward Compatibility

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: THE SYSTEM SHALL continue returning `data` array (warehouse breakdown) with identical structure and values.
<!-- @END:AC:AC-007 -->

<!-- @END:CRITERIA_GROUP:backward_compat -->

<!-- @CRITERIA_GROUP:nfr story=US-001 -->
### Non-Functional Requirements

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: THE SYSTEM SHALL return API response within 500ms for typical thread types (< 1000 cones).
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: THE SYSTEM SHALL display the dialog responsively on mobile devices.
<!-- @END:AC:AC-009 -->

<!-- @END:CRITERIA_GROUP:nfr -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:ASSUMPTIONS -->
## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|-----------------|
| COALESCE priority | lots.supplier_id first | Lot-level supplier is more specific than thread-type default | thread_types first, require lot supplier |
| NULL display text | "Không xác định" | Vietnamese consistency with existing error messages | "N/A", "Chưa có NCC" |
| API structure | Add `supplier_breakdown` field to existing response | Backward compatible, no breaking changes | Separate endpoint, nested structure |
| Supplier section placement | Below warehouse section | Logical grouping, warehouse is primary | Above, separate tab |

> These assumptions were made autonomously based on codebase patterns and user requirements.
<!-- @END:ASSUMPTIONS -->

<!-- @SECTION:OUT_OF_SCOPE -->
## Out of Scope

- Editing supplier data from the breakdown dialog
- Filtering breakdown by supplier
- Drill-down from supplier to individual cones
- Supplier performance metrics or analytics
- Export functionality for breakdown data
<!-- @END:OUT_OF_SCOPE -->

<!-- @SECTION:CONTEXT -->
## Context

### Related Specifications
- `.claude/specs/thread/cone-inventory-summary/` - Parent feature for cone summary and warehouse breakdown

### Related Code
- Dialog component: `src/components/thread/ConeWarehouseBreakdownDialog.vue:1-302`
- Composable: `src/composables/thread/useConeSummary.ts:45-308`
- API route: `server/routes/inventory.ts:382-467`
- Service layer: `src/services/inventoryService.ts:202-218`
- Type definitions: `server/types/thread.ts:345-357`, `src/types/thread/inventory.ts:94-105`

### Database Schema References
- `suppliers` table: `supabase/migrations/20240101000021_suppliers.sql:13-27`
- `lots.supplier_id`: `supabase/migrations/20240101000023_thread_types_fks.sql:25-26`
- `thread_types.supplier_id`: `supabase/migrations/20240101000023_thread_types_fks.sql:16`
- `thread_inventory.lot_id`: `supabase/migrations/20240101000018_inventory_lot_id.sql:13-14`
<!-- @END:CONTEXT -->
