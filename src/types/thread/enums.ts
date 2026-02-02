/**
 * Thread Management Enums
 *
 * These enums match database ENUMs exactly.
 * Do not modify values without corresponding database migration.
 */

/**
 * Cone status tracking through the entire lifecycle
 * From receipt to consumption or write-off
 */
export enum ConeStatus {
  RECEIVED = 'RECEIVED',
  INSPECTED = 'INSPECTED',
  AVAILABLE = 'AVAILABLE',
  SOFT_ALLOCATED = 'SOFT_ALLOCATED',
  HARD_ALLOCATED = 'HARD_ALLOCATED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  PARTIAL_RETURN = 'PARTIAL_RETURN',
  PENDING_WEIGH = 'PENDING_WEIGH',
  CONSUMED = 'CONSUMED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  QUARANTINE = 'QUARANTINE'
}

/**
 * Allocation status for order thread requests
 */
export enum AllocationStatus {
  PENDING = 'PENDING',
  SOFT = 'SOFT',
  HARD = 'HARD',
  ISSUED = 'ISSUED',
  CANCELLED = 'CANCELLED',
  WAITLISTED = 'WAITLISTED',
  // Request workflow statuses
  APPROVED = 'APPROVED',
  READY_FOR_PICKUP = 'READY_FOR_PICKUP',
  RECEIVED = 'RECEIVED',
  REJECTED = 'REJECTED'
}

/**
 * Priority levels for allocation requests
 */
export enum AllocationPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

/**
 * Types of inventory movements for audit trail
 */
export enum MovementType {
  RECEIVE = 'RECEIVE',
  ISSUE = 'ISSUE',
  RETURN = 'RETURN',
  TRANSFER = 'TRANSFER',
  ADJUSTMENT = 'ADJUSTMENT',
  WRITE_OFF = 'WRITE_OFF'
}

/**
 * Recovery status for partial cone returns
 */
export enum RecoveryStatus {
  INITIATED = 'INITIATED',
  PENDING_WEIGH = 'PENDING_WEIGH',
  WEIGHED = 'WEIGHED',
  CONFIRMED = 'CONFIRMED',
  WRITTEN_OFF = 'WRITTEN_OFF',
  REJECTED = 'REJECTED'
}

/**
 * Thread material types
 */
export enum ThreadMaterial {
  POLYESTER = 'polyester',
  COTTON = 'cotton',
  NYLON = 'nylon',
  SILK = 'silk',
  RAYON = 'rayon',
  MIXED = 'mixed'
}
