# Thread Request Workflow - Tasks

> Change: thread-request-workflow
> Created: 2026-02-02
> Updated: 2026-02-02

## Task List

### Phase 1: Database Migration

- [x] **T1.1** Create migration `20240101000015_thread_request_workflow.sql`
  - Add APPROVED, READY_FOR_PICKUP, RECEIVED, REJECTED to allocation_status enum
  - Add columns: requesting_warehouse_id, source_warehouse_id, requested_by
  - Add columns: approved_by, approved_at, rejection_reason
  - Add columns: received_by, received_at
  - Create indexes for common queries

### Phase 2: Backend Types & Routes

- [x] **T2.1** Update `server/types/thread.ts`
  - Add new status values to AllocationStatus type
  - Add CreateRequestDTO interface
  - Add workflow action DTOs (ApproveDTO, RejectDTO, etc.)

- [x] **T2.2** Update `server/routes/allocations.ts` - Filter extensions
  - Add query params: requesting_warehouse_id, source_warehouse_id, workflow_status
  - Update GET / to support new filters
  - Update select to include warehouse relations

- [x] **T2.3** Add POST /api/allocations/:id/approve endpoint
  - Validate status === 'PENDING'
  - Update status to 'APPROVED'
  - Set approved_by, approved_at
  - Return updated allocation

- [x] **T2.4** Add POST /api/allocations/:id/reject endpoint
  - Validate status === 'PENDING'
  - Update status to 'REJECTED'
  - Set approved_by (rejector), rejection_reason
  - Return updated allocation

- [x] **T2.5** Add POST /api/allocations/:id/ready endpoint
  - Validate status === 'APPROVED'
  - Call allocate_thread RPC to reserve cones
  - Update status to 'READY_FOR_PICKUP'
  - Return updated allocation with cones

- [x] **T2.6** Add POST /api/allocations/:id/receive endpoint
  - Validate status === 'READY_FOR_PICKUP'
  - Issue cones (reuse existing issue logic)
  - Update status to 'RECEIVED'
  - Set received_by, received_at
  - Return updated allocation

- [x] **T2.7** Update POST /api/allocations to accept new fields
  - Accept requesting_warehouse_id, source_warehouse_id, requested_by
  - Validate warehouse exists and type='STORAGE'

### Phase 3: Frontend Types & Services

- [x] **T3.1** Update `src/types/thread/allocation.ts` and `enums.ts`
  - Mirror backend type changes
  - Add RequestFilters interface

- [x] **T3.2** Update `src/services/allocationService.ts`
  - getRequests(filters)
  - approve(id, approvedBy)
  - reject(id, rejectedBy, reason)
  - markReady(id)
  - confirmReceived(id, receivedBy)

### Phase 4: Frontend Composable

- [x] **T4.1** Create `src/composables/useThreadRequests.ts`
  - State: requests, loading, error, filters
  - Actions: fetch, create, approve, reject, markReady, confirmReceived
  - Computed: pendingCount, readyForPickupCount
  - Use snackbar for success/error notifications

### Phase 5: Frontend Pages

- [x] **T5.1** Create `src/pages/thread/requests.vue`
  - Tab layout: Tất cả | Chờ duyệt | Đã duyệt | Chờ nhận | Đã nhận
  - Data table with columns: Mã, Loại chỉ, Số mét, Xưởng yêu cầu, Ngày, Trạng thái
  - Inline actions based on status
  - Create dialog for new request

- [ ] **T5.2** Create request detail page (DEFERRED)
  - Request details display
  - Workflow timeline visualization
  - Action buttons based on current status

### Phase 6: Integration & Testing

- [x] **T6.1** Type check passes
- [x] **T6.2** Update existing allocation status badge and page
  - Added new status values to AllocationStatusBadge
  - Added new status values to allocations.vue

## Dependencies

```
T1.1 → T2.* (migration must run first)
T2.1 → T2.2-T2.7 (types needed for routes)
T2.* → T3.* (backend before frontend services)
T3.* → T4.* (services before composable)
T4.* → T5.* (composable before pages)
T5.* → T6.* (pages before testing)
```

## Verification

After each phase:
- `npm run type-check` - ✅ PASSED
- `npm run lint` - ⚠️ Pre-existing warnings (not related to this change)

## Files Changed

### New Files
- `supabase/migrations/20240101000015_thread_request_workflow.sql`
- `src/composables/useThreadRequests.ts`
- `src/pages/thread/requests.vue`

### Modified Files
- `server/types/thread.ts` - Added workflow types
- `server/routes/allocations.ts` - Added workflow endpoints
- `src/types/thread/enums.ts` - Added new status values
- `src/types/thread/allocation.ts` - Added workflow fields
- `src/services/allocationService.ts` - Added workflow methods
- `src/composables/index.ts` - Exported useThreadRequests
- `src/components/thread/AllocationStatusBadge.vue` - Added new statuses
- `src/pages/thread/allocations.vue` - Added new status colors/labels

## ⚠️ IMPORTANT: Run Migration

Before testing, run the migration:
```sql
-- In Supabase SQL Editor or psql
\i supabase/migrations/20240101000015_thread_request_workflow.sql
```
