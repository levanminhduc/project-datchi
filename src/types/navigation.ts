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

export interface HubNavItem {
  title: string
  icon: string
  to: string
  color: string
  caption: string
}

export interface HubNavGroup {
  label: string
  icon: string
  color: string
  items: HubNavItem[]
}
