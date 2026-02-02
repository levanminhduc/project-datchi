# Thread Request Workflow - Design

> Change: thread-request-workflow
> Created: 2026-02-02
> Status: DESIGN

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐   │
│  │ ThreadRequests   │  │ PendingApprovals │  │ PickupQueue      │   │
│  │ Page (Xưởng)     │  │ Page (Kho)       │  │ Page (Xưởng)     │   │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘   │
│           │                     │                     │              │
│           └─────────────────────┼─────────────────────┘              │
│                                 │                                    │
│                    ┌────────────▼────────────┐                       │
│                    │ useThreadRequests()     │                       │
│                    │ composable              │                       │
│                    └────────────┬────────────┘                       │
│                                 │                                    │
│                    ┌────────────▼────────────┐                       │
│                    │ threadRequestService.ts │                       │
│                    └────────────┬────────────┘                       │
└─────────────────────────────────┼────────────────────────────────────┘
                                  │ HTTP
┌─────────────────────────────────▼────────────────────────────────────┐
│                         BACKEND                                       │
│                    ┌────────────────────────┐                         │
│                    │ allocations.ts routes  │                         │
│                    │ + new endpoints        │                         │
│                    └────────────┬───────────┘                         │
│                                 │                                     │
└─────────────────────────────────┼─────────────────────────────────────┘
                                  │
┌─────────────────────────────────▼─────────────────────────────────────┐
│                         SUPABASE                                       │
│  ┌────────────────────────────────────────────────────────────────┐   │
│  │ thread_allocations                                              │   │
│  │ + requesting_warehouse_id (FK → warehouses)                     │   │
│  │ + source_warehouse_id (FK → warehouses)                         │   │
│  │ + requested_by, approved_by, received_by                        │   │
│  │ + approved_at, received_at                                      │   │
│  │ + rejection_reason                                              │   │
│  └────────────────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────────────┘
```

## Database Schema Changes

### Migration: `20240101000015_thread_request_workflow.sql`

```sql
-- Add new status values to allocation_status enum
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'APPROVED';
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'RECEIVED';
ALTER TYPE allocation_status ADD VALUE IF NOT EXISTS 'REJECTED';

-- Add workflow columns to thread_allocations
ALTER TABLE thread_allocations
ADD COLUMN IF NOT EXISTS requesting_warehouse_id INTEGER REFERENCES warehouses(id),
ADD COLUMN IF NOT EXISTS source_warehouse_id INTEGER REFERENCES warehouses(id),
ADD COLUMN IF NOT EXISTS requested_by TEXT,
ADD COLUMN IF NOT EXISTS approved_by TEXT,
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS received_by TEXT,
ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_allocations_requesting_warehouse 
ON thread_allocations(requesting_warehouse_id) WHERE requesting_warehouse_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_allocations_status_pending
ON thread_allocations(status) WHERE status IN ('PENDING', 'APPROVED', 'READY_FOR_PICKUP');
```

## API Design

### Existing Endpoints Modified

#### POST /api/allocations
New optional fields in `CreateAllocationDTO`:
```typescript
interface CreateAllocationDTO {
  // existing fields...
  requesting_warehouse_id?: number  // NEW
  source_warehouse_id?: number      // NEW
  requested_by?: string             // NEW
}
```

### New Endpoints

#### POST /api/allocations/:id/approve
```typescript
// Request
{ approved_by: string }

// Response
{ data: AllocationWithRelations, message: "Đã duyệt yêu cầu" }

// Workflow:
// 1. Validate status === 'PENDING'
// 2. Update status → 'APPROVED'
// 3. Set approved_by, approved_at
```

#### POST /api/allocations/:id/reject
```typescript
// Request
{ rejected_by: string, reason: string }

// Response
{ data: AllocationWithRelations, message: "Đã từ chối yêu cầu" }

// Workflow:
// 1. Validate status === 'PENDING'
// 2. Update status → 'REJECTED'
// 3. Set approved_by (reuse for rejected_by), rejection_reason
```

#### POST /api/allocations/:id/ready
```typescript
// Request
{ prepared_by: string }

