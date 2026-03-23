/**
 * Thread Recovery Management Composable
 *
 * Provides reactive state and operations for cone recovery management.
 * Handles fetching, initiating returns, weighing, confirming, and writing off.
 */
import type { Recovery, RecoveryFilters, InitiateReturnDTO, WeighConeDTO, WriteOffDTO } from '@/types/thread';
export declare function useRecovery(): {
    recoveries: any;
    error: any;
    selectedRecovery: any;
    filters: any;
    isLoading: any;
    hasRecoveries: any;
    pendingWeighCount: any;
    recoveryCount: any;
    fetchRecoveries: (newFilters?: RecoveryFilters) => Promise<void>;
    fetchRecoveryById: (id: number) => Promise<Recovery | null>;
    initiateReturn: (data: InitiateReturnDTO) => Promise<Recovery | null>;
    weighCone: (id: number, data: WeighConeDTO) => Promise<Recovery | null>;
    confirmRecovery: (id: number, confirmedBy?: string) => Promise<boolean>;
    writeOffCone: (id: number, data: WriteOffDTO) => Promise<boolean>;
    fetchPending: () => Promise<void>;
    clearError: () => void;
};
