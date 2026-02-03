---
spec_version: "1.0"
feature: "cone-inventory-summary"
level: 2
status: "active"
created: "2026-02-03"
updated: "2026-02-03"
tags: ["inventory", "thread", "summary", "reporting"]
synced_from: "server/routes/inventory.ts:262-467"
---

<!-- @SECTION:OVERVIEW -->
# Cone-Based Inventory Summary

A comprehensive inventory view that groups thread cones by thread type, providing summary statistics and warehouse distribution drill-down. This feature enables warehouse managers to quickly assess total inventory across all warehouses at the thread type level, distinguishing between full cones and partial (remnant) cones.

**Key capabilities:**
- Aggregate inventory by thread type
- View full cone vs partial cone counts
- Track partial cone metrics (meters, weight)
- Filter by warehouse, material, search terms
- Drill down to see warehouse distribution per thread type
- Real-time refresh after stock receipt operations

**Synced from existing implementation**: Backend API routes, frontend components, composable, and page integration all exist and are operational.
<!-- @END:OVERVIEW -->

<!-- @SECTION:USER_STORIES -->
## User Stories

<!-- @STORY:US-001 priority=P1 status=done mvp=true -->
### US-001: View Inventory Summary by Thread Type (P1) 🎯 MVP

As a warehouse manager, I want to view inventory grouped by thread type so that I can quickly assess total stock levels without scrolling through individual cones.

**Independent Test**: Navigate to Inventory page, switch to "Tổng hợp theo cuộn" tab, verify summary table displays with thread type rows.

**Inferred from**: `src/pages/thread/inventory.vue:108-127`, `src/components/thread/ConeSummaryTable.vue:1-344`
<!-- @END:STORY:US-001 -->

<!-- @STORY:US-002 priority=P1 status=done mvp=true -->
### US-002: Filter Summary by Warehouse (P1) 🎯 MVP

As a warehouse manager, I want to filter the cone summary by warehouse so that I can focus on inventory at a specific location.

**Independent Test**: Select warehouse from filter dropdown in inventory page, verify summary refreshes to show only data for that warehouse.

**Inferred from**: `src/pages/thread/inventory.vue:68-81`, `src/composables/thread/useConeSummary.ts:84-103`
<!-- @END:STORY:US-002 -->

<!-- @STORY:US-003 priority=P2 status=done -->
### US-003: Drill Down to Warehouse Distribution (P2)

As a warehouse manager, I want to click on a thread type row to see which warehouses contain that thread so that I can locate inventory across facilities.

**Independent Test**: Click any row in cone summary table, verify breakdown dialog opens showing warehouse list with cone counts for that thread type.

**Inferred from**: `src/pages/thread/inventory.vue:564-570`, `src/components/thread/ConeWarehouseBreakdownDialog.vue:1-302`
<!-- @END:STORY:US-003 -->

<!-- @STORY:US-004 priority=P2 status=done -->
### US-004: Search Cone Summary (P2)

As a warehouse manager, I want to search the cone summary by thread code, name, or color so that I can quickly find specific thread types.

**Independent Test**: Enter search term in summary table search box, verify filtered results show only matching thread types.

**Inferred from**: `src/components/thread/ConeSummaryTable.vue:26-49`, `server/routes/inventory.ts:329-336`
<!-- @END:STORY:US-004 -->

<!-- @STORY:US-005 priority=P2 status=done -->
### US-005: Filter Summary by Material (P2)

As a warehouse manager, I want to filter cone summary by material type (polyester, cotton, etc.) so that I can analyze inventory by fabric category.

**Independent Test**: Apply material filter via API query parameter, verify only matching thread types appear in summary.

**Inferred from**: `server/routes/inventory.ts:325-326`, `src/types/thread/inventory.ts:110-114`
<!-- @END:STORY:US-005 -->

<!-- @STORY:US-006 priority=P3 status=done -->
### US-006: Refresh Summary After Stock Receipt (P3)

As a warehouse manager, I want the cone summary to automatically refresh after receiving new stock so that I see updated totals immediately.

**Independent Test**: Complete stock receipt operation, verify both detail and summary views refresh automatically.

**Inferred from**: `src/pages/thread/inventory.vue:829-833`
<!-- @END:STORY:US-006 -->

<!-- @END:USER_STORIES -->

<!-- @SECTION:ACCEPTANCE_CRITERIA -->
## Acceptance Criteria

<!-- @CRITERIA_GROUP:backend_api story=US-001 -->
### Backend API - Cone Summary Endpoint

