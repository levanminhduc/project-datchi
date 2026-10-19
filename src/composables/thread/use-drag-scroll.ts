import { getCurrentInstance, onBeforeUnmount, type Ref } from 'vue'

const DRAG_THRESHOLD_PX = 5

export function useDragScroll(el: Ref<HTMLElement | null>) {
  let startX = 0
  let startScroll = 0
  let dragged = false
  let detach: (() => void) | null = null

  function onWheel(event: WheelEvent) {
    const target = el.value
    if (!target || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return

    const canScrollBack = target.scrollLeft > 0
    const canScrollForward = target.scrollLeft + target.clientWidth < target.scrollWidth - 1
    if ((event.deltaY < 0 && !canScrollBack) || (event.deltaY > 0 && !canScrollForward)) return

    event.preventDefault()
    target.scrollLeft += event.deltaY
  }

  function onPointerMove(event: PointerEvent) {
    const target = el.value
    if (!target) return
    const dx = event.clientX - startX
    if (!dragged && Math.abs(dx) <= DRAG_THRESHOLD_PX) return
    dragged = true
    target.scrollLeft = startScroll - dx
  }

  function stopTracking() {
    detach?.()
    detach = null
  }

  function onPointerDown(event: PointerEvent) {
    const target = el.value
    if (!target || event.pointerType !== 'mouse' || event.button !== 0) return

    stopTracking()
    startX = event.clientX
    startScroll = target.scrollLeft
    dragged = false
    window.addEventListener('pointermove', onPointerMove)
    window.addEventListener('pointerup', stopTracking)
    detach = () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', stopTracking)
    }
  }

  function onClickCapture(event: MouseEvent) {
    if (!dragged || event.detail === 0) return
    event.preventDefault()
    event.stopPropagation()
    dragged = false
  }

  if (getCurrentInstance()) onBeforeUnmount(stopTracking)

  return { onWheel, onPointerDown, onClickCapture }
}
