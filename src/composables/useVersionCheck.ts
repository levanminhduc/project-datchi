import { useSnackbar } from './useSnackbar'

const POLL_INTERVAL = 60_000
let lastETag: string | null = null
let intervalId: ReturnType<typeof setInterval> | null = null
let updateDetected = false

async function checkVersion(): Promise<boolean> {
  try {
    const res = await fetch(`/index.html?_t=${Date.now()}`, { method: 'HEAD' })
    const etag = res.headers.get('etag') || res.headers.get('last-modified')
    if (!etag) return false

    if (lastETag === null) {
      lastETag = etag
      return false
    }

    if (etag !== lastETag) {
      lastETag = etag
      return true
    }

    return false
  } catch {
    return false
  }
}

export function useVersionCheck() {
  const snackbar = useSnackbar()

  function startVersionCheck() {
    if (import.meta.env.DEV) return
    if (intervalId) return

    updateDetected = false
    lastETag = null

    checkVersion()

    intervalId = setInterval(async () => {
      if (updateDetected) return

      const hasUpdate = await checkVersion()
      if (hasUpdate) {
        updateDetected = true
        stopVersionCheck()
        snackbar.show({
          message: 'Có bản cập nhật mới được triển khai!',
          type: 'info',
          timeout: 0,
          position: 'top',
          actions: [{
            label: 'Làm mới',
            color: 'white',
            handler: () => window.location.reload(),
          }],
        })
      }
    }, POLL_INTERVAL)
  }

  function stopVersionCheck() {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  }

  return { startVersionCheck, stopVersionCheck }
}
