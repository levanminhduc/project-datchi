## Why

Hệ thống quản lý kho hiện tại chỉ hỗ trợ danh sách kho phẳng (flat list), không phản ánh được cấu trúc thực tế của công ty: 2 địa điểm (Điện Bàn - kho sở hữu với 3 xưởng con, Phú Tường - kho thuê với 1 kho duy nhất). Điều này gây khó khăn cho việc báo cáo tồn kho theo địa điểm, phân quyền nhập/xuất theo xưởng, và không linh hoạt khi cần đóng/mở kho trong tương lai.

## What Changes

- **Database Schema**: Thêm 3 cột vào bảng `warehouses`:
  - `parent_id` - FK tự tham chiếu để tạo cấu trúc cây (LOCATION → STORAGE)
  - `type` - Phân biệt 'LOCATION' (địa điểm) và 'STORAGE' (kho lưu trữ thực tế)
  - `sort_order` - Thứ tự hiển thị trong cùng cấp
- **API Layer**: Cập nhật `GET /api/warehouses` trả về cấu trúc cây với children
- **Frontend**: Warehouse selector component hiển thị phân cấp (grouped dropdown hoặc tree)
- **Reports**: Hỗ trợ lọc/group theo location (địa điểm) hoặc storage (kho con)
- **Seed Data**: Tạo 6 warehouses mặc định theo cấu trúc thực tế

## Capabilities

### New Capabilities
- `warehouse-hierarchy`: Hệ thống phân cấp kho 2 cấp (LOCATION → STORAGE) với API tree structure và UI grouped selector

### Modified Capabilities
- None (existing specs không bị ảnh hưởng về requirements)

## Impact

- **Database**: Migration thêm 3 cột + update existing data
- **API**: `server/routes/warehouses.ts` - thêm tree structure response
- **Types**: `src/services/warehouseService.ts`, `server/types/thread.ts` - cập nhật Warehouse interface
- **Components**: `src/composables/useWarehouses.ts` - thêm helper methods cho hierarchy
- **UI**: Tất cả warehouse selectors cần cập nhật để hiển thị phân cấp
- **Backward Compatible**: Các inventory/allocation operations vẫn hoạt động với warehouse_id như cũ
