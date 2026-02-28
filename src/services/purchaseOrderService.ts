/**
 * Purchase Order Service
 *
 * API client for purchase order operations.
 */

import { fetchApi } from './api'
import type {
  PurchaseOrder,
  PurchaseOrderWithItems,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderFilter,
  POItem,
  POItemHistory,
  CreatePOItemDTO,
  UpdatePOItemDTO,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/purchase-orders'

function buildQueryString(filters?: PurchaseOrderFilter): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.status) params.append('status', filters.status)
  if (filters.priority) params.append('priority', filters.priority)
  if (filters.customer_name) params.append('customer_name', filters.customer_name)
  if (filters.po_number) params.append('po_number', filters.po_number)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const purchaseOrderService = {
  /**
   * Lấy danh sách tất cả đơn hàng
   * @param filters - Optional filters
   * @returns Array of purchase orders
   */
  async getAll(filters?: PurchaseOrderFilter): Promise<PurchaseOrder[]> {
    const queryString = buildQueryString(filters)
    const response = await fetchApi<ApiResponse<PurchaseOrder[]>>(`${BASE}${queryString}`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin đơn hàng theo ID
   * @param id - Purchase order ID
   * @returns Purchase order
   */
  async getById(id: number): Promise<PurchaseOrder> {
    const response = await fetchApi<ApiResponse<PurchaseOrder>>(`${BASE}/${id}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy đơn hàng')
    }

    return response.data
  },

  /**
   * Lấy thông tin đơn hàng kèm po_items, styles
   * @param id - Purchase order ID
   * @returns Purchase order with items
   */
  async getWithItems(id: number): Promise<PurchaseOrderWithItems> {
    const response = await fetchApi<ApiResponse<PurchaseOrderWithItems>>(
      `${BASE}/${id}?include=items`,
    )

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy đơn hàng')
    }

    return response.data
  },

  /**
   * Tạo đơn hàng mới
   * @param data - CreatePurchaseOrderDTO
   * @returns Created purchase order
   */
  async create(data: CreatePurchaseOrderDTO): Promise<PurchaseOrder> {
    const response = await fetchApi<ApiResponse<PurchaseOrder>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể tạo đơn hàng')
    }

    return response.data
  },

  /**
   * Cập nhật đơn hàng
   * @param id - Purchase order ID
   * @param data - UpdatePurchaseOrderDTO
   * @returns Updated purchase order
   */
  async update(id: number, data: UpdatePurchaseOrderDTO): Promise<PurchaseOrder> {
    const response = await fetchApi<ApiResponse<PurchaseOrder>>(`${BASE}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể cập nhật đơn hàng')
    }

    return response.data
  },

  /**
   * Xóa đơn hàng
   * @param id - Purchase order ID
   */
  async delete(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<void>>(`${BASE}/${id}`, {
      method: 'DELETE',
    })

    if (response.error) {
      throw new Error(response.error)
    }
  },

  // ================== PO Items CRUD ==================

  /**
   * Thêm item vào PO
   * @param poId - Purchase order ID
   * @param data - CreatePOItemDTO
   * @returns Created item
   */
  async addItem(poId: number, data: CreatePOItemDTO): Promise<POItem> {
    const response = await fetchApi<ApiResponse<POItem>>(`${BASE}/${poId}/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể thêm mã hàng')
    }

    return response.data
  },

  /**
   * Cập nhật quantity của item
   * @param poId - Purchase order ID
   * @param itemId - Item ID
   * @param data - UpdatePOItemDTO
   * @returns Updated item
   */
  async updateItem(poId: number, itemId: number, data: UpdatePOItemDTO): Promise<POItem> {
    const response = await fetchApi<ApiResponse<POItem>>(`${BASE}/${poId}/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể cập nhật mã hàng')
    }

    return response.data
  },

  /**
   * Xóa item khỏi PO (soft delete)
   * @param poId - Purchase order ID
   * @param itemId - Item ID
   */
  async deleteItem(poId: number, itemId: number): Promise<void> {
    const response = await fetchApi<ApiResponse<void>>(`${BASE}/${poId}/items/${itemId}`, {
      method: 'DELETE',
    })

    if (response.error) {
      throw new Error(response.error)
    }
  },

  /**
   * Lấy lịch sử thay đổi của item
   * @param poId - Purchase order ID
   * @param itemId - Item ID
   * @returns Array of history entries
   */
  async getItemHistory(poId: number, itemId: number): Promise<POItemHistory[]> {
    const response = await fetchApi<ApiResponse<POItemHistory[]>>(
      `${BASE}/${poId}/items/${itemId}/history`,
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },
}
