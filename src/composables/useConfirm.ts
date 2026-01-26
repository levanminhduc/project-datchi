import { ref } from 'vue'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'error'
}

export function useConfirm() {
  const isOpen = ref(false)
  const options = ref<ConfirmOptions>({
    title: 'Xác nhận',
    message: '',
    confirmText: 'Đồng ý',
    cancelText: 'Hủy',
    type: 'info'
  })
  
  let resolvePromise: ((value: boolean) => void) | null = null

  const confirm = (config: string | ConfirmOptions): Promise<boolean> => {
    if (typeof config === 'string') {
      options.value = { ...options.value, message: config }
    } else {
      options.value = { ...options.value, ...config }
    }
    isOpen.value = true
    
    return new Promise((resolve) => {
      resolvePromise = resolve
    })
  }

  const onConfirm = () => {
    isOpen.value = false
    resolvePromise?.(true)
  }

  const onCancel = () => {
    isOpen.value = false
    resolvePromise?.(false)
  }

  return {
    isOpen,
    options,
    confirm,
    onConfirm,
    onCancel
  }
}
