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
      { label: 'Tính Toán & Đặt Hàng', icon: 'o_shopping_cart', to: '/thread/weekly-order' },
      { label: 'Lịch Sử Đặt Hàng', icon: 'o_history', to: '/thread/weekly-order/history' }
    ]
  },
  {
    label: 'Danh Mục',
    icon: 'o_folder_open',
    to: '/danh-muc#top',
    children: [
      { label: 'Đơn Hàng (PO)', icon: 'o_receipt_long', to: '/thread/purchase-orders' },
      { label: 'Loại Chỉ', icon: 'o_category', to: '/thread' },
      { label: 'Màu Sắc', icon: 'o_palette', to: '/thread/colors' },
      { label: 'Nhà Cung Cấp', icon: 'o_store', to: '/thread/suppliers' }
    ]
  },
  {
    label: 'Kỹ Thuật',
    icon: 'o_engineering',
    to: '/ky-thuat#top',
    children: [
      { label: 'Mã Hàng', icon: 'o_checkroom', to: '/thread/styles' },
      { label: 'Import Sub-Art', icon: 'o_upload_file', to: '/thread/sub-arts' }
    ]
  },
  { label: 'Kho', icon: 'o_inventory_2', to: '/kho#top' },
  {
    label: 'Quản Lý Chỉ',
    icon: 'o_linear_scale',
    to: '/thread#top',
    children: [
      { label: 'Dashboard', icon: 'o_dashboard', to: '/thread/dashboard' },
      { label: 'Tồn Kho', icon: 'o_inventory', to: '/thread/inventory' },
      { label: 'Xuất Kho', icon: 'o_output', to: '/thread/issues/v2' },
      { label: 'Trả Kho V2', icon: 'o_assignment_return', to: '/thread/issues/v2/return' },
      { label: 'Theo Dõi Giao Hàng', icon: 'o_local_shipping', to: '/thread/weekly-order/deliveries' },
      { label: 'Mượn Chỉ', icon: 'o_swap_horiz', to: '/thread/loans' }
    ]
  },
  { label: 'Phân Quyền', icon: 'o_admin_panel_settings', to: '/phan-quyen#top' },
  { label: 'Cài Đặt', icon: 'o_settings', to: '/settings' }
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
