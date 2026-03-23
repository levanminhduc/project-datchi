/**
 * Thread Calculation Composable
 *
 * Provides reactive state and operations for thread calculation.
 */
import type { CalculationInput, CalculationResult, CalculateByPOInput, POCalculationResult } from '@/types/thread';
export declare function useThreadCalculation(): {
    calculationResult: any;
    poCalculationResults: any;
    error: any;
    isLoading: any;
    hasResults: any;
    clearError: () => void;
    clearResults: () => void;
    calculate: (input: CalculationInput) => Promise<CalculationResult | null>;
    calculateByPO: (input: CalculateByPOInput) => Promise<POCalculationResult[]>;
};
