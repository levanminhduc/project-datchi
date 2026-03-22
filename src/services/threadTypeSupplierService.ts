/**
 * Thread Type Supplier Service
 *
 * API client for managing thread type - supplier relationships.
 * Each thread type can be sourced from multiple suppliers,
 * each with their own supplier_item_code and unit_price.
 */

import { fetchApi } from './api'
import type {
  ThreadTypeSupplier,
  ThreadTypeSupplierWithRelations,
  ThreadTypeSupplierFormData,
  LinkSupplierFormData,
  ThreadTypeSupplierFilters
} from '@/types/thread/thread-type-supplier'

interface ApiResponse<T> {
  data: T | null
  error: string | null
  message?: string
}

const BASE = '/api/thread-type-suppliers'

export const threadTypeSupplierService = {
  /**
   * Lấy danh sách liên kết loại chỉ - nhà cung cấp với filters
   */
  async getAll(filters?: ThreadTypeSupplierFilters): Promise<ThreadTypeSupplierWithRelations[]> {
    const params = new URLSearchParams()
    if (filters?.thread_type_id) params.append('thread_type_id', filters.thread_type_id.toString())
    if (filters?.supplier_id) params.append('supplier_id', filters.supplier_id.toString())
    if (filters?.is_active !== undefined) params.append('is_active', filters.is_active.toString())
    if (filters?.search) params.append('search', filters.search)

    const url = `${BASE}${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetchApi<ApiResponse<ThreadTypeSupplierWithRelations[]>>(url)
    return response.data || []
  },

  /**
   * Lấy thông tin chi tiết một liên kết
   */
  async getById(id: number): Promise<ThreadTypeSupplierWithRelations> {
    const response = await fetchApi<ApiResponse<ThreadTypeSupplierWithRelations>>(`${BASE}/${id}`)
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Tạo liên kết mới
   */
  async create(data: ThreadTypeSupplierFormData): Promise<ThreadTypeSupplierWithRelations> {
    const response = await fetchApi<ApiResponse<ThreadTypeSupplierWithRelations>>(BASE, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Cập nhật liên kết
   */
  async update(
    id: number, 
    data: Partial<Omit<ThreadTypeSupplierFormData, 'thread_type_id' | 'supplier_id'>> & { is_active?: boolean }
  ): Promise<ThreadTypeSupplierWithRelations> {
    const response = await fetchApi<ApiResponse<ThreadTypeSupplierWithRelations>>(`${BASE}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
    if (response.error) throw new Error(response.error)
    return response.data!
  },

  /**
   * Xóa liên kết (hard delete)
   */
  async remove(id: number): Promise<void> {
    const response = await fetchApi<ApiResponse<ThreadTypeSupplier | null>>(`${BASE}/${id}`, {
      method: 'DELETE'
    })
    if (response.error) throw new Error(response.error)
  },

  // ============ THREAD TYPE CONTEXT ============

  /**
   * Lấy danh sách nhà cung cấp cho một loại chỉ
   */
  async getSuppliersByThreadType(
    threadTypeId: number, 
    isActive?: boolean
  ): Promise<ThreadTypeSupplierWithRelations[]> {
    const params = new URLSearchParams()
    if (isActive !== undefined) params.append('is_active', isActive.toString())

    const url = `${BASE}/by-thread/${threadTypeId}${params.toString() ? '?' + params.toString() : ''}`
    const response = await fetchApi<ApiResponse<ThreadTypeSupplierWithRelations[]>>(url)
    return response.data || []
  },

  /**
   * Liên kết nhà cung cấp với loại chỉ
   */
  async linkSupplierToThread(
    threadTypeId: number, 
    data: LinkSupplierFormData
  ): Promise<ThreadTypeSupplierWithRelations> {
    const response = await fetchApi<ApiResponse<ThreadTypeSupplierWithRelations>>(
      `${BASE}/by-thread/${threadTypeId}`,
      {
        method: 'POST',
        body: JSON.stringify(data)
      }
    )
    if (response.error) throw new Error(response.error)
    return response.data!
  }
}
