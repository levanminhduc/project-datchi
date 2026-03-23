/**
 * Weekly Order Calculation Composable
 *
 * Manages multi-style selection, parallel calculation, and aggregation
 * for weekly thread ordering. Supports PO → Style → Color flow.
 */
import type { ThreadOrderItem, CalculationResult } from '@/types/thread';
export declare function useWeeklyOrderCalculation(): {
    orderEntries: any;
    perStyleResults: any;
    aggregatedResults: any;
    isCalculating: any;
    isReordering: any;
    calculationProgress: any;
    calculationErrors: any;
    calculationWarnings: any;
    lastCalculatedAt: any;
    lastModifiedAt: any;
    deliveryDateOverrides: any;
    orderedQuantities: any;
    subArtRequired: any;
    canCalculate: any;
    canCalculateReason: any;
    hasResults: any;
    isResultsStale: any;
    hasOverLimitEntries: any;
    subArtMissing: any;
    addStyle: (style: {
        id: number;
        style_code: string;
        style_name: string;
        po_id?: number | null;
        po_number?: string;
        sub_art_id?: number | null;
        sub_art_code?: string;
    }) => void;
    removeStyle: (styleId: number, poId?: number | null, subArtId?: number | null) => void;
    removePO: (poId: number) => void;
    updateSubArt: (styleId: number, poId: number | null, subArtId: number | null, subArtCode?: string, oldSubArtId?: number | null) => void;
    addColorToStyle: (styleId: number, color: {
        color_id: number;
        color_name: string;
        hex_code: string;
        style_color_id: number;
    }, poId?: number | null, subArtId?: number | null) => void;
    removeColorFromStyle: (styleId: number, colorId: number, poId?: number | null, subArtId?: number | null) => void;
    updateColorQuantity: (styleId: number, colorId: number, qty: number, poId?: number | null, subArtId?: number | null) => void;
    calculateAll: (currentWeekId?: number) => Promise<void>;
    aggregateResults: (results: CalculationResult[]) => void;
    updateAdditionalOrder: (threadTypeId: number, value: number) => void;
    updateQuotaCones: (threadTypeId: number, value: number) => void;
    updateDeliveryDate: (specId: number, date: string) => void;
    mergeDeliveryDateOverrides: () => void;
    reorderResults: (newOrder: CalculationResult[]) => Promise<void>;
    fetchOrderedQuantities: (pairs: Array<{
        po_id: number;
        style_id: number;
    }>, excludeWeekId?: number) => Promise<void>;
    clearAll: () => void;
    setFromWeekItems: (items: ThreadOrderItem[]) => void;
};
