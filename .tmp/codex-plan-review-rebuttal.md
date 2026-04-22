## Issues Accepted & Fixed

### ISSUE-1 (Legacy supplier_breakdown post-filter wrong): ACCEPTED + FIXED
- design.md Decision 3: rewrote → khi `warehouse_id` present, KHÔNG dùng output cũ của `fn_supplier_breakdown` (cross-warehouse → sai số). Re-derive bằng query trực tiếp `thread_inventory` filter `thread_type_id + color_id + warehouse_id`, join `thread_types → suppliers`, group ở app layer.
- specs/warehouse-breakdown-rpc/spec.md "Optional warehouse_id filter" scenario: updated để require re-derivation.
- tasks.md 2.3/2.4/2.5/2.6: split path "có warehouse_id" vs "không warehouse_id"; verify case (d) explicit yêu cầu compare với raw SQL khi supplier có cone ở 2 warehouse.
- tasks.md 7.5 added: supplier_breakdown consistency QA case.

### ISSUE-2 (Deleted/non-CONFIRMED week handling): ACCEPTED + FIXED
- design.md Decision 7 added: chính sách cho cone trỏ về week non-CONFIRMED/deleted/orphan → gom vào `other_reserved` per warehouse (không silent drop).
- specs/cone-reserved-by-week/spec.md added scenario "Reserved cones with non-CONFIRMED or deleted/orphan week reference" + retention rule cho warehouse.
- tasks.md 1.5: thêm `.is('deleted_at', null)` cho week query, gom vào `other_reserved`.
- tasks.md 1.6: response shape thêm `other_reserved`, retention rule.
- tasks.md 1.8 verify: case (e) DRAFT week, (f) deleted week, (g) zero AVAILABLE.
- tasks.md 7.3.5 QA: simulate scenario, verify "Reserve khác" row.

### ISSUE-3 (Warehouse-move semantics): ACCEPTED + FIXED
- design.md Decision 8 added: explicit rule grouping theo `thread_inventory.warehouse_id` HIỆN TẠI tại fetch time (không track historical). Lý do: DB không có field lịch sử + user cần view "kho nào đang giữ cone".
- specs/cone-reserved-by-week/spec.md added scenario "Cone warehouse grouping at fetch time".
- tasks.md 1.3 ghi rõ "warehouse_id HIỆN TẠI tại fetch time".
- tasks.md 7.3.6 QA case verify behavior này.

### ISSUE-4 (Inline error state): ACCEPTED + FIXED
- design.md Decision 9 added: inline red banner tiếng Việt + retry button cho `ConeReservedByWeekTable`. Banner persist đến refetch thành công, snackbar chỉ là phụ.
- specs/cone-reserved-by-week/spec.md added scenario "Inline error state".
- specs/cone-reserved-by-week/spec.md added scenario "Other reserved indicator" cho UI display.
- tasks.md 5.7 added: inline error banner + retry button requirement.
- tasks.md 7.3.7 QA: simulate API fail, verify inline banner + retry hoạt động + bảng cũ độc lập.

### ISSUE-5 (Edge-case verification too thin / late): ACCEPTED + FIXED
- tasks.md 1.8: BE verify TRƯỚC FE integration, 7 case explicit (curl/Postman), không đợi UI.
- tasks.md 2.5: BE verify endpoint cũ trước FE integration, 4 case explicit including supplier filter consistency.
- tasks.md 7.3 rewritten thành QA Matrix 8 case explicit (no-filter, filter-có-data, filter-empty, only-AVAILABLE, only-non-CONFIRMED, moved-warehouse, fetch-fail, permission-403).
- tasks.md 7.5 added: supplier_breakdown raw-SQL comparison.
- Sequencing đảm bảo BE contract đúng trước khi FE integration.

## Issues Disputed
None — all 5 issues accepted as valid.

## Your Turn
Re-review using the same output format. Keep prior accepted points closed unless regression exists.
