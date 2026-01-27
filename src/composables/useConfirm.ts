import { useQuasar } from 'quasar'

type DialogType = 'info' | 'warning' | 'error' | 'success'

interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: DialogType
  icon?: string
  html?: boolean
  persistent?: boolean
}

interface DeleteConfirmOptions {
  title?: string
  message?: string
  itemName: string
  confirmText?: string
  cancelText?: string
}

export function useConfirm() {
  const $q = useQuasar()

  // Map dialog type to color
  const getColor = (type: DialogType): string => {
    const colorMap: Record<DialogType, string> = {
      info: 'info',
      warning: 'warning',
      error: 'negative',
      success: 'positive'
    }
    return colorMap[type] || 'primary'
  }

  // Map dialog type to icon
  const getIcon = (type: DialogType): string => {
    const iconMap: Record<DialogType, string> = {
      info: 'mdi-information',
      warning: 'mdi-alert',
      error: 'mdi-alert-circle',
      success: 'mdi-check-circle'
    }
    return iconMap[type]
  }

  /**
   * Show confirmation dialog
   * @param config - String message or full options object
   * @returns Promise that resolves to true if confirmed, false if cancelled
   */
  const confirm = (config: string | ConfirmOptions): Promise<boolean> => {
    const options: ConfirmOptions = typeof config === 'string'
      ? { message: config }
      : config

    const {
      title = 'Xác nhận',
      message,
      confirmText = 'Đồng ý',
      cancelText = 'Hủy',
      type = 'info',
      icon,
      html = false,
      persistent = false
    } = options

    return new Promise((resolve) => {
      $q.dialog({
        title,
        message,
        html,
        persistent,
        cancel: {
          label: cancelText,
          flat: true,
          color: 'grey'
        },
        ok: {
          label: confirmText,
          color: getColor(type)
        },
        focus: 'cancel'
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false))
        .onDismiss(() => resolve(false))
    })
  }

  /**
   * Shorthand for warning confirmation
   */
  const confirmWarning = (message: string, title?: string): Promise<boolean> => {
    return confirm({
      title: title || 'Cảnh báo',
      message,
      type: 'warning'
    })
  }

  /**
   * Shorthand for delete confirmation with danger styling
   */
  const confirmDelete = (options: string | DeleteConfirmOptions): Promise<boolean> => {
    const config: DeleteConfirmOptions = typeof options === 'string'
      ? { itemName: options }
      : options

    const {
      title = 'Xác nhận xóa',
      message,
      itemName,
      confirmText = 'Xóa',
      cancelText = 'Hủy'
    } = config

    const finalMessage = message || `Bạn có chắc chắn muốn xóa "${itemName}"? Hành động này không thể hoàn tác.`

    return new Promise((resolve) => {
      $q.dialog({
        title,
        message: finalMessage,
        html: true,
        persistent: true,
        cancel: {
          label: cancelText,
          flat: true,
          color: 'grey'
        },
        ok: {
          label: confirmText,
          color: 'negative'
        },
        focus: 'cancel'
      })
        .onOk(() => resolve(true))
        .onCancel(() => resolve(false))
        .onDismiss(() => resolve(false))
    })
  }

  return {
    confirm,
    confirmWarning,
    confirmDelete
  }
}
