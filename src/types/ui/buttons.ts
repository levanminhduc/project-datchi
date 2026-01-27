import type { Size, Color, ButtonVariant, BaseComponentProps } from './base'

export interface AppButtonProps extends BaseComponentProps {
  /** Button color */
  color?: Color | string
  /** Button size */
  size?: Size
  /** Button variant style */
  variant?: ButtonVariant
  /** Show loading spinner */
  loading?: boolean
  /** Disable button */
  disable?: boolean
  /** Icon name (Material Icons) */
  icon?: string
  /** Icon on right side */
  iconRight?: string
  /** Button label */
  label?: string
  /** Round button */
  round?: boolean
  /** Dense padding */
  dense?: boolean
  /** Full width */
  block?: boolean
  /** No caps on label */
  noCaps?: boolean
  /** Button type */
  type?: 'button' | 'submit' | 'reset'
}

export interface IconButtonProps extends BaseComponentProps {
  /** Icon name */
  icon: string
  /** Button color */
  color?: Color | string
  /** Button size */
  size?: Size
  /** Disable button */
  disable?: boolean
  /** Show loading */
  loading?: boolean
  /** Flat style (default true) */
  flat?: boolean
  /** Round style (default true) */
  round?: boolean
  /** Dense padding */
  dense?: boolean
}

export interface ButtonGroupProps extends BaseComponentProps {
  /** Spread buttons evenly */
  spread?: boolean
  /** Stretch to full width */
  stretch?: boolean
  /** Flat style for all buttons */
  flat?: boolean
  /** Outlined style for all buttons */
  outline?: boolean
  /** Push style for all buttons */
  push?: boolean
  /** Rounded corners */
  rounded?: boolean
  /** Square corners */
  square?: boolean
  /** Unelevated style */
  unelevated?: boolean
}

export interface ButtonToggleProps extends BaseComponentProps {
  /** v-model value */
  modelValue?: any
  /** Options array */
  options: Array<{
    label?: string
    value: any
    icon?: string
    slot?: string
    disable?: boolean
  }>
  /** Toggle color */
  color?: Color | string
  /** Text color */
  textColor?: string
  /** Toggle color when active */
  toggleColor?: Color | string
  /** Toggle text color when active */
  toggleTextColor?: string
  /** Spread evenly */
  spread?: boolean
  /** No outline */
  outline?: boolean
  /** Flat style */
  flat?: boolean
  /** Unelevated */
  unelevated?: boolean
  /** No border radius */
  square?: boolean
  /** Rounded corners */
  rounded?: boolean
  /** Push effect */
  push?: boolean
  /** Dense padding */
  dense?: boolean
  /** Readonly mode */
  readonly?: boolean
  /** Disable all */
  disable?: boolean
  /** Stack vertically */
  stack?: boolean
  /** Stretch to fill */
  stretch?: boolean
  /** No caps */
  noCaps?: boolean
  /** Ripple effect */
  ripple?: boolean | object
  /** Size */
  size?: Size
  /** Clear selection allowed */
  clearable?: boolean
}

export interface ButtonDropdownProps extends BaseComponentProps {
  /** v-model for menu open state */
  modelValue?: boolean
  /** Dropdown color */
  color?: Color | string
  /** Text color */
  textColor?: string
  /** Label */
  label?: string
  /** Icon */
  icon?: string
  /** Icon on right */
  iconRight?: string
  /** Split mode */
  split?: boolean
  /** Disable */
  disable?: boolean
  /** No icon on right (arrow) */
  noIconAnimation?: boolean
  /** Size */
  size?: Size
  /** Dense */
  dense?: boolean
  /** Flat */
  flat?: boolean
  /** Unelevated */
  unelevated?: boolean
  /** Outline */
  outline?: boolean
  /** Push effect */
  push?: boolean
  /** No caps */
  noCaps?: boolean
  /** Round */
  round?: boolean
  /** Rounded corners */
  rounded?: boolean
  /** Square corners */
  square?: boolean
  /** Ripple */
  ripple?: boolean | object
  /** Menu offset */
  menuOffset?: [number, number]
  /** Auto close menu */
  autoClose?: boolean
}
