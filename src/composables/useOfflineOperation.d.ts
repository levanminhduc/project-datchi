/**
 * useOfflineOperation Composable
 *
 * Wraps API operations with offline-aware behavior.
 * Automatically queues operations when offline and syncs when back online.
 */
import { type QueuedOperation } from '@/stores/thread/offlineQueue';
export type OperationType = QueuedOperation['type'];
export interface OfflineOperationOptions<T> {
    /** Operation type for queue categorization */
    type: OperationType;
    /** The API function to execute when online */
    onlineExecutor: () => Promise<T>;
    /** Payload to store for offline sync */
    payload: Record<string, unknown>;
    /** Optional: Success message (shown on successful online execution) */
    successMessage?: string;
    /** Optional: Queued message (shown when operation is queued offline) */
    queuedMessage?: string;
}
export interface OfflineOperationResult<T> {
    /** Whether the operation was executed online successfully */
    success: boolean;
    /** Whether the operation was queued for later sync */
    queued: boolean;
    /** The result data (only when success=true) */
    data?: T;
    /** Error message (only when success=false and not queued) */
    error?: string;
}
export declare function useOfflineOperation(): {
    isOnline: any;
    isSyncing: any;
    pendingCount: any;
    failedCount: any;
    conflictCount: any;
    hasConflicts: any;
    pendingOperations: any;
    conflictOperations: any;
    failedOperations: any;
    execute: <T>(options: OfflineOperationOptions<T>) => Promise<OfflineOperationResult<T>>;
    createOfflineWrapper: <TArgs extends Record<string, unknown>, TResult>(type: OperationType, apiFunction: (args: TArgs) => Promise<TResult>, options?: {
        successMessage?: string;
        queuedMessage?: string;
    }) => (args: TArgs) => Promise<OfflineOperationResult<TResult>>;
    syncNow: () => Promise<any>;
    initialize: any;
    resolveConflict: any;
    retryFailed: any;
    clearAll: any;
    cleanup: any;
};
