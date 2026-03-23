/**
 * Position Management Composable
 *
 * Provides reactive state for positions (Chức Vụ)
 * Fetches positions from positions table with internal name and display name
 * Used by employee form dropdowns
 */
import { type PositionOption } from '@/services/positionService';
export type { PositionOption };
export declare function usePositions(): {
    positions: any;
    error: any;
    loading: any;
    hasPositions: any;
    positionOptions: any;
    positionLabels: any;
    fetchPositions: () => Promise<void>;
    clearError: () => void;
    getPositionLabel: (value: string) => string;
};
