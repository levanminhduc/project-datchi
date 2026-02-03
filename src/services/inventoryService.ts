/**
 * Inventory Service
 *
 * API client for thread inventory management operations.
 * Handles all HTTP operations for cone inventory.
 */

import { fetchApi } from './api'
import type { Cone, InventoryFilters, ReceiveStockDTO, ConeSummaryRow, ConeWarehouseBreakdown, ConeSummaryFilters } from '@/types/thread'
import type { UnassignedThreadGroup } from '@/types/thread/lot'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

/**
 * Available stock summary per thread type
 */
export interface AvailableSummary {
  total_meters: number
  full_cones: number
  partial_cones: number
}

/**
 * Build query string from filters object
 */
function buildQueryString(filters?: InventoryFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.search) params.append('search', filters.search)
  if (filters.thread_type_id !== undefined) params.append('thread_type_id', String(filters.thread_type_id))
  if (filters.warehouse_id !== undefined) params.append('warehouse_id', String(filters.warehouse_id))
  if (filters.status) params.append('status', filters.status)
  if (filters.is_partial !== undefined) params.append('is_partial', String(filters.is_partial))
  if (filters.expiry_before) params.append('expiry_before', filters.expiry_before)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const inventoryService = {
  /**
   * Lấy danh sách tất cả cone trong kho
   * Uses limit=0 to trigger batch fetch for all records
   * @param filters - Optional filters for search, thread_type_id, warehouse_id, status, is_partial
   * @returns Array of cones
   */
  async getAll(filters?: InventoryFilters): Promise<Cone[]> {
    const queryString = buildQueryString(filters)
    const separator = queryString ? '&' : '?'
    const response = await fetchApi<ApiResponse<Cone[]>>(`/api/inventory${queryString}${separator}limit=0`)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy thông tin cone theo ID
   * @param id - Cone ID (database ID)
   * @returns Cone
   * @throws Error if not found
   */
  async getById(id: number): Promise<Cone> {
    const response = await fetchApi<ApiResponse<Cone>>(`/api/inventory/${id}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy cuộn chỉ')
    }

    return response.data
  },

  /**
   * Lấy thông tin cone theo mã vạch (cone_id)
   * @param coneId - Barcode/cone_id string
   * @returns Cone
   * @throws Error if not found
   */
  async getByBarcode(coneId: string): Promise<Cone> {
    const response = await fetchApi<ApiResponse<Cone>>(`/api/inventory/by-barcode/${encodeURIComponent(coneId)}`)

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không tìm thấy cuộn chỉ với mã vạch này')
    }

    return response.data
  },

  /**
   * Lấy tất cả cone trong một kho cụ thể (cho kiểm kê)
   * @param warehouseId - Warehouse ID
   * @returns ApiResponse with array of partial cone data
   */
  async getByWarehouse(warehouseId: number): Promise<ApiResponse<Partial<Cone>[]>> {
    const response = await fetchApi<ApiResponse<Partial<Cone>[]>>(
      `/api/inventory/by-warehouse/${warehouseId}`
    )
    return response
  },

  /**
   * Lấy tổng hợp số lượng có sẵn theo thread type
   * @param threadTypeId - Optional filter by thread type ID
   * @returns Record mapping thread_type_id to summary (total_meters, full_cones, partial_cones)
   */
  async getAvailableSummary(
    threadTypeId?: number
  ): Promise<Record<number, AvailableSummary>> {
    const params = threadTypeId !== undefined ? `?thread_type_id=${threadTypeId}` : ''
    const response = await fetchApi<ApiResponse<Record<number, AvailableSummary>>>(
      `/api/inventory/available/summary${params}`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || {}
  },

  /**
   * Nhập kho mới - tạo nhiều cone cùng lúc
   * @param data - ReceiveStockDTO with thread_type_id, warehouse_id, quantity_cones, etc.
   * @returns Array of created cones
   */
  async receiveStock(data: ReceiveStockDTO): Promise<Cone[]> {
    const response = await fetchApi<ApiResponse<Cone[]>>('/api/inventory/receive', {
      method: 'POST',
      body: JSON.stringify(data),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lưu kết quả kiểm kê
   * @param warehouseId - Warehouse ID
   * @param scannedConeIds - Array of scanned cone IDs
   * @param notes - Optional notes
   * @returns Stocktake result with comparison data
   */
  async saveStocktake(
    warehouseId: number, 
    scannedConeIds: string[], 
    notes?: string
  ): Promise<ApiResponse<StocktakeResult>> {
    const response = await fetchApi<ApiResponse<StocktakeResult>>('/api/inventory/stocktake', {
      method: 'POST',
      body: JSON.stringify({
        warehouse_id: warehouseId,
        scanned_cone_ids: scannedConeIds,
        notes,
      }),
    })
    return response
  },

  /**
   * Lấy tổng hợp tồn kho theo cuộn (cone-based summary)
   * Groups by thread_type, counts full and partial cones
   * @param filters - Optional filters: warehouse_id, material, search
   * @returns Array of ConeSummaryRow
   */
  async getConeSummary(filters?: ConeSummaryFilters): Promise<ConeSummaryRow[]> {
    const params = new URLSearchParams()
    if (filters?.warehouse_id !== undefined) params.append('warehouse_id', String(filters.warehouse_id))
    if (filters?.material) params.append('material', filters.material)
    if (filters?.search) params.append('search', filters.search)

    const queryString = params.toString()
    const url = `/api/inventory/summary/by-cone${queryString ? `?${queryString}` : ''}`

    const response = await fetchApi<ApiResponse<ConeSummaryRow[]>>(url)

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Lấy chi tiết phân bố kho cho một loại chỉ cụ thể
   * Shows breakdown by warehouse for drill-down view
   * @param threadTypeId - Thread type ID
   * @returns Array of ConeWarehouseBreakdown
   */
  async getWarehouseBreakdown(threadTypeId: number): Promise<ConeWarehouseBreakdown[]> {
    const response = await fetchApi<ApiResponse<ConeWarehouseBreakdown[]>>(
      `/api/inventory/summary/by-cone/${threadTypeId}/warehouses`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  async getUnassignedByThreadType(warehouseId: number): Promise<UnassignedThreadGroup[]> {
    const response = await fetchApi<ApiResponse<UnassignedThreadGroup[]>>(
      `/api/inventory/unassigned-by-thread-type?warehouse_id=${warehouseId}`
    )

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },
}

/**
 * Stocktake result from backend
 */
export interface StocktakeResult {
  stocktake_id: number
  warehouse_id: number
  total_in_db: number
  total_scanned: number
  matched: number
  missing: string[]
  extra: string[]
  match_rate: number
  performed_at: string
}
