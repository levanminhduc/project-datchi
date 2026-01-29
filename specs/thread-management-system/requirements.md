# Thread Management System (Quản lý Chỉ May)

## Overview

Enterprise thread inventory management for garment manufacturing with dual unit-of-measure tracking (Cones/Meters), soft allocation system for production planning, FEFO-based allocation priority, and partial cone recovery workflow. Integrates with barcode scanners and electronic scales for warehouse operations.

## User Roles

| Role | Vietnamese | Permissions |
|------|-----------|-------------|
| Technical Admin | Kỹ thuật | Define thread specs, conversion factors, system config |
| Planning | Kế hoạch | Approve orders, allocate inventory, resolve conflicts |
| Warehouse | Thủ kho | Receive stock, issue to production, recover partial cones |
| Production Line | Công nhân | Request thread, return partial cones, view own allocations |

---

## User Stories

### Technical Admin (Kỹ thuật)

#### Story 1: Thread Type Management (Priority: P1) 🎯 MVP

As a Technical Admin, I want to define thread types with conversion factors so that the system can accurately calculate meters from cone weight.

**Independent Test**: Create thread type → Verify conversion formula → Calculate meters from sample weight

**Acceptance Criteria**:
- [ ] WHEN the admin creates a thread type, THE SYSTEM SHALL require thread code (unique), name, color, manufacturer, and density factor.
- [ ] WHEN the admin specifies density factor, THE SYSTEM SHALL use formula: `meters = (weight_grams / density_factor) * 1000` for conversion.
- [ ] IF the thread code already exists, THEN THE SYSTEM SHALL return 409 with message "Mã chỉ đã tồn tại".
- [ ] WHEN the admin updates a thread type, THE SYSTEM SHALL recalculate all inventory quantities using the new density factor.
- [ ] THE SYSTEM SHALL store density values with DECIMAL(10,6) precision.

#### Story 2: Conversion Factor Testing (Priority: P2)

As a Technical Admin, I want to test conversion formulas against sample cones so that I can verify accuracy before production use.

**Independent Test**: Enter sample weight → Compare calculated vs measured length → Adjust if needed

**Acceptance Criteria**:
- [ ] WHEN the admin enters a sample cone weight, THE SYSTEM SHALL display calculated meters using current density factor.
- [ ] WHEN the admin enters actual measured length, THE SYSTEM SHALL calculate deviation percentage.
- [ ] IF deviation exceeds 5%, THEN THE SYSTEM SHALL warn admin and suggest revised density factor.
- [ ] WHEN the admin approves a revised factor, THE SYSTEM SHALL log the calibration event with timestamp.

---

### Planning (Kế hoạch)

#### Story 3: Inventory Dashboard (Priority: P1) 🎯 MVP

As a Planner, I want a real-time dashboard showing thread inventory status so that I can make informed allocation decisions.

**Independent Test**: View dashboard → Verify stock levels match database → Check real-time updates

**Acceptance Criteria**:
- [ ] THE SYSTEM SHALL display total inventory by thread type with both cone count and meter total.
- [ ] WHILE viewing the dashboard, THE SYSTEM SHALL update values within 2 seconds of any inventory change.
- [ ] WHEN stock falls below reorder level, THE SYSTEM SHALL display amber warning indicator.
- [ ] WHEN stock is critically low (<25% of reorder level), THE SYSTEM SHALL display red alert indicator.
- [ ] THE SYSTEM SHALL display soft-allocated vs available quantities separately.
- [ ] WHERE filter is applied, THE SYSTEM SHALL support filtering by thread code, color, manufacturer, and warehouse.

#### Story 4: Soft Allocation Creation (Priority: P1) 🎯 MVP

As a Planner, I want to create soft allocations for production orders so that inventory is reserved before physical issuance.

**Independent Test**: Create allocation for order → Verify available stock reduced → Cancel allocation → Verify stock restored

**Acceptance Criteria**:
- [ ] WHEN the planner creates a soft allocation, THE SYSTEM SHALL reserve specified quantity from available stock.
- [ ] WHEN allocation is created, THE SYSTEM SHALL require production order ID, thread type, quantity in meters, and priority level.
- [ ] IF available stock is insufficient, THEN THE SYSTEM SHALL allow partial allocation and add remainder to waitlist.
- [ ] WHEN allocation is created, THE SYSTEM SHALL apply FEFO (First Expired First Out) logic to select cones.
- [ ] WHERE partial cones exist with sufficient quantity, THE SYSTEM SHALL prioritize clearing partial cones before full cones.
- [ ] THE SYSTEM SHALL calculate priority score as: `(priority_level × 10) + days_since_order_created`.

