import { useQuasar } from 'quasar'
import { ref } from 'vue'

export function useDarkMode() {
  const $q = useQuasar()
  const preference = ref<'auto' | 'light' | 'dark'>(
    (localStorage.getItem('quasar-dark-mode') as any) || 'auto'
  )

  const applyMode = (mode: 'auto' | 'light' | 'dark') => {
    if (mode === 'auto') {
      $q.dark.set('auto')
    } else {
      $q.dark.set(mode === 'dark')
    }
  }

  const setMode = (mode: 'auto' | 'light' | 'dark') => {
    preference.value = mode
    localStorage.setItem('quasar-dark-mode', mode)
    applyMode(mode)
  }

  const toggle = () => {
    if (preference.value === 'light') {
      setMode('dark')
    } else if (preference.value === 'dark') {
      setMode('auto')
    } else {
      setMode('light')
    }
  }

  const isDark = () => $q.dark.isActive

  const init = () => {
    applyMode(preference.value)
  }

  return {
    preference,
    setMode,
    toggle,
    isDark,
    init
  }
}
