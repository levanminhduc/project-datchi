# Sự cố drift-heal tước tuần của cuộn (tuần 80)

Ghi lại để sau này không phải điều tra lại. **Đã quyết định để nguyên hiện trạng, không hoàn nguyên.**

## Chuyện gì xảy ra

`fn_receive_delivery` có một khối "drift-heal": mỗi lần nhận hàng, nó so lượng cuộn đang giữ cho tuần với nhu cầu tính toán, thấy dư thì gỡ `reserved_week_id` để trả về kho tự do.

Nhu cầu nó đọc là của **cả tuần**, còn lượng giữ nó đếm chỉ trong **kho đang nhận**. Hai vế khác phạm vi nên khối này hiểu nhầm là dư.

Ngày **2026-07-11 09:15:13**, khi nhận đợt hai của đơn giao 854 (183 cuộn, `delivery_receive_logs` id 826), khối này tước tuần của **964 cuộn** thuộc tuần 80 — loại chỉ 18, màu C9700, kho 4 (Xưởng Trước).

Ngày **2026-07-30**, migration `20260730090000_remove_drift_heal_receive_delivery.sql` gỡ bỏ khối này. Sự cố không tái diễn.

## 964 cuộn giờ ở đâu

| Số cuộn | Tình trạng |
|---|---|
| 602 | Vẫn nằm kho, trạng thái khả dụng, `reserved_week_id` rỗng |
| 362 | Đã xuất cho sản xuất ngày 07-17 → 07-22, lấy từ trạng thái khả dụng |

Toàn bộ 3.135 cuộn của đơn giao 854 vẫn còn trong hệ thống. Không cuộn nào chảy sang tuần khác, không cuộn nào biến mất — chỉ mất dấu thuộc về tuần 80.

## Vì sao tab Truy xuất báo thiếu

Tab chỉ tính công cho tuần với cuộn xuất từ trạng thái `RESERVED_FOR_ORDER` (`process-trace.ts`, `AVAILABLE_ISSUE_SOURCE_STATUSES`). 362 cuộn kia xuất từ trạng thái khả dụng nên rơi vào nhóm không tính công.

Vì vậy con số thiếu trên tab **lớn hơn 602**. Đây là hệ quả của sự cố, không phải lỗi thứ hai.

## Đã quyết định

**Để nguyên, không hoàn nguyên.**

- `restore_week_on_drift_stripped_cones.sql` giữ trong repo nhưng **chưa chạy và không định chạy**. Nếu sau này đổi ý, script còn nguyên assertion bắt buộc đúng 616/602/14 nên không apply nhầm phạm vi được.
- 362 cuộn đã xuất **không thể hoàn nguyên** bằng `reserved_week_id` — cuộn đã sang sản xuất. Muốn lấy lại công cho tuần thì phải sửa cách tính của tab Truy xuất (cho tính công với cuộn xuất từ trạng thái khả dụng nhưng mang lô `WO-<tuần>`). Đã cân nhắc và không làm.

## Còn một vector chưa rõ

14 cuộn tuần 14 (loại chỉ 76, màu 117, kho 3) bị tước lúc **2026-07-20 14:10:13**, sau khi drift-heal đã bị nghi ngờ. Không trùng receive log nào, không có `thread_movements`. **Chưa xác định nguyên nhân.** Nếu hiện tượng tước tuần lặp lại sau ngày 2026-07-30, đây là đầu mối đầu tiên nên lần theo.
