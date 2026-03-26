import { ref } from 'vue'

export function useDialog<T = any>(defaultValue?: T) {
  const isOpen = ref(false)
  const data = ref<T | undefined>(defaultValue)

  const open = (payload?: T) => {
    data.value = payload
    isOpen.value = true
  }

  const close = () => {
    isOpen.value = false
    data.value = defaultValue
  }

  const toggle = () => {
    isOpen.value = !isOpen.value
  }

  return {
    isOpen,
    data,
    open,
    close,
    toggle
  }
}