#### Story 5: Conflict Resolution (Priority: P1) 🎯 MVP

As a Planner, I want to resolve allocation conflicts when multiple orders compete for limited stock so that production can proceed without delays.

**Independent Test**: Create conflicting allocations → View conflict panel → Resolve by adjusting priorities → Verify resolution

**Acceptance Criteria**:
- [ ] WHEN two or more allocations compete for the same stock, THE SYSTEM SHALL detect and flag as conflict.
- [ ] WHEN conflict is detected, THE SYSTEM SHALL block affected allocations until resolved.
- [ ] WHEN conflict exists, THE SYSTEM SHALL display conflict timeline showing all affected orders.
- [ ] WHEN the planner adjusts priority, THE SYSTEM SHALL recalculate allocation order and resolve if possible.
- [ ] WHEN the planner splits an order, THE SYSTEM SHALL create partial allocation and waitlist for remainder.
- [ ] WHEN conflict is resolved, THE SYSTEM SHALL notify affected production lines via real-time update.
- [ ] THE SYSTEM SHALL log all conflict resolutions with planner ID, action taken, and timestamp.

#### Story 6: Allocation Reports (Priority: P2)

As a Planner, I want to generate allocation reports so that I can track allocation efficiency and identify patterns.

**Independent Test**: Generate report for date range → Verify data accuracy → Export to Excel

**Acceptance Criteria**:
- [ ] WHEN the planner requests a report, THE SYSTEM SHALL support date range, thread type, and order status filters.
- [ ] THE SYSTEM SHALL calculate allocation fulfillment rate (allocated / requested).
- [ ] THE SYSTEM SHALL show average time from soft allocation to hard allocation.
- [ ] WHEN export is requested, THE SYSTEM SHALL generate XLSX file with all report data.

---

### Warehouse (Thủ kho)

#### Story 7: Stock Receipt (Priority: P1) 🎯 MVP

As a Warehouse Keeper, I want to receive new thread stock into inventory so that it becomes available for allocation.

**Independent Test**: Scan cone barcode → Enter weight → Verify inventory updated → Check cone appears in system

**Acceptance Criteria**:
- [ ] WHEN receiving stock, THE SYSTEM SHALL support barcode scanning for cone identification.
- [ ] WHEN barcode is scanned, THE SYSTEM SHALL auto-populate thread type if barcode matches known format.
- [ ] WHEN weight is entered, THE SYSTEM SHALL calculate meters using thread-specific density factor.
- [ ] THE SYSTEM SHALL capture weight from electronic scale via Web Serial API.
- [ ] IF scale is unavailable, THEN THE SYSTEM SHALL allow manual weight entry with validation.
- [ ] WHEN stock is received, THE SYSTEM SHALL set status to 'RECEIVED' pending quality inspection.
- [ ] WHEN stock passes inspection, THE SYSTEM SHALL change status to 'AVAILABLE'.
- [ ] THE SYSTEM SHALL generate unique cone_id with format: `{thread_code}-{YYYYMMDD}-{sequence}`.

#### Story 8: Issue to Production (Priority: P1) 🎯 MVP

As a Warehouse Keeper, I want to issue allocated thread to production lines so that they can start manufacturing.

**Independent Test**: View soft allocations → Issue cone to order → Verify hard allocation created → Confirm status change

**Acceptance Criteria**:
- [ ] WHEN issuing thread, THE SYSTEM SHALL display soft allocations awaiting fulfillment.
- [ ] WHEN cone barcode is scanned, THE SYSTEM SHALL verify it matches the allocated thread type.
- [ ] IF scanned cone doesn't match allocation, THEN THE SYSTEM SHALL display error "Sai loại chỉ".
- [ ] WHEN issue is confirmed, THE SYSTEM SHALL convert soft allocation to hard allocation.
- [ ] WHEN issue is confirmed, THE SYSTEM SHALL change cone status from 'AVAILABLE' to 'IN_PRODUCTION'.
- [ ] WHEN partial cone is issued, THE SYSTEM SHALL deduct issued quantity and update remaining meters.
- [ ] THE SYSTEM SHALL record issue transaction with cone_id, order_id, quantity, warehouse_user, timestamp.

