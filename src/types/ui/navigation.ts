/**
 * Navigation component types
 */
import type { Color } from './base'

/** Tab configuration */
export interface TabConfig {
  name: string
  label: string
  icon?: string
  disable?: boolean
  alert?: boolean | string
  alertIcon?: string
}

/** AppTabs props */
export interface AppTabsProps {
  modelValue?: string | number
  tabs?: TabConfig[]
  vertical?: boolean
  outsideArrows?: boolean
  mobileArrows?: boolean
  align?: 'left' | 'center' | 'right' | 'justify'
  breakpoint?: number
  activeColor?: Color
  indicatorColor?: Color
  dense?: boolean
  noCaps?: boolean
  inlineLabel?: boolean
  switchIndicator?: boolean
}

/** TabPanel props */
export interface TabPanelProps {
  name: string | number
  disable?: boolean
  keepAlive?: boolean
  keepAliveInclude?: string | RegExp | string[]
  keepAliveExclude?: string | RegExp | string[]
  keepAliveMax?: number
}

/** Breadcrumb item */
export interface BreadcrumbItem {
  label: string
  icon?: string
  to?: string
  href?: string
  disable?: boolean
}

/** AppBreadcrumbs props */
export interface AppBreadcrumbsProps {
  items?: BreadcrumbItem[]
  separator?: string
  separatorColor?: Color
  activeColor?: Color
  gutter?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl'
}

/** AppPagination props */
export interface AppPaginationProps {
  modelValue?: number
  min?: number
  max?: number
  maxPages?: number
  boundaryLinks?: boolean
  boundaryNumbers?: boolean
  directionLinks?: boolean
  ellipses?: boolean
  color?: Color
  textColor?: string
  activeColor?: Color
  activeTextColor?: string
  round?: boolean
  rounded?: boolean
  flat?: boolean
  outline?: boolean
  unelevated?: boolean
  dense?: boolean
  size?: string
  ripple?: boolean
  inputStyle?: string | Record<string, string>
  inputClass?: string
}

/** Stepper step configuration */
export interface StepConfig {
  name: string | number
  title: string
  caption?: string
  icon?: string
  activeIcon?: string
  doneIcon?: string
  errorIcon?: string
  color?: Color
  done?: boolean
  error?: boolean
  disable?: boolean
}

/** AppStepper props */
export interface AppStepperProps {
  modelValue?: string | number
  steps?: StepConfig[]
  vertical?: boolean
  headerNav?: boolean
  flat?: boolean
  bordered?: boolean
  alternativeLabels?: boolean
  contractedLabelBreakpoint?: number
  inactiveColor?: Color
  inactiveIcon?: string
  doneIcon?: string
  doneColor?: Color
  activeIcon?: string
  activeColor?: Color
  errorIcon?: string
  errorColor?: Color
  animated?: boolean
  keepAlive?: boolean
}

/** StepperStep props */
export interface StepperStepProps {
  name: string | number
  title: string
  caption?: string
  icon?: string
  activeIcon?: string
  doneIcon?: string
  errorIcon?: string
  color?: Color
  done?: boolean
  error?: boolean
  disable?: boolean
  headerNav?: boolean
}
