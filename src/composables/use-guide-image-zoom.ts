import { ref, onBeforeUnmount, type Ref } from 'vue'

export function useGuideImageZoom(containerRef: Ref<HTMLElement | null>) {
  const visible = ref(false)
  const index = ref(0)
  const imgs = ref<string[]>([])
  let clickHandler: ((e: MouseEvent) => void) | null = null

  function rescan() {
    const container = containerRef.value
    if (!container) return

    if (clickHandler) {
      container.removeEventListener('click', clickHandler)
      clickHandler = null
    }

    const imgEls = Array.from(container.querySelectorAll<HTMLImageElement>('img'))
    imgs.value = imgEls.map((img) => img.src).filter(Boolean)

    if (imgs.value.length === 0) return

    clickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName !== 'IMG') return
      const idx = imgEls.indexOf(target as HTMLImageElement)
      if (idx === -1) return
      index.value = idx
      visible.value = true
    }

    container.addEventListener('click', clickHandler)
  }

  function closeZoom() {
    visible.value = false
  }

  onBeforeUnmount(() => {
    const container = containerRef.value
    if (container && clickHandler) {
      container.removeEventListener('click', clickHandler)
    }
  })

  return { visible, imgs, index, rescan, closeZoom }
}
