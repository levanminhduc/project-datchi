/**
 * Recovery API Service
 *
 * Handles API calls for thread cone recovery operations.
 * Supports initiating returns, weighing, confirming, and writing off cones.
 */
import type { Recovery, RecoveryFilters, InitiateReturnDTO, WeighConeDTO, WriteOffDTO } from '@/types/thread';
export declare const recoveryService: {
    /**
     * Lấy tất cả bản ghi recovery với bộ lọc
     * @param filters - Optional filters for status, cone_id, date range
     * @returns Array of recovery records
     */
    getAll(filters?: RecoveryFilters): Promise<Recovery[]>;
    /**
     * Lấy thông tin recovery theo ID
     * @param id - Recovery ID
     * @returns Recovery record with cone details
     */
    getById(id: number): Promise<Recovery>;
    /**
     * Khởi tạo hoàn trả cone (từ quét barcode)
     * Tạo bản ghi recovery với trạng thái INITIATED
     * @param data - InitiateReturnDTO with cone_id (barcode), returned_by, notes
     * @returns Created recovery record
     */
    initiate(data: InitiateReturnDTO): Promise<Recovery>;
    /**
     * Ghi nhận trọng lượng cone đã hoàn trả
     * Tính toán số mét còn lại dựa trên trọng lượng
     * Chuyển trạng thái từ INITIATED/PENDING_WEIGH -> WEIGHED
     * @param id - Recovery ID
     * @param data - WeighConeDTO with weight_grams, optional tare_weight_grams
     * @returns Updated recovery with calculated meters
     */
    weigh(id: number, data: WeighConeDTO): Promise<Recovery>;
    /**
     * Xác nhận hoàn trả cone
     * Cập nhật inventory, chuyển trạng thái cone về AVAILABLE
     * Chuyển trạng thái recovery từ WEIGHED -> CONFIRMED
     * @param id - Recovery ID
     * @param confirmedBy - Optional confirmer name
     * @returns Updated recovery record
     */
    confirm(id: number, confirmedBy?: string): Promise<Recovery>;
    /**
     * Loại bỏ cone (write off)
     * Đánh dấu cone là WRITTEN_OFF, không trả về inventory
     * Dùng khi cone bị hỏng, lỗi, hoặc không đủ tiêu chuẩn
     * @param id - Recovery ID
     * @param data - WriteOffDTO with reason and approved_by
     * @returns Updated recovery record
     */
    writeOff(id: number, data: WriteOffDTO): Promise<Recovery>;
    /**
     * Lấy danh sách recovery đang chờ cân
     * Shortcut cho getAll với filter status = PENDING_WEIGH
     * @returns Array of pending weigh records
     */
    getPending(): Promise<Recovery[]>;
};
