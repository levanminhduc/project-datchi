import type { Size, Color, BaseComponentProps, ValidationRule, LabeledProps, ValidatableProps } from './base'

export interface AppInputProps extends BaseComponentProps, LabeledProps, ValidatableProps {
  /** v-model value */
  modelValue?: string | number | null
  /** Input type */
  type?: 'text' | 'password' | 'email' | 'number' | 'tel' | 'url' | 'textarea' | 'search'
  /** Placeholder text */
  placeholder?: string
  /** Outlined style */
  outlined?: boolean
  /** Filled style */
  filled?: boolean
  /** Standout style */
  standout?: boolean | string
  /** Borderless style */
  borderless?: boolean
  /** Dense padding */
  dense?: boolean
  /** Disable input */
  disable?: boolean
  /** Readonly mode */
  readonly?: boolean
  /** Prepend icon */
  prependIcon?: string
  /** Append icon */
  appendIcon?: string
  /** Show clear button */
  clearable?: boolean
  /** Debounce delay (ms) */
  debounce?: number
  /** Autofocus */
  autofocus?: boolean
  /** Autogrow for textarea */
  autogrow?: boolean
  /** Max length */
  maxlength?: number | string
  /** Counter */
  counter?: boolean
  /** Input mask */
  mask?: string
  /** Loading state */
  loading?: boolean
  /** Color */
  color?: Color | string
  /** Label color */
  labelColor?: string
  /** Background color */
  bgColor?: string
  /** Stack label on top */
  stackLabel?: boolean
  /** Hide bottom space */
  hideBottomSpace?: boolean
}

export interface AppSelectProps extends BaseComponentProps, LabeledProps, ValidatableProps {
  /** v-model value */
  modelValue?: any
  /** Options array */
  options: Array<any>
  /** Option value field */
  optionValue?: string | ((option: any) => any)
  /** Option label field */
  optionLabel?: string | ((option: any) => string)
  /** Option disable field */
  optionDisable?: string | ((option: any) => boolean)
  /** Multiple selection */
  multiple?: boolean
  /** Outlined style */
  outlined?: boolean
  /** Filled style */
  filled?: boolean
  /** Dense padding */
  dense?: boolean
  /** Disable select */
  disable?: boolean
  /** Readonly mode */
  readonly?: boolean
  /** Clearable */
  clearable?: boolean
  /** Use input for filtering */
  useInput?: boolean
  /** Use chips for multiple */
  useChips?: boolean
  /** Emit value only (not whole option) */
  emitValue?: boolean
  /** Map options */
  mapOptions?: boolean
  /** Color */
  color?: Color | string
  /** Loading state */
  loading?: boolean
  /** Popup content class */
  popupContentClass?: string
  /** Popup content style */
  popupContentStyle?: string | object
  /** Popup behavior mode - 'menu' for dropdown, 'dialog' for overlay */
  behavior?: 'menu' | 'dialog'
  /** Hide dropdown icon */
  hideDropdownIcon?: boolean
  /** Dropdown icon */
  dropdownIcon?: string
  /** New value mode */
  newValueMode?: 'add' | 'add-unique' | 'toggle'
  /** Max visible chips */
  maxValues?: number
  /** Options dense */
  optionsDense?: boolean
  /** Virtual scroll */
  virtualScrollSliceSize?: number
  /** Virtual scroll slice ratio before */
  virtualScrollSliceRatioBefore?: number
  /** Virtual scroll slice ratio after */
  virtualScrollSliceRatioAfter?: number
  /** Input debounce */
  inputDebounce?: number
  /** Hide selected */
  hideSelected?: boolean
  /** Fill input on focus */
  fillInput?: boolean
  /** Stack label */
  stackLabel?: boolean
  /** Hide bottom space */
  hideBottomSpace?: boolean
}

export interface SearchInputProps extends BaseComponentProps {
  /** v-model value */
  modelValue?: string
  /** Placeholder */
  placeholder?: string
  /** Debounce delay (ms) */
  debounce?: number
  /** Dense padding */
  dense?: boolean
  /** Outlined style */
  outlined?: boolean
  /** Loading state */
  loading?: boolean
  /** Clearable */
  clearable?: boolean
  /** Input class */
  inputClass?: string
  /** Autofocus */
  autofocus?: boolean
}

