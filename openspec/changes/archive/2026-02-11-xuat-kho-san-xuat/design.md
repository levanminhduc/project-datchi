## Context

The current thread management system has:
- `thread_allocations` - tracks thread allocation requests for production orders
- `thread_inventory` - individual cone tracking with meters/weight
- `thread_movements` - movement history (receive, issue, transfer)
- `thread_recovery` - partial cone return with weight-based calculation

Current issue flow: `Allocation (SOFT/HARD) → Issue → IN_PRODUCTION status`

Missing capabilities:
- No link to PO/Style/Color when issuing
- No department tracking (who receives the threads)
- No quota enforcement with over-limit controls
- No simple percentage-based partial return (only weight-based)

Existing data available:
- `purchase_orders` - PO master data
- `styles` - product styles with BOM specs
- `colors` - product colors
- `employees.department` - department values for receiving party
- `style_thread_specs` - BOM with meters_per_unit per style

## Goals / Non-Goals

**Goals:**
- Enable complete traceability: PO → Style → Color → Issued Cones → Department
- Support multiple issuance batches per PO with running quota tracking
- Warn on over-quota issuance with mandatory notes
- Simplify partial returns with percentage estimation (worker-friendly)
- Integrate with existing allocation system (not replace)
- Provide reconciliation data for consumption analysis

**Non-Goals:**
- Real-time quota blocking (soft warning only, allow with notes)
- Weight-based return calculation (keep existing recovery for that)
- Replacing existing allocation system (enhance it)
- Automatic BOM calculation (use pre-calculated quota from style_thread_specs)
- Multi-warehouse issuance (single warehouse per request)

## Decisions

### Decision 1: Separate Issue Request from Issue Items

**Choice**: Create `thread_issue_requests` (batch header) and `thread_issue_items` (individual cones)

**Rationale**:
- Allows multiple issuance batches per PO (user requirement)
- Separates batch-level data (PO, style, color, department) from cone-level data
- Easier quota tracking at batch level
- Matches existing pattern (allocations → allocation_cones)

**Alternatives considered**:
- Single table with all fields → Too denormalized, quota tracking complex
- Extend existing allocation table → Would break existing flow, too coupled

### Decision 2: Department from employees.department

**Choice**: Use DISTINCT values from `employees.department` column as dropdown options

**Rationale**:
- Reuses existing data, no new master data table needed
- Already has values: 'IT', 'Kho', 'Kế hoạch', etc.
- Consistent with existing employee management

**Alternatives considered**:
- Create separate `departments` table → Over-engineering for current needs
- Free text input → No consistency, reporting difficult
- Use warehouses as departments → Semantically incorrect

### Decision 3: Percentage-based Returns (10% increments)

**Choice**: Worker selects remaining percentage in 10% increments (10%, 20%, ..., 100%)

**Rationale**:
- User specified "ước lượng chấp nhận được" (estimation acceptable)
- Much faster than weighing each cone
- 10% precision is sufficient for reconciliation
- Converts to meters: `remaining_meters = original_meters × percentage / 100`

**Alternatives considered**:
- Weight-based calculation → Already exists in thread_recovery, too slow
- Free percentage input → More error-prone
- 5% increments → Too granular for estimation

### Decision 4: Soft Quota Enforcement

**Choice**: Calculate quota from BOM, warn when exceeded, require notes, allow issuance

**Rationale**:
- User specified "cho phép xuất vượt nhưng phải giải thích"
- Hard blocking would disrupt production
- Notes provide audit trail for over-usage analysis

**Implementation**:
```
quota_meters = SUM(style_thread_specs.meters_per_unit × order_quantity)
issued_to_date = SUM(thread_issue_items.quantity_meters) for this PO/Style/Color
remaining_quota = quota_meters - issued_to_date

IF new_issue > remaining_quota:
  - Show warning
  - Require over_limit_notes (mandatory)
  - Allow proceed
```

