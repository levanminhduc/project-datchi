/**
 * Base types for UI components
 */

// Size variants
export type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// Color variants (Quasar colors)
export type Color =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'positive'
  | 'negative'
  | 'info'
  | 'warning'
  | 'dark'
  | 'white'

// Button variants
export type ButtonVariant = 'filled' | 'outlined' | 'flat' | 'text'

// Base props for all components
export interface BaseComponentProps {
  class?: string
  style?: string | Record<string, string>
}

// Validation rule type
export type ValidationRule =
  | ((val: any) => boolean | string)
  | ((val: any) => Promise<boolean | string>)

// Common labeled props
export interface LabeledProps {
  label?: string
  hint?: string
}

// Validatable props
export interface ValidatableProps {
  rules?: ValidationRule[]
  required?: boolean
  errorMessage?: string
}

// Pagination config
export interface PaginationConfig {
  page: number
  rowsPerPage: number
  sortBy?: string
  descending?: boolean
  rowsNumber?: number
}

// Select option (enhanced version with generics)
export interface UISelectOption<T = any> {
  label: string
  value: T
  disable?: boolean
  description?: string
  icon?: string
}

// Menu item (enhanced version with onClick handler)
export interface UIMenuItem {
  label: string
  icon?: string
  value?: any
  separator?: boolean
  disable?: boolean
  to?: string
  href?: string
  onClick?: () => void
}
