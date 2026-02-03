## Why

Date inputs trong các trang batch-tracking đang dùng native HTML `<input type="date">` thay vì Quasar DatePicker với popup. Điều này gây ra:
- Giao diện không đồng nhất (native browser calendar vs Quasar styled)
- Locale không đúng (ngày trong tuần hiển thị tiếng Anh thay vì tiếng Việt)
- Style khác biệt so với các trang khác trong app đã dùng đúng pattern

## What Changes

- Thay thế `<AppInput type="date">` bằng pattern chuẩn: `<AppInput>` + `<q-popup-proxy>` + `<DatePicker>`
- Đảm bảo tất cả date inputs trong batch-tracking pages sử dụng Quasar DatePicker với Vietnamese locale

## Capabilities

### New Capabilities
- None (đây là bugfix, không thêm capability mới)

### Modified Capabilities
- None (không thay đổi requirements, chỉ sửa implementation để đúng pattern)

## Impact

- `src/pages/thread/batch/history.vue`: 2 date inputs (from_date, to_date)
- Có thể có thêm file khác dùng `type="date"` cần audit
