## Why

Phòng Kế Hoạch hiện tại chỉ tính định mức chỉ cho **1 mã hàng tại 1 thời điểm** hoặc qua PO. Thực tế, họ đặt hàng chỉ theo **tuần hàng** - mỗi tuần gồm nhiều mã hàng, mỗi mã hàng có nhiều màu, cần tính gộp tổng lượng chỉ cần đặt. Hiện không có cách nào chọn nhiều mã hàng + nhiều màu cùng lúc, cũng không có lịch sử đặt hàng để tra cứu lại.

## What Changes

- **Thêm bảng `thread_order_weeks`**: Lưu tuần hàng đơn giản (tên tuần, ngày, ghi chú) để theo dõi lịch sử đặt hàng chỉ
- **Thêm bảng `thread_order_items`**: Lưu chi tiết từng dòng đặt hàng (style + màu + số lượng) gắn với tuần hàng
- **Trang đặt hàng chỉ theo tuần mới**: UI cho phép chọn nhiều mã hàng, chọn nhiều màu trong mỗi mã hàng, nhập số lượng riêng từng màu
- **Tính toán gộp multi-style**: Gọi API tính toán cho tất cả style/màu đã chọn, gom kết quả thành 2 view:
  - Chi tiết per style (bảng riêng từng mã hàng)
  - Tổng hợp theo Màu chỉ | NCC | Tex | Tổng mét | Tổng cuộn
- **Lưu kết quả tính toán**: Lưu lại gắn với tuần hàng để tra cứu lịch sử
- **Nút Export Excel**: Placeholder UI trước, chức năng export bổ sung sau
- **Tạo phân bổ từ kết quả**: Tận dụng flow tạo allocation hiện có

## Capabilities

### New Capabilities
- `weekly-thread-order`: Quản lý tuần hàng và đặt hàng chỉ theo tuần - bao gồm CRUD tuần hàng, chọn multi-style/multi-color, tính toán gộp, hiển thị kết quả chi tiết + tổng hợp, lưu lịch sử, và tạo phân bổ

### Modified Capabilities
<!-- Không thay đổi requirement của spec nào hiện có. Tận dụng API calculate() có sẵn với color_breakdown. -->

## Impact

- **Database**: 2 bảng mới (`thread_order_weeks`, `thread_order_items`) + có thể thêm bảng lưu kết quả tính toán
- **Backend API**: Endpoint mới cho CRUD tuần hàng, endpoint tính toán gộp multi-style (hoặc gọi endpoint hiện tại nhiều lần)
- **Frontend**: Trang mới trong `/thread/` module, composable mới, service mới
- **Tận dụng có sẵn**: `style_thread_specs`, `style_color_thread_specs`, `threadCalculationService.calculate()` với `color_breakdown`, flow tạo allocation
- **Không breaking change**: Trang tính toán hiện tại giữ nguyên
