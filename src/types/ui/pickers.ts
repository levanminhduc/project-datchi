/**
 * Picker component types
 */
import type { Color } from './base'

/** DatePicker props */
export interface DatePickerProps {
  modelValue?: string | null
  mask?: string
  locale?: Record<string, any>
  calendar?: 'gregorian' | 'persian'
  landscape?: boolean
  color?: Color
  textColor?: string
  dark?: boolean
  square?: boolean
  flat?: boolean
  bordered?: boolean
  readonly?: boolean
  disable?: boolean
  title?: string
  subtitle?: string
  todayBtn?: boolean
  minimal?: boolean
  navigationMinYearMonth?: string
  navigationMaxYearMonth?: string
  noUnset?: boolean
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  eventColor?: string | ((date: string) => string | null)
  events?: string[] | ((date: string) => boolean)
  options?: (date: string) => boolean
  multiple?: boolean
  range?: boolean
  emitImmediately?: boolean
  defaultYearMonth?: string
  defaultView?: 'Calendar' | 'Months' | 'Years'
  yearsInMonthView?: boolean
}

/** TimePicker props */
export interface TimePickerProps {
  modelValue?: string | null
  mask?: string
  locale?: Record<string, any>
  landscape?: boolean
  color?: Color
  textColor?: string
  dark?: boolean
  square?: boolean
  flat?: boolean
  bordered?: boolean
  readonly?: boolean
  disable?: boolean
  format24h?: boolean
  defaultDate?: string
  options?: (hr: number, min: number | null, sec: number | null) => boolean
  hourOptions?: number[]
  minuteOptions?: number[]
  secondOptions?: number[]
  withSeconds?: boolean
  nowBtn?: boolean
}

/** ColorPicker props */
export interface ColorPickerProps {
  modelValue?: string | null | Record<string, any>
  defaultValue?: string
  defaultView?: 'spectrum' | 'tune' | 'palette'
  formatModel?: 'auto' | 'hex' | 'rgb' | 'hexa' | 'rgba'
  palette?: string[]
  noHeader?: boolean
  noHeaderTabs?: boolean
  noFooter?: boolean
  square?: boolean
  flat?: boolean
  bordered?: boolean
  disable?: boolean
  readonly?: boolean
  dark?: boolean
}

/** AppEditor toolbar configuration */
export type EditorToolbarItem =
  | 'bold' | 'italic' | 'strike' | 'underline' | 'subscript' | 'superscript'
  | 'token' | 'hr' | 'link' | 'unordered' | 'ordered' | 'indent' | 'outdent'
  | 'quote' | 'left' | 'center' | 'right' | 'justify' | 'print' | 'fullscreen'
  | 'viewsource' | 'undo' | 'redo' | 'removeFormat' | 'h1' | 'h2' | 'h3'
  | 'h4' | 'h5' | 'h6' | 'p' | 'code' | 'size-1' | 'size-2' | 'size-3'
  | 'size-4' | 'size-5' | 'size-6' | 'size-7'

/** AppEditor props */
export interface AppEditorProps {
  modelValue?: string
  readonly?: boolean
  disable?: boolean
  minHeight?: string
  maxHeight?: string
  height?: string
  placeholder?: string
  toolbar?: EditorToolbarItem[][]
  toolbarTextColor?: string
  toolbarColor?: string
  toolbarBg?: string
  toolbarOutline?: boolean
  toolbarPush?: boolean
  toolbarRounded?: boolean
  contentStyle?: string | Record<string, string>
  contentClass?: string | string[] | Record<string, boolean>
  square?: boolean
  flat?: boolean
  dense?: boolean
}

/** FilePicker props */
export interface FilePickerProps {
  modelValue?: File | File[] | null
  accept?: string
  multiple?: boolean
  maxFileSize?: number
  maxTotalSize?: number
  maxFiles?: number
  filter?: (files: File[]) => File[]
  label?: string
  hint?: string
  clearable?: boolean
  outlined?: boolean
  filled?: boolean
  dense?: boolean
  disable?: boolean
  readonly?: boolean
  color?: Color
  useChips?: boolean
  counter?: boolean
  counterLabel?: (props: { totalSize: string; filesNumber: number; maxFiles: number }) => string
  displayValue?: string | ((files: File[]) => string)
  appendToInput?: boolean
}
