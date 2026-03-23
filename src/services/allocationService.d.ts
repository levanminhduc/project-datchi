/**
 * Allocation Service
 *
 * API client for thread allocation operations.
 * Handles soft/hard allocation, issuing, and conflict management.
 */
import type { Allocation, AllocationFilters, CreateAllocationDTO, AllocationConflict } from '@/types/thread';
import { AllocationPriority } from '@/types/thread/enums';
export declare const allocationService: {
    /**
     * Lấy danh sách tất cả phân bổ với bộ lọc
     * @param filters - Optional filters for order_id, thread_type_id, status, priority, date range
     * @returns Array of allocations
     */
    getAll(filters?: AllocationFilters): Promise<Allocation[]>;
    /**
     * Lấy thông tin phân bổ theo ID
     * @param id - Allocation ID
     * @returns Allocation with allocated cones
     * @throws Error if not found
     */
    getById(id: number): Promise<Allocation>;
    /**
     * Tạo yêu cầu phân bổ mới (trạng thái PENDING)
     * @param data - CreateAllocationDTO with order_id, thread_type_id, requested_meters, priority
     * @returns Created allocation
     */
    create(data: CreateAllocationDTO): Promise<Allocation>;
    /**
     * Thực hiện phân bổ mềm - đặt chỗ cone cho đơn hàng
     * Chuyển trạng thái từ PENDING -> SOFT
     * Cone được đánh dấu SOFT_ALLOCATED
     * @param id - Allocation ID
     * @returns Updated allocation with allocated cones
     */
    execute(id: number): Promise<Allocation>;
    /**
     * Xuất cone đã phân bổ cho sản xuất
     * Chuyển trạng thái từ SOFT/HARD -> ISSUED
     * Cone được đánh dấu IN_PRODUCTION
     * @param id - Allocation ID
     * @returns Updated allocation
     */
    issue(id: number): Promise<Allocation>;
    /**
     * Hủy phân bổ - giải phóng cone đã đặt chỗ
     * Chuyển trạng thái -> CANCELLED
     * Cone được trả về trạng thái AVAILABLE
     * @param id - Allocation ID
     * @returns Updated allocation
     */
    cancel(id: number): Promise<Allocation>;
    /**
     * Lấy danh sách xung đột phân bổ đang hoạt động
     * Xung đột xảy ra khi tổng yêu cầu > tồn kho có sẵn
     * @returns Array of active conflicts
     */
    getConflicts(): Promise<AllocationConflict[]>;
    /**
     * Giải quyết xung đột bằng cách điều chỉnh ưu tiên
     * Phân bổ có ưu tiên cao hơn sẽ được xử lý trước
     * @param id - Conflict ID
     * @param newPriority - New priority to apply
     * @returns Updated conflict with resolution
     */
    resolveConflict(id: number, newPriority: AllocationPriority): Promise<AllocationConflict>;
    /**
     * Escalate a conflict to management
     * @param conflictId - Conflict ID to escalate
     * @param notes - Optional notes for escalation
     * @returns Updated conflict
     */
    escalate(conflictId: number, notes?: string): Promise<AllocationConflict>;
    /**
     * Chia nhỏ phân bổ thành hai phân bổ riêng biệt
     * Giải phóng tất cả cone đã phân bổ và đặt cả hai phân bổ về trạng thái PENDING
     * @param id - Allocation ID to split
     * @param splitMeters - Number of meters for the new allocation
     * @param reason - Optional reason for the split
     * @returns Split result with both allocations
     */
    split(id: number, splitMeters: number, reason?: string): Promise<{
        original: Allocation;
        new_allocation: Allocation;
        result: {
            success: boolean;
            original_allocation_id: number;
            new_allocation_id: number;
            original_meters: number;
            split_meters: number;
            message: string;
        };
    }>;
    /**
     * Lấy danh sách yêu cầu chỉ (có requesting_warehouse_id)
     * @param filters - Optional filters
     * @returns Array of thread requests
     */
    getRequests(filters?: AllocationFilters): Promise<Allocation[]>;
    /**
     * Duyệt yêu cầu chỉ
     * Chuyển trạng thái từ PENDING -> APPROVED
     * @param id - Request ID
     * @param approvedBy - Person approving
     * @returns Updated allocation
     */
    approve(id: number, approvedBy: string): Promise<Allocation>;
    /**
     * Từ chối yêu cầu chỉ
     * Chuyển trạng thái từ PENDING -> REJECTED
     * @param id - Request ID
     * @param rejectedBy - Person rejecting
     * @param reason - Rejection reason
     * @returns Updated allocation
     */
    reject(id: number, rejectedBy: string, reason: string): Promise<Allocation>;
    /**
     * Đánh dấu sẵn sàng nhận
     * Chuyển trạng thái từ APPROVED -> READY_FOR_PICKUP
     * Thực hiện phân bổ mềm để đặt chỗ cone
     * @param id - Request ID
     * @returns Updated allocation with allocated cones
     */
    markReady(id: number): Promise<Allocation>;
    /**
     * Xác nhận đã nhận chỉ
     * Chuyển trạng thái từ READY_FOR_PICKUP -> RECEIVED
     * Xuất cone cho xưởng
     * @param id - Request ID
     * @param receivedBy - Person receiving
     * @returns Updated allocation
     */
    confirmReceived(id: number, receivedBy: string): Promise<Allocation>;
};
