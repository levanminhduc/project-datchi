## ADDED Requirements

### Requirement: Network-level failure handling in fetchApiRaw
The `fetchApiRaw` function SHALL handle network-level failures (TypeError from fetch) in addition to the existing HTTP 502/503 retry. This is a new error category that does not modify existing 503 retry behavior.

#### Scenario: Existing 502/503 retry unchanged
- **WHEN** the server returns HTTP 502 or 503
- **THEN** the system SHALL retry once after 1500ms (existing behavior preserved exactly)

#### Scenario: Network TypeError handled separately
- **WHEN** `fetch()` throws a TypeError (not an HTTP response)
- **THEN** the system SHALL apply network retry logic (defined in network-retry spec) instead of the 502/503 retry path
