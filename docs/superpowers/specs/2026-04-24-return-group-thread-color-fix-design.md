# Fix: Trang Trả Kho tab "Theo Nhóm" gom sai loại chỉ theo màu

**Ngày:** 2026-04-24
**Trang ảnh hưởng:** `/thread/return` (tab "Theo nhóm")
**Endpoint ảnh hưởng:** `GET /api/issues-v2/return-groups`, `POST /api/issues-v2/return-grouped`

## Vấn đề

Tab "Theo nhóm" gom các line cùng `thread_type_id` nhưng khác `thread_color_id` (ví dụ C9700 và C9701) thành 1 dòng duy nhất, hiển thị 1 màu (sai). Trang Xuất Kho `/thread/issues/v2` đã hiển thị đúng — mỗi `(thread_type_id, thread_color_id)` là 1 dòng riêng với tên loại chỉ + màu chính xác.

## Root cause

File `server/routes/issues-v2-return-grouped.ts` route `GET /return-groups`:

1. SELECT line không lấy cột `thread_color_id` (đã có trong schema từ migration `20260414_add_thread_color_id_to_issue_lines.sql`).
2. Lấy màu sai nguồn: query `thread_inventory` rồi build `ttColorMap: thread_type_id → color_name` 1-1 (`if (!ttColorMap.has(thread_type_id))` chỉ giữ entry đầu tiên) → cùng `thread_type_id` chỉ có 1 màu.
3. Gom `group.thread_types` chỉ theo `thread_type_id` → 2 line khác `thread_color_id` bị merge, outstanding cộng dồn.

Route `POST /return-grouped` cũng dùng `thread_type_id` làm key duy nhất khi map request line → candidate lines, nên nếu chỉ fix display sẽ apply nhầm số trả sang line khác màu.

## Reference (đúng pattern)

`server/routes/issuesV2.ts` L2107-L2189: lấy thread_color_id từ BOM (`style_color_thread_specs.thread_color_id`), join `colors!thread_color_id(name)`, key composite `(thread_type_id, thread_color_id)`, displayName = `[supplier, tex_label, color_name]`.

## Thay đổi

### Backend

**`server/routes/issues-v2-return-grouped.ts` — `GET /return-groups`:**

- Thêm `thread_color_id` vào SELECT của `thread_issue_lines`.
- Bỏ subquery `thread_inventory` và biến `ttColorMap`.
- Batch fetch `colors(id, name)` theo set `thread_color_id` distinct của các line (thay nguồn lookup màu).
- Đổi key gom thread trong group:
  - Trước: `find((t) => t.thread_type_id === l.thread_type_id)`
  - Sau: `find((t) => t.thread_type_id === l.thread_type_id && t.thread_color_id === l.thread_color_id)`
- `displayName` build từ `[supplier_name, tex_label || 'TEX ${tex_number}', colors[thread_color_id].name]`, fallback `tt.name`.
- Response `threads[]` thêm field `thread_color_id: number | null`.

**`server/validation/issuesV2.ts` — `ReturnGroupedLineSchema`:**

- Thêm `thread_color_id: z.number().int().positive().nullable().optional()`.
- Refine uniqueness đổi thành key composite `${thread_type_id}_${thread_color_id ?? 'null'}`.

**`server/routes/issues-v2-return-grouped.ts` — `POST /return-grouped`:**

- Khi loop `requestLines`, filter `candidateLines` thêm điều kiện match `thread_color_id` (so sánh nullable: `(l.thread_color_id ?? null) === (requestLine.thread_color_id ?? null)`).
- `distribution[]` thêm `thread_color_id`.

### Frontend

**`src/types/thread/issueV2.ts`:**

- `ReturnGroupThread`: thêm `thread_color_id: number | null`.
- `ReturnGroupedDTO.lines[]`: thêm `thread_color_id: number | null`.
- `ReturnGroupedResponse.distribution[]`: thêm `thread_color_id?: number | null`.

**`src/components/thread/ReturnGroupDetail.vue`:**

- `interface ReturnInput` thêm `thread_color_id: number | null`.
- `resetInputs()` map kèm `thread_color_id: t.thread_color_id`.
- Mọi lookup `inputs.find(i => i.thread_type_id === ...)` đổi thành match cả `thread_color_id`.
- `getThread`, `getMaxFullReturn`, `getMaxPartialReturn`, `isFullyReturned` đổi signature nhận thêm `threadColorId` (hoặc nhận luôn row).
- Template helper key đổi sang composite `${thread_type_id}_${thread_color_id ?? 'null'}` cho `row-key` của `q-table` và `:key` các binding.
- `emit('submit', ...)` payload thêm `thread_color_id`.

**`src/composables/thread/useReturnV2.ts`:**

- `submitGroupedReturn` typing và payload `lines` thêm `thread_color_id`.
- `validateReturnQuantities` đổi find thread sang match `(thread_type_id, thread_color_id)`.
- Error message giữ nguyên (dùng `thread.thread_name` đã build đúng).

### Không đụng

- `GET /return-groups/logs` — chỉ hiển thị log lịch sử, đã có `thread_code`/`thread_name` từ join trực tiếp tới `thread_types`.
- `ReturnGroupCard.vue` — chỉ hiển thị summary group (PO/Style/Color), không list từng loại chỉ.
- `submit grouped` flow allocation cones (FEFO theo line) không đổi vì candidate đã filter đúng line.

## Edge case

- Line cũ trước migration `20260414` có `thread_color_id = NULL` → group theo key null → 1 dòng riêng, name fallback về `tt.name`.
- Idempotency: payload shape thay đổi nhưng mỗi submit dùng `crypto.randomUUID()` mới → không clash với idempotency_key cũ.
- Validate uniqueness: 2 line `(thread_type_id=X, thread_color_id=null)` và `(X, 5)` không bị refine reject (key khác nhau).

## Acceptance criteria

1. Vào `/thread/return` tab "Theo nhóm", chọn 1 nhóm có 2 line cùng `thread_type_id` khác `thread_color_id`:
   - Hiển thị 2 dòng riêng biệt.
   - Mỗi dòng có tên màu đúng (vd: `Coats Astra - TEX Tex 240 (20/9) - C9700` vs `... - C9701`).
   - Outstanding mỗi dòng tính riêng.
2. Nhập số trả vào dòng C9700 và submit:
   - Chỉ line có `thread_color_id` C9700 bị trừ outstanding.
   - Line C9701 không bị ảnh hưởng.
3. Trang Xuất Kho `/thread/issues/v2` hiển thị giống trước (không regression).
4. Validate: nhập số trả vượt outstanding của 1 dòng → snackbar lỗi đúng tên loại chỉ + màu của dòng đó.
