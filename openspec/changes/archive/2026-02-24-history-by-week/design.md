## Context

The current `GET /api/weekly-orders/order-history` returns a flat list of `thread_order_items`, each with nested `week`, `style`, `color`, `po` data. The FE renders this as a flat q-table. Users lack visibility into PO fulfillment progress across weeks.

Existing relevant APIs:
- `GET /api/weekly-orders` — lists weeks with `item_count` (no items)
- `GET /api/weekly-orders/:id` — single week with full items
- `GET /api/weekly-orders/ordered-quantities` — PO progress for given `(po_id, style_id)` pairs
- `GET /api/weekly-orders/order-history` — flat items (to be replaced)

DB tables involved: `thread_order_weeks`, `thread_order_items`, `po_items`, `purchase_orders`, `styles`, `colors`.

## Goals / Non-Goals

**Goals:**
- Single API endpoint returning week-grouped history with embedded PO progress
- FE accordion UI: collapsed week rows expand to show PO → Style → Color hierarchy with progress bars
- Status filter (default excludes CANCELLED, user can include)
- Remove old `/order-history` endpoint and all related dead code

**Non-Goals:**
- Server-side export (Excel export stays client-side, same as current)
- Changing the order creation/editing flow
- Adding real-time updates or WebSocket notifications
- Changing PO quantity validation logic

## Decisions

### D1: New endpoint path — `/history-by-week`

Add `GET /api/weekly-orders/history-by-week` as a new static route. Place it BEFORE `/:id` in route registration order (Hono matches routes in registration order).

**Why not modify `/order-history`**: Different response shape (grouped vs flat). Clean break is safer than trying to version the same endpoint.

### D2: Query strategy — paginate weeks first, then load items

```
Step 1: Find week_ids matching filters (if po_id/style_id → find weeks containing those items first)
Step 2: Paginate weeks
Step 3: Batch-load items for those weeks
Step 4: Calculate PO progress for unique (po_id, style_id) pairs
Step 5: Group and assemble response
```

**Why not single query**: Supabase JS client doesn't support the level of grouping + aggregation needed. Multi-step approach is clearer and matches existing patterns.

### D3: PO progress calculation — loop query (same as `/ordered-quantities`)

For each unique `(po_id, style_id)` pair in the result set:
1. Sum all `thread_order_items.quantity` across non-CANCELLED weeks
2. Get `po_items.quantity` for the PO total

**Why not RPC/Postgres function**: Loop approach is proven in `/ordered-quantities`, number of unique pairs per page is small (typically 5-15), and avoids needing a DB migration.

**Why not Supabase composite IN**: Not supported by the JS client. An `.or()` filter is possible but brittle for large numbers of pairs.

### D4: Filter behavior for `status`

- Query param `status` is optional
- Default: exclude `CANCELLED` (same as current behavior)
- If `status=ALL`, return all statuses including CANCELLED
- If `status=DRAFT` or `status=CONFIRMED` or `status=CANCELLED`, filter to that specific status

### D5: Response shape — nested groups

```typescript
{
  data: Array<{
    week_id, week_name, status, created_by, created_at, total_quantity,
    po_groups: Array<{
      po_id, po_number,
      styles: Array<{
        style_id, style_code, style_name,
        po_quantity, total_ordered, this_week_quantity, remaining, progress_pct,
        colors: Array<{ color_id, color_name, hex_code, quantity }>
      }>
    }>
  }>,
  pagination: { page, limit, total, totalPages }
}
```

**Why deeply nested**: Matches the natural hierarchy users think in (week → PO → style → color) and avoids FE having to re-group flat data.

### D6: FE page — rewrite `history.vue` as accordion

- Use `q-expansion-item` for each week row
- Expand triggers detail rendering (data already loaded from API)
- Progress bars using `q-linear-progress` with color thresholds: primary (0-79%), warning (80-99%), positive (100%), negative (>100%)
- Status filter added to existing filter bar

### D7: Clean removal of old code

Remove in BE and FE simultaneously:
- BE: `order-history` route handler, `OrderHistoryQuerySchema`
- FE: `OrderHistoryItem`, `OrderHistoryFilter` types, `getOrderHistory()` service method
- All in a single change — no backward compatibility needed since only `history.vue` consumes it

## Risks / Trade-offs

- **[N+1 queries for progress]** → Mitigated by small unique-pair count per page (10 weeks × ~5 styles = ~50 queries max). If becomes a bottleneck, can batch into RPC later.
- **[Breaking API change]** → Mitigated by verified single consumer (`history.vue`). No external API consumers.
- **[Filter by po_id/style_id requires pre-query]** → When filtering, must first find which weeks contain matching items, then paginate those weeks. Adds one extra query but keeps pagination accurate.
