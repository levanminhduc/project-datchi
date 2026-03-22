## Why

The Weekly Order page currently calculates thread requirements per style but lacks visibility into available inventory. Users cannot see if stock is sufficient before ordering, leading to unnecessary purchases or delayed production when inventory exists. Additionally, when multiple styles share the same thread type, there's no priority system to determine allocation order.

## What Changes

- Add **Inventory Preview** column to the Detail Results table showing available stock per thread type
- Display **"Sẵn Kho" (In Stock)** instead of delivery date when inventory covers full requirement
- Display **"Thiếu X"** with delivery date when inventory is insufficient (only for shortage quantity)
- Add **drag-and-drop reordering** of Style cards to set allocation priority (first in list = first allocated)
- Backend **preview allocation** that simulates FEFO allocation without locking cones
- **Create soft allocations** when saving results (for shortage quantities only)
- Install `vuedraggable` package for drag-and-drop functionality

## Capabilities

### New Capabilities
- `inventory-preview-allocation`: Backend simulation of FEFO allocation for preview purposes, returning available stock and shortage per calculation item based on position order
- `draggable-style-order`: Frontend drag-and-drop reordering of Style cards with position tracking and debounced recalculation

### Modified Capabilities
<!-- No existing specs are being modified at the requirement level -->

## Impact

- **Backend**:
  - New endpoint or enhanced `/api/thread-calculation` to include preview allocation data
  - Modified `/api/weekly-orders/:id/results` save endpoint to create soft allocations for shortages
- **Frontend**:
  - `ResultsDetailView.vue`: New "Tồn Kho" column, enhanced "Ngày giao" display logic
  - `useWeeklyOrderCalculation.ts`: Position tracking, reorder handling
  - New dependency: `vuedraggable` package
- **Types**:
  - Extended `CalculationItem` with `inventory_available`, `shortage_cones`, `is_fully_stocked` fields
- **Database**: No schema changes (uses existing `thread_inventory` and `thread_allocations` tables)
