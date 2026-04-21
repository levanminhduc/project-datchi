# Project Roadmap

**Project:** Thread Inventory Management System (Hệ thống Quản lý Kho Chỉ)
**Last updated:** 2026-03-19

---

## Current System Status

**Production-ready domains (2026-03-19):** Thread master data, Inventory, Allocations (FEFO), Issue V2, Batch operations, Purchase orders, Recovery, HR/Auth (RBAC), Dashboard, Reports, Mobile workflows, QR scanning, Offline sync, Settings, Thread Calculation, Sub-Arts, Style Colors.

**Stable as of 2026-03-19:** Weekly ordering cycle — loans, reservations, delivery tracking, sub-art selection, partial cone conversion, cone assignment tracking. Inventory performance: server-side pagination + DB aggregation views/RPCs (138K+ cones). Production warehouse reconciliation (Điện Bàn/Phú Tường).

---

## System Scale (2026-03-19)

| Metric | Count |
|--------|-------|
| DB migrations | 112 |
| Backend route files | 28 |
| Zod validation schemas | 8 |
| Frontend services | 32 |
| Frontend composables | 48 |
| Frontend pages | 50 |
| UI components (ui/) | 67 |
| Thread domain components | 51 |
| Other components | 12 |
| Type files | ~40 |
| Total project files | ~1,051 |
| Core app LOC | ~101K (src + server + supabase) |

---

## Recent Milestones

### 2026-03 (Current Sprint)

| Date | Feature | Migration / Commit |
|------|---------|-------------------|
| 2026-04-21 | Chuyển kho cho chỉ đã gán theo Tuần đặt hàng (`fn_transfer_reserved_cones` + UI `/thread/transfer-reserved`) | `20260421100000` |
| 2026-03-18 | `fn_warehouse_breakdown` + `fn_supplier_breakdown` RPCs cho phân tích tồn kho | `20260318220000` |
| 2026-03-18 | `fn_count_available_cones` bulk RPC | `20260318210000` |
| 2026-03-18 | `color_id` trên `thread_inventory`; cập nhật `fn_cone_summary_filtered` | `20260318170000` |
| 2026-03-18 | Reconcile production warehouses Điện Bàn / Phú Tường | `20260318000001` |
| 2026-03-14 | `fn_get_supplier_unique_tex` RPC | `20260314151300` |
| 2026-03-14 | `fn_get_tex_options_by_supplier` RPC | `20260314143000` |
| 2026-03-14 | Inventory performance: server-side pagination + SQL View/RPC summary (138K+ cones) | `20260314100000` |
| 2026-03-14 | Seeds initial Coats inventory (4 suppliers × 5 thread types) | `20260314093300` |
| 2026-03-14 | New table `style_colors` (garment colors as first-class entity) | `20260314010000` |
| 2026-03-13 | `thread_color_id` on `style_color_thread_specs`; `thread_type_id` nullable | `20260313233200` |
| 2026-03-13 | `tex_label` column on `thread_types` | `20260313000003` |
| 2026-03-13 | `week` on `purchase_orders`, `finished_product_code` on `po_items`, seeds `import_po_items_mapping` | `20260313000002` |
| 2026-03-13 | `sub_art_id` on `thread_order_items`, rebuilds unique index | `20260313000001` |
| 2026-03-12 | New table `sub_arts`; `sub_art_id` FK on `thread_issue_lines` | `20260312000001` |
| 2026-03-12 | Sub-art selection in weekly thread orders | commit |
| 2026-03-12 | Sub-art classification for thread issue management | commit |
| 2026-03-09 | Reserve functions read `reserve_priority` setting; partial cone support | `20260309000001` |
| 2026-03-09 | Partial cone conversion in weekly ordering | commit |
| 2026-03-07 | `tex_number` NUMERIC → VARCHAR(20) on `thread_types` | `20260307000002` |
| 2026-03-07 | Seeds `po_items` column mapping into `system_settings` | `20260307000001` |
| 2026-03-06 | Fix nested JSON parse bug in reserve/borrow functions | `20260306000001` |
| 2026-03-06 | Weekly order cone assignment tracking | commit |
| 2026-03-06 | Auth v2 improvements | commit |
| 2026-03-05 | Batch borrow thread | `20260305000004` |
| 2026-03-05 | Loan dashboard summary view | `20260305000003` |
| 2026-03-05 | Loan status auto-return trigger on cycle close | `20260305000002` |
| 2026-03-05 | Update warehouses for production layout | `20260305000001` |
| 2026-03-03 | Delivery quantity tracking functions | `20260303000002` |
| 2026-03-03 | Delivery quantity tracking tables | `20260303000001` |
| 2026-03-03 | Weekly order summary table | commit `0bc96f9` |
| 2026-03-02 | Reserve thread from stock | `20260302000003` + `20260302000004` |
| 2026-03-02 | Modify allocate thread reserve logic | `20260302000005` |

