export interface PendingOperation {
    id: string;
    type: 'RECEIVE' | 'ISSUE' | 'RECOVERY' | 'WEIGH';
    endpoint: string;
    method: 'POST' | 'PUT' | 'DELETE';
    data: Record<string, any>;
    timestamp: number;
    retries: number;
}
export declare function useOfflineSync(): {
    isOnline: any;
    pendingOperations: any;
    pendingCount: any;
    hasPending: any;
    isSyncing: any;
    lastSyncTime: any;
    error: any;
    addPending: (operation: Omit<PendingOperation, "id" | "timestamp" | "retries">) => Promise<string>;
    removePending: (id: string) => Promise<void>;
    syncAll: () => Promise<void>;
    queueOperation: (type: PendingOperation["type"], endpoint: string, method: PendingOperation["method"], data: Record<string, any>) => Promise<{
        success: boolean;
        queued: boolean;
        result?: any;
    }>;
    clearAll: () => Promise<void>;
    loadPending: () => Promise<void>;
};
