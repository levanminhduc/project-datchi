/**
 * Style Thread Specs Composable
 *
 * Provides reactive state and operations for style thread specification management.
 */
import type { StyleThreadSpec, StyleColorThreadSpec, CreateStyleThreadSpecDTO, UpdateStyleThreadSpecDTO, CreateStyleColorThreadSpecDTO, UpdateStyleColorThreadSpecDTO, StyleThreadSpecFilter } from '@/types/thread';
export declare function useStyleThreadSpecs(): {
    styleThreadSpecs: any;
    colorSpecs: any;
    error: any;
    filters: any;
    selectedSpec: any;
    isLoading: any;
    specCount: any;
    colorSpecCount: any;
    clearError: () => void;
    fetchStyleThreadSpecs: (newFilters?: StyleThreadSpecFilter) => Promise<void>;
    fetchSpecById: (id: number) => Promise<void>;
    createSpec: (data: CreateStyleThreadSpecDTO) => Promise<StyleThreadSpec | null>;
    updateSpec: (id: number, data: UpdateStyleThreadSpecDTO) => Promise<StyleThreadSpec | null>;
    deleteSpec: (id: number) => Promise<boolean>;
    fetchColorSpecs: (specId: number) => Promise<void>;
    addColorSpec: (specId: number, data: CreateStyleColorThreadSpecDTO) => Promise<StyleColorThreadSpec | null>;
    fetchAllColorSpecsByStyle: (styleId: number) => Promise<void>;
    updateColorSpec: (colorSpecId: number, data: UpdateStyleColorThreadSpecDTO) => Promise<StyleColorThreadSpec | null>;
    deleteColorSpec: (colorSpecId: number) => Promise<boolean>;
};
