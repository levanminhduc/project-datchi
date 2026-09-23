# Mở khóa chỉnh sửa tuần hàng cho ROOT + nhật ký thao tác

## Bối cảnh

Khi một tuần đặt hàng chuyển sang `CONFIRMED`/`COMPLETED`, hệ thống khóa phần lớn thao tác sửa: đổi kho và sửa/xóa tuần chỉ cho `DRAFT` (`server/routes/weekly-order/core.ts:714`, `:1071`, `:1189`), xóa PO bị chặn ở `COMPLETED`/`CANCELLED` (`core.ts:944`). Thực tế vẫn có lúc phát hiện sai sót sau khi chốt và phải sửa. Ngoài ra bảng nhu cầu chỉ (`thread_order_results.summary_data`) trên trang chi tiết tuần đang `readonly`, chỉ sửa được bằng "Tính toán lại" ghi đè cả cụm — không thêm/xóa được từng dòng.

Mục tiêu: root mở khóa chỉnh sửa **cho riêng một tuần**, có thời hạn tự hết, và **mọi thao tác trong lúc mở đều được ghi nhật ký**. Không viết lại nghiệp vụ — tái dùng đúng các route/flow hiện có để giữ nguyên hệ quả (tính lại khi xóa PO, `fn_receive_delivery` sinh cuộn, reserve/transfer).

Quyết định đã chốt:

- Phạm vi: nhu cầu chỉ, giao hàng, cuộn đặt trước/mượn, danh sách PO của tuần.
- Cách tắt: tự hết hạn theo thời gian, tắt tay sớm được.
- Khi mở: chỉ root được vượt chốt chặn; người khác vẫn bị chặn theo status như cũ.
- Nhật ký: xem ngay trong trang Cài đặt, lọc theo tuần đang chọn.

## Database

`supabase/migrations/{timestamp}_create_weekly_order_edit_unlocks.sql` — additive:

```sql
CREATE TABLE weekly_order_edit_unlocks (
    id SERIAL PRIMARY KEY,
    week_id INTEGER NOT NULL REFERENCES thread_order_weeks(id) ON DELETE CASCADE,
    granted_by VARCHAR(100) NOT NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by VARCHAR(100),
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE thread_audit_log ADD COLUMN IF NOT EXISTS week_id INTEGER;
```

Unlock đang hiệu lực = `revoked_at IS NULL AND expires_at > NOW()`. Bản ghi cũ giữ nguyên làm lịch sử (không xóa dòng).

Không tạo bảng audit mới — tái dùng `thread_audit_log`. Cột `week_id` nullable chỉ để lọc nhật ký theo tuần; mọi dòng cũ = NULL.

## Backend

`server/utils/weekly-order-unlock.ts`:

- `getActiveUnlock(weekId)` — unlock còn hiệu lực hoặc `null`.
- `isRootUnlocked(c, weekId)` — `auth.isRoot && getActiveUnlock(weekId) !== null`.
- `logWeekAudit({ weekId, tableName, recordId, action, oldValues, newValues, performedBy })` — theo pattern insert của `server/routes/styleThreadSpecs.ts:66-82`, bọc try/catch để audit hỏng không làm hỏng nghiệp vụ.

Nới chốt chặn (giữ nguyên thông báo lỗi cũ cho người không phải root):

| Vị trí | Guard hiện tại |
|---|---|
| `core.ts:714` | `week.status !== 'DRAFT'` (đổi kho) |
| `core.ts:944` | `status === 'COMPLETED' \|\| 'CANCELLED'` (xóa PO) |
| `core.ts:1071` | `existing.status !== 'DRAFT'` (sửa tuần) |
| `core.ts:1189` | `existing.status !== 'DRAFT'` (xóa tuần) |
| `loans-reservations.ts:265`, `:312`, `:1022` | `week.status !== 'CONFIRMED'` (đánh dấu hoàn tất, bỏ đánh dấu, lấy từ tồn kho) |

`deliveries.ts` không có chốt chặn theo trạng thái tuần — sửa giao hàng vốn đã cho phép, nên ở đó chỉ bổ sung ghi nhật ký khi tuần đang mở khóa.

Xóa tuần vẫn giữ nguyên chốt chặn thứ hai "đã có kết quả tính toán → 409", nên tuần đã chốt trên thực tế vẫn không xóa được dù đang mở khóa.

Mỗi write thành công trong lúc unlock đang bật → `logWeekAudit` với `performed_by = c.get('auth').employeeCode`.

`server/routes/weeklyOrderUnlock.ts`, mount `/api/weekly-order-unlocks`, toàn router gác bằng `requireRoot`. Route cụ thể đăng ký trước `/:id`:

- `GET /audit?week_id=&page=&limit=` — `thread_audit_log WHERE week_id = $1`, phân trang server-side (mặc định 25, cap 100).
- `GET /?week_id=` — unlock đang hiệu lực + lịch sử.
- `POST /` — `{ week_id, duration_minutes, reason }`, `duration_minutes ∈ [15, 480]`; thu hồi unlock đang mở của tuần rồi tạo bản mới.
- `POST /:id/revoke` — set `revoked_at`/`revoked_by`.

## Frontend

- `src/services/weeklyOrderUnlockService.ts` — `fetchApi` theo chuẩn `src/services/`.
- `src/components/settings/WeeklyOrderUnlockCard.vue` — `src/pages/settings.vue` đã 963 dòng nên chỉ thêm `<WeeklyOrderUnlockCard v-if="isRoot && hasLoaded" />` cạnh các card ROOT hiện có. Card gồm: chọn tuần, chọn thời hạn (30/60/120 phút), lý do bắt buộc, nút mở khóa / khóa lại kèm đếm ngược, và `DataTable` nhật ký của tuần đang chọn.
- `src/pages/thread/weekly-order/[id].vue` — khi tuần đang unlock và `isRoot`: banner cảnh báo, bỏ `readonly` trên `ResultsSummaryTable` (`[id].vue:583`), thêm nút thêm/xóa dòng nhu cầu chỉ. Lưu qua route sẵn có `POST /api/weekly-orders/:id/results` (đã tự lo `enrichWithInventory` + `syncDeliveries` + `createAllocations`).
- `src/components/thread/weekly-order/ResultsSummaryTable.vue` — thêm emit `add-row` / `remove-row`, chỉ render khi `!readonly`.

## Giai đoạn

1. **GĐ1** — migration + util + router unlock + card Cài đặt + nới guard `core.ts`.
2. **GĐ2** — sửa/thêm/xóa từng dòng nhu cầu chỉ trên `[id].vue` + `ResultsSummaryTable.vue`.
3. **GĐ3** — nới guard giao hàng / đặt trước / mượn + audit cho các nhánh đó.

## Kiểm thử

`npm run lint`, `npm run type-check`, `npx tsx server/utils/weekly-order-unlock.test.ts`.

Thủ công với tài khoản root: tuần `CONFIRMED` chưa mở khóa → 400; mở khóa → sửa được; tài khoản không phải root trong lúc mở → vẫn 400; đẩy `expires_at` về quá khứ → chặn lại; card Cài đặt hiện đủ dòng nhật ký với giá trị cũ → mới.
