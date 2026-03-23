import { ref, computed, onUnmounted } from 'vue'

export interface ScaleReading {
  weight: number      // Weight in grams
  stable: boolean     // Is reading stable
  unit: 'g' | 'kg'
  timestamp: Date
}

// Web Serial API types (not included in standard TypeScript lib)
interface SerialPort {
  readable: ReadableStream | null
  writable: WritableStream | null
  open(options: { baudRate: number }): Promise<void>
  close(): Promise<void>
}

interface Serial {
  requestPort(): Promise<SerialPort>
}

declare global {
  interface Navigator {
    serial?: Serial
  }
}

export function useScale() {
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const currentWeight = ref<number | null>(null)
  const isStable = ref(false)
  const error = ref<string | null>(null)
  const readings = ref<ScaleReading[]>([])
  
  let port: SerialPort | null = null
  let reader: ReadableStreamDefaultReader<string> | null = null
  
  // Check if Web Serial API is supported
  const isSupported = computed(() => 'serial' in navigator)
  
  // Connect to scale
  const connect = async (): Promise<boolean> => {
    if (!isSupported.value) {
      error.value = 'Trình duyệt không hỗ trợ kết nối cân'
      return false
    }
    
    isConnecting.value = true
    error.value = null
    
    try {
      // Request port from user
      port = await navigator.serial!.requestPort()
      
      // Open with typical scale baud rate
      await port.open({ baudRate: 9600 })
      
      isConnected.value = true
      
      // Start reading
      startReading()
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Lỗi kết nối cân'
      return false
    } finally {
      isConnecting.value = false
    }
  }
  
  // Disconnect from scale
  const disconnect = async (): Promise<void> => {
    try {
      if (reader) {
        await reader.cancel()
        reader = null
      }
      if (port) {
        await port.close()
        port = null
      }
    } catch {
      // Ignore close errors
    }
    isConnected.value = false
    currentWeight.value = null
  }
  
  // Start reading data from scale
  const startReading = async () => {
    if (!port?.readable) return
    
    const decoder = new TextDecoderStream()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inputStream = (port.readable as any).pipeThrough(decoder) as ReadableStream<string>
    reader = inputStream.getReader()
    
    let buffer = ''
    
    while (true) {
      try {
        const { value, done } = await reader!.read()
        if (done) break
        
        buffer += value ?? ''
        
        // Parse weight from buffer (common format: "  123.4 g\r\n")
        const match = buffer.match(/([+-]?\d+\.?\d*)\s*(g|kg)/i)
        if (match) {
          const weightStr = match[1]
          const unitStr = match[2]
          
          if (weightStr && unitStr) {
            let weight = parseFloat(weightStr)
            const unit = unitStr.toLowerCase()
            
            if (unit === 'kg') weight *= 1000
            
            currentWeight.value = weight
            isStable.value = !buffer.includes('?') && !buffer.includes('~')
            
            readings.value.push({
              weight,
              stable: isStable.value,
              unit: 'g',
              timestamp: new Date(),
            })
            
            // Keep last 10 readings
            if (readings.value.length > 10) {
              readings.value.shift()
            }
          }
          
          buffer = ''
        }
      } catch {
        break
      }
    }
  }
  
  // Capture current stable weight
  const capture = (): number | null => {
    if (isStable.value && currentWeight.value !== null) {
      return currentWeight.value
    }
    return null
  }
  
  // Tare (zero) the scale - send command
  const tare = async (): Promise<void> => {
    if (!port?.writable) return
    
     
    const writer = (port.writable as WritableStream<Uint8Array>).getWriter()
    try {
      // Common tare command
      await writer.write(new TextEncoder().encode('T\r\n'))
    } finally {
      writer.releaseLock()
    }
  }
  
  onUnmounted(() => {
    disconnect()
  })
  
  return {
    // State
    isSupported,
    isConnected,
    isConnecting,
    currentWeight,
    isStable,
    error,
    readings,
    
    // Methods
    connect,
    disconnect,
    capture,
    tare,
  }
}