// Response
{ data: AllocationWithRelations, message: "Sẵn sàng nhận hàng" }

// Workflow:
// 1. Validate status === 'APPROVED'
// 2. Execute soft allocation (call allocate_thread RPC)
// 3. Update status → 'READY_FOR_PICKUP'
```

#### POST /api/allocations/:id/receive
```typescript
// Request
{ received_by: string }

// Response
{ data: AllocationWithRelations, message: "Đã xác nhận nhận hàng" }

// Workflow:
// 1. Validate status === 'READY_FOR_PICKUP'
// 2. Issue cones (call existing issue logic)
// 3. Update status → 'RECEIVED'
// 4. Set received_by, received_at
```

### Query Filters

GET /api/allocations supports new filters:
- `requesting_warehouse_id`: Filter by requesting workshop
- `source_warehouse_id`: Filter by source warehouse
- `workflow_status`: Group filter for workflow stages
  - `pending_approval`: status = PENDING
  - `pending_preparation`: status = APPROVED  
  - `pending_pickup`: status = READY_FOR_PICKUP

## Frontend Components

### New Pages

1. **`src/pages/thread-requests/index.vue`**
   - Tab-based: Tất cả | Chờ duyệt | Đã duyệt | Chờ nhận | Đã nhận
   - Table with columns: Mã YC, Loại chỉ, Số mét, Xưởng, Ngày, Trạng thái
   - Actions: Tạo mới, Xem chi tiết

2. **`src/pages/thread-requests/[id].vue`**
   - Chi tiết yêu cầu
   - Timeline workflow
   - Action buttons theo status

### New Composable

```typescript
// src/composables/useThreadRequests.ts
export function useThreadRequests() {
  const requests = ref<AllocationWithRelations[]>([])
  const loading = ref(false)
  
  // Fetch với filter mặc định chỉ lấy requests có requesting_warehouse_id
  async function fetchRequests(filters?: RequestFilters)
  
  // Workflow actions
  async function createRequest(data: CreateRequestDTO)
  async function approve(id: number, approvedBy: string)
  async function reject(id: number, reason: string, rejectedBy: string)
  async function markReady(id: number, preparedBy: string)
  async function confirmReceived(id: number, receivedBy: string)
  
  return { requests, loading, /* ... */ }
}
```

## State Transitions

```
┌─────────┐   create    ┌─────────┐
│  START  │────────────▶│ PENDING │
└─────────┘             └────┬────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              │
        ┌──────────┐   ┌──────────┐         │
        │ APPROVED │   │ REJECTED │         │
        └────┬─────┘   └──────────┘         │
             │                              │
             ▼                              ▼
    ┌────────────────┐               ┌───────────┐
    │ READY_FOR_     │               │ CANCELLED │
    │ PICKUP         │               └───────────┘
    └────────┬───────┘
             │
             ▼
      ┌──────────┐
      │ RECEIVED │
      └──────────┘
```

### Transition Rules

| From | To | Action | Required Fields |
|------|-----|--------|-----------------|
| - | PENDING | create | requesting_warehouse_id, thread_type_id, requested_meters |
| PENDING | APPROVED | approve | approved_by |
| PENDING | REJECTED | reject | approved_by (as rejector), rejection_reason |
| PENDING | CANCELLED | cancel | - |
| APPROVED | READY_FOR_PICKUP | ready | - |
| APPROVED | CANCELLED | cancel | - |
| READY_FOR_PICKUP | RECEIVED | receive | received_by |

## Error Handling

| Code | Condition | Vietnamese Message |
|------|-----------|-------------------|
| 400 | Invalid status transition | Không thể chuyển trạng thái từ X sang Y |
| 400 | Missing required field | Vui lòng điền [field name] |
| 404 | Request not found | Không tìm thấy yêu cầu |
| 409 | Already processed | Yêu cầu đã được xử lý |

## Security Considerations

1. **Warehouse Access Control** (Future): Users should only see requests for their warehouse
2. **Audit Trail**: All transitions logged with who/when
3. **RLS Policies** (Future): Row-level security based on warehouse assignment