<!-- @AC:AC-001 status=done -->
- [x] **AC-001**: WHEN GET `/api/inventory/summary/by-cone` is called THE SYSTEM SHALL return an array of ConeSummaryRow objects grouped by thread_type_id
<!-- @END:AC:AC-001 -->

<!-- @AC:AC-002 status=done -->
- [x] **AC-002**: WHEN aggregating inventory THE SYSTEM SHALL only include usable statuses: RECEIVED, INSPECTED, AVAILABLE, SOFT_ALLOCATED, HARD_ALLOCATED
<!-- @END:AC:AC-002 -->

<!-- @AC:AC-003 status=done -->
- [x] **AC-003**: WHEN warehouse_id query parameter is provided THE SYSTEM SHALL filter summary to that warehouse only
<!-- @END:AC:AC-003 -->

<!-- @AC:AC-004 status=done -->
- [x] **AC-004**: WHEN material query parameter is provided THE SYSTEM SHALL filter summary to matching thread material
<!-- @END:AC:AC-004 -->

<!-- @AC:AC-005 status=done -->
- [x] **AC-005**: WHEN search query parameter is provided THE SYSTEM SHALL filter by thread code, name, or color (case-insensitive)
<!-- @END:AC:AC-005 -->

<!-- @AC:AC-006 status=done -->
- [x] **AC-006**: WHEN grouping cones THE SYSTEM SHALL count full cones separately from partial cones based on is_partial flag
<!-- @END:AC:AC-006 -->

<!-- @AC:AC-007 status=done -->
- [x] **AC-007**: WHEN summing partial cones THE SYSTEM SHALL calculate total partial_meters and partial_weight_grams
<!-- @END:AC:AC-007 -->

<!-- @AC:AC-008 status=done -->
- [x] **AC-008**: WHEN returning results THE SYSTEM SHALL include thread type details: code, name, color, color_code, material, tex_number, meters_per_cone
<!-- @END:AC:AC-008 -->

<!-- @AC:AC-009 status=done -->
- [x] **AC-009**: WHEN returning results THE SYSTEM SHALL sort by thread_code in ascending order
<!-- @END:AC:AC-009 -->
<!-- @END:CRITERIA_GROUP:backend_api -->

<!-- @CRITERIA_GROUP:backend_warehouse_breakdown story=US-003 -->
### Backend API - Warehouse Breakdown Endpoint

<!-- @AC:AC-010 status=done -->
- [x] **AC-010**: WHEN GET `/api/inventory/summary/by-cone/:threadTypeId/warehouses` is called THE SYSTEM SHALL return warehouse breakdown for that thread type
<!-- @END:AC:AC-010 -->

<!-- @AC:AC-011 status=done -->
- [x] **AC-011**: WHEN threadTypeId is invalid (NaN) THE SYSTEM SHALL return 400 error with Vietnamese message
<!-- @END:AC:AC-011 -->

<!-- @AC:AC-012 status=done -->
- [x] **AC-012**: WHEN aggregating by warehouse THE SYSTEM SHALL group by warehouse_id and include warehouse code, name, location
<!-- @END:AC:AC-012 -->

<!-- @AC:AC-013 status=done -->
- [x] **AC-013**: WHEN aggregating by warehouse THE SYSTEM SHALL count full_cones, partial_cones, and sum partial_meters per warehouse
<!-- @END:AC:AC-013 -->

<!-- @AC:AC-014 status=done -->
- [x] **AC-014**: WHEN returning warehouse breakdown THE SYSTEM SHALL sort by warehouse_code in ascending order
<!-- @END:AC:AC-014 -->
<!-- @END:CRITERIA_GROUP:backend_warehouse_breakdown -->

<!-- @CRITERIA_GROUP:frontend_service story=US-001 -->
### Frontend Service Layer

<!-- @AC:AC-015 status=done -->
- [x] **AC-015**: WHEN getConeSummary(filters) is called THE SYSTEM SHALL construct query params from ConeSummaryFilters (warehouse_id, material, search)
<!-- @END:AC:AC-015 -->

<!-- @AC:AC-016 status=done -->
- [x] **AC-016**: WHEN getConeSummary() succeeds THE SYSTEM SHALL return ConeSummaryRow[] or throw error with Vietnamese message
<!-- @END:AC:AC-016 -->

<!-- @AC:AC-017 status=done -->
- [x] **AC-017**: WHEN getWarehouseBreakdown(threadTypeId) is called THE SYSTEM SHALL fetch warehouse distribution for that thread type
<!-- @END:AC:AC-017 -->

