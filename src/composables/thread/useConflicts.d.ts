/**
 * Thread Conflict Management Composable
 *
 * Provides reactive state and operations for thread allocation conflict management.
 * Handles fetching, resolving, and monitoring conflicts between competing allocations.
 */
import type { AllocationConflict } from '@/types/thread';
import { AllocationPriority } from '@/types/thread/enums';
/**
 * Extended conflict interface with UI-specific fields
 * Maps to the spec interface ThreadConflict
 */
export interface ThreadConflict extends AllocationConflict {
    thread_type_code?: string;
    thread_type_name?: string;
}
/**
 * Conflict allocation info for display
 */
export interface ConflictAllocation {
    allocation_id: number;
    production_order_id: string;
    production_order_code: string;
    requested_quantity: number;
    allocated_quantity: number;
    priority: AllocationPriority;
    priority_score: number;
    requested_date: string;
    status: string;
}
/**
 * Resolution types for conflict resolution
 */
export type ConflictResolutionType = 'priority' | 'cancel' | 'split' | 'escalate';
/**
 * DTO for resolving a conflict
 */
export interface ResolveConflictDTO {
    conflictId: number;
    resolutionType: ConflictResolutionType;
    allocationId?: number;
    newPriority?: AllocationPriority;
    splitQuantity?: number;
    notes?: string;
}
/**
 * Conflict filter options
 */
export interface ConflictFilters {
    status?: 'PENDING' | 'RESOLVED' | 'ESCALATED';
    thread_type_id?: number;
    from_date?: string;
    to_date?: string;
}
/**
 * Thread Conflict Management Composable
 *
 * @example
 * ```ts
 * const {
 *   conflicts,
 *   isLoading,
 *   fetchConflicts,
 *   resolveByPriority,
 *   cancelConflictingAllocation,
 *   enableRealtime,
 * } = useConflicts()
 *
 * onMounted(() => {
 *   fetchConflicts()
 *   enableRealtime()
 * })
 * ```
 */
export declare function useConflicts(): {
    conflicts: any;
    error: any;
    filters: any;
    selectedConflict: any;
    realtimeEnabled: any;
    isLoading: any;
    conflictCount: any;
    pendingConflicts: any;
    resolvedConflicts: any;
    escalatedConflicts: any;
    hasActiveConflicts: any;
    totalShortage: any;
    fetchConflicts: (newFilters?: ConflictFilters) => Promise<void>;
    getConflictById: (id: number) => ThreadConflict | undefined;
    getConflictAllocations: (conflict: ThreadConflict) => ConflictAllocation[];
    resolveConflict: (dto: ResolveConflictDTO) => Promise<boolean>;
    resolveByPriority: (conflictId: number, allocationId: number, newPriority: AllocationPriority) => Promise<boolean>;
    cancelConflictingAllocation: (allocationId: number) => Promise<boolean>;
    splitAllocation: (allocationId: number, splitQuantity: number, reason?: string) => Promise<boolean>;
    escalateConflict: (conflictId: number, notes?: string) => Promise<boolean>;
    enableRealtime: () => void;
    disableRealtime: () => void;
    selectConflict: (conflict: ThreadConflict | null) => void;
    setFilters: (newFilters: ConflictFilters) => Promise<void>;
    clearFilters: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
};
