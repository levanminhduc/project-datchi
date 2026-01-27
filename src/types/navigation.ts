export interface NavItem {
  label: string
  icon: string
  to: string
  badge?: number | string
  badgeColor?: string
}

export interface NavSection {
  title?: string
  items: NavItem[]
}
