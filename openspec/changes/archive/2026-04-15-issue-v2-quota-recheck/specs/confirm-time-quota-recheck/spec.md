## ADDED Requirements

### Requirement: Live quota recalculation at confirm time

The system SHALL recalculate the remaining quota for every line in a DRAFT issue at the moment of confirmation, using the same `batchGetQuotaCones()` logic that computes live remaining quota from CONFIRMED issues. The system SHALL NOT rely on the stored `quota_cones` snapshot for the over-quota decision at confirm time.

#### Scenario: Quota consumed by another issue between DRAFT creation and confirm

- **WHEN** user A adds a line to a DRAFT issue and the remaining quota at that time is 10 cones
- **AND** user B confirms a different issue that consumes 8 cones of the same quota
- **AND** user A then confirms their DRAFT issue which issues 5 cones (exceeding the now-remaining 2 cones)
- **AND** the line has no `over_quota_notes`
- **THEN** the system SHALL reject the confirmation with an error message indicating the line exceeds the quota

#### Scenario: Quota still sufficient at confirm time

- **WHEN** a DRAFT issue line was added with `quota_cones = 10`
- **AND** at confirm time the live remaining quota is still 10 (no other issues consumed quota)
- **AND** the line issues 5 cones
- **THEN** the system SHALL allow the confirmation to proceed

#### Scenario: Over-quota with notes allowed

- **WHEN** a DRAFT issue line exceeds the live remaining quota at confirm time
- **AND** the line has a non-empty `over_quota_notes` value
- **THEN** the system SHALL allow the confirmation to proceed (preserving existing over-quota-with-notes behavior)

### Requirement: Stored quota snapshot refresh on confirm

The system SHALL update each line's `quota_cones` field in the database with the live-recalculated value during confirmation, so the stored snapshot reflects the most recent quota state at the time of confirmation.

#### Scenario: Snapshot updated after successful confirm

- **WHEN** a DRAFT issue is confirmed successfully
- **AND** line X had a stale `quota_cones` of 10 but the live value is 6
- **THEN** the system SHALL update line X's `quota_cones` to 6 in the `thread_issue_lines` table

#### Scenario: Snapshot not updated on failed confirm

- **WHEN** a DRAFT issue confirmation is rejected (due to over-quota or stock issues)
- **THEN** the system SHALL NOT update any line's `quota_cones` value

### Requirement: Intra-batch consumption accumulation

When processing multiple lines in a single `POST /:id/batch-lines` request, the system SHALL accumulate the issued quantities of earlier lines in the batch and include them when calculating the remaining quota for subsequent lines that share the same `(po_id, style_id, style_color_id, thread_type_id)` combination.

#### Scenario: Two batch lines targeting the same thread type

- **WHEN** a batch request contains line 1 issuing 5 cones of thread type T and line 2 issuing 3 cones of the same thread type T
- **AND** the remaining quota for thread type T is 6 cones
- **THEN** line 1 SHALL pass validation (5 <= 6)
- **AND** line 2 SHALL fail validation (5 + 3 = 8 > 6) unless it has `over_quota_notes`

#### Scenario: Batch lines targeting different thread types

- **WHEN** a batch request contains line 1 for thread type A and line 2 for thread type B
- **THEN** each line's quota SHALL be calculated independently (no cross-thread-type accumulation)

### Requirement: Quota re-check precedes stock check

The live quota re-check at confirm time SHALL execute before the stock availability check. If any line fails the quota validation (over-quota without notes), the system SHALL return an error without proceeding to stock queries.

#### Scenario: Quota failure prevents stock check

- **WHEN** a DRAFT issue has a line that exceeds live quota without notes
- **THEN** the system SHALL return a 400 error with the quota violation message
- **AND** the system SHALL NOT perform any stock availability queries for any line in the issue

### Requirement: Null quota handling preserved

When `batchGetQuotaCones()` returns `null` for a line (meaning no quota can be determined -- e.g., no weekly orders or no thread spec), the system SHALL treat the line as having no quota constraint, consistent with the existing behavior where `line.quota_cones === null` skips the over-quota check.

#### Scenario: Line with no determinable quota

- **WHEN** a line's thread type has no matching weekly order or thread spec
- **AND** `batchGetQuotaCones()` returns `null` for that line
- **THEN** the system SHALL skip the over-quota check for that line and allow confirmation to proceed
