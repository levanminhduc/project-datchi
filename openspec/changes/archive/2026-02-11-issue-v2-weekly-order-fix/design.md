## Context

The Issue V2 system (`/thread/issues/v2`) was recently implemented to manage thread issuance with cone-based tracking. However, two issues prevent it from working correctly:

1. **Route conflict**: In `server/index.ts`, routes are registered as:
   ```
   app.route('/api/issues', issuesRouter)      // line 78
   app.route('/api/issues/v2', issuesV2Router) // line 81
   ```
   Hono matches `/api/issues/*` first, so `/api/issues/v2/form-data` is handled by `issuesRouter` which interprets `v2` as an ID parameter.

2. **Data source**: The Issue V2 page loads PO/Style/Color from all purchase orders, but business logic requires only combinations from confirmed weekly orders to be available for issuance.

**Current tables involved:**
- `thread_order_weeks` (status: draft | confirmed | cancelled)
- `thread_order_items` (week_id, po_id, style_id, color_id, quantity)
- `purchase_orders`, `styles`, `colors`

## Goals / Non-Goals

**Goals:**
- Fix route ordering so `/api/issues/v2/*` endpoints work correctly
- Create endpoint to load PO/Style/Color options from confirmed weekly orders only
- Update frontend to use cascading selection (PO → Style → Color)
- Filter out items without PO (`po_id IS NULL`)

**Non-Goals:**
- Changing the weekly order creation process
- Adding week selection to Issue V2 (aggregate all confirmed weeks)
- Modifying quota calculation logic (already handled by existing endpoint)

## Decisions

### 1. Route Registration Order
**Decision**: Move `/api/issues/v2` registration BEFORE `/api/issues` in server/index.ts

**Rationale**: Hono matches routes in registration order. More specific paths must come first.

**Alternative considered**: Using a completely different path like `/api/issues-v2`. Rejected because it breaks convention and requires more changes.

### 2. Single Endpoint with Query Parameters
**Decision**: Create `GET /api/issues/v2/order-options` with optional query params:
- No params → returns distinct POs
- `?po_id=X` → returns distinct Styles for that PO
- `?po_id=X&style_id=Y` → returns distinct Colors for that PO+Style

**Rationale**: Single endpoint is simpler than three separate endpoints. Frontend makes cascading calls as user selects each level.

**Alternative considered**: Three separate endpoints (`/pos`, `/styles`, `/colors`). Rejected as unnecessarily complex.

### 3. Frontend Cascading Selection Pattern
**Decision**: Replace current `loadInitialOptions()` with cascading watchers:
- `onMounted`: Load PO options
- `watch(selectedPoId)`: Load Style options
- `watch(selectedStyleId)`: Load Color options

**Rationale**: Matches existing patterns in the codebase (see `IssueRequestForm.vue` watchers).

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Breaking existing Issue V1 routes | Route order change only affects matching, not functionality. V1 routes remain unchanged. |
| No confirmed weeks → empty options | Frontend shows informative message: "Không có tuần đặt hàng đã xác nhận" |
| Performance with many order items | Query uses DISTINCT and indexes on `thread_order_items(po_id, style_id, color_id)` |
