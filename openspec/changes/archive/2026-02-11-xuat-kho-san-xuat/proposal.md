## Why

The current thread allocation system tracks thread issuance at a basic level but lacks critical production tracking information. When threads are issued to production, there's no way to:
- Track which department receives the threads
- Link issuance directly to PO/Style/Color for production accountability
- Monitor consumption against quota with over-limit controls
- Handle partial cone returns with estimated remaining percentage

This creates gaps in material tracking, making it difficult to reconcile thread consumption per production order and identify waste or over-usage patterns.

## What Changes

- **New Issue Request System**: Create `thread_issue_requests` table to track issuance batches linked to PO → Style → Color, with quota monitoring and department tracking
- **Issue Items Tracking**: Create `thread_issue_items` table to track individual cones issued per request batch, with over-limit notes
- **Partial Cone Returns**: Create `thread_issue_returns` table for returning unused/partial cones with worker-estimated percentage remaining (10-100% increments)
- **Quota Enforcement**: Warn when issuance exceeds BOM-calculated quota, require notes for over-limit issues
- **Department Integration**: Use existing `employees.department` column for receiving department selection
- **Reconciliation View**: Create `v_issue_reconciliation` view for consumption analysis per PO
- **Upgrade Allocation Flow**: Integrate new issuance with existing allocation system (allocation → issue request → issue items)

## Capabilities

### New Capabilities

- `thread-issue-request`: Issue request management - create, track, and manage thread issuance batches linked to PO/Style/Color with quota control
- `thread-issue-items`: Individual cone issuance tracking with over-limit handling and department assignment
- `thread-issue-returns`: Partial cone return processing with percentage-based quantity estimation
- `thread-issue-reconciliation`: Consumption tracking and reconciliation reporting per PO/Style/Color

### Modified Capabilities

- `thread-allocation`: Link allocation to new issue request flow (allocation_id reference in issue_items)

## Impact

### Database
- 3 new tables: `thread_issue_requests`, `thread_issue_items`, `thread_issue_returns`
- 1 new view: `v_issue_reconciliation`
- New indexes for performance
- FK relationships to: `purchase_orders`, `styles`, `colors`, `thread_inventory`, `thread_allocations`

### Backend (Hono API)
- New routes: `/api/issues/*` for CRUD operations
- New RPC functions for quota calculation and issuance processing
- Integration with existing allocation service

### Frontend
- New pages: Issue Request management (desktop), Issue scanning (mobile)
- Return processing UI with percentage selector
- Reconciliation report page
- Updates to allocation flow to link with issuance

### Services
- New `issueService.ts` for issue request operations
- New `issueReturnService.ts` for return processing
- Updates to `allocationService.ts` for integration
