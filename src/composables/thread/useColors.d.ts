/**
 * Colors Management Composable
 *
 * Provides reactive state and CRUD operations for color master data management.
 * Follows patterns from useThreadTypes.ts
 */
import type { Color, ColorFormData, ColorFilters } from '@/types/thread/color';
export declare function useColors(): {
    colors: any;
    loading: any;
    error: any;
    selectedColor: any;
    filters: any;
    hasColors: any;
    colorCount: any;
    activeColors: any;
    fetchColors: (newFilters?: ColorFilters) => Promise<void>;
    createColor: (data: ColorFormData) => Promise<Color | null>;
    updateColor: (id: number, data: Partial<ColorFormData> & {
        is_active?: boolean;
    }) => Promise<Color | null>;
    deleteColor: (id: number) => Promise<boolean>;
    selectColor: (color: Color | null) => void;
    getColorById: (id: number) => Color | undefined;
    setFilters: (newFilters: ColorFilters) => Promise<void>;
    clearFilters: () => Promise<void>;
    clearError: () => void;
    reset: () => void;
};
