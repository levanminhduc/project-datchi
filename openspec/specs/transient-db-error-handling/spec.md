## ADDED Requirements

### Requirement: Recognize PGRST002 as transient DB error
The auth middleware SHALL recognize PostgREST error code `PGRST002` ("Could not query the database for the schema cache") as a transient database error.

#### Scenario: PGRST002 triggers retry
- **WHEN** the employee status query returns error code `PGRST002`
- **THEN** the system SHALL retry the query up to 2 times with incremental backoff (300ms × attempt number)

#### Scenario: PGRST002 returns 503 after retries exhausted
- **WHEN** the employee status query returns `PGRST002` and all retry attempts are exhausted
- **THEN** the system SHALL return HTTP 503 with message "Hệ thống đang khởi động lại, vui lòng thử lại sau"
- **AND** SHALL NOT return HTTP 401

### Requirement: Recognize PGRST001 as transient DB error
The auth middleware SHALL recognize PostgREST error code `PGRST001` ("connection pool timeout") as a transient database error.

#### Scenario: PGRST001 triggers retry
- **WHEN** the employee status query returns error code `PGRST001`
- **THEN** the system SHALL retry the query up to 2 times with incremental backoff

#### Scenario: PGRST001 returns 503 after retries exhausted
- **WHEN** the employee status query returns `PGRST001` and all retry attempts are exhausted
- **THEN** the system SHALL return HTTP 503
- **AND** SHALL NOT return HTTP 401

### Requirement: Existing transient codes remain functional
All previously recognized transient DB error codes (`PGRST000`, `PGRST503`, `57P01`, `57P03`, `08006`) and the `recovery mode` message check SHALL continue to function identically.

#### Scenario: PGRST000 still retries and returns 503
- **WHEN** the employee status query returns error code `PGRST000`
- **THEN** the system SHALL retry and return HTTP 503 if retries are exhausted (unchanged behavior)
