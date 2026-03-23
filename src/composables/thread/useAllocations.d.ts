/**
 * Thread Allocations Management Composable
 *
 * Provides reactive state and operations for thread allocation management.
 * Handles fetching, creating, executing, issuing, and cancelling allocations.
 */
import type { Allocation, AllocationFilters, CreateAllocationDTO } from '@/types/thread';
export declare function useAllocations(): {
    allocations: any;
    conflicts: any;
    error: any;
    filters: any;
    selectedAllocation: any;
    isLoading: any;
    allocationCount: any;
    conflictCount: any;
    fetchAllocations: (newFilters?: AllocationFilters) => Promise<void>;
    fetchConflicts: () => Promise<void>;
    createAllocation: (data: CreateAllocationDTO) => Promise<Allocation | null>;
    executeAllocation: (id: number) => Promise<boolean>;
    issueAllocation: (id: number) => Promise<boolean>;
    cancelAllocation: (id: number) => Promise<boolean>;
    fetchAllocationById: (id: number) => Promise<Allocation | null>;
};
