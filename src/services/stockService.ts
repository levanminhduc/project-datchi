/**
 * Stock Service
 *
 * API client for thread stock management operations.
 * Handles quantity-based inventory tracking with FEFO deduction.
 */

import { fetchApi } from './api'
import type {
  ThreadStockRow,
  ThreadStockWithRelations,
  ThreadStockSummary,
  ThreadStockFilters,
  AddStockDTO,
  DeductStockDTO,
  ReturnStockDTO,
  DeductStockResponse,
  StockApiResponse,
} from '@/types/thread/stock'

/**
 * Build query string from filters object
 */
function buildQueryString(filters?: ThreadStockFilters): string {
  if (!filters) return ''

  const params = new URLSearchParams()

  if (filters.thread_type_id) params.append('thread_type_id', String(filters.thread_type_id))
  if (filters.warehouse_id) params.append('warehouse_id', String(filters.warehouse_id))
  if (filters.lot_number) params.append('lot_number', filters.lot_number)

  const queryString = params.toString()
  return queryString ? `?${queryString}` : ''
}

export const stockService = {
  /**
   * Lay danh sach ton kho voi bo loc
   * @param filters - Optional filters: thread_type_id, warehouse_id, lot_number
   * @returns Array of stock records with relations
   */
  async getAll(filters?: ThreadStockFilters): Promise<ThreadStockWithRelations[]> {
    const queryString = buildQueryString(filters)
    const response = await fetchApi<StockApiResponse<ThreadStockWithRelations[]>>(
      `/api/stock${queryString}`
    )
    return response.data || []
  },

  /**
   * Lay tong hop ton kho theo loai chi
   * @param warehouseId - Optional warehouse filter
   * @returns Array of stock summaries by thread type
   */
  async getSummary(warehouseId?: number): Promise<ThreadStockSummary[]> {
    const params = warehouseId ? `?warehouse_id=${warehouseId}` : ''
    const response = await fetchApi<StockApiResponse<ThreadStockSummary[]>>(
      `/api/stock/summary${params}`
    )
    return response.data || []
  },

  async addStock(data: AddStockDTO): Promise<{ cones_created: number; lot_number: string; cone_ids: string[] }> {
    const response = await fetchApi<{ data: { cones_created: number; lot_number: string; cone_ids: string[] }; error: string | null; message?: string }>('/api/stock', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data
  },

  /**
   * Xuat kho theo FEFO (First Expired First Out)
   * Tu dong tru tu cac lo cu nhat truoc
   * @param data - Deduction request
   * @returns Deduction result showing which lots were affected
   */
  async deductStock(data: DeductStockDTO): Promise<DeductStockResponse> {
    const response = await fetchApi<StockApiResponse<DeductStockResponse>>('/api/stock/deduct', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  /**
   * Tra lai ton kho
   * Cong so luong vao stock record tuong ung
   * @param data - Return data
   * @returns Updated stock record
   */
  async returnStock(data: ReturnStockDTO): Promise<ThreadStockRow> {
    const response = await fetchApi<StockApiResponse<ThreadStockRow>>('/api/stock/return', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return response.data!
  },

  /**
   * Lay ton kho theo loai chi cu the
   * @param threadTypeId - Thread type ID
   * @param warehouseId - Optional warehouse filter
   * @returns Array of stock records for that thread type
   */
  async getByThreadType(
    threadTypeId: number,
    warehouseId?: number
  ): Promise<ThreadStockWithRelations[]> {
    return this.getAll({
      thread_type_id: threadTypeId,
      warehouse_id: warehouseId,
    })
  },

  /**
   * Lay ton kho theo kho
   * @param warehouseId - Warehouse ID
   * @returns Array of stock records for that warehouse
   */
  async getByWarehouse(warehouseId: number): Promise<ThreadStockWithRelations[]> {
    return this.getAll({ warehouse_id: warehouseId })
  },

  /**
   * Kiem tra ton kho co du khong
   * @param threadTypeId - Thread type ID
   * @param qtyFull - Required full cones
   * @param qtyPartial - Required partial cones
   * @param warehouseId - Optional warehouse filter
   * @returns true if sufficient stock available
   */
  async checkAvailability(
    threadTypeId: number,
    qtyFull: number,
    qtyPartial: number = 0,
    warehouseId?: number
  ): Promise<boolean> {
    const stocks = await this.getAll({
      thread_type_id: threadTypeId,
      warehouse_id: warehouseId,
    })

    const totalFull = stocks.reduce((sum, s) => sum + (s.qty_full_cones || 0), 0)
    const totalPartial = stocks.reduce((sum, s) => sum + (s.qty_partial_cones || 0), 0)

    return totalFull >= qtyFull && totalPartial >= qtyPartial
  },
}
