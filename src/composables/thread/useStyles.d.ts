/**
 * Styles Composable
 *
 * Provides reactive state and operations for style management.
 */
import type { Style, CreateStyleDTO, UpdateStyleDTO, StyleFilter } from '@/types/thread';
export declare function useStyles(): {
    styles: any;
    error: any;
    filters: any;
    selectedStyle: any;
    styleThreadSpecs: any;
    isLoading: any;
    styleCount: any;
    clearError: () => void;
    fetchStyles: (newFilters?: StyleFilter) => Promise<void>;
    fetchStyleById: (id: number) => Promise<void>;
    createStyle: (data: CreateStyleDTO) => Promise<Style | null>;
    updateStyle: (id: number, data: UpdateStyleDTO) => Promise<Style | null>;
    deleteStyle: (id: number) => Promise<boolean>;
    fetchStyleThreadSpecs: (id: number) => Promise<void>;
};
