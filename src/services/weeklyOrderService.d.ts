/**
 * Weekly Order Service
 *
 * API client for weekly thread ordering operations.
 * Handles CRUD for weekly orders and calculation results.
 */
import type { ThreadOrderWeek, CreateWeeklyOrderDTO, UpdateWeeklyOrderDTO, WeeklyOrderResults, AggregatedRow, OrderedQuantityInfo, WeekHistoryGroup, HistoryByWeekFilter, ThreadOrderLoan, LoanDashboardSummary, ReservationSummary, ReservedCone, CreateLoanDTO, CreateBatchLoanDTO, BatchLoanResult, ConfirmWithReserveResult, ReserveFromStockDTO, ReserveFromStockResult, AssignmentSummaryRow, LoanDetailByType, LoanReturnLog, ManualReturnDTO, ManualReturnResult } from '@/types/thread';
export interface CheckNameResult {
    exists: boolean;
    week?: {
        id: number;
        week_name: string;
        status: string;
    };
}
export declare const weeklyOrderService: {
    /**
     * Kiểm tra tên tuần đã tồn tại chưa
     * @param name - Tên tuần cần kiểm tra
     * @returns { exists: boolean, week?: { id, week_name, status } }
     */
    checkWeekNameExists(name: string): Promise<CheckNameResult>;
    /**
     * Lấy danh sách tất cả tuần đặt hàng
     * @param params - Optional filters (status)
     * @returns Array of weekly orders
     */
    getAll(params?: {
        status?: string;
    }): Promise<ThreadOrderWeek[]>;
    /**
     * Lấy thông tin tuần đặt hàng theo ID
     * @param id - Weekly order ID
     * @returns Weekly order with items
     */
    getById(id: number): Promise<ThreadOrderWeek>;
    /**
     * Tạo tuần đặt hàng mới với danh sách items
     * @param dto - CreateWeeklyOrderDTO with week_name and items
     * @returns Created weekly order
     */
    create(dto: CreateWeeklyOrderDTO): Promise<ThreadOrderWeek>;
    /**
     * Cập nhật tuần đặt hàng
     * @param id - Weekly order ID
     * @param dto - UpdateWeeklyOrderDTO with fields to update
     * @returns Updated weekly order
     */
    update(id: number, dto: UpdateWeeklyOrderDTO): Promise<ThreadOrderWeek>;
    /**
     * Xóa tuần đặt hàng
     * @param id - Weekly order ID
     */
    remove(id: number): Promise<void>;
    /**
     * Cập nhật trạng thái tuần đặt hàng (draft -> confirmed -> cancelled)
     * @param id - Weekly order ID
     * @param status - New status
     * @returns Updated weekly order
     */
    updateStatus(id: number, status: string): Promise<ConfirmWithReserveResult | ThreadOrderWeek>;
    /**
     * Lưu kết quả tính toán định mức cho tuần đặt hàng
     * @param id - Weekly order ID
     * @param data - Calculation and summary data
     * @returns Saved results
     */
    saveResults(id: number, data: {
        calculation_data: unknown;
        summary_data: unknown;
    }): Promise<WeeklyOrderResults>;
    /**
     * Lấy kết quả tính toán định mức đã lưu
     * @param id - Weekly order ID
     * @returns Calculation results
     */
    getResults(id: number): Promise<WeeklyOrderResults>;
    enrichInventory(rows: AggregatedRow[], currentWeekId?: number): Promise<AggregatedRow[]>;
    /**
     * Cập nhật định mức (quota_cones) cho một loại chỉ
     * @param weekId - Weekly order ID
     * @param threadTypeId - Thread type ID
     * @param quotaCones - New quota value
     */
    updateQuotaCones(weekId: number, threadTypeId: number, quotaCones: number): Promise<void>;
    getOrderedQuantities(pairs: Array<{
        po_id: number;
        style_id: number;
    }>, excludeWeekId?: number): Promise<OrderedQuantityInfo[]>;
    getHistoryByWeek(filters: HistoryByWeekFilter): Promise<{
        data: WeekHistoryGroup[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createLoan(toWeekId: number, data: CreateLoanDTO): Promise<ThreadOrderLoan>;
    createBatchLoan(toWeekId: number, data: CreateBatchLoanDTO): Promise<BatchLoanResult>;
    getLoans(weekId: number): Promise<{
        all: ThreadOrderLoan[];
        given: ThreadOrderLoan[];
        received: ThreadOrderLoan[];
    }>;
    getReservations(weekId: number): Promise<{
        cones: ReservedCone[];
        summary: Array<{
            thread_type_id: number;
            count: number;
            total_meters: number;
        }>;
        total_cones: number;
    }>;
    /**
     * Get all loans across all weeks
     */
    getAllLoans(): Promise<ThreadOrderLoan[]>;
    getLoanSummary(): Promise<LoanDashboardSummary[]>;
    /**
     * Task 6.2: Get reservation summary for a week
     * Returns per-thread summary with needed, reserved, shortage, available_stock
     */
    getReservationSummary(weekId: number): Promise<ReservationSummary[]>;
    /**
     * Task 6.1: Reserve available stock for a confirmed week
     * Creates loan record with from_week_id = NULL
     */
    reserveFromStock(weekId: number, dto: ReserveFromStockDTO): Promise<ReserveFromStockResult>;
    getAssignmentSummary(status?: string): Promise<AssignmentSummaryRow[]>;
    getLoanDetailByType(weekId: number): Promise<LoanDetailByType[]>;
    getReturnLogs(loanId: number): Promise<LoanReturnLog[]>;
    manualReturn(weekId: number, loanId: number, dto: ManualReturnDTO): Promise<ManualReturnResult>;
};