export interface AppCheckboxProps extends BaseComponentProps, LabeledProps {
  /** v-model value */
  modelValue?: boolean | any[] | null
  /** True value */
  trueValue?: any
  /** False value */
  falseValue?: any
  /** Indeterminate value */
  indeterminateValue?: any
  /** Toggle indeterminate */
  toggleIndeterminate?: boolean
  /** Toggle order */
  toggleOrder?: 'tf' | 'ft'
  /** Keep color when unchecked */
  keepColor?: boolean
  /** Color */
  color?: Color | string
  /** Disable */
  disable?: boolean
  /** Dense padding */
  dense?: boolean
  /** Size */
  size?: Size | string
  /** Left label */
  leftLabel?: boolean
  /** Checked icon */
  checkedIcon?: string
  /** Unchecked icon */
  uncheckedIcon?: string
  /** Indeterminate icon */
  indeterminateIcon?: string
  /** Dark mode */
  dark?: boolean
}

export interface AppToggleProps extends BaseComponentProps, LabeledProps {
  /** v-model value */
  modelValue?: boolean | any
  /** True value */
  trueValue?: any
  /** False value */
  falseValue?: any
  /** Toggle indeterminate */
  toggleIndeterminate?: boolean
  /** Toggle order */
  toggleOrder?: 'tf' | 'ft'
  /** Keep color when off */
  keepColor?: boolean
  /** Color */
  color?: Color | string
  /** Disable */
  disable?: boolean
  /** Dense padding */
  dense?: boolean
  /** Size */
  size?: Size | string
  /** Left label */
  leftLabel?: boolean
  /** Icon */
  icon?: string
  /** Checked icon */
  checkedIcon?: string
  /** Unchecked icon */
  uncheckedIcon?: string
  /** Icon color */
  iconColor?: string
  /** Dark mode */
  dark?: boolean
}

export interface AppSliderProps extends BaseComponentProps {
  /** v-model value */
  modelValue?: number | null
  /** Minimum value */
  min?: number
  /** Maximum value */
  max?: number
  /** Step */
  step?: number
  /** Snap to steps */
  snap?: boolean
  /** Vertical orientation */
  vertical?: boolean
  /** Reverse direction */
  reverse?: boolean
  /** Color */
  color?: Color | string
  /** Track color */
  trackColor?: string
  /** Track image */
  trackImg?: string
  /** Inner track color */
  innerTrackColor?: string
  /** Inner track image */
  innerTrackImg?: string
  /** Selection color */
  selectionColor?: string
  /** Selection image */
  selectionImg?: string
  /** Thumb size */
  thumbSize?: string
  /** Thumb color */
  thumbColor?: string
  /** Thumb path */
  thumbPath?: string
  /** Disable */
  disable?: boolean
  /** Readonly */
  readonly?: boolean
  /** Dense */
  dense?: boolean
  /** Dark mode */
  dark?: boolean
  /** Show label */
  label?: boolean
  /** Label value */
  labelValue?: string | number
  /** Label color */
  labelColor?: string
  /** Label text color */
  labelTextColor?: string
  /** Switch label side */
  switchLabelSide?: boolean
  /** Label always visible */
  labelAlways?: boolean
  /** Markers */
  markers?: boolean | number
  /** Marker labels */
  markerLabels?: boolean | Array<{ value: number; label: string }> | ((value: number) => string)
  /** Marker labels class */
  markerLabelsClass?: string
  /** Switch marker labels side */
  switchMarkerLabelsSide?: boolean
  /** Track size */
  trackSize?: string
  /** Thumb class */
  thumbClass?: string
  /** Inner min */
  innerMin?: number
  /** Inner max */
  innerMax?: number
}

export interface AppRangeProps extends Omit<AppSliderProps, 'modelValue'> {
  /** v-model value */
  modelValue?: { min: number; max: number } | null
  /** Drag range */
  dragRange?: boolean
  /** Drag only range */
  dragOnlyRange?: boolean
  /** Left label value */
  leftLabelValue?: string | number
  /** Right label value */
  rightLabelValue?: string | number
  /** Left label color */
  leftLabelColor?: string
  /** Right label color */
  rightLabelColor?: string
  /** Left label text color */
  leftLabelTextColor?: string
  /** Right label text color */
  rightLabelTextColor?: string
  /** Left thumb class */
  leftThumbClass?: string
  /** Right thumb class */
  rightThumbClass?: string
  /** Left thumb color */
  leftThumbColor?: string
  /** Right thumb color */
  rightThumbColor?: string
}

export interface AppTextareaProps extends Omit<AppInputProps, 'type' | 'autogrow'> {
  /** Autogrow height */
  autogrow?: boolean
  /** Rows */
  rows?: number | string
  /** Min rows */
  minRows?: number | string
  /** Max rows */
  maxRows?: number | string
}