### 2026-02

| Feature | Notes |
|---------|-------|
| Mượn chỉ (loan) page update | UI improvements for borrow workflow |
| SSE streaming for bulk import | Progress bar for PO/color import |
| Menu restructuring | Navigation improvements |
| Docker multi-stage build optimization | Frontend 40MB → 47.6MB, Backend 1.23GB → 555MB |
| Backend security review | `docs/backend-security-review-2026-02-21.md` |

### Earlier Milestones

| Feature | Status |
|---------|--------|
| Issue V2 (xuất chỉ V2) với multi-line create | Stable |
| Thread calculation engine | Stable |
| FEFO allocation với split support | Stable |
| Mobile receive / issue / recovery pages | Stable |
| Offline operation queue với sync | Stable |
| QR barcode scanning integration | Stable |
| Excel export via ExcelJS | Stable |
| Full RBAC với granular permissions | Stable |
| Reconciliation workflow | Stable |
| Style + thread spec management | Stable |
| Supplier và color import tools | Stable |
| Global authMiddleware (C01 security fix) | Stable |

---

## Planned / In-Progress Features

### Weekly Order Enhancements

- [x] Batch borrow UI integration
- [x] Delivery tracking UI
- [x] Loan dashboard — summary view cho tất cả active loans
- [x] Order history aggregation across multiple weeks
- [x] Sub-art selection per order item
- [x] Partial cone conversion
- [ ] Delivery management page (full UI polish)

### Inventory Improvements

- [ ] Stocktake workflow improvements — mobile-optimized scanning
- [ ] Inventory alert thresholds — configurable low-stock warnings
- [ ] Cone-level inventory detail trên mobile

### Reporting

- [ ] Weekly order report — ordered vs. delivered quantities by week
- [ ] Loan report — borrowed, returned, outstanding by department
- [ ] Recovery report — write-off quantities by period

### System

- [ ] Notification push — real-time alerts cho pending approvals
- [ ] Audit log viewer — UI để xem change history
- [ ] Security remediation từ review 2026-02-21 (C01 global auth đã apply; H01–H05 và M01–M07 pending)
- [ ] Performance optimization cho large inventory datasets (pagination improvements)
- [x] Inventory page server-side pagination + DB aggregation (v_cone_summary + fn_cone_summary_filtered) — 2026-03-14
- [x] Inventory color_id tracking + warehouse/supplier breakdown RPCs — 2026-03-18

---

## Known Technical Debt

| Area | Issue | Priority |
|------|-------|---------|
| `issuesV2.ts` (2,697 LOC) | Vượt xa modularization target — nên split theo concern | Medium |
| `weeklyOrder.ts` (2,652 LOC) | Same — quá lớn cho 1 file | Medium |
| `allocations.ts` (1,634 LOC) | Approaching complexity limit | Low |
| Test coverage | Không có unit tests — chỉ Playwright e2e | Medium |
| PostgREST schema cache | New FK tables cần manual `NOTIFY pgrst, 'reload schema'` | Low |
| Security remediation | C01 applied; H01–H05, M01–M07 từ review 2026-02-21 pending | High |
| Docker backend env vars | `VITE_*` prefix cho backend env vars là sai convention (nên `SUPABASE_*`) — functional nhưng misleading | Low |

---

## Architecture Constraints for Future Work

1. **No direct Supabase CRUD from frontend** — tất cả features mới phải qua Hono API
2. **File size limit** — file mới phải dưới 200 LOC; split proactively
3. **Auth on all new routes** — apply `requirePermission()` cho mọi endpoint mới
4. **Zod schema required** — mọi write endpoint mới cần validation schema trong `server/validation/`
5. **Vietnamese UI** — tất cả user-facing text mới phải bằng Tiếng Việt
6. **No `supabase db reset`** — chỉ apply migrations với `supabase migration up`

---

## Development Workflow Reference

```bash
# Start dev environment
npm run dev:all       # Frontend (5173) + Backend (3000) concurrently

# Before committing
npm run lint          # ESLint --fix
npm run type-check    # vue-tsc --build --force

# Apply new migration
supabase migration up # Safe — additive only

# Direct DB access (local)
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

---

## Doc Links

| Document | Purpose |
|----------|---------|
| `docs/project-overview-pdr.md` | Domain overview, business rules, stakeholders |
| `docs/system-architecture.md` | Architecture, auth flow, DB schema conventions |
| `docs/codebase-summary.md` | File counts, composables, services, component inventory |
| `docs/code-standards.md` | Coding patterns, anti-patterns, pre-commit checklist |
| `docs/docker-deployment.md` | Docker + nginx production deployment |
| `docs/backend-security-review-2026-02-21.md` | Point-in-time security review (Feb 2026) |
