import { ref, computed } from 'vue'
import type { NavItem } from '@/types/navigation'

const isOpen = ref(true)

const navItems: NavItem[] = [
  { label: 'Trang Chủ', icon: 'home', to: '/#top' },
  { label: 'Nhân Sự', icon: 'people', to: '/nhan-su#top' },
  { label: 'Kế Hoạch', icon: 'event_note', to: '/ke-hoach#top' },
  { label: 'Kỹ Thuật', icon: 'engineering', to: '/ky-thuat#top' },
  { label: 'Kho', icon: 'inventory_2', to: '/kho#top' },
  { label: 'Phân Quyền', icon: 'admin_panel_settings', to: '/phan-quyen#top' }
]

export function useSidebar() {
  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  const open = () => {
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
  }

  return {
    isOpen: computed({
      get: () => isOpen.value,
      set: (val: boolean) => {
        isOpen.value = val
      }
    }),
    navItems,
    toggle,
    open,
    close
  }
}
