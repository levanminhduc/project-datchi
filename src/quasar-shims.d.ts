/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Quasar Type Extensions for Vue 3 strict templates
 * Fixes type errors with Quasar components in strict mode
 */

import type { Directive } from 'vue'

// Extend GlobalDirectives to include Quasar directives
declare module 'vue' {
  interface ComponentCustomProperties {
    vClosePopup: Directive<HTMLElement, boolean | void>
    vRipple: Directive<HTMLElement, boolean | { center?: boolean; color?: string } | void>
    vIntersection: Directive<HTMLElement, any>
    vMutation: Directive<HTMLElement, any>
    vScroll: Directive<HTMLElement, any>
    vScrollFire: Directive<HTMLElement, any>
    vTouchHold: Directive<HTMLElement, any>
    vTouchPan: Directive<HTMLElement, any>
    vTouchRepeat: Directive<HTMLElement, any>
    vTouchSwipe: Directive<HTMLElement, any>
    vGoBack: Directive<HTMLElement, any>
    vMorph: Directive<HTMLElement, any>
  }
}

// Extend Quasar component props that are missing in type definitions
declare module 'quasar' {
  // QInput extensions
  interface QInputProps {
    placeholder?: string
    onKeyup?: (event: KeyboardEvent) => void
    onClick?: (event: MouseEvent) => void
  }

  // QIcon extensions
  interface QIconProps {
    onClick?: (event: MouseEvent) => void
  }

  // QCard extensions
  interface QCardProps {
    onClick?: (event: MouseEvent) => void
  }

  // QTimelineEntry extensions
  interface QTimelineEntryProps {
    onClick?: (event: MouseEvent) => void
  }

  // QDialog extensions
  interface QDialogProps {
    title?: string
  }

  // QBtnDropdown extensions
  interface QBtnDropdownProps {
    round?: boolean
  }

  // QBtnToggle extensions
  interface QBtnToggleProps {
    square?: boolean
  }

  // QBanner extensions
  interface QBannerProps {
    inline?: boolean
  }

  // QCircularProgress extensions
  interface QCircularProgressProps {
    dark?: boolean
  }

  // QRange extensions
  interface QRangeProps {
    leftThumbClass?: string
    rightThumbClass?: string
  }

  // QSlider extensions
  interface QSliderProps {
    thumbClass?: string
  }

  // QToolbar extensions
  interface QToolbarProps {
    dense?: boolean
  }

  // QItem extensions
  interface QItemProps {
    ripple?: boolean | object
  }

  // QImg extensions
  interface QImgProps {
    noDefaultSpinner?: boolean
  }

  // QPagination extensions
  interface QPaginationProps {
    dense?: boolean
  }

  // QExpansionItem extensions
  interface QExpansionItemProps {
    ripple?: boolean | object
  }

  // QTabPanel extensions
  interface QTabPanelProps {
    keepAlive?: boolean
  }

  // QTd extensions
  interface QTdProps {
    align?: 'left' | 'center' | 'right'
  }

  // QPopupProxy extensions
  interface QPopupProxyProps {
    cover?: boolean
  }

  // QCheckbox extensions
  interface QCheckboxProps {
    required?: boolean
  }

  // QSelect extensions
  interface QSelectProps {
    searchable?: boolean
  }

  // QSeparator extensions
  interface QSeparatorProps {
    qMySm?: boolean
  }

  // QPopupEdit extensions
  interface QPopupEditProps {
    modelModifiers?: Record<string, boolean>
  }
}

export {}
