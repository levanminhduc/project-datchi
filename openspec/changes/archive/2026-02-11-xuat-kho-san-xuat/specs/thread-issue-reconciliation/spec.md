## ADDED Requirements

### Requirement: Reconciliation View

The system SHALL provide a view that aggregates issuance and return data for consumption analysis.

#### Scenario: View reconciliation by PO
- **WHEN** user views reconciliation for a PO
- **THEN** system shows breakdown by style, color, thread type with issued, returned, and consumed meters

#### Scenario: Calculate consumption percentage
- **WHEN** system displays reconciliation
- **THEN** consumption_percentage = (issued_meters - returned_meters) / quota_meters × 100

### Requirement: Quota vs Actual Comparison

The system SHALL compare actual consumption against BOM quota.

#### Scenario: Under quota
- **WHEN** consumed_meters < quota_meters
- **THEN** system shows positive variance with green indicator

#### Scenario: Over quota
- **WHEN** consumed_meters > quota_meters
- **THEN** system shows negative variance with red indicator and variance percentage

#### Scenario: Display variance
- **WHEN** system shows comparison
- **THEN** variance = quota_meters - consumed_meters (positive = under, negative = over)

### Requirement: Reconciliation Filtering

The system SHALL provide filtering for reconciliation reports.

#### Scenario: Filter by date range
- **WHEN** user selects date range
- **THEN** system shows reconciliation for issues created in that range

#### Scenario: Filter by PO
- **WHEN** user selects specific PO
- **THEN** system shows reconciliation for that PO only

#### Scenario: Filter by department
- **WHEN** user selects department
- **THEN** system shows reconciliation for issues to that department

### Requirement: Over-Limit Summary

The system SHALL summarize over-limit issuances for analysis.

#### Scenario: Count over-limit issues
- **WHEN** user views reconciliation
- **THEN** system shows count of issue items with over_limit_notes

#### Scenario: List over-limit reasons
- **WHEN** user drills into over-limit summary
- **THEN** system shows all over_limit_notes for the selected scope

### Requirement: Export Reconciliation

The system SHALL allow exporting reconciliation data to Excel.

#### Scenario: Export to Excel
- **WHEN** user clicks export button
- **THEN** system downloads XLSX file with reconciliation data

#### Scenario: Export format
- **WHEN** export is generated
- **THEN** file includes: PO, Style, Color, Thread Type, Quota, Issued, Returned, Consumed, Variance, Over-Limit Count

### Requirement: Partial Cone Impact

The system SHALL show impact of partial cones on reconciliation.

#### Scenario: Show partial cone breakdown
- **WHEN** user views reconciliation detail
- **THEN** system shows: full cones returned, partial cones returned, average remaining percentage

#### Scenario: Estimate waste from partials
- **WHEN** system calculates
- **THEN** partial_waste = SUM(original_meters - remaining_meters) for all partial returns

### Requirement: Real-time Reconciliation

The system SHALL provide near-real-time reconciliation data.

#### Scenario: Update on issue
- **WHEN** new cone is issued
- **THEN** reconciliation view reflects updated issued_meters

#### Scenario: Update on return
- **WHEN** cone is returned
- **THEN** reconciliation view reflects updated returned_meters and consumed_meters
