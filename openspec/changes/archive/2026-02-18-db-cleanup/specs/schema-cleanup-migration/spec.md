## MODIFIED Requirements

### Requirement: Schema cleanup migration covers all audit findings
The existing schema cleanup migration scope SHALL be extended to include:
- Orphaned function removal (fn_calculate_quota, fn_check_quota)
- Duplicate index removal (11 indexes)
- Enum standardization (permission_action UPPERCASE, new po_priority and notification_type enums)
- Trigger/index/constraint naming standardization
- Dual-write column retirement (lots.supplier, assigned_at)
- Timestamp nullability fix
- View rename (v_issue_reconciliation_v2 → v_issue_reconciliation)

#### Scenario: Migration is idempotent
- **WHEN** the migration is run multiple times
- **THEN** it SHALL succeed without errors (using IF EXISTS/IF NOT EXISTS guards)

#### Scenario: Migration is transactional
- **WHEN** any section of the migration fails
- **THEN** the entire migration SHALL be rolled back with no partial changes

#### Scenario: All audit P0/P1 items addressed
- **WHEN** the migration completes successfully
- **THEN** zero orphaned functions SHALL exist
- **THEN** zero duplicate indexes SHALL exist
- **THEN** all enum values SHALL be UPPERCASE
- **THEN** all triggers SHALL follow `trigger_<table>_updated_at` naming
- **THEN** all indexes SHALL follow `idx_<full_table>_<column>` naming
