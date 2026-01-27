import type { Size, Color, BaseComponentProps } from './base'
import type { QTableColumn } from 'quasar'

export interface DataTableProps extends BaseComponentProps {
  /** Table rows data */
  rows: any[]
  /** Column definitions */
  columns: QTableColumn[]
  /** Row key field */
  rowKey?: string
  /** Loading state */
  loading?: boolean
  /** Filter string */
  filter?: string
  /** Pagination config */
  pagination?: {
    page: number
    rowsPerPage: number
    sortBy?: string
    descending?: boolean
    rowsNumber?: number
  }
  /** Rows per page options */
  rowsPerPageOptions?: number[]
  /** Selection mode */
  selection?: 'none' | 'single' | 'multiple'
  /** Selected rows */
  selected?: any[]
  /** Empty state icon */
  emptyIcon?: string
  /** Empty state title */
  emptyTitle?: string
  /** Empty state subtitle */
  emptySubtitle?: string
  /** Flat style */
  flat?: boolean
  /** Bordered */
  bordered?: boolean
  /** Square corners */
  square?: boolean
  /** Dense rows */
  dense?: boolean
  /** Dark mode */
  dark?: boolean
  /** Hide header */
  hideHeader?: boolean
  /** Hide bottom */
  hideBottom?: boolean
  /** Hide pagination */
  hidePagination?: boolean
  /** Hide selected banner */
  hideSelectedBanner?: boolean
  /** No data label */
  noDataLabel?: string
  /** No results label */
  noResultsLabel?: string
  /** Loading label */
  loadingLabel?: string
  /** Separator type */
  separator?: 'horizontal' | 'vertical' | 'cell' | 'none'
  /** Wrap cells */
  wrapCells?: boolean
  /** Virtual scroll */
  virtualScroll?: boolean
  /** Virtual scroll slice size */
  virtualScrollSliceSize?: number
  /** Virtual scroll item size */
  virtualScrollItemSize?: number
  /** Binary state sort */
  binaryStateSort?: boolean
  /** Column sort order */
  columnSortOrder?: 'ad' | 'da'
  /** Sort method */
  sortMethod?: (rows: readonly any[], sortBy: string, descending: boolean) => readonly any[]
  /** Title */
  title?: string
  /** Grid mode */
  grid?: boolean
  /** Grid header */
  gridHeader?: boolean
  /** Card container class */
  cardContainerClass?: string
  /** Card container style */
  cardContainerStyle?: string | object
  /** Card class */
  cardClass?: string
  /** Card style */
  cardStyle?: string | object
  /** Table class */
  tableClass?: string
  /** Table style */
  tableStyle?: string | object
  /** Table header class */
  tableHeaderClass?: string
  /** Table header style */
  tableHeaderStyle?: string | object
  /** Color */
  color?: Color | string
  /** Icon first page */
  iconFirstPage?: string
  /** Icon prev page */
  iconPrevPage?: string
  /** Icon next page */
  iconNextPage?: string
  /** Icon last page */
  iconLastPage?: string
}

export interface AppListProps extends BaseComponentProps {
  /** Bordered style */
  bordered?: boolean
  /** Dense padding */
  dense?: boolean
  /** Separator type */
  separator?: boolean
  /** Padding */
  padding?: boolean
  /** Dark mode */
  dark?: boolean
}

export interface ListItemProps extends BaseComponentProps {
  /** Clickable */
  clickable?: boolean
  /** Active state */
  active?: boolean
  /** Active class */
  activeClass?: string
  /** Focused state */
  focused?: boolean
  /** Manual focus */
  manualFocus?: boolean
  /** Dense padding */
  dense?: boolean
  /** Inset level */
  insetLevel?: number
  /** To route */
  to?: string | object
  /** Href link */
  href?: string
  /** Target */
  target?: string
  /** Disable */
  disable?: boolean
  /** Dark mode */
  dark?: boolean
  /** v-ripple */
  ripple?: boolean | object
}

export interface AppBadgeProps extends BaseComponentProps {
  /** Badge color */
  color?: Color | string
  /** Text color */
  textColor?: string
  /** Floating position */
  floating?: boolean
  /** Transparent background */
  transparent?: boolean
  /** Multi-line */
  multiLine?: boolean
  /** Outline style */
  outline?: boolean
  /** Rounded corners */
  rounded?: boolean
  /** Label text */
  label?: string | number
  /** Align */
  align?: 'top' | 'middle' | 'bottom'
}

export interface AppChipProps extends BaseComponentProps {
  /** Chip label */
  label?: string
  /** Chip icon */
  icon?: string
  /** Icon on right */
  iconRight?: string
  /** Icon remove (for removable) */
  iconRemove?: string
  /** Icon selected */
  iconSelected?: string
  /** Color */
  color?: Color | string
  /** Text color */
  textColor?: string
  /** v-model for selected */
  modelValue?: boolean
  /** Selected state */
  selected?: boolean
  /** Square shape */
  square?: boolean
  /** Outline style */
  outline?: boolean
  /** Clickable */
  clickable?: boolean
  /** Removable */
  removable?: boolean
  /** Disable ripple */
  ripple?: boolean | object
  /** Disable */
  disable?: boolean
  /** Dense padding */
  dense?: boolean
  /** Size */
  size?: Size | string
  /** Dark mode */
  dark?: boolean
}

export interface AppCardProps extends BaseComponentProps {
  /** Flat style (no shadow) */
  flat?: boolean
  /** Bordered */
  bordered?: boolean
  /** Square corners */
  square?: boolean
  /** Dark mode */
  dark?: boolean
  /** Card tag */
  tag?: string
}

export interface CardSectionProps extends BaseComponentProps {
  /** Horizontal layout */
  horizontal?: boolean
}

export interface CardActionsProps extends BaseComponentProps {
  /** Align actions */
  align?: 'left' | 'center' | 'right' | 'between' | 'around' | 'evenly' | 'stretch'
  /** Vertical layout */
  vertical?: boolean
}

export interface InfoCardProps extends BaseComponentProps {
  /** Card title */
  title?: string
  /** Card subtitle */
  subtitle?: string
  /** Card icon */
  icon?: string
  /** Icon color */
  iconColor?: string
  /** Flat style */
  flat?: boolean
  /** Bordered */
  bordered?: boolean
}

export interface StatCardProps extends BaseComponentProps {
  /** Stat label */
  label: string
  /** Stat value */
  value: string | number
  /** Icon */
  icon?: string
  /** Icon color */
  iconColor?: string
  /** Icon background color */
  iconBgColor?: string
  /** Trend value (e.g., "+5%") */
  trend?: string
  /** Trend is positive */
  trendPositive?: boolean
  /** Flat style */
  flat?: boolean
  /** Bordered */
  bordered?: boolean
}
