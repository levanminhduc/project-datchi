## MODIFIED Requirements

### Requirement: Reconciliation data source
The reconciliation API SHALL use `v_issue_reconciliation_v2` view exclusively instead of `v_issue_reconciliation` (v1). The v1 reconciliation endpoint SHALL be removed.

#### Scenario: GET /api/reconciliation uses v2 view
- **WHEN** a client requests reconciliation data via GET /api/reconciliation
- **THEN** the system SHALL query `v_issue_reconciliation_v2` view instead of `v_issue_reconciliation`

#### Scenario: v1 reconciliation endpoint removed
- **WHEN** v1 tables are dropped
- **THEN** any endpoint in `server/routes/reconciliation.ts` that queries `v_issue_reconciliation` or v1 tables directly SHALL be removed or updated to use v2

#### Scenario: Over-quota items query updated
- **WHEN** the reconciliation route queries over-limit items
- **THEN** it SHALL query `v_issue_reconciliation_v2.is_over_quota` instead of `thread_issue_items.over_limit_notes`

#### Scenario: Filter parameters preserved
- **WHEN** reconciliation is queried with filters (po_id, style_id, color_id, thread_type_id)
- **THEN** all existing filter parameters SHALL continue to work with the v2 view