#### Story 9: Partial Cone Recovery (Priority: P1) 🎯 MVP

As a Warehouse Keeper, I want to receive partial cones returned from production so that remaining thread can be reused.

**Independent Test**: Receive returned cone → Weigh → Verify meters calculated → Confirm re-entry to inventory

**Acceptance Criteria**:
- [ ] WHEN receiving a returned cone, THE SYSTEM SHALL require cone barcode scan.
- [ ] WHEN barcode is scanned, THE SYSTEM SHALL verify cone was previously issued (status = 'IN_PRODUCTION').
- [ ] WHEN cone is weighed, THE SYSTEM SHALL calculate remaining meters using density factor.
- [ ] IF weight is less than 50g, THEN THE SYSTEM SHALL flag for write-off with reason "Số lượng còn lại quá ít".
- [ ] WHEN recovery is confirmed, THE SYSTEM SHALL change status to 'AVAILABLE' and mark as partial.
- [ ] THE SYSTEM SHALL record recovery transaction with original_meters, returned_meters, consumed_meters.
- [ ] WHERE partial cones total equals cone capacity, THE SYSTEM SHALL suggest consolidation.

#### Story 10: Offline Operations (Priority: P2)

As a Warehouse Keeper, I want to continue working when network is unavailable so that warehouse operations are not interrupted.

**Independent Test**: Disconnect network → Perform operations → Reconnect → Verify sync completes

**Acceptance Criteria**:
- [ ] WHEN network is unavailable, THE SYSTEM SHALL queue operations in IndexedDB.
- [ ] WHILE offline, THE SYSTEM SHALL display sync status indicator.
- [ ] WHEN network is restored, THE SYSTEM SHALL automatically sync queued operations.
- [ ] IF sync conflict occurs, THEN THE SYSTEM SHALL flag for manual resolution.
- [ ] THE SYSTEM SHALL support offline mode for: stock receipt, issue, and recovery operations.

---

### Production Line (Công nhân)

#### Story 11: Thread Request (Priority: P1) 🎯 MVP

As a Production Worker, I want to view my allocated thread and request additional if needed so that production is not delayed.

**Independent Test**: View allocations for my line → Request additional thread → Verify request appears in planning queue

**Acceptance Criteria**:
- [ ] WHEN viewing allocations, THE SYSTEM SHALL display thread allocated to worker's production line.
- [ ] WHEN allocation exists, THE SYSTEM SHALL show thread type, quantity in meters, and status.
- [ ] WHEN worker requests additional thread, THE SYSTEM SHALL create soft allocation request for planning approval.
- [ ] WHEN request is approved, THE SYSTEM SHALL notify worker via real-time update.

#### Story 12: Partial Cone Return (Priority: P1) 🎯 MVP

As a Production Worker, I want to initiate partial cone return so that unused thread is properly tracked.

**Independent Test**: Initiate return → Enter cone barcode → Verify return request created

**Acceptance Criteria**:
- [ ] WHEN initiating return, THE SYSTEM SHALL require cone barcode scan.
- [ ] WHEN return is initiated, THE SYSTEM SHALL set cone status to 'PARTIAL_RETURN'.
- [ ] THE SYSTEM SHALL notify warehouse of pending return for weighing.
- [ ] WHEN warehouse confirms receipt, THE SYSTEM SHALL complete the return workflow.

---

## Business Rules

| Rule ID | Condition | Action |
|---------|-----------|--------|
| ALLOC-001 | Order priority = "Urgent" AND stock sufficient | Allocate immediately, bypass waitlist |
| ALLOC-002 | Multiple orders need same thread | Allocate by score = (Priority × 10) + Order age in days |
| ALLOC-003 | Partial cones exist AND qty ≤ partial total | Allocate from partials first (clear partials preference) |
| ALLOC-004 | Full cones have different expiry dates | Apply FEFO - allocate earliest expiry first |
| ALLOC-005 | Allocation qty > available stock | Create partial allocation + add to waitlist |
| ALLOC-006 | Conflict detected (competing allocations) | Block until resolved; notify Planning role |
| REC-001 | Returned cone weight < 50g | Flag for write-off, require supervisor approval |
| REC-002 | Returned cone original - returned > expected consumption | Flag for investigation "Tiêu thụ cao bất thường" |
| INV-001 | quantity_meters < reorder_level | Create low stock alert, visible on dashboard |
| INV-002 | Cone age > 365 days since receipt | Flag as aging stock, include in aging report |
| SCAN-001 | Barcode format unrecognized | Allow manual entry with warning |
| SCALE-001 | Scale reading variance > 2g in 3 readings | Retry weighing, warn if persists |

