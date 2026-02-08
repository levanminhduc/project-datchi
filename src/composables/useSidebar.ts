import { ref, computed } from 'vue'
import type { NavItem } from '@/types/navigation'

const isOpen = ref(true)

const navItems: NavItem[] = [
  { label: 'Trang Chủ', icon: 'o_home', to: '/#top' },
  { 
    label: 'Nhân Sự', 
    icon: 'o_people', 
    to: '/nhan-su#top',
    children: [
      { label: 'Danh Sách Nhân Viên', icon: 'o_list', to: '/nhan-su/danh-sach' }
    ]
  },
  { 
    label: 'Kế Hoạch', 
    icon: 'o_event_note', 
    to: '/ke-hoach#top',
    children: [
      { label: 'Tính Toán Chỉ', icon: 'o_calculate', to: '/thread/calculation' },
      { label: 'Đặt Hàng Chỉ Tuần', icon: 'o_shopping_cart', to: '/thread/weekly-order' }
    ]
  },
  { 
    label: 'Kỹ Thuật', 
    icon: 'o_engineering', 
    to: '/ky-thuat#top',
    children: [
      { label: 'Mã Hàng', icon: 'o_checkroom', to: '/thread/styles' }
    ]
  },
  { label: 'Kho', icon: 'o_inventory_2', to: '/kho#top' },
  { 
    label: 'Quản Lý Chỉ', 
    icon: 'o_linear_scale', 
    to: '/thread#top',
    children: [
      { label: 'Dashboard', icon: 'o_dashboard', to: '/thread/dashboard' },
      { label: 'Loại Chỉ', icon: 'o_category', to: '/thread' },
      { label: 'Lô Hàng', icon: 'o_inventory_2', to: '/thread/lots' },
      { label: 'Tồn Kho', icon: 'o_inventory', to: '/thread/inventory' },
      { label: 'Phân Bổ', icon: 'o_assignment', to: '/thread/allocations' },
      { label: 'Thu Hồi', icon: 'o_assignment_return', to: '/thread/recovery' },
      { label: 'Màu Sắc', icon: 'o_palette', to: '/thread/colors' },
      { label: 'Nhà Cung Cấp', icon: 'o_local_shipping', to: '/thread/suppliers' }
    ]
  },
  { label: 'Phân Quyền', icon: 'o_admin_panel_settings', to: '/phan-quyen#top' }
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
