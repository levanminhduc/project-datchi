## Why

Hiện tại khi click "Thêm định mức", dòng mới luôn được thêm vào cuối bảng. Một số user muốn thêm dòng mới vào đầu bảng để dễ nhìn thấy ngay mà không cần scroll xuống. Cần cho phép user tùy chọn vị trí thêm dòng và nhớ lựa chọn này.

## What Changes

- Thêm switch toggle bên trái nút "Thêm định mức" để chọn vị trí thêm dòng (đầu/cuối)
- Mặc định: thêm dòng cuối bảng
- Lưu lựa chọn vào localStorage để nhớ preference của user
- Áp dụng cho trang chi tiết mã hàng (`/thread/styles/[id]`)

## Capabilities

### New Capabilities
- `add-row-position-toggle`: Switch cho phép user chọn thêm dòng định mức ở đầu hoặc cuối bảng, với preference được lưu trong localStorage

### Modified Capabilities
<!-- Không có spec nào bị thay đổi requirement -->

## Impact

- **Frontend**: `src/pages/thread/styles/[id].vue` - thêm switch UI và logic xử lý vị trí
- **Storage**: localStorage key mới để lưu preference
- **UX**: User có thể tùy chọn workflow phù hợp với thói quen
