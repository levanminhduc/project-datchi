/**
 * Position API Service
 *
 * Handles fetching positions from positions table
 * Uses fetchApi for consistent error handling
 */
export interface PositionOption {
    value: string;
    label: string;
}
export declare const positionService: {
    /**
     * Lấy danh sách chức vụ từ bảng positions
     * @returns Array of position options with value (name) and label (display_name)
     */
    getUniquePositions(): Promise<PositionOption[]>;
};
