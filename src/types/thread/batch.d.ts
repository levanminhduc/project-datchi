/**
 * Batch Operation Types
 *
 * Type definitions for batch operations and transactions.
 */
import type { Lot } from './lot';
/**
 * Batch operation type enum matching database batch_operation_type
 */
export type BatchOperationType = 'RECEIVE' | 'TRANSFER' | 'ISSUE' | 'RETURN';
/**
 * Batch transaction entity matching database schema
 */
export interface BatchTransaction {
    id: number;
    operation_type: BatchOperationType;
    lot_id: number | null;
    from_warehouse_id: number | null;
    to_warehouse_id: number | null;
    cone_ids: number[];
    cone_count: number;
    reference_number: string | null;
    recipient: string | null;
    notes: string | null;
    performed_by: string | null;
    performed_at: string;
    lot?: Lot;
    from_warehouse?: {
        id: number;
        code: string;
        name: string;
    };
    to_warehouse?: {
        id: number;
        code: string;
        name: string;
    };
}
/**
 * Batch receive request
 */
export interface BatchReceiveRequest {
    lot_id?: number;
    lot_number?: string;
    thread_type_id: number;
    warehouse_id: number;
    cone_ids: string[];
    production_date?: string;
    expiry_date?: string;
    supplier_id?: number;
    notes?: string;
}
/**
 * Batch transfer request
 */
export interface BatchTransferRequest {
    cone_ids?: number[];
    lot_id?: number;
    from_warehouse_id: number;
    to_warehouse_id: number;
    notes?: string;
}
/**
 * Batch issue request
 */
export interface BatchIssueRequest {
    cone_ids?: number[];
    lot_id?: number;
    warehouse_id: number;
    recipient: string;
    reference_number?: string;
    notes?: string;
}
/**
 * Batch return request
 */
export interface BatchReturnRequest {
    cone_ids: number[];
    warehouse_id: number;
    notes?: string;
}
/**
 * Batch operation response
 */
export interface BatchOperationResponse {
    transaction_id: number;
    operation_type: BatchOperationType;
    cone_count: number;
    lot_id?: number;
    message: string;
}
/**
 * Batch transaction filters
 */
export interface BatchTransactionFilters {
    operation_type?: BatchOperationType;
    lot_id?: number;
    warehouse_id?: number;
    from_date?: string;
    to_date?: string;
    reference_number?: string;
}
