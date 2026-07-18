import { ref, computed } from 'vue'
import type { HubNavGroup, HubNavItem, NavItem } from '@/types/navigation'

const MOBILE_BREAKPOINT = 1024
const isOpen = ref(window.innerWidth >= MOBILE_BREAKPOINT)

const HUB_EXCLUDE_GROUPS = new Set(['Nhân Sự', 'Quản Lý Hệ Thống'])

const navItems: NavItem[] = [
  { label: 'Trang Chủ', icon: 'o_home', to: '/#top' },
  // {
  //   label: 'Nhân Sự',
  //   icon: 'o_people',
  //   to: '/nhan-su#top',
  //   children: [
  //     { label: 'Danh Sách Nhân Viên', icon: 'o_list', to: '/nhan-su/danh-sach' }
  //   ]
  // },
  {
    label: 'Kỹ Thuật',
    icon: 'o_design_services',
    to: '/ky-thuat#top',
    children: [
      { label: 'Mã Hàng', icon: 'o_checkroom', to: '/thread/styles' },
      { label: 'D/S Style đã có Định Mức', icon: 'o_fact_check', to: '/thread/styles/with-specs' }
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
    label: 'Lãnh Đạo',
    icon: 'o_workspace_premium',
    to: '/lanh-dao#top',
    children: [
      { label: 'Lãnh Đạo Ký Duyệt', icon: 'o_approval', to: '/thread/weekly-order/leader-review' }
    ]
  },
  {
    label: 'Quản Lý Chỉ',
    icon: 'o_linear_scale',
    to: '/thread#top',
    children: [
      // { label: 'Dashboard', icon: 'o_dashboard', to: '/thread/dashboard' },
      { label: 'Theo Dõi & Nhập Kho', icon: 'o_local_shipping', to: '/thread/weekly-order/deliveries' },
      { label: 'Xuất Kho', icon: 'o_output', to: '/thread/issues/v2' },
      { label: 'Tồn Kho', icon: 'o_inventory', to: '/thread/inventory' },
      // { label: 'Trả Kho', icon: 'o_assignment_return', to: '/thread/return' },
      // { label: 'Mượn Chỉ', icon: 'o_swap_horiz', to: '/thread/loans' },
      // { label: 'Chuyển Kho', icon: 'o_compare_arrows', to: '/thread/batch/transfer' },
      { label: 'Chuyển kho theo Tuần', icon: 'o_swap_horiz', to: '/thread/transfer-reserved' },
      { label: 'Báo Cáo Xuất Kho', icon: 'o_history', to: '/thread/issues/export-history' }
    ]
  },
  {
    label: 'Danh Mục',
    icon: 'o_folder_open',
    to: '/danh-muc#top',
    children: [
      { label: 'Nhà Cung Cấp', icon: 'o_store', to: '/thread/suppliers' },
      { label: 'Loại Chỉ', icon: 'o_category', to: '/thread' },
      { label: 'Màu Sắc', icon: 'o_palette', to: '/thread/colors' },
      { label: 'Đơn Hàng (PO)', icon: 'o_receipt_long', to: '/thread/purchase-orders' },
      { label: 'Import Sub-Art', icon: 'o_upload_file', to: '/thread/sub-arts' },
      { label: 'Trợ Lý Tra Cứu', icon: 'o_manage_search', to: '/thread/chat-assistant' }
    ]
  },
  {
    label: 'Quản Lý Hệ Thống',
    icon: 'o_admin_panel_settings',
    to: '/he-thong#top',
    children: [
      { label: 'Hướng Dẫn', icon: 'o_menu_book', to: '/guides' },
      { label: 'Thông Báo Hệ Thống', icon: 'o_campaign', to: '/announcements#top' },
      { label: 'Phân Quyền', icon: 'o_security', to: '/phan-quyen#top' },
      { label: 'Cài Đặt', icon: 'o_settings', to: '/settings' }
    ]
  }
]

const HUB_GROUP_COLORS: Record<string, string> = {
  'Kỹ Thuật': '#3F51B5',
  'Kế Hoạch': '#673AB7',
  'Lãnh Đạo': '#C62828',
  'Quản Lý Chỉ': '#1976D2',
  'Danh Mục': '#009688',
}

const HUB_GROUP_PALETTES: Record<string, string[]> = {
  'Kỹ Thuật': ['#3F51B5', '#5C6BC0'],
  'Kế Hoạch': ['#673AB7', '#7E57C2'],
  'Lãnh Đạo': ['#C62828'],
  'Quản Lý Chỉ': ['#1976D2', '#1E88E5', '#00897B', '#26A69A', '#43A047', '#FB8C00', '#8E24AA', '#546E7A'],
  'Danh Mục': ['#009688', '#26A69A', '#EC407A', '#5C6BC0', '#78909C', '#8D6E63', '#00ACC1'],
}

const HUB_ITEM_CAPTIONS: Record<string, string> = {
  '/thread/styles': 'Style & thông số kỹ thuật',
  '/thread/styles/with-specs': 'Style đã thiết lập định mức chỉ',
  '/thread/weekly-order': 'Tính nhu cầu, tạo đơn tuần',
  '/thread/weekly-order/history': 'Các chu kỳ đặt hàng trước',
  '/thread/weekly-order/leader-review': 'Phê duyệt đơn đặt hàng tuần',
  '/thread/dashboard': 'Biểu đồ & phân tích tồn kho',
  '/thread/weekly-order/deliveries': 'Nhận hàng từ đơn đặt',
  '/thread/issues/v2': 'Cấp chỉ cho sản xuất',
  '/thread/inventory': 'Tra cứu côn chỉ theo kho',
  '/thread/return': 'Thu hồi & xác nhận chỉ thừa',
  '/thread/loans': 'Cho mượn & theo dõi hoàn trả',
  '/thread/batch/transfer': 'Điều chuyển giữa các kho',
  '/thread/transfer-reserved': 'Chuyển chỉ đã reserve theo tuần',
  '/thread/purchase-orders': 'Quản lý đơn mua chỉ',
  '/thread': 'NCC × Tex × Màu',
  '/thread/colors': 'Bảng màu chỉ theo NCC',
  '/thread/suppliers': 'Đối tác cung cấp chỉ',
  '/thread/sub-arts': 'Nhập định mức từ file',
  '/thread/issues/export-history': 'Tra cứu các lần xuất kho',
  '/thread/chat-assistant': 'Hỏi đáp nhanh về kho chỉ',
}

function buildHubNavGroups(): HubNavGroup[] {
  const groups: HubNavGroup[] = []

  for (const item of navItems) {
    if (!item.children?.length || HUB_EXCLUDE_GROUPS.has(item.label)) continue

    const palette = HUB_GROUP_PALETTES[item.label] ?? ['#1976D2']
    const items: HubNavItem[] = []

    for (const child of item.children) {
      if (!child.to) continue
      items.push({
        title: child.label,
        icon: child.icon,
        to: child.to,
        color: palette[items.length % palette.length] ?? '#1976D2',
        caption: HUB_ITEM_CAPTIONS[child.to] ?? '',
      })
    }

    groups.push({
      label: item.label,
      icon: item.icon,
      color: HUB_GROUP_COLORS[item.label] ?? '#1976D2',
      items,
    })
  }

  return groups
}

const hubNavGroups = buildHubNavGroups()

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
    hubNavGroups,
    toggle,
    open,
    close
  }
}