<!-- @AC:AC-018 status=done -->
- [x] **AC-018**: WHEN getWarehouseBreakdown() succeeds THE SYSTEM SHALL return ConeWarehouseBreakdown[] or throw error with Vietnamese message
<!-- @END:AC:AC-018 -->
<!-- @END:CRITERIA_GROUP:frontend_service -->

<!-- @CRITERIA_GROUP:composable story=US-001 -->
### Composable - useConeSummary

<!-- @AC:AC-019 status=done -->
- [x] **AC-019**: WHEN useConeSummary() is initialized THE SYSTEM SHALL provide reactive state: summaryList, warehouseBreakdown, selectedThreadType, filters, error
<!-- @END:AC:AC-019 -->

<!-- @AC:AC-020 status=done -->
- [x] **AC-020**: WHEN fetchSummary() is called THE SYSTEM SHALL set loading state, call inventoryService.getConeSummary(), and update summaryList
<!-- @END:AC:AC-020 -->

<!-- @AC:AC-021 status=done -->
- [x] **AC-021**: WHEN fetchSummary() fails THE SYSTEM SHALL set error state and show Vietnamese error notification
<!-- @END:AC:AC-021 -->

<!-- @AC:AC-022 status=done -->
- [x] **AC-022**: WHEN selectThreadType(row) is called THE SYSTEM SHALL set selectedThreadType and automatically fetch warehouse breakdown
<!-- @END:AC:AC-022 -->

<!-- @AC:AC-023 status=done -->
- [x] **AC-023**: WHEN composable calculates totals THE SYSTEM SHALL provide computed properties: totalFullCones, totalPartialCones, totalPartialMeters from summaryList
<!-- @END:AC:AC-023 -->
<!-- @END:CRITERIA_GROUP:composable -->

<!-- @CRITERIA_GROUP:ui_summary_table story=US-001 -->
### UI Component - ConeSummaryTable

<!-- @AC:AC-024 status=done -->
- [x] **AC-024**: WHEN rendering summary table THE SYSTEM SHALL display columns: thread_code, thread_name, color, tex_number, full_cones, partial_cones, partial_meters, partial_weight_grams, actions
<!-- @END:AC:AC-024 -->

<!-- @AC:AC-025 status=done -->
- [x] **AC-025**: WHEN displaying color column THE SYSTEM SHALL show color swatch with background color from color_code if available
<!-- @END:AC:AC-025 -->

<!-- @AC:AC-026 status=done -->
- [x] **AC-026**: WHEN displaying cone counts THE SYSTEM SHALL use color-coded badges: green for full_cones, orange/warning for partial_cones
<!-- @END:AC:AC-026 -->

<!-- @AC:AC-027 status=done -->
- [x] **AC-027**: WHEN user clicks table row THE SYSTEM SHALL emit 'show-breakdown' event with row data
<!-- @END:AC:AC-027 -->

<!-- @AC:AC-028 status=done -->
- [x] **AC-028**: WHEN rendering bottom row THE SYSTEM SHALL display totals: sum of full_cones, partial_cones, partial_meters, partial_weight_grams
<!-- @END:AC:AC-028 -->

<!-- @AC:AC-029 status=done -->
- [x] **AC-029**: WHEN table has search filter THE SYSTEM SHALL filter rows by thread_code, thread_name, or color (client-side)
<!-- @END:AC:AC-029 -->

<!-- @AC:AC-030 status=done -->
- [x] **AC-030**: WHEN user clicks refresh button THE SYSTEM SHALL emit 'refresh' event
<!-- @END:AC:AC-030 -->
<!-- @END:CRITERIA_GROUP:ui_summary_table -->

<!-- @CRITERIA_GROUP:ui_breakdown_dialog story=US-003 -->
### UI Component - ConeWarehouseBreakdownDialog

<!-- @AC:AC-031 status=done -->
- [x] **AC-031**: WHEN dialog opens THE SYSTEM SHALL display thread type header with code, name, color, tex_number
<!-- @END:AC:AC-031 -->

<!-- @AC:AC-032 status=done -->
- [x] **AC-032**: WHEN dialog shows summary cards THE SYSTEM SHALL display: full_cones (green), partial_cones (orange), partial_meters, warehouse_count
<!-- @END:AC:AC-032 -->

<!-- @AC:AC-033 status=done -->
- [x] **AC-033**: WHEN rendering warehouse breakdown table THE SYSTEM SHALL display columns: warehouse_code, warehouse_name, full_cones, partial_cones, partial_meters
<!-- @END:AC:AC-033 -->

