## Your Role
You are Codex acting as a strict implementation-plan reviewer.

## Plan Location
D:/HoaThoDienBan/VueJS/project-datchi/openspec/changes/cone-reserved-by-week-display/

Files to read:
- proposal.md
- design.md
- tasks.md
- specs/cone-reserved-by-week/spec.md (new capability)
- specs/warehouse-breakdown-rpc/spec.md (MODIFIED delta)

## User's Original Request
User wants a new component displayed INSIDE the existing `ConeWarehouseBreakdownDialog` (opened from "Tổng hợp theo cuộn" tab at `src/pages/thread/inventory.vue`) that shows which weekly orders (tuần đặt hàng) are reserving cones for a specific thread type, alongside available cones. Key constraints finalized:

- Reserve mechanism: `thread_inventory.reserved_week_id` + `status = 'RESERVED_FOR_ORDER'`
- "Khả dụng" (available) = cones with `status = 'AVAILABLE'`, grouped by warehouse
- Layout: group by warehouse (parent row), expand to weeks (child rows). NO PO breakdown (dropped by user)
- Week filter: only `CONFIRMED` status weeks
- Warehouse filter sync: if `inventory.vue` has `filters.warehouse_id` active, BOTH legacy warehouse breakdown endpoint AND new endpoint must respect that filter (to avoid data inconsistency between two tables in same dialog)
- Location: mount BELOW existing warehouse breakdown table within `ConeWarehouseBreakdownDialog`
- No navigation on row click
- Permission reuses `thread.allocations.view`

## Session Context
Project: Vue 3 + Quasar 2 + TypeScript + Hono + Supabase PostgreSQL (Vietnamese B2B thread inventory app).

Relevant conventions:
- Response shape: `{ data, error, message }`
- `fetchApi()` wrapper for frontend
- DataTable preferred over raw q-table (plan notes q-table expand-row as an exception)
- Snake_case DB, soft delete via `deleted_at`
- Weekly order statuses: `DRAFT | CONFIRMED | CANCELLED | COMPLETED` (no ACTIVE)
- Max 200 lines per file
- Vietnamese UI text

Existing code references:
- `server/routes/weekly-order/transfer-reserved.ts` — pattern for querying reserved cones by week
- `src/composables/thread/useConeSummary.ts` — has `fetchWarehouseBreakdown(thread_type_id, color_id)`
- `src/components/thread/ConeWarehouseBreakdownDialog.vue` — where new component mounts
- `src/pages/thread/inventory.vue` — has `filters.warehouse_id`

## Instructions
1. Read the plan files directly (proposal.md, design.md, tasks.md, both spec.md files).
2. Identify gaps, risks, missing edge cases, and sequencing flaws.
3. Pay particular attention to:
   - Data consistency between legacy breakdown and new endpoint when warehouse_id filter active
   - N+1 queries / performance risks
   - Edge cases: week deleted, cone moved between warehouses during RESERVED, no CONFIRMED weeks, zero available cones
   - Permission enforcement
   - Error states in UI
   - Whether the task sequencing allows incremental testing
4. Do not propose code changes; review only the plan quality.
5. Use the required output format exactly.

## Required Output Format
```markdown
### ISSUE-{N}: {Short title}
- Category: correctness | architecture | sequencing | risk | scope
- Severity: low | medium | high | critical
- Problem: {clear statement}
- Why it matters: {impact}
- Suggested fix: {plan-level change}

### VERDICT
- Status: APPROVE | REVISE
- Reason: {short reason}
```

If no issues remain, return only `VERDICT` with `Status: APPROVE`.
