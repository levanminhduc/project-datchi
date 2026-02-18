## MODIFIED Requirements

### Requirement: Code sync covers all enum and column changes
The existing code sync scope SHALL be extended to cover:
- UPPERCASE permission_action values in all backend permission checks
- New po_priority enum in purchase order routes and types
- New notification_type enum in notification routes and types
- Removal of lots.supplier references
- Removal of assigned_at references
- View name update from v_issue_reconciliation_v2

#### Scenario: Backend compiles without errors
- **WHEN** all backend code sync changes are applied
- **THEN** `npx tsc --noEmit` SHALL succeed with zero type errors related to enum values, column names, or view names

#### Scenario: Frontend compiles without errors
- **WHEN** all frontend code sync changes are applied
- **THEN** `npx vue-tsc --noEmit` SHALL succeed with zero type errors related to enum values or column names

#### Scenario: No stale references remain
- **WHEN** searching the entire codebase for old values
- **THEN** zero references to lowercase permission actions (`'view'`, `'create'`, `'edit'`, `'delete'`, `'manage'`) SHALL exist in code (excluding migration history files)
- **THEN** zero references to `v_issue_reconciliation_v2` SHALL exist in code
- **THEN** zero references to `assigned_at` SHALL exist in backend/frontend code
