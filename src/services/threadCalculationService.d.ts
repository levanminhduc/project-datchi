/**
 * Thread Calculation Service
 *
 * API client for thread calculation operations.
 */
import type { CalculationInput, CalculationResult, CalculateByPOInput, POCalculationResult } from '@/types/thread';
export declare const threadCalculationService: {
    /**
     * Tính toán định mức chỉ theo mã hàng và số lượng
     * @param input - CalculationInput with style_id and quantity
     * @returns Calculation result
     */
    calculate(input: CalculationInput): Promise<CalculationResult>;
    /**
     * Tính toán định mức chỉ cho nhiều mã hàng cùng lúc (batch)
     * @param items - Array of CalculationInput (max 100)
     * @param includeInventoryPreview - Include inventory availability preview
     * @returns Array of calculation results
     */
    calculateBatch(items: CalculationInput[], includeInventoryPreview?: boolean): Promise<CalculationResult[]>;
    /**
     * Tính toán định mức chỉ theo đơn hàng (PO)
     * @param input - CalculateByPOInput with po_id
     * @returns Array of calculation results for each PO item
     */
    calculateByPO(input: CalculateByPOInput): Promise<POCalculationResult[]>;
};
