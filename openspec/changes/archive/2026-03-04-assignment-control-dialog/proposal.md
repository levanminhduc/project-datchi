## Why

Weekly Orders (WO) reserve inventory cones for each week, but there's no centralized view to monitor assignment status across all weeks. Users currently must open each WO detail page individually to see reservation status. Need a summary dialog showing planned vs reserved vs allocated cones per thread type per week.

## What Changes

- Add new API endpoint `GET /api/weekly-orders/assignment-summary` to aggregate assignment data across weeks
- Create `AssignmentControlDialog.vue` component for read-only monitoring
- Add button on Weekly Order index page to open the dialog
- Add `AssignmentSummary` TypeScript interface for the response data

## Capabilities

### New Capabilities
- `assignment-summary-api`: Backend endpoint aggregating planned/reserved/allocated cones by week and thread type
- `assignment-control-dialog`: Frontend dialog component displaying assignment summary with week status filter

### Modified Capabilities
<!-- None - this is additive functionality -->

## Impact

- **Backend**: New route in `server/routes/weeklyOrder.ts`
- **Frontend**: New component in `src/components/thread/weekly-order/`, modifications to `src/pages/thread/weekly-order/index.vue`
- **Types**: New interface in `src/types/thread/weekly-order.ts`
- **Service**: New method in `src/services/weeklyOrderService.ts`
