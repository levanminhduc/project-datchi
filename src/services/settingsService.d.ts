/**
 * System Settings Service
 * Cai dat he thong - System Settings Management
 *
 * Handles all HTTP operations for system settings
 * Uses fetchApi for consistent error handling
 */
/**
 * Type for system setting row from database
 */
export interface SystemSetting {
    id: number;
    key: string;
    value: unknown;
    description: string | null;
    updated_at: string;
}
export declare const settingsService: {
    /**
     * Lay danh sach tat ca cai dat he thong
     * @returns Array of system settings
     */
    getAll(): Promise<SystemSetting[]>;
    /**
     * Lay gia tri cai dat theo key
     * @param key - Setting key (e.g., 'partial_cone_ratio')
     * @returns System setting or throws error if not found
     */
    get(key: string): Promise<SystemSetting>;
    /**
     * Cap nhat gia tri cai dat
     * @param key - Setting key
     * @param value - New value (can be any valid JSON)
     * @returns Updated system setting
     */
    update(key: string, value: unknown): Promise<SystemSetting>;
};