<!-- @AC:AC-034 status=done -->
- [x] **AC-034**: WHEN displaying warehouse row THE SYSTEM SHALL show warehouse icon, name, and location (if available)
<!-- @END:AC:AC-034 -->

<!-- @AC:AC-035 status=done -->
- [x] **AC-035**: WHEN displaying cone counts in breakdown THE SYSTEM SHALL use same color-coded badges as summary table
<!-- @END:AC:AC-035 -->

<!-- @AC:AC-036 status=done -->
- [x] **AC-036**: WHEN dialog is in loading state THE SYSTEM SHALL show q-inner-loading spinner
<!-- @END:AC:AC-036 -->

<!-- @AC:AC-037 status=done -->
- [x] **AC-037**: WHEN breakdown data is empty THE SYSTEM SHALL show "Không có dữ liệu phân bố kho" message
<!-- @END:AC:AC-037 -->
<!-- @END:CRITERIA_GROUP:ui_breakdown_dialog -->

<!-- @CRITERIA_GROUP:page_integration story=US-001 -->
### Page Integration - inventory.vue

<!-- @AC:AC-038 status=done -->
- [x] **AC-038**: WHEN inventory page renders THE SYSTEM SHALL show tab navigation with "Chi tiết cuộn" and "Tổng hợp theo cuộn" tabs
<!-- @END:AC:AC-038 -->

<!-- @AC:AC-039 status=done -->
- [x] **AC-039**: WHEN user switches to summary tab THE SYSTEM SHALL automatically fetch cone summary with current warehouse filter
<!-- @END:AC:AC-039 -->

<!-- @AC:AC-040 status=done -->
- [x] **AC-040**: WHEN warehouse filter changes and summary tab is active THE SYSTEM SHALL refetch cone summary
<!-- @END:AC:AC-040 -->

<!-- @AC:AC-041 status=done -->
- [x] **AC-041**: WHEN stock receipt completes THE SYSTEM SHALL refresh both detail inventory AND cone summary to ensure data consistency
<!-- @END:AC:AC-041 -->

<!-- @AC:AC-042 status=done -->
- [x] **AC-042**: WHEN user clicks summary table row THE SYSTEM SHALL call selectThreadType() and open breakdown dialog
<!-- @END:AC:AC-042 -->

<!-- @AC:AC-043 status=done -->
- [x] **AC-043**: WHEN summary tab is active THE SYSTEM SHALL hide detail-specific filters (thread type, status, search) and only show warehouse filter
<!-- @END:AC:AC-043 -->
<!-- @END:CRITERIA_GROUP:page_integration -->

<!-- @CRITERIA_GROUP:data_consistency story=US-006 -->
### Data Consistency

<!-- @AC:AC-044 status=done -->
- [x] **AC-044**: WHEN calculating cone summary THE SYSTEM SHALL exclude non-usable statuses to match available inventory view
<!-- @END:AC:AC-044 -->

<!-- @AC:AC-045 status=done -->
- [x] **AC-045**: WHEN summing partial metrics THE SYSTEM SHALL use actual quantity_meters and weight_grams from database, not estimates
<!-- @END:AC:AC-045 -->

<!-- @AC:AC-046 status=done -->
- [x] **AC-046**: WHEN displaying formatted numbers THE SYSTEM SHALL use Vietnamese locale number formatting (Intl.NumberFormat('vi-VN'))
<!-- @END:AC:AC-046 -->
<!-- @END:CRITERIA_GROUP:data_consistency -->

<!-- @END:ACCEPTANCE_CRITERIA -->

<!-- @SECTION:IMPLEMENTATION_NOTES -->
## Implementation Notes

**Status**: Synced from production codebase on 2026-02-03

**Excluded Statuses**: The summary view intentionally excludes cones with these statuses:
- IN_PRODUCTION (issued to production floor)
- PARTIAL_RETURN (waiting to be weighed and confirmed)
- PENDING_WEIGH (waiting for recovery weighing)
- CONSUMED (fully used)
- WRITTEN_OFF (discarded)
- QUARANTINE (quality hold)

This ensures the summary reflects "usable warehouse inventory" only.

**Performance**: Backend aggregation processes all matching cones in a single query (no pagination), grouping and summing in-memory. For large datasets (10,000+ cones), consider adding database-level aggregation with GROUP BY if performance degrades.

**Future Enhancements** (not implemented):
- Export summary to Excel/CSV
- Material filter in UI (currently API-only)
- Historical trending (summary snapshots over time)
- Low stock alerts at thread type level
<!-- @END:IMPLEMENTATION_NOTES -->
