/**
 * useLots Composable
 *
 * State management for lot operations.
 */
import type { Lot, LotFilters, CreateLotRequest, UpdateLotRequest } from '@/types/thread/lot';
export declare function useLots(): {
    lots: any;
    currentLot: any;
    currentCones: any;
    loading: any;
    error: any;
    activeLots: any;
    hasLots: any;
    fetchLots: (filters?: LotFilters) => Promise<void>;
    fetchLot: (id: number) => Promise<void>;
    fetchLotCones: (lotId: number) => Promise<void>;
    createLot: (data: CreateLotRequest) => Promise<Lot | null>;
    updateLot: (id: number, data: UpdateLotRequest) => Promise<Lot | null>;
    quarantineLot: (id: number) => Promise<boolean>;
    releaseLot: (id: number) => Promise<boolean>;
    reset: () => void;
};
