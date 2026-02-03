# Thread Request Workflow - Proposal

> Change: thread-request-workflow
> Created: 2026-02-02
> Status: PROPOSAL

## Problem Statement

Hiện tại hệ thống allocation chỉ hỗ trợ việc phân bổ chỉ theo `order_id` (đơn hàng sản xuất). Thiếu quy trình:

1. **Xưởng yêu cầu chỉ** - Không có cách để xưởng sản xuất tạo yêu cầu chỉ
2. **Kho duyệt yêu cầu** - Không có workflow duyệt/từ chối
3. **Xác nhận nhận hàng** - Không theo dõi được xưởng đã nhận chỉ hay chưa

## Proposed Solution

Mở rộng `thread_allocations` table để hỗ trợ workflow yêu cầu chỉ hoàn chỉnh:

### Workflow States

```
PENDING → APPROVED → READY_FOR_PICKUP → RECEIVED
    ↓        ↓
 REJECTED  CANCELLED
```

### New Fields

| Field | Type | Description |
|-------|------|-------------|
| `requesting_warehouse_id` | FK → warehouses | Kho/xưởng yêu cầu (STORAGE type) |
| `source_warehouse_id` | FK → warehouses | Kho nguồn xuất chỉ (STORAGE type) |
| `requested_by` | string | Người tạo yêu cầu |
| `approved_by` | string | Người duyệt |
| `approved_at` | timestamp | Thời điểm duyệt |
| `rejection_reason` | text | Lý do từ chối |
| `received_by` | string | Người nhận |
| `received_at` | timestamp | Thời điểm xác nhận nhận |

### New Status Values

Thêm vào `AllocationStatus` enum:
- `APPROVED` - Đã duyệt, chờ chuẩn bị
- `READY_FOR_PICKUP` - Đã chuẩn bị xong, chờ nhận
- `RECEIVED` - Đã nhận
- `REJECTED` - Từ chối

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/allocations/:id/approve` | Duyệt yêu cầu |
| POST | `/api/allocations/:id/reject` | Từ chối yêu cầu |
| POST | `/api/allocations/:id/ready` | Đánh dấu sẵn sàng nhận |
| POST | `/api/allocations/:id/receive` | Xác nhận đã nhận |

### UI Changes

1. **Trang Yêu Cầu Chỉ** (`/thread-requests`)
   - Danh sách yêu cầu theo trạng thái
   - Form tạo yêu cầu mới
   - Filter theo xưởng, loại chỉ, trạng thái

2. **Trang Duyệt Yêu Cầu** (`/thread-requests/pending`)
   - Danh sách chờ duyệt cho thủ kho
   - Actions: Duyệt/Từ chối
   
3. **Trang Nhận Chỉ** (`/thread-requests/pickup`)
   - Danh sách chờ nhận cho xưởng
   - Xác nhận đã nhận

## Impact Analysis

### Database Changes
- ALTER TABLE `thread_allocations` ADD 6 columns
- No breaking changes (new columns nullable)

### Backend Changes
- Thêm 4 endpoints mới
- Mở rộng existing GET/POST handlers

### Frontend Changes
- 3 pages mới
- Mở rộng allocation composable

## Dependencies

- **warehouse-hierarchy** (COMPLETED) - Cần phân biệt STORAGE warehouses

## Risks

1. **Migration Complexity**: Low - chỉ thêm columns, không đổi existing data
2. **Performance**: Low - thêm foreign keys có thể cần index

## Success Criteria

1. Xưởng có thể tạo yêu cầu chỉ với loại chỉ và số lượng
2. Thủ kho nhận notification và duyệt/từ chối
3. Xưởng xác nhận đã nhận chỉ
4. Báo cáo lịch sử yêu cầu theo xưởng/thời gian
