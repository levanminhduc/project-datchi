## Why

Hiện tại khi thêm dòng định mức mới vào bảng `style_thread_specs`, dòng mới luôn được fetch về và hiển thị theo thứ tự `created_at DESC` (mới nhất lên đầu). Toggle "Thêm đầu bảng" chỉ hoạt động tạm thời trong session - sau khi refetch hoặc reload page, thứ tự bị reset về mặc định của API.

User cần:
- Thứ tự hiển thị ổn định, không thay đổi sau refresh
- Chỉ thay đổi khi user chủ động sort theo cột khác

## What Changes

- **BREAKING**: Thêm column `display_order INTEGER` vào table `style_thread_specs`
- Backend API thay đổi:
  - GET: Order by `display_order ASC` thay vì `created_at DESC`
  - POST: Assign `display_order` = 0 (đầu) hoặc MAX+1 (cuối) tùy preference
  - PUT: Hỗ trợ update `display_order` khi drag-drop reorder (future)
- Frontend:
  - Remove client-side position manipulation trong `addEmptyRow()`
  - Gửi `add_to_top` flag khi POST để backend quyết định position

## Capabilities

### New Capabilities
- `display-order`: Quản lý thứ tự hiển thị persistent cho style_thread_specs - bao gồm migration, API changes, và frontend integration

### Modified Capabilities
(none - không có existing specs bị ảnh hưởng)

## Impact

- **Database**: New column + migration required
- **Backend API**: `server/routes/styleThreadSpecs.ts` - thay đổi GET/POST
- **Frontend**: `src/pages/thread/styles/[id].vue` - simplify addEmptyRow()
- **Types**: Update `StyleThreadSpec` interface thêm `display_order`
