/**
 * Thread Allocation Type Definitions
 *
 * Types for thread allocation and conflict management.
 * Field names match database columns.
 */

import type { AllocationStatus, AllocationPriority } from './enums'
import type { ThreadType } from './thread-type'
import type { Cone } from './inventory'

/**
 * Allocation entity matching database schema
 * Represents a thread request from production orders
 */
export interface Allocation {
  id: number
  order_id: string
  order_reference: string | null
  thread_type_id: number
  thread_type?: ThreadType
  requested_meters: number
  allocated_meters: number
  status: AllocationStatus
  priority: AllocationPriority
  priority_score: number
  requested_date: string
  due_date: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  // Request workflow fields
  requesting_warehouse_id: number | null
  source_warehouse_id: number | null
  requested_by: string | null
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  received_by: string | null
  received_at: string | null
  // Joined
  allocated_cones?: AllocationCone[]
  requesting_warehouse?: { id: number; code: string; name: string }
  source_warehouse?: { id: number; code: string; name: string }
}

/**
 * Junction table for allocation-cone relationship
 */
export interface AllocationCone {
  id: number
  allocation_id: number
  cone_id: number
  cone?: Cone
  allocated_meters: number
  created_at: string
}

/**
 * DTO for creating new allocation
 */
export interface CreateAllocationDTO {
  order_id: string
  order_reference?: string
  thread_type_id: number
  requested_meters: number
  priority: AllocationPriority
  due_date?: string
  notes?: string
  // Request workflow fields
  requesting_warehouse_id?: number
  source_warehouse_id?: number
  requested_by?: string
}

/**
 * Allocation conflict entity
 * Represents resource contention between multiple allocations
 */
export interface AllocationConflict {
  id: number
  thread_type_id: number
  thread_type?: ThreadType
  competing_allocations: Allocation[]
  total_requested: number
  total_available: number
  shortage: number
  status: 'PENDING' | 'RESOLVED' | 'ESCALATED'
  resolution_notes: string | null
  resolved_by: string | null
  resolved_at: string | null
  created_at: string
}

/**
 * Resolution options for a conflict
 */
export interface ConflictResolution {
  action: 'ADJUST_PRIORITY' | 'CANCEL' | 'SPLIT' | 'ESCALATE'
  allocation_id?: number
  new_priority?: AllocationPriority
  split_meters?: number
  notes: string
}

/**
 * Confirmation data for issuing to production
 */
export interface IssueConfirmation {
  allocation_id: number
  cone_ids: string[]
  notes?: string
}

/**
 * Filters for allocation search/filter functionality
 */
export interface AllocationFilters {
  order_id?: string
  thread_type_id?: number
  status?: AllocationStatus
  priority?: AllocationPriority
  from_date?: string
  to_date?: string
  // Request workflow filters
  requesting_warehouse_id?: number
  source_warehouse_id?: number
  workflow_status?: 'pending_approval' | 'pending_preparation' | 'pending_pickup' | 'completed'
  is_request?: boolean
}
