import { ref, computed } from 'vue'
import { guideService } from '@/services/guideService'
import { useSnackbar } from '@/composables/useSnackbar'
import type { GuideListItem } from '@/types/guides'

export function useGuides() {
  const guides = ref<GuideListItem[]>([])
  const loading = ref(false)
  const search = ref('')
  const snackbar = useSnackbar()

  async function fetchGuides() {
    loading.value = true
    try {
      guides.value = await guideService.getAll(search.value || undefined)
    } catch {
      snackbar.error('Lỗi khi tải danh sách hướng dẫn')
    } finally {
      loading.value = false
    }
  }

  async function removeGuide(id: string) {
    try {
      await guideService.remove(id)
      guides.value = guides.value.filter(g => g.id !== id)
      snackbar.success('Đã xóa bài hướng dẫn')
    } catch {
      snackbar.error('Lỗi khi xóa bài hướng dẫn')
    }
  }

  async function togglePublish(id: string) {
    try {
      const updated = await guideService.togglePublish(id)
      const idx = guides.value.findIndex(g => g.id === id)
      if (idx !== -1) {
        guides.value[idx] = { ...guides.value[idx], status: updated.status, published_at: updated.published_at }
      }
      snackbar.success(updated.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Đã chuyển về nháp')
    } catch {
      snackbar.error('Lỗi khi thay đổi trạng thái')
    }
  }

  return {
    guides: computed(() => guides.value),
    loading: computed(() => loading.value),
    search,
    fetchGuides,
    removeGuide,
    togglePublish,
  }
}
