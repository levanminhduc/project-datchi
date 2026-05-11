## Context

The weekly order detail page (`/thread/weekly-order/[id]`) has multiple tabs for different aspects: Calculation, Progress, Overview, Reservations, Loans, and Deliveries. The Deliveries tab currently just shows a link to `/thread/weekly-order/deliveries` — a separate page that manages all deliveries across all weeks.

Users reviewing a specific week's status need to see delivery progress without navigating away. The `ProgressSummarySection` component already provides a good pattern for displaying aggregated data within a tab.

**Existing patterns to follow:**
- `ProgressSummarySection.vue`: Props-based component with loading state, refresh emit, breakdown table
- `progress-summary.ts`: Route handler that aggregates data from multiple tables
- `deliveries.ts` route: Existing delivery queries with supplier/thread_type joins

## Goals / Non-Goals

**Goals:**
- Display delivery KPIs (ordered, delivered, received) at a glance
- Show breakdown by supplier + tex + color for detailed tracking
- Allow manual data refresh
- Maintain existing link to full delivery management page

**Non-Goals:**
- Real-time updates via Supabase subscriptions (manual refresh only)
- Alert system for overdue/due-today deliveries
- Modifying the separate `/thread/weekly-order/deliveries` page

## Decisions

### 1. API Aggregation Approach
**Decision:** Aggregate in backend route, not in frontend composable

**Rationale:** 
- Follows `progress-summary.ts` pattern
- Single database query with aggregation is more efficient
- Keeps frontend component stateless (receives props from parent)

**Alternative considered:** Frontend composable with multiple queries — rejected due to N+1 potential and more complex state management

### 2. Data Structure
**Decision:** Flat breakdown by supplier + tex + color (not nested by supplier)

**Rationale:**
- Matches existing `deliveries.vue` tracking table format
- Simpler rendering logic
- Users expect consistency with the detailed view

### 3. Component Pattern
**Decision:** Section component with props + refresh emit (like ProgressSummarySection)

**Rationale:**
- Parent page manages loading state and API calls
- Component is purely presentational
- Consistent with other tab sections in the page

### 4. Route Placement
**Decision:** Add route in existing `deliveries.ts` file as `/:weekId/delivery-summary`

**Rationale:**
- Logically grouped with other delivery routes
- Follows existing route organization pattern
- Requires check that specific route is placed BEFORE generic `/:id` routes

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Route order conflict (specific before generic) | Place `/:weekId/delivery-summary` route BEFORE `/:id/deliveries` in file |
| Large datasets slow aggregation | Use existing batch pattern from deliveries.ts; week-scoped query limits data |
| Type mismatch with existing DeliveryRecord | Create separate `DeliverySummary` interface, don't extend existing types |

## Data Flow

```
[id].vue (parent)
    ├── loadDeliverySummary() → weeklyOrderService.getDeliverySummary(weekId)
    │                              └── fetchApi('/api/weekly-orders/:weekId/delivery-summary')
    │                                      └── deliveries.ts route handler
    │                                              └── supabase query + aggregation
    └── <DeliverySummarySection
            :summary="deliverySummary"
            :loading="deliverySummaryLoading"
            @refresh="loadDeliverySummary"
        />
```

## API Response

```typescript
// GET /api/weekly-orders/:weekId/delivery-summary
{
  data: {
    total_ordered: number,      // SUM(quantity_cones) all deliveries
    total_delivered: number,    // SUM(quantity_cones) WHERE status='DELIVERED'
    total_received: number,     // SUM(received_quantity)
    percent_received: number,   // Math.round((received/ordered) * 100) or 0
    by_supplier: [
      {
        supplier_id: number,
        supplier_name: string,
        tex_number: string,
        color_name: string,
        color_hex: string,
        ordered: number,
        delivered: number,
        received: number,
        pending_delivery: number,  // ordered - delivered (if status != DELIVERED)
        pending_receive: number    // delivered - received (if status == DELIVERED)
      }
    ]
  },
  error: null
}
```
