## Context

### Current State
The weekly order system (`/thread/weekly-order`) calculates thread requirements and saves results including `summary_data` with aggregated quantities per thread type. This automatically creates delivery tracking records in `thread_order_deliveries` table with `delivery_date` and `status` (pending/delivered).

The deliveries page (`/thread/weekly-order/deliveries`) allows users to:
- View all delivery records across weeks
- Filter by status (pending/delivered)
- Edit expected delivery dates inline
- Mark deliveries as "delivered" with actual delivery date

**Gap**: When a delivery is marked "delivered", no inventory records are created. The `thread_inventory` table remains disconnected from the ordering flow.

### Existing Structures
```sql
-- thread_order_deliveries (current)
id, week_id, thread_type_id, supplier_id, delivery_date, actual_delivery_date, status, notes

-- thread_inventory (target for new records)
cone_id, thread_type_id, warehouse_id, quantity_meters, status, lot_number, received_date, ...

-- warehouses (for selection)
id, code, name, type (LOCATION/STORAGE), parent_id, is_active
```

### Existing Patterns
- Inventory receiving: `POST /api/inventory/receive` creates cones with `CONE-{timestamp}-{seq}` format
- Lot management: `lots` table with `lot_number` format expected as `LOT-{date}-{seq}`
- Batch operations: `server/routes/batch.ts` handles bulk cone creation

## Goals / Non-Goals

**Goals:**
- Enable receiving delivered cones into inventory from the deliveries page
- Track partial deliveries (ordered 10, received 8, pending 2)
- Auto-generate lot numbers for each receive batch
- Create `thread_inventory` records with `AVAILABLE` status
- Provide clear UI for pending receive items

**Non-Goals:**
- Quality inspection workflow (cones go directly to AVAILABLE)
- Barcode/QR printing from this flow (existing inventory page handles this)
- Modifying the weekly order calculation logic
- Price/cost tracking for received items

## Decisions

### 1. Schema Extension vs New Table
**Decision**: Extend `thread_order_deliveries` with new columns

**Rationale**:
- Keeps delivery and receive data together (single source of truth)
- Simpler queries for status display
- Alternative (new `delivery_receipts` table) would require joins and support multiple partial receives - overkill for current needs

**New columns**:
```sql
received_quantity INT DEFAULT 0,
inventory_status VARCHAR(20) DEFAULT 'pending', -- pending | partial | received
warehouse_id INT REFERENCES warehouses(id),
received_by VARCHAR(100),
received_at TIMESTAMPTZ
```

### 2. Lot Number Generation
**Decision**: Auto-generate as `LOT-{YYYYMMDD}-{HHmmss}` per receive action

**Rationale**:
- Unique without needing sequence counter
- Human-readable date prefix
- Each receive action = one lot (even for same delivery)

### 3. Cone Status on Receive
**Decision**: Create with `AVAILABLE` status

**Rationale**:
- User confirmed this is the expected flow
- QC step not required for this workflow
- Cones should be immediately usable for allocation

### 4. UI Approach
**Decision**: Two tabs in existing deliveries page

**Rationale**:
- Tab 1: "Theo dõi giao hàng" - existing delivery tracking
- Tab 2: "Nhập kho" - receive into inventory
- Keeps related functionality together
- No new route needed

### 5. Partial Delivery Handling
**Decision**: Track with `inventory_status` field

**Statuses**:
- `pending`: Not yet received any
- `partial`: Received some, but less than `total_final`
- `received`: Fully received (received_quantity >= total_final)

**Flow**: Users can receive multiple times until fully received.

## Risks / Trade-offs

### Risk: Data Inconsistency
- **Risk**: Delivery marked "delivered" but not yet received into inventory
- **Mitigation**: Clear UI distinction between delivery status and inventory status

### Risk: Duplicate Receives
- **Risk**: User accidentally receives same delivery twice
- **Mitigation**:
  - Show current `received_quantity` prominently
  - Validate: total received cannot exceed reasonable multiple of ordered

### Trade-off: No Multi-Receive History
- **Trade-off**: Single `received_at` field doesn't track multiple partial receives
- **Accepted**: Keep simple for MVP. Can add `delivery_receive_history` table later if needed.

### Trade-off: AVAILABLE Without QC
- **Trade-off**: Cones skip inspection step
- **Accepted**: Per user requirement. Existing inventory page can still update status if needed.
