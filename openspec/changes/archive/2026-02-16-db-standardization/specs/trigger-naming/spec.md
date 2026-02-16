## ADDED Requirements

### Requirement: Rename updated_at triggers to trigger_ pattern
The system SHALL rename 8 triggers from the `update_*` pattern to the `trigger_*` pattern:

| Current Name | New Name |
|---|---|
| update_employees_updated_at | trigger_employees_updated_at |
| update_thread_allocations_updated_at | trigger_thread_allocations_updated_at |
| update_thread_conflicts_updated_at | trigger_thread_conflicts_updated_at |
| update_thread_inventory_updated_at | trigger_thread_inventory_updated_at |
| update_thread_recovery_updated_at | trigger_thread_recovery_updated_at |
| update_thread_types_updated_at | trigger_thread_types_updated_at |
| update_warehouses_updated_at | trigger_warehouses_updated_at |
| update_lots_updated_at (trigger name on lots) | trigger_lots_updated_at |

#### Scenario: Trigger renamed
- **WHEN** the migration runs
- **THEN** each trigger SHALL be dropped and recreated with the new name, using the same function and timing

#### Scenario: Trigger behavior unchanged
- **WHEN** a trigger is renamed
- **THEN** the trigger SHALL still fire BEFORE UPDATE and call the same trigger function as before
