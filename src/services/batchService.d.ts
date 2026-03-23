/**
 * Batch Service
 *
 * API client for batch operations (receive, transfer, issue, return).
 */
import type { BatchReceiveRequest, BatchTransferRequest, BatchIssueRequest, BatchReturnRequest, BatchOperationResponse, BatchTransaction, BatchTransactionFilters } from '@/types/thread/batch';
export declare const batchService: {
    /**
     * Nhập kho hàng loạt
     */
    receive(data: BatchReceiveRequest): Promise<BatchOperationResponse>;
    /**
     * Chuyển kho hàng loạt
     */
    transfer(data: BatchTransferRequest): Promise<BatchOperationResponse>;
    /**
     * Xuất kho hàng loạt
     */
    issue(data: BatchIssueRequest): Promise<BatchOperationResponse>;
    /**
     * Trả lại cuộn
     */
    return(data: BatchReturnRequest): Promise<BatchOperationResponse>;
    /**
     * Lấy danh sách thao tác batch
     */
    getTransactions(filters?: BatchTransactionFilters): Promise<BatchTransaction[]>;
    /**
     * Lấy chi tiết thao tác
     */
    getTransaction(id: number): Promise<BatchTransaction>;
};
