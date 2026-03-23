/**
 * useBatchOperations Composable
 *
 * State management for batch operations (receive, transfer, issue).
 */
import type { BatchReceiveRequest, BatchTransferRequest, BatchIssueRequest, BatchReturnRequest, BatchOperationResponse, BatchTransactionFilters } from '@/types/thread/batch';
export declare function useBatchOperations(): {
    coneBuffer: any;
    transactions: any;
    loading: any;
    error: any;
    lastResult: any;
    bufferCount: any;
    hasBuffer: any;
    addToBuffer: (coneId: string) => boolean;
    addMultipleToBuffer: (coneIds: string[]) => number;
    parseInput: (input: string) => string[];
    removeFromBuffer: (coneId: string) => void;
    clearBuffer: () => void;
    batchReceive: (data: Omit<BatchReceiveRequest, "cone_ids">) => Promise<BatchOperationResponse | null>;
    batchTransfer: (data: BatchTransferRequest) => Promise<BatchOperationResponse | null>;
    batchIssue: (data: BatchIssueRequest) => Promise<BatchOperationResponse | null>;
    batchReturn: (data: BatchReturnRequest) => Promise<BatchOperationResponse | null>;
    fetchTransactions: (filters?: BatchTransactionFilters) => Promise<void>;
    reset: () => void;
};
