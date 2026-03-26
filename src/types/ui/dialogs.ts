import type { Color, UIMenuItem } from './base'

/**
 * Dialog type variants
 */
export type DialogType = 'info' | 'warning' | 'error' | 'success'

/**
 * Dialog position
 */
export type DialogPosition = 'standard' | 'top' | 'right' | 'bottom' | 'left'

/**
 * AppDialog props - Base dialog wrapper component
 */
export interface AppDialogProps {
  /** v-model for open state */
  modelValue: boolean
  /** Prevent closing on backdrop click */
  persistent?: boolean
  /** Maximize dialog */
  maximized?: boolean
  /** Full width dialog */
  fullWidth?: boolean
  /** Full height dialog */
  fullHeight?: boolean
  /** Show transition animation */
  transitionShow?: string
  /** Hide transition animation */
  transitionHide?: string
  /** Disable ESC key dismiss */
  noEscDismiss?: boolean
  /** Disable backdrop click dismiss */
  noBackdropDismiss?: boolean
  /** Dialog position */
  position?: DialogPosition
}

/**
 * ConfirmDialog props - Confirmation dialog with actions
 */
export interface ConfirmDialogProps extends AppDialogProps {
  /** Dialog title (default: 'Xác nhận') */
  title?: string
  /** Confirmation message */
  message: string
  /** Confirm button text (default: 'Đồng ý') */
  confirmText?: string
  /** Cancel button text (default: 'Hủy') */
  cancelText?: string
  /** Dialog type (default: 'info') */
  type?: DialogType
  /** Icon name */
  icon?: string
  /** Confirm button color */
  confirmColor?: Color
  /** Loading state */
  loading?: boolean
}

/**
 * FormDialog props - Dialog with form functionality
 */
export interface FormDialogProps extends AppDialogProps {
  /** Dialog title */
  title?: string
  /** Submit button text (default: 'Lưu') */
  submitText?: string
  /** Cancel button text (default: 'Hủy') */
  cancelText?: string
  /** Loading state */
  loading?: boolean
  /** Reset form on dialog close */
  resetOnClose?: boolean
}

/**
 * DeleteDialog props - Confirmation dialog for delete actions
 */
export interface DeleteDialogProps extends ConfirmDialogProps {
  /** Name of item being deleted (for confirmation display) */
  itemName?: string
  /** Require typing item name to confirm */
  requireConfirmation?: boolean
  /** Text user must type to confirm deletion */
  confirmationText?: string
}

/**
 * AppMenu props - Dropdown menu component
 */
export interface AppMenuProps {
  /** Menu items */
  items: UIMenuItem[]
  /** Anchor point on activator element */
  anchor?: string
  /** Self anchor point on menu */
  self?: string
  /** Menu offset [horizontal, vertical] */
  offset?: [number, number]
  /** Auto close menu after item click */
  autoClose?: boolean
}

/**
 * AppTooltip props - Tooltip wrapper component
 */
export interface AppTooltipProps {
  /** Tooltip text */
  text: string
  /** Anchor point on target element */
  anchor?: string
  /** Self anchor point on tooltip */
  self?: string
  /** Tooltip offset [horizontal, vertical] */
  offset?: [number, number]
  /** Show delay in milliseconds */
  delay?: number
  /** Maximum width */
  maxWidth?: string
  /** Hide delay in milliseconds */
  hideDelay?: number
  /** Show transition animation */
  transitionShow?: string
  /** Hide transition animation */
  transitionHide?: string
}

/**
 * PopupEdit props - Inline popup editor component
 */
export interface PopupEditProps {
  /** v-model for edited value */
  modelValue: any
  /** Popup title */
  title?: string
  /** Show save/cancel buttons */
  buttons?: boolean
  /** Save button label (default: 'Lưu') */
  labelSet?: string
  /** Cancel button label (default: 'Hủy') */
  labelCancel?: string
  /** Auto save on change */
  autoSave?: boolean
  /** Input type for editing */
  inputType?: 'text' | 'number' | 'textarea'
}
