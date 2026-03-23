/**
 * Offline Queue Store
 *
 * Pinia store for managing offline operations with IndexedDB persistence.
 * Queues operations when offline and syncs them when back online.
 */
export interface QueuedOperation {
    id: string;
    type: 'stock_receipt' | 'issue' | 'recovery' | 'allocation';
    payload: Record<string, unknown>;
    createdAt: string;
    status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
    retryCount: number;
    error?: string;
    syncedAt?: string;
}
export interface SyncResult {
    success: number;
    failed: number;
    conflicts: number;
    total: number;
}
/**
 * Offline Queue Store
 */
export declare const useOfflineQueueStore: any;