### Decision 5: Integration with Allocation System

**Choice**: Optional link via `thread_issue_items.allocation_id`

**Rationale**:
- Allocation handles FEFO selection and conflict detection
- Issue request adds PO/Style/Color/Department tracking
- Can issue from allocation OR directly (flexibility)
- Preserves existing allocation workflow

**Flow options**:
1. Allocation-based: `Allocation → Issue Request → Issue Items`
2. Direct: `Issue Request → Issue Items` (no allocation)

## Risks / Trade-offs

### Risk 1: Percentage Estimation Accuracy
**Risk**: Worker estimates may have ±20% variance from actual meters
**Mitigation**:
- Acceptable per user requirement
- Reconciliation report will show patterns
- Can upgrade to weight-based for high-value threads later

### Risk 2: Quota Calculation Performance
**Risk**: Calculating quota from BOM for each issuance may be slow
**Mitigation**:
- Cache quota at issue_request creation
- Store `quota_meters` and `issued_meters` on request for quick reference
- Index on (po_id, style_id, color_id, thread_type_id)

### Risk 3: Department Data Quality
**Risk**: Inconsistent department names in employees table
**Mitigation**:
- Use DISTINCT dropdown (standardizes selection)
- Consider adding department normalization migration later

### Risk 4: Orphaned Allocations
**Risk**: Allocations without corresponding issue requests
**Mitigation**:
- allocation_id is optional on issue_items
- Existing allocation flow continues to work
- New issuance can optionally link to allocation

## Data Model

```
thread_issue_requests
├── id (PK)
├── issue_code (auto: XK-YYYYMMDD-NNN)
├── po_id → purchase_orders
├── style_id → styles
├── color_id → colors
├── thread_type_id → thread_types
├── department (from employees.department)
├── quota_meters (calculated from BOM)
├── requested_meters
├── issued_meters (denormalized sum)
├── status (PENDING, PARTIAL, COMPLETED, CANCELLED)
├── notes
├── created_by, created_at, updated_at

thread_issue_items
├── id (PK)
├── issue_request_id → thread_issue_requests
├── cone_id → thread_inventory
├── allocation_id → thread_allocations (optional)
├── quantity_meters
├── batch_number (for multi-batch tracking)
├── over_limit_notes (required if over quota)
├── issued_by, issued_at

thread_issue_returns
├── id (PK)
├── issue_item_id → thread_issue_items
├── cone_id → thread_inventory
├── original_meters
├── remaining_percentage (10-100, step 10)
├── calculated_remaining_meters
├── notes
├── returned_by, returned_at

v_issue_reconciliation (view)
├── po_id, po_number
├── style_id, style_code
├── color_id, color_name
├── thread_type_id, thread_name
├── quota_meters
├── total_issued_meters
├── total_returned_meters
├── consumed_meters
├── consumption_percentage
├── over_limit_count
```

## API Design

```
POST   /api/issues                    # Create issue request
GET    /api/issues                    # List issue requests (with filters)
GET    /api/issues/:id                # Get issue request detail
PATCH  /api/issues/:id                # Update issue request
DELETE /api/issues/:id                # Cancel issue request

POST   /api/issues/:id/items          # Add cones to issue request
DELETE /api/issues/:id/items/:itemId  # Remove cone from issue

POST   /api/issues/returns            # Return partial cone
GET    /api/issues/returns            # List returns

GET    /api/issues/reconciliation     # Get reconciliation data
GET    /api/issues/quota/:poId/:styleId/:colorId/:threadTypeId  # Check quota
```

## Migration Plan

1. **Phase 1 - Schema**: Create new tables and view
2. **Phase 2 - API**: Implement Hono routes
3. **Phase 3 - Services**: Create frontend services
4. **Phase 4 - UI**: Build pages (desktop + mobile)
5. **Phase 5 - Integration**: Link to existing allocation flow

**Rollback**: Tables can be dropped without affecting existing system (all new tables)
