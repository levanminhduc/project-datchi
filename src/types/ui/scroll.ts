/**
 * Scroll component types
 */
import type { Color } from './base'

/** ScrollArea props */
export interface ScrollAreaProps {
  dark?: boolean
  thumbStyle?: string | Record<string, string>
  barStyle?: string | Record<string, string>
  contentStyle?: string | Record<string, string>
  contentActiveStyle?: string | Record<string, string>
  visible?: boolean
  delay?: number
  tabindex?: number | string
}

/** VirtualScroll props */
export interface VirtualScrollProps {
  items?: any[]
  itemsFn?: (from: number, size: number) => any[]
  itemsSize?: number
  virtualScrollSliceSize?: number | string
  virtualScrollSliceRatioBefore?: number | string
  virtualScrollSliceRatioAfter?: number | string
  virtualScrollItemSize?: number | string
  virtualScrollStickySizeStart?: number | string
  virtualScrollStickySizeEnd?: number | string
  scrollTarget?: Element | string
  tableColspan?: number | string
}

/** InfiniteScroll props */
export interface InfiniteScrollProps {
  offset?: number
  debounce?: number | string
  scrollTarget?: Element | string
  disable?: boolean
  reverse?: boolean
}

/** PullToRefresh props */
export interface PullToRefreshProps {
  color?: Color
  bgColor?: string
  icon?: string
  noMouse?: boolean
  disable?: boolean
  scrollTarget?: Element | string
}

/** Timeline entry configuration */
export interface TimelineEntryConfig {
  title: string
  subtitle?: string
  body?: string
  color?: Color
  icon?: string
  side?: 'left' | 'right'
  avatar?: string
}

/** Timeline props */
export interface TimelineProps {
  entries?: TimelineEntryConfig[]
  color?: Color
  side?: 'left' | 'right'
  layout?: 'dense' | 'comfortable' | 'loose'
  dark?: boolean
}

/** TimelineEntry props */
export interface TimelineEntryProps {
  title?: string
  subtitle?: string
  body?: string
  color?: Color
  icon?: string
  avatar?: string
  side?: 'left' | 'right'
  heading?: boolean
  tag?: string
}
