## Why

Khi user click "Thêm định mức" trên trang chi tiết mã hàng (`/thread/styles/:id`), hiển thị lỗi "Lỗi hệ thống. Vui lòng thử lại sau". Bug này block hoàn toàn việc thêm định mức mới theo flow inline edit vừa implement.

**Root cause**: Frontend `addEmptyRow()` gửi `process_name: ''` (rỗng), nhưng backend API validate `process_name` là required field → reject với lỗi 400.

## What Changes

- **Backend**: Cho phép `process_name` rỗng hoặc null khi tạo định mức mới (user sẽ điền sau qua inline edit)
- **Frontend**: Fallback với default `process_name` nếu backend vẫn yêu cầu (không cần nếu backend đã sửa)

## Capabilities

### New Capabilities
<!-- Không có capability mới - đây là bugfix -->

### Modified Capabilities
<!-- Không thay đổi spec - chỉ fix validation logic -->

## Impact

- **Backend**: `server/routes/styleThreadSpecs.ts` - Sửa validation logic cho POST endpoint
- **Database**: Không thay đổi schema (process_name trong DB đã nullable)
- **Frontend**: Có thể không cần sửa nếu backend accept empty string
