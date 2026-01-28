export interface NavItem {
  label: string
  icon: string
  to?: string
  badge?: number | string
  badgeColor?: string
  children?: NavItem[]
}

export interface NavSection {
  title?: string
  items: NavItem[]
}
