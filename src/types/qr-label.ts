/**
 * Types for QR Label Printing functionality
 */

/** Size variants for QR code display */
export type QrCodeSize = 'small' | 'medium' | 'large'

/** QR code size in pixels */
export const QR_SIZE_MAP: Record<QrCodeSize, number> = {
  small: 64,
  medium: 96,
  large: 128,
}

/** Label dimensions in mm */
export interface LabelDimensions {
  width: number
  height: number
}

/** Standard label size 50x30mm */
export const LABEL_SIZE: LabelDimensions = {
  width: 50,
  height: 30,
}

/** A4 paper dimensions in mm */
export const A4_SIZE: LabelDimensions = {
  width: 210,
  height: 297,
}

/** Grid layout for batch printing */
export interface LabelGridConfig {
  columns: number
  rows: number
  marginTop: number
  marginLeft: number
  gapX: number
  gapY: number
}

/** Default grid config for A4 paper with 50x30mm labels */
export const DEFAULT_GRID_CONFIG: LabelGridConfig = {
  columns: 4,
  rows: 9,
  marginTop: 10,
  marginLeft: 5,
  gapX: 2,
  gapY: 2,
}

/** Cone information for label display */
export interface ConeLabelData {
  cone_id: string
  lot_number?: string
  thread_type_code?: string
  thread_type_name?: string
  weight_grams?: number
  quantity_meters?: number
}

/** Props for ConeQrCode component */
export interface ConeQrCodeProps {
  coneId: string
  size?: QrCodeSize
  showText?: boolean
}

/** Props for QrLabelSingle component */
export interface QrLabelSingleProps {
  cone: ConeLabelData
  showBorder?: boolean
}

/** Props for QrLabelGrid component */
export interface QrLabelGridProps {
  cones: ConeLabelData[]
  config?: LabelGridConfig
}

/** Props for QrPrintDialog component */
export interface QrPrintDialogProps {
  modelValue: boolean
  cones: ConeLabelData[]
  title?: string
}
