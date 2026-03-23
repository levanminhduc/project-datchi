## Context

The Issue V2 system manages thread issuance with quantity-based tracking (full cones + partial cones). The backend is complete with:
- `GET /api/issues/v2` - List issues with filters (department, status, date range) and pagination
- `GET /api/issues/v2/:id` - Get issue details with all lines and computed fields
- `issueV2Service` - Frontend service wrapping these APIs
- `useIssueV2` composable - Reactive state with `fetchIssues()` and `fetchIssue(id)`

Current pages only support creating new issues and returning items. Users need to view history.

## Goals / Non-Goals

**Goals:**
- Enable users to view all issued tickets with filtering and pagination
- Enable users to see full details of any issue including line items
- Reuse existing UI components (AppButton, AppSelect, DataTable, etc.)
- Follow established patterns from similar pages (batch/history.vue, issues/index.vue)

**Non-Goals:**
- Modifying backend APIs (already complete)
- Adding edit functionality for confirmed issues
- Adding export to Excel (can be added later)
- Real-time updates via websockets

## Decisions

### 1. File Structure
**Decision**: Create `history.vue` for list and `[id].vue` for detail in `src/pages/thread/issues/v2/`

**Rationale**: Follows Vue Router file-based routing convention. `[id].vue` enables dynamic route `/thread/issues/v2/:id`.

**Alternatives considered**:
- Single page with modal for detail → Rejected: less intuitive UX, harder to share links

### 2. Status Badge Component
**Decision**: Create dedicated `IssueV2StatusBadge.vue` component

**Rationale**:
- Encapsulates status-to-color/label mapping
- Reusable in both list and detail pages
- Follows existing pattern (`LotStatusBadge.vue`)

**Status mapping**:
| Status | Color | Label |
|--------|-------|-------|
| DRAFT | grey | Nháp |
| CONFIRMED | positive | Đã xác nhận |
| RETURNED | info | Đã nhập lại |

### 3. Filter Implementation
**Decision**: Use existing `IssueV2Filters` type with AppSelect and DatePicker components

**Rationale**: Matches existing filter patterns in project. DatePicker with popup follows batch/history.vue pattern.

### 4. Table Component
**Decision**: Use `DataTable` component (wraps q-table with EmptyState)

**Alternative considered**: Raw q-table → Rejected: DataTable provides consistent empty state and dark mode handling

### 5. Navigation Flow
**Decision**:
- List page: click row → navigate to `/thread/issues/v2/{id}`
- Detail page: back button → navigate to `/thread/issues/v2/history`

**Rationale**: Standard drill-down pattern, allows direct linking to specific issues.

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| API response structure mismatch | Verified API returns `IssueV2ListResponse` with correct fields in exploration |
| Type inconsistency | Use existing types from `@/types/thread/issueV2` |
| Performance with large datasets | API already supports pagination with `page` and `limit` params |
