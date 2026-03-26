import { ref, computed } from 'vue'
import { useSnackbar } from './useSnackbar'
import type {
  DetectedCode,
  QrScannerError,
  QrScannerErrorName,
  UseQrScannerOptions,
} from '@/types/qr'

/**
 * Vietnamese error messages for QR scanner errors
 */
const errorMessages: Record<QrScannerErrorName, string> = {
  NotAllowedError: 'Bạn cần cấp quyền truy cập camera để quét mã QR',
  NotFoundError: 'Không tìm thấy camera trên thiết bị này',
  NotSupportedError: 'Trình duyệt không hỗ trợ quét mã QR',
  NotReadableError: 'Camera đang được sử dụng bởi ứng dụng khác',
  OverconstrainedError: 'Camera không đáp ứng yêu cầu cấu hình',
  SecurityError: 'Cần kết nối HTTPS để sử dụng camera',
  StreamApiNotSupportedError: 'Trình duyệt không hỗ trợ API camera',
}

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
export function useQrScanner(options: UseQrScannerOptions = {}) {
  const {
    onDetect,
    onError,
    autoStart = false,
    vibrate = true,
    playSound = false,
  } = options

  const snackbar = useSnackbar()

  // State
  const isScanning = ref(autoStart)
  const isLoading = ref(false)
  const error = ref<QrScannerError | null>(null)
  const lastDetectedCode = ref<string | null>(null)
  const detectionHistory = ref<DetectedCode[]>([])

  // Audio context for sound feedback
  let audioContext: AudioContext | null = null

  /**
   * Get Vietnamese error message
   */
  const getErrorMessage = (err: QrScannerError): string => {
    return errorMessages[err.name] || err.message || 'Đã xảy ra lỗi không xác định'
  }

  /**
   * Play detection sound
   */
  const playDetectionSound = () => {
    if (!playSound) return

    try {
      if (!audioContext) {
        audioContext = new AudioContext()
      }

      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 1000
      oscillator.type = 'sine'

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.1)
    } catch {
      // Ignore audio errors
    }
  }

  /**
   * Vibrate device on detection
   */
  const vibrateDevice = () => {
    if (!vibrate) return

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(100)
      }
    } catch {
      // Ignore vibration errors
    }
  }

  /**
   * Handle QR code detection
   */
  const handleDetect = (codes: DetectedCode[]) => {
    if (codes.length === 0) return

    const detectedCode = codes[0]
    if (!detectedCode) return

    lastDetectedCode.value = detectedCode.rawValue

    // Add to history (avoid duplicates in quick succession)
    const lastInHistory = detectionHistory.value[0]
    if (!lastInHistory || lastInHistory.rawValue !== detectedCode.rawValue) {
      detectionHistory.value.unshift({ ...detectedCode })

      // Keep only last 50 entries
      if (detectionHistory.value.length > 50) {
        detectionHistory.value = detectionHistory.value.slice(0, 50)
      }
    }

    // Feedback
    vibrateDevice()
    playDetectionSound()

    // Callback
    onDetect?.(codes)
  }

  /**
   * Handle scanner error
   */
  const handleError = (err: QrScannerError) => {
    error.value = err
    isScanning.value = false

    const message = getErrorMessage(err)
    snackbar.error(message)

    onError?.(err)
  }

  /**
   * Handle camera ready event
   */
  const handleCameraOn = () => {
    isLoading.value = false
    error.value = null
  }

  /**
   * Handle camera loading
   */
  const handleCameraOff = () => {
    isLoading.value = true
  }

  /**
   * Start scanning
   */
  const start = () => {
    isScanning.value = true
    error.value = null
  }

  /**
   * Stop scanning
   */
  const stop = () => {
    isScanning.value = false
  }

  /**
   * Toggle scanning
   */
  const toggle = () => {
    if (isScanning.value) {
      stop()
    } else {
      start()
    }
  }

  /**
   * Clear detection history
   */
  const clearHistory = () => {
    detectionHistory.value = []
    lastDetectedCode.value = null
  }

  /**
   * Check if camera is available
   */
  const hasCamera = computed(() => {
    return 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices
  })

  /**
   * Check if running on HTTPS (required for camera)
   */
  const isSecureContext = computed(() => {
    return window.isSecureContext || window.location.hostname === 'localhost'
  })

  return {
    // State
    isScanning,
    isLoading,
    error,
    lastDetectedCode,
    detectionHistory,

    // Computed
    hasCamera,
    isSecureContext,

    // Methods
    start,
    stop,
    toggle,
    clearHistory,
    handleDetect,
    handleError,
    handleCameraOn,
    handleCameraOff,
    getErrorMessage,
  }
}
