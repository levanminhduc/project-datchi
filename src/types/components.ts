/**
 * Types for Quasar components
 */

export interface BaseProps {
  class?: string
  style?: string | Record<string, string>
}

export interface DataTableColumn {
  name: string
  label: string
  field: string | ((row: any) => any)
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  format?: (val: any) => string
  style?: string
  classes?: string
}

export interface SelectOption {
  label: string
  value: string | number
}

export interface TreeNode {
  label: string
  id: string
  children?: TreeNode[]
  icon?: string
  expandable?: boolean
}

export interface CarouselSlide {
  src: string
  caption?: string
}

export interface ExpansionItem {
  label: string
  caption?: string
  icon?: string
  value?: any
}

export interface MenuItem {
  label: string
  icon?: string
  value?: any
  separator?: boolean
  disable?: boolean
}

export interface TimelineEntry {
  title: string
  subtitle?: string
  body?: string
  color?: string
  icon?: string
  side?: 'left' | 'right'
}

export interface ListItem {
  label: string
  caption?: string
  icon?: string
  avatar?: string
  value?: any
  disable?: boolean
  to?: string
  href?: string
}

export interface TabConfig {
  name: string
  label: string
  icon?: string
  disable?: boolean
}

export interface NavItem {
  value: any
  icon: string
  label: string
}

export interface RadioOption {
  label: string
  value: any
}

export interface ChipItem {
  label: string
  value?: any
  color?: string
  icon?: string
  removable?: boolean
}
