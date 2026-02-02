# Thread Request Workflow - Delta Spec

> Change: thread-request-workflow
> Created: 2026-02-02
> Capability: thread-request-workflow
> Version: 1.0.0

## Overview

Mở rộng hệ thống phân bổ chỉ để hỗ trợ workflow yêu cầu chỉ hoàn chỉnh: Xưởng yêu cầu → Kho duyệt → Chuẩn bị → Xưởng nhận.

## Requirements

### Requirement: Request creation with warehouse context

The system SHALL allow creating thread allocation requests with requesting warehouse context.

#### Scenario: Create request from workshop

- **GIVEN** a workshop (STORAGE warehouse) needs thread
- **WHEN** user creates a new allocation request
- **THEN** the request SHALL include:
  - `requesting_warehouse_id` - the requesting workshop
  - `source_warehouse_id` - the source warehouse (optional, defaults to main warehouse)
  - `requested_by` - the person creating the request
- **AND** initial status SHALL be `PENDING`

#### Scenario: Requesting warehouse validation

- **WHEN** creating a request with `requesting_warehouse_id`
- **THEN** system SHALL validate the warehouse exists and type='STORAGE'

### Requirement: Request approval workflow

The system SHALL support approval/rejection of thread requests by warehouse staff.

#### Scenario: Approve pending request

- **GIVEN** a request with status='PENDING'
- **WHEN** warehouse staff approves the request
- **THEN** status SHALL change to 'APPROVED'
- **AND** `approved_by` SHALL be set to the approver's identifier
- **AND** `approved_at` SHALL be set to current timestamp

#### Scenario: Reject pending request

- **GIVEN** a request with status='PENDING'
- **WHEN** warehouse staff rejects the request
- **THEN** status SHALL change to 'REJECTED'
- **AND** `rejection_reason` SHALL be recorded
- **AND** `approved_by` SHALL be set (as the person who made the decision)

#### Scenario: Cannot approve non-pending request

- **GIVEN** a request with status != 'PENDING'
- **WHEN** attempting to approve or reject
- **THEN** system SHALL return error 400 with message "Yêu cầu đã được xử lý"

### Requirement: Preparation and pickup workflow

The system SHALL track when thread is prepared and picked up.

#### Scenario: Mark as ready for pickup

- **GIVEN** a request with status='APPROVED'
- **WHEN** warehouse staff marks request as ready
- **THEN** system SHALL execute soft allocation (reserve specific cones)
- **AND** status SHALL change to 'READY_FOR_PICKUP'

#### Scenario: Confirm receipt

- **GIVEN** a request with status='READY_FOR_PICKUP'
- **WHEN** workshop staff confirms receipt
- **THEN** system SHALL issue the allocated cones
- **AND** status SHALL change to 'RECEIVED'
- **AND** `received_by` and `received_at` SHALL be recorded

### Requirement: Extended allocation status

The system SHALL extend AllocationStatus enum with workflow states.

#### Scenario: New status values

- **WHEN** processing allocation status
- **THEN** system SHALL support these additional values:
  - `APPROVED` - Request approved, pending preparation
  - `READY_FOR_PICKUP` - Cones prepared, waiting for pickup
  - `RECEIVED` - Workshop confirmed receipt
  - `REJECTED` - Request was rejected

### Requirement: Request filtering by warehouse

The system SHALL support filtering requests by warehouse.

#### Scenario: Filter by requesting warehouse

- **WHEN** querying allocations with `requesting_warehouse_id` parameter
- **THEN** results SHALL only include allocations from that requesting warehouse

#### Scenario: Filter by source warehouse

- **WHEN** querying allocations with `source_warehouse_id` parameter  
- **THEN** results SHALL only include allocations sourced from that warehouse

#### Scenario: Filter by workflow status group

- **WHEN** querying with `workflow_status=pending_approval`
- **THEN** results SHALL include only status='PENDING' requests with requesting_warehouse_id
- **WHEN** querying with `workflow_status=pending_pickup`
- **THEN** results SHALL include only status='READY_FOR_PICKUP' requests

### Requirement: Request cancellation

The system SHALL support cancellation at appropriate workflow stages.

#### Scenario: Cancel before ready

- **GIVEN** a request with status IN ('PENDING', 'APPROVED')
- **WHEN** user cancels the request
- **THEN** status SHALL change to 'CANCELLED'
- **AND** any allocated cones SHALL be released

#### Scenario: Cannot cancel after pickup

- **GIVEN** a request with status IN ('READY_FOR_PICKUP', 'RECEIVED', 'ISSUED')
- **WHEN** attempting to cancel
- **THEN** system SHALL return error 400

### Requirement: API endpoints for workflow actions

The system SHALL provide REST endpoints for each workflow action.

#### Scenario: Approve endpoint

- **WHEN** calling POST /api/allocations/:id/approve with { approved_by: string }
- **THEN** system SHALL transition request to APPROVED status
- **AND** return updated allocation data

#### Scenario: Reject endpoint

- **WHEN** calling POST /api/allocations/:id/reject with { rejected_by: string, reason: string }
- **THEN** system SHALL transition request to REJECTED status
- **AND** store rejection reason
- **AND** return updated allocation data

#### Scenario: Ready endpoint

- **WHEN** calling POST /api/allocations/:id/ready
- **THEN** system SHALL allocate cones and transition to READY_FOR_PICKUP
- **AND** return updated allocation with allocated cones

#### Scenario: Receive endpoint

- **WHEN** calling POST /api/allocations/:id/receive with { received_by: string }
- **THEN** system SHALL issue cones and transition to RECEIVED
- **AND** return updated allocation data
