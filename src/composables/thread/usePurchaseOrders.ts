import { ref, computed } from 'vue'
import { purchaseOrderService } from '@/services'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type {
  PurchaseOrder,
  CreatePurchaseOrderDTO,
  UpdatePurchaseOrderDTO,
  PurchaseOrderFilter,
} from '@/types/thread'

export function usePurchaseOrders() {
  const purchaseOrders = ref<PurchaseOrder[]>([])
  const error = ref<string | null>(null)
  const filters = ref<PurchaseOrderFilter>({})
  const selectedPurchaseOrder = ref<PurchaseOrder | null>(null)

  const currentPage = ref(1)
  const pageSize = ref(25)
  const sortBy = ref('created_at')
  const descending = ref(true)
  const totalCount = ref(0)

  const snackbar = useSnackbar()
  const loading = useLoading()

  const isLoading = computed(() => loading.isLoading.value)
  const purchaseOrderCount = computed(() => purchaseOrders.value.length)

  const clearError = () => {
    error.value = null
  }

  const fetchPurchaseOrders = async (newFilters?: PurchaseOrderFilter): Promise<void> => {
    clearError()

    if (newFilters) {
      filters.value = { ...filters.value, ...newFilters }
    }

    try {
      const result = await loading.withLoading(async () => {
        return await purchaseOrderService.getPaginated({
          page: currentPage.value,
          pageSize: pageSize.value,
          sortBy: sortBy.value,
          descending: descending.value,
          status: filters.value.status,
          priority: filters.value.priority,
          customer_name: filters.value.customer_name,
          po_number: filters.value.po_number,
        })
      })

      purchaseOrders.value = result.data
      totalCount.value = result.count
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] fetchPurchaseOrders error:', err)
    }
  }

  const handleTableRequest = async (props: {
    pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean }
  }): Promise<void> => {
    const { page, rowsPerPage, sortBy: sort, descending: desc } = props.pagination
    currentPage.value = page
    pageSize.value = rowsPerPage
    sortBy.value = sort || 'created_at'
    descending.value = desc
    await fetchPurchaseOrders()
  }

  const fetchPurchaseOrderById = async (id: number): Promise<void> => {
    clearError()

    try {
      const data = await loading.withLoading(async () => {
        return await purchaseOrderService.getById(id)
      })

      selectedPurchaseOrder.value = data
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] fetchPurchaseOrderById error:', err)
    }
  }

  const createPurchaseOrder = async (data: CreatePurchaseOrderDTO): Promise<PurchaseOrder | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await purchaseOrderService.create(data)
      })

      snackbar.success('Tao don hang thanh cong')
      await fetchPurchaseOrders()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] createPurchaseOrder error:', err)
      return null
    }
  }

  const updatePurchaseOrder = async (id: number, data: UpdatePurchaseOrderDTO): Promise<PurchaseOrder | null> => {
    clearError()
    try {
      const result = await loading.withLoading(async () => {
        return await purchaseOrderService.update(id, data)
      })

      snackbar.success('Cap nhat don hang thanh cong')
      await fetchPurchaseOrders()
      return result
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] updatePurchaseOrder error:', err)
      return null
    }
  }

  const deletePurchaseOrder = async (id: number): Promise<boolean> => {
    clearError()
    try {
      await loading.withLoading(async () => {
        return await purchaseOrderService.delete(id)
      })

      snackbar.success('Xoa don hang thanh cong')
      await fetchPurchaseOrders()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      error.value = errorMessage
      snackbar.error(errorMessage)
      console.error('[usePurchaseOrders] deletePurchaseOrder error:', err)
      return false
    }
  }

  return {
    purchaseOrders,
    error,
    filters,
    selectedPurchaseOrder,
    currentPage,
    pageSize,
    totalCount,
    isLoading,
    purchaseOrderCount,
    clearError,
    fetchPurchaseOrders,
    fetchPurchaseOrderById,
    createPurchaseOrder,
    updatePurchaseOrder,
    deletePurchaseOrder,
    handleTableRequest,
  }
}
