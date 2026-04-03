import { ref, computed } from 'vue'
import { announcementService } from '@/services/announcement-service'
import type { Announcement } from '@/types/announcement'

const pendingAnnouncements = ref<Announcement[]>([])
const currentIndex = ref(0)
const isLoading = ref(false)
let fetched = false

export function useAnnouncements() {
  const currentAnnouncement = computed(() =>
    pendingAnnouncements.value[currentIndex.value] ?? null
  )

  const totalPending = computed(() => pendingAnnouncements.value.length)
  const currentPosition = computed(() => currentIndex.value + 1)

  async function fetchPending() {
    if (fetched) return
    isLoading.value = true
    try {
      pendingAnnouncements.value = await announcementService.getPending()
      currentIndex.value = 0
      fetched = true
    } catch {
      pendingAnnouncements.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function dismissCurrent() {
    const current = currentAnnouncement.value
    if (!current) return

    try {
      await announcementService.dismiss(current.id)
    } catch {
      // dismiss failed silently — still remove from local list
    }

    pendingAnnouncements.value = pendingAnnouncements.value.filter((a) => a.id !== current.id)
    if (currentIndex.value >= pendingAnnouncements.value.length) {
      currentIndex.value = Math.max(0, pendingAnnouncements.value.length - 1)
    }
  }

  function reset() {
    fetched = false
    pendingAnnouncements.value = []
    currentIndex.value = 0
  }

  return {
    currentAnnouncement,
    totalPending,
    currentPosition,
    isLoading,
    fetchPending,
    dismissCurrent,
    reset,
  }
}
