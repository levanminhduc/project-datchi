## Why

The "Giao Hàng" (Delivery) tab in the weekly order detail page (`/thread/weekly-order/[id]`) currently only shows a redirect link to a separate delivery management page. Users must navigate away to see delivery statistics, disrupting their workflow when reviewing weekly order status.

## What Changes

- Add a new API endpoint `GET /api/weekly-orders/:weekId/delivery-summary` that aggregates delivery data for a specific week
- Add `DeliverySummary` and `DeliverySupplierBreakdown` TypeScript interfaces for type-safe API responses
- Add `getDeliverySummary(weekId)` method to `weeklyOrderService`
- Create a new `DeliverySummarySection.vue` component (following `ProgressSummarySection` pattern) displaying:
  - 3 KPI cards: Total Ordered / Total Delivered / Total Received
  - Progress bar showing % received
  - Breakdown table by Supplier + Tex + Color
  - Manual refresh button
  - Link to detailed delivery management page
- Update the "deliveries" tab panel in `[id].vue` to use the new component instead of just a redirect link

## Capabilities

### New Capabilities
- `delivery-summary`: API endpoint and UI component for displaying aggregated delivery statistics within weekly order detail page

### Modified Capabilities
<!-- No existing specs are being modified - this adds new functionality to an existing page -->

## Impact

- **Backend**: `server/routes/weekly-order/deliveries.ts` — new route
- **Services**: `src/services/weeklyOrderService.ts` — new method
- **Types**: `src/types/thread/weeklyOrder.ts` — new interfaces
- **Components**: New `src/components/thread/weekly-order/DeliverySummarySection.vue`
- **Pages**: `src/pages/thread/weekly-order/[id].vue` — update tab panel
- **Database**: No schema changes (reads existing `thread_order_deliveries` table)
