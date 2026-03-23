/**
 * Thread Requests Composable
 *
 * Provides reactive state and workflow operations for thread request management.
 * Follows patterns from useEmployees.ts
 */
import type { Allocation, AllocationFilters, CreateAllocationDTO } from '@/types/thread';
export declare function useThreadRequests(): {
    requests: any;
    error: any;
    selectedRequest: any;
    filters: any;
    isLoading: any;
    hasRequests: any;
    requestCount: any;
    pendingRequests: any;
    approvedRequests: any;
    readyForPickupRequests: any;
    receivedRequests: any;
    rejectedRequests: any;
    pendingCount: any;
    readyForPickupCount: any;
    fetchRequests: (newFilters?: AllocationFilters) => Promise<void>;
    fetchById: (id: number) => Promise<Allocation | null>;
    createRequest: (data: CreateAllocationDTO) => Promise<Allocation | null>;
    approve: (id: number, approvedBy: string) => Promise<Allocation | null>;
    reject: (id: number, rejectedBy: string, reason: string) => Promise<Allocation | null>;
    markReady: (id: number) => Promise<Allocation | null>;
    confirmReceived: (id: number, receivedBy: string) => Promise<Allocation | null>;
    cancelRequest: (id: number) => Promise<Allocation | null>;
    reset: () => void;
};
