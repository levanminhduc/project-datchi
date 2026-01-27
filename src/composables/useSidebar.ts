import { ref, computed } from 'vue'
import type { NavItem } from '@/types/navigation'

const isOpen = ref(true)

const navItems: NavItem[] = [
  { label: 'Trang Chủ', icon: 'home', to: '/' },
  { label: 'Nhân Sự', icon: 'people', to: '/nhan-su' },
  { label: 'Kế Hoạch', icon: 'event_note', to: '/ke-hoach' },
  { label: 'Kỹ Thuật', icon: 'engineering', to: '/ky-thuat' },
  { label: 'Kho', icon: 'inventory_2', to: '/kho' },
  { label: 'Phân Quyền', icon: 'admin_panel_settings', to: '/phan-quyen' }
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
    isOpen: computed(() => isOpen.value),
    navItems,
    toggle,
    open,
    close
  }
}
