## Why

Hiện tại hệ thống theo dõi từng cuộn chỉ (cone) riêng lẻ qua cone_id, nhưng thiếu khả năng quản lý theo lô sản xuất (batch/lot) và thực hiện các thao tác hàng loạt. Điều này gây khó khăn cho việc truy xuất nguồn gốc (traceability), kiểm soát chất lượng theo lô, và tăng thời gian nhập/xuất/chuyển kho khi số lượng lớn.

## What Changes

- **Batch/Lot Lifecycle Tracking**: Theo dõi vòng đời lô hàng từ khi tạo đến khi tiêu thụ hết - bao gồm lot_number, ngày sản xuất, ngày hết hạn (nếu có), trạng thái lô
- **Batch Receiving**: Nhập kho hàng loạt - quét hoặc nhập danh sách cone_id cùng lúc, gán chung lot, lưu một lần
- **Batch Transfer**: Chuyển kho hàng loạt - chọn nhiều cone hoặc cả lô, chuyển đến warehouse đích trong một thao tác
- **Batch Issuing/Dispatch**: Xuất kho hàng loạt - xuất nhiều cone hoặc theo lô cho sản xuất hoặc khách hàng

## Capabilities

### New Capabilities
- `lot-lifecycle`: Quản lý vòng đời lô hàng - tạo lô, theo dõi trạng thái, cập nhật thông tin lô, truy xuất nguồn gốc
- `batch-receiving`: Thao tác nhập kho hàng loạt - quét/nhập nhiều cone, gán lô, xác nhận nhập kho một lần
- `batch-transfer`: Thao tác chuyển kho hàng loạt - chọn cone theo danh sách hoặc theo lô, chuyển warehouse
- `batch-issuing`: Thao tác xuất kho hàng loạt - xuất theo danh sách cone hoặc theo lô, ghi nhận đối tác/mục đích

### Modified Capabilities
_(Không có thay đổi requirement cho specs hiện tại)_

## Impact

- **Database**: Thêm bảng `lots` để theo dõi thông tin lô, thêm cột `lot_id` vào `cones` để liên kết
- **API**: Thêm endpoints cho CRUD lot, batch receive, batch transfer, batch issue
- **Frontend**: Thêm các trang/modal cho quản lý lô và thao tác hàng loạt
- **QR Scanner**: Tích hợp với batch receiving - quét liên tục, thêm vào buffer, xác nhận nhập lô
- **Reports**: Báo cáo tồn kho theo lô, truy xuất nguồn gốc theo lot_number
