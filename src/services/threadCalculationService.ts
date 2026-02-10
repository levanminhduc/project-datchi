/**
 * Thread Calculation Service
 *
 * API client for thread calculation operations.
 */

import { fetchApi } from './api'
import type {
  CalculationInput,
  CalculationResult,
  CalculateByPOInput,
  POCalculationResult,
} from '@/types/thread'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/thread-calculation'

export const threadCalculationService = {
  /**
   * Tính toán định mức chỉ theo mã hàng và số lượng
   * @param input - CalculationInput with style_id and quantity
   * @returns Calculation result
   */
  async calculate(input: CalculationInput): Promise<CalculationResult> {
    const response = await fetchApi<ApiResponse<CalculationResult>>(`${BASE}/calculate`, {
      method: 'POST',
      body: JSON.stringify(input),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    if (!response.data) {
      throw new Error('Không thể tính toán định mức chỉ')
    }

    return response.data
  },

  /**
   * Tính toán định mức chỉ cho nhiều mã hàng cùng lúc (batch)
   * @param items - Array of CalculationInput (max 100)
   * @param includeInventoryPreview - Include inventory availability preview
   * @returns Array of calculation results
   */
  async calculateBatch(
    items: CalculationInput[],
    includeInventoryPreview = false,
  ): Promise<CalculationResult[]> {
    const response = await fetchApi<ApiResponse<CalculationResult[]>>(`${BASE}/calculate-batch`, {
      method: 'POST',
      body: JSON.stringify({ items, include_inventory_preview: includeInventoryPreview }),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },

  /**
   * Tính toán định mức chỉ theo đơn hàng (PO)
   * @param input - CalculateByPOInput with po_id
   * @returns Array of calculation results for each PO item
   */
  async calculateByPO(input: CalculateByPOInput): Promise<POCalculationResult[]> {
    const response = await fetchApi<ApiResponse<POCalculationResult[]>>(`${BASE}/calculate-by-po`, {
      method: 'POST',
      body: JSON.stringify(input),
    })

    if (response.error) {
      throw new Error(response.error)
    }

    return response.data || []
  },
}
