import type { DetectedCode, QrScannerError, UseQrScannerOptions } from '@/types/qr';
/**
 * Composable for QR code scanning functionality
 * Provides unified API for QR scanning with Vietnamese error messages
 *
 * @example
 * ```ts
 * const {
 *   isScanning,
 *   lastDetectedCode,
 *   handleDetect,
 *   handleError,
 *   start,
 *   stop
 * } = useQrScanner({
 *   onDetect: (codes) => console.log('Detected:', codes),
 *   vibrate: true
 * })
 * ```
 */
export declare function useQrScanner(options?: UseQrScannerOptions): {
    isScanning: any;
    isLoading: any;
    error: any;
    lastDetectedCode: any;
    detectionHistory: any;
    hasCamera: any;
    isSecureContext: any;
    start: () => void;
    stop: () => void;
    toggle: () => void;
    clearHistory: () => void;
    handleDetect: (codes: DetectedCode[]) => void;
    handleError: (err: QrScannerError) => void;
    handleCameraOn: () => void;
    handleCameraOff: () => void;
    getErrorMessage: (err: QrScannerError) => string;
};
