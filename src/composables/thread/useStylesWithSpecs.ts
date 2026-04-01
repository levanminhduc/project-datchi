import { ref, computed } from 'vue'
import { styleService } from '@/services/styleService'
import { useSnackbar } from '../useSnackbar'
import { useLoading } from '../useLoading'
import { getErrorMessage } from '@/utils/errorMessages'
import type { StyleWithSpecs } from '@/types/thread'

export function useStylesWithSpecs() {
  const styles = ref<StyleWithSpecs[]>([])
  const totalCount = ref(0)
  const currentPage = ref(1)
  const pageSize = ref(25)
  const sortBy = ref('style_code')
  const descending = ref(false)
  const searchQuery = ref('')

  const snackbar = useSnackbar()
  const loading = useLoading()
  const isLoading = computed(() => loading.isLoading.value)

  async function fetchStyles() {
    try {
      const result = await loading.withLoading(() =>
        styleService.getWithSpecs({
          page: currentPage.value,
          pageSize: pageSize.value,
          search: searchQuery.value || undefined,
          sortBy: sortBy.value,
          descending: descending.value,
        })
      )
      styles.value = result.data
      totalCount.value = result.total
    } catch (err) {
      snackbar.error(getErrorMessage(err))
    }
  }

  async function handleTableRequest(props: {
    pagination: { page: number; rowsPerPage: number; sortBy: string; descending: boolean }
  }) {
    const { page, rowsPerPage, sortBy: sort, descending: desc } = props.pagination
    currentPage.value = page
    pageSize.value = rowsPerPage
    sortBy.value = sort || 'style_code'
    descending.value = desc
    await fetchStyles()
  }

  return {
    styles,
    totalCount,
    currentPage,
    pageSize,
    sortBy,
    descending,
    searchQuery,
    isLoading,
    fetchStyles,
    handleTableRequest,
  }
}
