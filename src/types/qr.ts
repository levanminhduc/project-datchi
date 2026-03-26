/**
 * QR Scanner Types
 * TypeScript interfaces for QR code scanning functionality
 */

/**
 * Detected QR code result from vue-qrcode-reader
 */
export interface DetectedCode {
  /** Raw string value decoded from QR code */
  rawValue: string
  /** Format of the detected code */
  format: string
  /** Bounding box of the detected code */
  boundingBox?: DOMRectReadOnly
  /** Corner points of the detected code */
  cornerPoints?: Array<{ x: number; y: number }>
}

/**
 * Camera device info
 */
export interface CameraDevice {
  deviceId: string
  label: string
  kind: string
}

/**
 * QR Scanner error types
 */
export type QrScannerErrorName =
  | 'NotAllowedError'
  | 'NotFoundError'
  | 'NotSupportedError'
  | 'NotReadableError'
  | 'OverconstrainedError'
  | 'SecurityError'
  | 'StreamApiNotSupportedError'

/**
 * QR Scanner error
 */
export interface QrScannerError {
  name: QrScannerErrorName
  message: string
}

/**
 * Barcode formats supported by vue-qrcode-reader
 */
export type BarcodeFormat =
  | 'aztec'
  | 'code_128'
  | 'code_39'
  | 'code_93'
  | 'codabar'
  | 'data_matrix'
  | 'ean_13'
  | 'ean_8'
  | 'itf'
  | 'pdf417'
  | 'qr_code'
  | 'upc_a'
  | 'upc_e'

/**
 * QR Scanner component props
 */
export interface QrScannerProps {
  /** Barcode formats to detect (default: ['qr_code']) */
  formats?: BarcodeFormat[]
  /** Whether to use torch/flashlight */
  torch?: boolean
  /** Constraints for camera */
  constraints?: MediaTrackConstraints
  /** Whether to pause scanning */
  paused?: boolean
}

/**
 * QR Scanner dialog props
 */
export interface QrScannerDialogProps extends QrScannerProps {
  /** v-model for dialog visibility */
  modelValue?: boolean
  /** Dialog title */
  title?: string
  /** Whether dialog is persistent */
  persistent?: boolean
  /** Whether to close dialog after successful scan */
  closeOnDetect?: boolean
}

/**
 * useQrScanner composable options
 */
export interface UseQrScannerOptions {
  /** Callback when QR code is detected */
  onDetect?: (codes: DetectedCode[]) => void
  /** Callback when error occurs */
  onError?: (error: QrScannerError) => void
  /** Auto-start scanning */
  autoStart?: boolean
  /** Vibrate on detection (mobile) */
  vibrate?: boolean
  /** Play sound on detection */
  playSound?: boolean
}

/**
 * useQrScanner composable return type
 */
export interface UseQrScannerReturn {
  /** Whether scanner is currently scanning */
  isScanning: Ref<boolean>
  /** Whether camera is loading */
  isLoading: Ref<boolean>
  /** Current error if any */
  error: Ref<QrScannerError | null>
  /** Last detected code */
  lastDetectedCode: Ref<string | null>
  /** Detection history */
  detectionHistory: Ref<DetectedCode[]>
  /** Start scanning */
  start: () => void
  /** Stop scanning */
  stop: () => void
  /** Toggle scanning */
  toggle: () => void
  /** Clear history */
  clearHistory: () => void
  /** Handle detection event */
  handleDetect: (codes: DetectedCode[]) => void
  /** Handle error event */
  handleError: (error: QrScannerError) => void
  /** Get Vietnamese error message */
  getErrorMessage: (error: QrScannerError) => string
}

// Import Ref type for return interface
import type { Ref } from 'vue'
