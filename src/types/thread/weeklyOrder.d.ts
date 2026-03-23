import type { CalculationResult } from './threadCalculation';
import type { OrderWeekStatus, DeliveryStatus, InventoryReceiptStatus } from './enums';
export interface ThreadOrderWeek {
    id: number;
    week_name: string;
    start_date: string | null;
    end_date: string | null;
    status: OrderWeekStatus;
    notes: string | null;
    created_by: string | null;
    updated_by: string | null;
    created_at: string;
    updated_at: string;
    item_count?: number;
    items?: ThreadOrderItem[];
}
export interface ThreadOrderItem {
    id: number;
    week_id: number;
    po_id: number | null;
    style_id: number;
    color_id: number;
    quantity: number;
    sub_art_id?: number | null;
    created_at: string;
    style?: {
        id: number;
        style_code: string;
        style_name: string;
    };
    color?: {
        id: number;
        name: string;
        hex_code: string;
    };
    po?: {
        id: number;
        po_number: string;
    };
    sub_art?: {
        id: number;
        sub_art_code: string;
    };
    style_color_id?: number;
    style_color?: {
        id: number;
        color_name: string;
        hex_code: string;
    };
}
export interface CreateWeeklyOrderDTO {
    week_name: string;
    start_date?: string;
    end_date?: string;
    notes?: string;
    items: Array<{
        po_id?: number | null;
        style_id: number;
        color_id: number;
        quantity: number;
        sub_art_id?: number | null;
        style_color_id: number;
    }>;
}
export interface UpdateWeeklyOrderDTO {
    week_name?: string;
    start_date?: string;
    end_date?: string;
    notes?: string;
    items?: Array<{
        po_id?: number | null;
        style_id: number;
        color_id: number;
        quantity: number;
        sub_art_id?: number | null;
    }>;
}
export interface WeeklyOrderResults {
    calculation_data: CalculationResult[];
    summary_data: AggregatedRow[];
    calculated_at: string;
}
export interface AggregatedRow {
    thread_type_id: number;
    thread_type_name: string;
    supplier_name: string;
    tex_number: string;
    total_meters: number;
    total_cones: number;
    meters_per_cone: number | null;
    thread_color: string | null;
    thread_color_code: string | null;
    supplier_id?: number | null;
    delivery_date?: string | null;
    lead_time_days?: number | null;
    inventory_cones?: number;
    full_cones?: number;
    partial_cones?: number;
    equivalent_cones?: number;
    sl_can_dat?: number;
    additional_order?: number;
    total_final?: number;
    quota_cones?: number;
    is_fallback_type?: boolean;
}
export interface StyleOrderEntry {
    po_id: number | null;
    po_number: string;
    style_id: number;
    style_code: string;
    style_name: string;
    colors: Array<{
        color_id: number;
        color_name: string;
        hex_code: string;
        quantity: number;
        style_color_id: number;
    }>;
    po_quantity?: number;
    already_ordered?: number;
    sub_art_id?: number | null;
    sub_art_code?: string;
}
export interface OrderedQuantityInfo {
    po_id: number;
    style_id: number;
    po_quantity: number;
    ordered_quantity: number;
    remaining_quantity: number;
}
export interface ColorEntryHistory {
    color_id: number;
    color_name: string;
    hex_code: string;
    quantity: number;
}
export interface StyleProgress {
    style_id: number;
    style_code: string;
    style_name: string;
    po_quantity: number;
    total_ordered: number;
    this_week_quantity: number;
    remaining: number;
    progress_pct: number;
    colors: ColorEntryHistory[];
}
export interface PoGroup {
    po_id: number | null;
    po_number: string;
    styles: StyleProgress[];
}
export interface WeekHistoryGroup {
    week_id: number;
    week_name: string;
    status: string;
    created_by: string | null;
    created_at: string;
    total_quantity: number;
    po_groups: PoGroup[];
}
export interface HistoryByWeekFilter {
    po_id?: number;
    style_id?: number;
    from_date?: string;
    to_date?: string;
    status?: string;
    created_by?: string;
    page?: number;
    limit?: number;
}
export interface DeliveryRecord {
    id: number;
    week_id: number;
    thread_type_id: number;
    supplier_id: number;
    delivery_date: string;
    actual_delivery_date: string | null;
    status: DeliveryStatus;
    notes: string | null;
    created_at: string;
    updated_at: string;
    received_quantity: number;
    inventory_status: InventoryReceiptStatus;
    warehouse_id: number | null;
    received_by: string | null;
    received_at: string | null;
    quantity_cones: number;
    days_remaining?: number;
    is_overdue?: boolean;
    supplier_name?: string;
    thread_type_name?: string;
    tex_number?: string;
    color_name?: string;
    color_hex?: string;
    week_name?: string;
    total_cones?: number | null;
    borrowed_in?: number;
    lent_out?: number;
}
export interface ReceiveDeliveryDTO {
    warehouse_id: number;
    quantity: number;
    received_by: string;
    expiry_date?: string;
}
export interface UpdateDeliveryDTO {
    delivery_date?: string;
    actual_delivery_date?: string | null;
    status?: DeliveryStatus;
    notes?: string;
}
export interface DeliveryFilter {
    status?: DeliveryStatus;
    week_id?: number;
}
export type LoanStatus = 'ACTIVE' | 'SETTLED';
export interface LoanDashboardSummary {
    week_id: number;
    week_name: string;
    week_status: string;
    total_needed: number;
    total_reserved: number;
    shortage: number;
    ncc_ordered: number;
    ncc_received: number;
    ncc_pending: number;
    borrowed_cones: number;
    borrowed_count: number;
    borrowed_returned_cones: number;
    lent_cones: number;
    lent_count: number;
    lent_returned_cones: number;
}
export interface ThreadOrderLoan {
    id: number;
    from_week_id: number | null;
    to_week_id: number;
    thread_type_id: number;
    quantity_cones: number;
    returned_cones: number;
    quantity_meters: number | null;
    reason: string | null;
    status: LoanStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
    deleted_at: string | null;
    from_week?: {
        id: number;
        week_name: string;
    } | null;
    to_week?: {
        id: number;
        week_name: string;
    };
    thread_type?: {
        id: number;
        code: string;
        name: string;
        tex_number: string | null;
        supplier?: {
            name: string;
        } | null;
        color?: {
            name: string;
        } | null;
    };
    supplier_name?: string;
    tex_number?: string;
    color_name?: string;
}
export interface LoanReturnLog {
    id: number;
    loan_id: number;
    cones_returned: number;
    return_type: 'AUTO' | 'MANUAL';
    returned_by: string;
    notes: string | null;
    created_at: string;
}
export interface ManualReturnDTO {
    quantity: number;
    notes?: string;
}
export interface ManualReturnResult {
    success: boolean;
    returned: number;
    remaining: number;
    settled: boolean;
}
export interface ReservationSummary {
    thread_type_id: number;
    thread_type_name?: string;
    needed: number;
    reserved: number;
    shortage: number;
    available_stock: number;
    can_reserve: boolean;
    cannot_reserve_reason?: string;
}
export interface ReserveFromStockDTO {
    thread_type_id: number;
    quantity: number;
    reason?: string;
}
export interface ReserveFromStockResult {
    success: boolean;
    reserved: number;
    shortage: number;
    loan_id: number | null;
}
export interface CreateLoanDTO {
    from_week_id: number;
    thread_type_id: number;
    quantity_cones: number;
    reason?: string;
}
export interface BatchLoanItem {
    thread_type_id: number;
    quantity_cones: number;
}
export interface CreateBatchLoanDTO {
    from_week_id: number;
    items: BatchLoanItem[];
    reason?: string;
}
export interface BatchLoanResult {
    success: boolean;
    total_items: number;
    total_moved_cones: number;
}
export interface ConfirmWithReserveResult {
    week: ThreadOrderWeek;
    reservation_summary: ReservationSummary[];
}
export interface ReservedCone {
    id: number;
    cone_id: string;
    thread_type_id: number;
    quantity_meters: number;
    warehouse_id: number;
    lot_number: string | null;
    expiry_date: string | null;
    received_date: string;
    thread_type?: {
        id: number;
        code: string;
        name: string;
        tex_number: string | null;
        supplier?: {
            name: string;
        } | null;
        color?: {
            name: string;
        } | null;
    };
    warehouse?: {
        id: number;
        code: string;
        name: string;
    };
}
export interface ThreadSummaryRow {
    thread_type_id: number;
    thread_type_name: string;
    supplier_name: string;
    tex_number: string;
    thread_color?: string | null;
    total_cones: number;
    equivalent_cones: number;
    pending_cones: number;
    shortage: number;
}
export interface AssignmentSummaryRow {
    week_id: number;
    week_name: string;
    week_status: string;
    thread_type_id: number;
    thread_type_code: string;
    thread_type_name: string;
    planned_cones: number;
    reserved_cones: number;
    allocated_cones: number;
    gap: number;
}
export interface LoanDetailByType {
    thread_type_id: number;
    thread_code: string;
    thread_name: string;
    color_name: string;
    supplier_name: string;
    tex_number: string | null;
    borrowed_cones: number;
    borrowed_returned_cones: number;
    lent_cones: number;
    lent_returned_cones: number;
    ncc_ordered: number;
    ncc_received: number;
    ncc_pending: number;
}
