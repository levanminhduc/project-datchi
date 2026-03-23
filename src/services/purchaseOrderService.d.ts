/**
 * Purchase Order Service
 *
 * API client for purchase order operations.
 */
import type { PurchaseOrder, PurchaseOrderWithItems, CreatePurchaseOrderDTO, UpdatePurchaseOrderDTO, PurchaseOrderFilter, POItem, POItemHistory, CreatePOItemDTO, UpdatePOItemDTO } from '@/types/thread';
export declare const purchaseOrderService: {
    /**
     * Lấy danh sách tất cả đơn hàng
     * @param filters - Optional filters
     * @returns Array of purchase orders
     */
    getAll(filters?: PurchaseOrderFilter): Promise<PurchaseOrder[]>;
    getPaginated(params?: {
        page?: number;
        pageSize?: number;
        sortBy?: string;
        descending?: boolean;
        status?: string;
        priority?: string;
        customer_name?: string;
        po_number?: string;
    }): Promise<{
        data: PurchaseOrder[];
        count: number;
    }>;
    getCustomers(): Promise<string[]>;
    /**
     * Lấy thông tin đơn hàng theo ID
     * @param id - Purchase order ID
     * @returns Purchase order
     */
    getById(id: number): Promise<PurchaseOrder>;
    /**
     * Lấy thông tin đơn hàng kèm po_items, styles
     * @param id - Purchase order ID
     * @returns Purchase order with items
     */
    getWithItems(id: number): Promise<PurchaseOrderWithItems>;
    /**
     * Tạo đơn hàng mới
     * @param data - CreatePurchaseOrderDTO
     * @returns Created purchase order
     */
    create(data: CreatePurchaseOrderDTO): Promise<PurchaseOrder>;
    /**
     * Cập nhật đơn hàng
     * @param id - Purchase order ID
     * @param data - UpdatePurchaseOrderDTO
     * @returns Updated purchase order
     */
    update(id: number, data: UpdatePurchaseOrderDTO): Promise<PurchaseOrder>;
    /**
     * Xóa đơn hàng
     * @param id - Purchase order ID
     */
    delete(id: number): Promise<void>;
    /**
     * Thêm item vào PO
     * @param poId - Purchase order ID
     * @param data - CreatePOItemDTO
     * @returns Created item
     */
    addItem(poId: number, data: CreatePOItemDTO): Promise<POItem>;
    /**
     * Cập nhật quantity của item
     * @param poId - Purchase order ID
     * @param itemId - Item ID
     * @param data - UpdatePOItemDTO
     * @returns Updated item
     */
    updateItem(poId: number, itemId: number, data: UpdatePOItemDTO): Promise<POItem>;
    /**
     * Xóa item khỏi PO (soft delete)
     * @param poId - Purchase order ID
     * @param itemId - Item ID
     */
    deleteItem(poId: number, itemId: number): Promise<void>;
    /**
     * Lấy lịch sử thay đổi của item
     * @param poId - Purchase order ID
     * @param itemId - Item ID
     * @returns Array of history entries
     */
    getItemHistory(poId: number, itemId: number): Promise<POItemHistory[]>;
};
