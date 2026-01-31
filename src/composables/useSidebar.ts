import { ref, computed } from 'vue'
import type { NavItem } from '@/types/navigation'

const isOpen = ref(true)

const navItems: NavItem[] = [
  { label: 'Trang Chủ', icon: 'home', to: '/#top' },
  { 
    label: 'Nhân Sự', 
    icon: 'people', 
    to: '/nhan-su#top',
    children: [
      { label: 'Danh Sách Nhân Viên', icon: 'list', to: '/nhan-su/danh-sach' },
      { label: 'Thêm Mới', icon: 'person_add', to: '/nhan-su/them-moi' }
    ]
  },
  { label: 'Kế Hoạch', icon: 'event_note', to: '/ke-hoach#top' },
  { label: 'Kỹ Thuật', icon: 'engineering', to: '/ky-thuat#top' },
  { label: 'Kho', icon: 'inventory_2', to: '/kho#top' },
  { 
    label: 'Quản Lý Chỉ', 
    icon: 'linear_scale', 
    to: '/thread#top',
    children: [
      { label: 'Dashboard', icon: 'dashboard', to: '/thread/dashboard' },
      { label: 'Loại Chỉ', icon: 'category', to: '/thread' },
      { label: 'Tồn Kho', icon: 'inventory', to: '/thread/inventory' },
      { label: 'Phân Bổ', icon: 'assignment', to: '/thread/allocations' },
      { label: 'Thu Hồi', icon: 'assignment_return', to: '/thread/recovery' }
    ]
  },
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
