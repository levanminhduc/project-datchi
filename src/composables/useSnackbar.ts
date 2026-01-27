import { useQuasar } from 'quasar'

type NotifyPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom' | 'left' | 'right' | 'center'
type NotifyType = 'positive' | 'negative' | 'warning' | 'info' | 'ongoing'

interface SnackbarOptions {
  message: string
  type?: NotifyType
  color?: string
  textColor?: string
  icon?: string
  timeout?: number
  position?: NotifyPosition
  caption?: string
  html?: boolean
  actions?: Array<{
    label: string
    color?: string
    handler?: () => void
  }>
  progress?: boolean
  multiLine?: boolean
}

export function useSnackbar() {
  const $q = useQuasar()

  // Map type to icon (using Material Icons format, not MDI)
  const getIcon = (type: NotifyType): string => {
    const iconMap: Record<NotifyType, string> = {
      positive: 'check_circle',      // Material Icons format
      negative: 'error',             // Material Icons format
      warning: 'warning',            // Material Icons format
      info: 'info',                  // Material Icons format
      ongoing: 'hourglass_empty'     // Material Icons format (for loading spinner case)
    }
    return iconMap[type] || 'info'
  }

  /**
   * Show a notification
   */
  const show = (options: string | SnackbarOptions): void => {
    const config: SnackbarOptions = typeof options === 'string'
      ? { message: options }
      : options

    const {
      message,
      type,
      color,
      textColor,
      icon,
      timeout = 3000,
      position = 'top',
      caption,
      html = false,
      actions,
      progress = false,
      multiLine = false
    } = config

    // Use conditional spread to only include optional properties when defined
    // This allows the `type` property to provide default colors/styling
    const computedIcon = icon || (type ? getIcon(type) : undefined)
    const computedActions = actions?.map(a => ({
      label: a.label,
      color: a.color || 'white',
      handler: a.handler
    }))

    $q.notify({
      message,
      type,
      ...(color && { color }),
      ...(textColor && { textColor }),
      ...(computedIcon && { icon: computedIcon }),
      timeout,
      position,
      ...(caption && { caption }),
      html,
      ...(computedActions && { actions: computedActions }),
      progress,
      multiLine
    })
  }

  /**
   * Success notification (green)
   */
  const success = (message: string, timeout?: number): void => {
    show({
      message,
      type: 'positive',
      timeout: timeout || 3000
    })
  }

  /**
   * Error notification (red)
   */
  const error = (message: string, timeout?: number): void => {
    show({
      message,
      type: 'negative',
      timeout: timeout || 5000
    })
  }

  /**
   * Warning notification (orange)
   */
  const warning = (message: string, timeout?: number): void => {
    show({
      message,
      type: 'warning',
      timeout: timeout || 4000
    })
  }

  /**
   * Info notification (blue)
   */
  const info = (message: string, timeout?: number): void => {
    show({
      message,
      type: 'info',
      timeout: timeout || 3000
    })
  }

  /**
   * Ongoing/loading notification (returns dismiss function)
   */
  const loading = (message: string): (() => void) => {
    const dismiss = $q.notify({
      message,
      type: 'ongoing',
      spinner: true,
      timeout: 0, // Persistent until dismissed
      position: 'top'
    })
    return dismiss
  }

  return {
    show,
    success,
    error,
    warning,
    info,
    loading
  }
}
