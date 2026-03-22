import { ref, onMounted, onUnmounted } from 'vue'

export interface UseScannerOptions {
  onScan?: (barcode: string) => void
  minLength?: number  // Minimum barcode length (default 5)
  maxDelay?: number   // Max delay between keystrokes (default 50ms)
}

export function useScanner(options?: UseScannerOptions) {
  const lastBarcode = ref<string>('')
  const isScanning = ref(false)
  const enabled = ref(true)
  
  // Buffer for accumulating keystrokes
  let buffer = ''
  let lastKeyTime = 0
  
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!enabled.value) return
    
    const now = Date.now()
    
    // If too much time passed, reset buffer (manual typing vs scanner)
    if (now - lastKeyTime > (options?.maxDelay ?? 50)) {
      buffer = ''
    }
    lastKeyTime = now
    
    // Scanner sends Enter at end of barcode
    if (event.key === 'Enter') {
      if (buffer.length >= (options?.minLength ?? 5)) {
        lastBarcode.value = buffer
        isScanning.value = true
        options?.onScan?.(buffer)
        setTimeout(() => { isScanning.value = false }, 300)
      }
      buffer = ''
      return
    }
    
    // Accumulate alphanumeric characters
    if (event.key.length === 1 && /[a-zA-Z0-9\-_]/.test(event.key)) {
      buffer += event.key
    }
  }
  
  const enable = () => { enabled.value = true }
  const disable = () => { enabled.value = false }
  const clear = () => { lastBarcode.value = '' }
  
  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })
  
  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
  
  return {
    lastBarcode,
    isScanning,
    enabled,
    enable,
    disable,
    clear,
  }
}
