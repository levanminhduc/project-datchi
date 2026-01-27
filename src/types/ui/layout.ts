/**
 * Layout component types
 */
import type { Color } from './base'

/** AppToolbar props */
export interface AppToolbarProps {
  inset?: boolean
  dense?: boolean
}

/** AppSeparator props */
export interface AppSeparatorProps {
  dark?: boolean
  spaced?: boolean | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  inset?: boolean | 'item' | 'item-thumbnail'
  vertical?: boolean
  color?: Color
  size?: string
}

/** AppSpace props */
export interface AppSpaceProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | string
  horizontal?: boolean
}

/** PageHeader props */
export interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  backTo?: string
  showBack?: boolean
  dense?: boolean
}

/** SectionHeader props */
export interface SectionHeaderProps {
  title: string
  subtitle?: string
  icon?: string
  dense?: boolean
  bordered?: boolean
}

/** Drawer side type */
export type DrawerSide = 'left' | 'right'

/** Drawer behavior type */
export type DrawerBehavior = 'default' | 'desktop' | 'mobile'

/** AppDrawer props */
export interface AppDrawerProps {
  modelValue?: boolean
  side?: DrawerSide
  width?: number
  mini?: boolean
  miniWidth?: number
  miniToOverlay?: boolean
  breakpoint?: number
  behavior?: DrawerBehavior
  bordered?: boolean
  elevated?: boolean
  overlay?: boolean
  persistent?: boolean
  noSwipeOpen?: boolean
  noSwipeClose?: boolean
  noSwipeBackdrop?: boolean
}
