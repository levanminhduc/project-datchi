## 1. Database Schema

- [x] 1.1 Create migration file for `lots` table with all columns (lot_number, thread_type_id, warehouse_id, production_date, expiry_date, supplier, total_cones, available_cones, status, notes)
- [x] 1.2 Create migration for `batch_operation_type` enum (RECEIVE, TRANSFER, ISSUE, RETURN)
- [x] 1.3 Create migration for `batch_transactions` table with all columns
- [x] 1.4 Add `lot_id` nullable FK column to `thread_inventory` table
- [x] 1.5 Create indexes for lots (lot_number, status) and thread_inventory (lot_id)
- [x] 1.6 Run migrations and verify schema in Supabase

## 2. TypeScript Types

- [x] 2.1 Create `src/types/thread/lot.ts` with Lot, LotStatus interfaces
- [x] 2.2 Create `src/types/thread/batch.ts` with BatchTransaction, BatchOperationType interfaces
- [x] 2.3 Create `server/types/batch.ts` with request/response types (BatchReceiveRequest, BatchTransferRequest, BatchIssueRequest)
- [x] 2.4 Update `src/types/thread/inventory.ts` to add lot_id to Cone interface

## 3. Lot CRUD API

- [x] 3.1 Create `server/routes/lots.ts` with Hono router
- [x] 3.2 Implement POST /api/lots - create new lot with duplicate check
- [x] 3.3 Implement GET /api/lots - list lots with filters (status, warehouse_id, thread_type_id)
- [x] 3.4 Implement GET /api/lots/:id - get lot details with cone count
- [x] 3.5 Implement PATCH /api/lots/:id - update lot metadata and status
- [x] 3.6 Implement GET /api/lots/:id/cones - get cones belonging to lot
- [x] 3.7 Implement GET /api/lots/:id/transactions - get transaction history for lot
- [x] 3.8 Register lots router in server/index.ts

## 4. Batch Operations API

- [x] 4.1 Create `server/routes/batch.ts` with Hono router
- [x] 4.2 Implement POST /api/batch/receive - batch receive with lot creation/linking
- [x] 4.3 Implement POST /api/batch/transfer - batch transfer with validation
- [x] 4.4 Implement POST /api/batch/issue - batch issue with recipient tracking
- [x] 4.5 Implement POST /api/batch/return - return issued cones
- [x] 4.6 Implement GET /api/batch/transactions - list all batch transactions
- [x] 4.7 Implement GET /api/batch/transactions/:id - get transaction details
- [x] 4.8 Add batch size validation (max 500 cones per operation)
- [x] 4.9 Register batch router in server/index.ts

## 5. Lot Services (Frontend)

- [x] 5.1 Create `src/services/lotService.ts` with API client methods
- [x] 5.2 Create `src/services/batchService.ts` with batch operation methods
- [x] 5.3 Create `src/composables/useLots.ts` for lot state management
- [x] 5.4 Create `src/composables/useBatchOperations.ts` for batch operation state

## 6. Lot Management UI

- [x] 6.1 Create `src/pages/thread/lots/index.vue` - lots list page with filters
- [x] 6.2 Create `src/pages/thread/lots/[id].vue` - lot detail page with cones list
- [x] 6.3 Create `src/components/thread/LotSelector.vue` - dropdown with search
- [x] 6.4 Create `src/components/thread/LotFormDialog.vue` - create/edit lot modal
- [x] 6.5 Create `src/components/thread/LotStatusBadge.vue` - status display component
- [x] 6.6 Add lots menu item to navigation

## 7. Batch Receiving UI

- [x] 7.1 Create `src/pages/thread/batch/receive.vue` - batch receive page
- [x] 7.2 Implement warehouse selection step
- [x] 7.3 Implement lot selection/creation step
- [x] 7.4 Integrate QR scanner for continuous cone scanning (reuse from stocktake)
- [x] 7.5 Implement manual cone_id entry with parsing
- [x] 7.6 Implement scanned items buffer list with remove action
- [x] 7.7 Implement review summary before confirm
- [x] 7.8 Implement confirm and success feedback
- [x] 7.9 Add batch receive menu item

## 8. Batch Transfer UI

- [x] 8.1 Create `src/pages/thread/batch/transfer.vue` - batch transfer page
- [x] 8.2 Implement source warehouse and lot selection
- [x] 8.3 Implement cone scanning/selection for transfer
- [x] 8.4 Implement destination warehouse selection
- [x] 8.5 Implement transfer validation and warnings
- [x] 8.6 Implement confirm and success feedback
- [x] 8.7 Add batch transfer menu item

## 9. Batch Issuing UI

- [x] 9.1 Create `src/pages/thread/batch/issue.vue` - batch issue page
- [x] 9.2 Implement warehouse and lot/cone selection
- [x] 9.3 Implement recipient and reference number form
- [x] 9.4 Implement issue summary with totals
- [x] 9.5 Implement confirm and success feedback
- [x] 9.6 Implement print issue slip option
- [x] 9.7 Add batch issue menu item

## 10. Batch Transaction History

- [x] 10.1 Create `src/pages/thread/batch/history.vue` - transaction history page
- [x] 10.2 Implement filters (operation_type, date range, lot, warehouse)
- [x] 10.3 Implement transaction detail view
- [x] 10.4 Implement CSV export for transactions
- [x] 10.5 Add history menu item

## 11. Data Migration

- [x] 11.1 Create migration script to create lot records from existing distinct lot_number/thread_type combinations
- [x] 11.2 Update existing cones with lot_id FK based on lot_number match
- [x] 11.3 Verify migration results and lot counts

## 12. Testing & Validation

- [x] 12.1 Test lot CRUD operations via API
- [x] 12.2 Test batch receive with new and existing lots
- [x] 12.3 Test batch transfer validation (source warehouse, status checks)
- [x] 12.4 Test batch issue with recipient tracking
- [x] 12.5 Test lot status transitions (ACTIVE → DEPLETED, QUARANTINE)
- [x] 12.6 Test batch size limits (reject > 500)
- [x] 12.7 Verify transaction history logging