---

## Non-Functional Requirements

### Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Dashboard load time | < 2s | Time to first meaningful paint |
| Real-time update latency | < 500ms | Time from database change to UI update |
| Barcode scan to result | < 300ms | Time from scan to data display |
| Allocation calculation | < 1s | Time to process 100 concurrent allocations |
| Batch stock receipt | < 5s | Time to process 50 cones |
| Report generation | < 10s | For reports with 10,000 rows |

### Scalability

| Dimension | Target |
|-----------|--------|
| Concurrent users | 50 |
| Thread types | 1,000 |
| Active cones | 100,000 |
| Daily transactions | 10,000 |
| Historical data retention | 5 years |

### Availability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.5% during business hours (6am-10pm) |
| Offline capability | Full warehouse operations |
| Data sync | Within 30s of network restoration |
| Backup recovery | RPO 1 hour, RTO 4 hours |

### Security

| Requirement | Implementation |
|-------------|----------------|
| Role-based access | Supabase RLS policies per role |
| Audit trail | All mutations logged with user, timestamp, before/after |
| Data encryption | AES-256 at rest (Supabase default) |
| API authentication | JWT tokens with 24h expiry |

---

## Assumptions (Auto-inferred)

| Decision | Chosen | Reasoning | Alternatives |
|----------|--------|-----------|--------------|
| Decimal precision | DECIMAL(12,4) + decimal.js | Balance precision vs storage; matches thread industry standards | DECIMAL(18,6), Float |
| Real-time engine | Supabase Realtime | Already in stack, selective subscriptions supported | WebSocket custom, polling |
| Barcode mode | Keyboard wedge | Universal scanner compatibility, no driver required | USB HID, Bluetooth |
| Scale protocol | Web Serial API | Browser-native, no plugins; manual fallback required | Native app, WebUSB |
| Offline storage | IndexedDB | Largest capacity, structured data, good browser support | localStorage, Service Worker Cache |
| State machine | Database enum + trigger | Atomic state transitions, audit log built-in | Application-side FSM |
| Conflict resolution | Manual planner decision | Business rules vary by context, AI suggestion future phase | Auto-resolve by priority |
| Mobile framework | Responsive Quasar | Unified codebase, native feel | Capacitor native, separate PWA |

---

## Out of Scope

- Purchase order integration (Phase 2)
- Supplier management
- Thread quality testing lab integration
- Multi-warehouse transfer logic
- Thread machine assignment optimization
- Predictive reorder suggestions
- Barcode label printing (manual process)
- Financial/costing calculations
- Integration with external ERP systems

---

## Success Metrics

| Metric | Target | Current Baseline |
|--------|--------|-----------------|
| Allocation accuracy | > 98% | Manual tracking |
| Partial cone recovery rate | > 90% | Unknown |
| Stock discrepancy | < 2% | Manual counts |
| Allocation conflict resolution time | < 30 min | N/A |
| Warehouse operation time (per cone) | < 30s | ~2 min manual |
| Planning dashboard refresh rate | Real-time | Daily manual reports |

---

## Glossary

| Term | Vietnamese | Definition |
|------|-----------|------------|
| Cone | Cuộn chỉ | Physical unit of thread storage |
| Soft Allocation | Phân bổ mềm | Reserved but not yet issued inventory |
| Hard Allocation | Phân bổ cứng | Physically issued to production |
| FEFO | Hết hạn trước xuất trước | First Expired First Out allocation strategy |
| Partial Cone | Cuộn lẻ | Partially consumed cone returned from production |
| Density Factor | Hệ số mật độ | Thread-specific conversion factor (grams to meters) |
| Recovery | Thu hồi | Process of returning partial cones to inventory |
| Waitlist | Danh sách chờ | Queue for unfulfilled allocations |
| Priority Score | Điểm ưu tiên | Calculated value for allocation ordering |
