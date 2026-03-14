import { ref, computed } from 'vue'
import { styleColorService } from '@/services/styleColorService'
import { useSnackbar } from '../useSnackbar'
import type { StyleColor, CreateStyleColorDTO } from '@/types/thread'

export function useStyleColors() {
  const styleColors = ref<StyleColor[]>([])
  const isLoading = ref(false)
  const snackbar = useSnackbar()

  const activeStyleColors = computed(() => styleColors.value.filter(c => c.is_active))

  const fetchStyleColors = async (styleId: number) => {
    isLoading.value = true
    try {
      styleColors.value = await styleColorService.getByStyleId(styleId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Lỗi tải màu hàng'
      snackbar.error(msg)
    } finally {
      isLoading.value = false
    }
  }

  const createStyleColor = async (styleId: number, data: CreateStyleColorDTO): Promise<StyleColor | null> => {
    try {
      const newColor = await styleColorService.create(styleId, data)
      styleColors.value = [...styleColors.value, newColor]
      snackbar.success('Thêm màu hàng thành công')
      return newColor
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể thêm màu hàng'
      snackbar.error(msg)
      return null
    }
  }

  const deleteStyleColor = async (styleId: number, id: number): Promise<boolean> => {
    try {
      await styleColorService.remove(styleId, id)
      styleColors.value = styleColors.value.filter(c => c.id !== id)
      snackbar.success('Đã xóa màu hàng')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể xóa'
      snackbar.error(msg)
      return false
    }
  }

  return {
    styleColors,
    activeStyleColors,
    isLoading,
    fetchStyleColors,
    createStyleColor,
    deleteStyleColor,
  }
}
