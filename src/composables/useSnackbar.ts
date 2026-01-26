import { ref } from 'vue'

interface SnackbarOptions {
  text: string
  color?: string
  timeout?: number
  location?: 'top' | 'bottom' | 'left' | 'right'
}

export function useSnackbar() {
  const isVisible = ref(false)
  const options = ref<SnackbarOptions>({
    text: '',
    color: 'success',
    timeout: 3000,
    location: 'bottom'
  })

  const show = (config: string | SnackbarOptions) => {
    if (typeof config === 'string') {
      options.value = { ...options.value, text: config }
    } else {
      options.value = { ...options.value, ...config }
    }
    isVisible.value = true
  }

  const success = (text: string, timeout?: number) => {
    show({ text, color: 'success', timeout })
  }

  const error = (text: string, timeout?: number) => {
    show({ text, color: 'error', timeout })
  }

  const warning = (text: string, timeout?: number) => {
    show({ text, color: 'warning', timeout })
  }

  const info = (text: string, timeout?: number) => {
    show({ text, color: 'info', timeout })
  }

  const hide = () => {
    isVisible.value = false
  }

  return {
    isVisible,
    options,
    show,
    success,
    error,
    warning,
    info,
    hide
  }
}
