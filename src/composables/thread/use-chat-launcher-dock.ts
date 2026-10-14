import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

type DockSide = 'left' | 'right'

const LAUNCHER_SIZE = 48
const EDGE_MARGIN = 18
const WINDOW_GAP = 16
const DRAG_THRESHOLD_PX = 6
const SHEET_BREAKPOINT_PX = 600
const POSITION_STORAGE_KEY = 'floating-chat-assistant-position'

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), Math.max(min, max))
}

export function useChatLauncherDock() {
  const viewport = ref(
    typeof window === 'undefined'
      ? { width: 1024, height: 768 }
      : { width: window.innerWidth, height: window.innerHeight },
  )
  const dockSide = ref<DockSide>('right')
  const dockTop = ref<number | null>(null)
  const isDragging = ref(false)
  const dragPos = ref({ x: 0, y: 0 })

  let dragStartX = 0
  let dragStartY = 0
  let dragOriginX = 0
  let dragOriginY = 0
  let dragMoved = false
  let suppressClick = false

  const maxLauncherTop = computed(() => viewport.value.height - LAUNCHER_SIZE - EDGE_MARGIN)

  const settledTop = computed(() =>
    clamp(dockTop.value ?? maxLauncherTop.value, EDGE_MARGIN, maxLauncherTop.value),
  )

  const settledLeft = computed(() =>
    dockSide.value === 'left'
      ? EDGE_MARGIN
      : viewport.value.width - LAUNCHER_SIZE - EDGE_MARGIN,
  )

  const effectiveLeft = computed(() => (isDragging.value ? dragPos.value.x : settledLeft.value))
  const effectiveTop = computed(() => (isDragging.value ? dragPos.value.y : settledTop.value))

  const isSheet = computed(() => viewport.value.width < SHEET_BREAKPOINT_PX)

  const wrapperStyle = computed(() => ({
    left: `${effectiveLeft.value}px`,
    top: `${effectiveTop.value}px`,
  }))

  const windowOpensRight = computed(
    () => effectiveLeft.value + LAUNCHER_SIZE / 2 < viewport.value.width / 2,
  )

  const windowMaxHeight = computed(() => {
    const spaceAbove = effectiveTop.value - WINDOW_GAP - 8
    const spaceBelow = viewport.value.height - (effectiveTop.value + LAUNCHER_SIZE + WINDOW_GAP) - 8
    const available = Math.max(spaceAbove, spaceBelow)
    return Math.max(260, Math.min(650, viewport.value.height - 24, available))
  })

  const windowStyle = computed(() => {
    if (isSheet.value) return {}

    const spaceAbove = effectiveTop.value - WINDOW_GAP - 8
    const spaceBelow = viewport.value.height - (effectiveTop.value + LAUNCHER_SIZE + WINDOW_GAP) - 8
    const openBelow = spaceBelow > spaceAbove

    return {
      left: windowOpensRight.value ? '0' : 'auto',
      right: windowOpensRight.value ? 'auto' : '0',
      ...(openBelow
        ? { top: `${LAUNCHER_SIZE + WINDOW_GAP}px`, bottom: 'auto' }
        : { bottom: `${LAUNCHER_SIZE + WINDOW_GAP}px`, top: 'auto' }),
      maxHeight: `${windowMaxHeight.value}px`,
    }
  })

  function onLauncherPointerDown(event: PointerEvent) {
    if (event.button !== 0) return

    dragStartX = event.clientX
    dragStartY = event.clientY
    dragOriginX = effectiveLeft.value
    dragOriginY = effectiveTop.value
    dragMoved = false

    window.addEventListener('pointermove', onLauncherPointerMove)
    window.addEventListener('pointerup', onLauncherPointerUp)
    window.addEventListener('pointercancel', onLauncherPointerCancel)
  }

  function onLauncherPointerMove(event: PointerEvent) {
    const deltaX = event.clientX - dragStartX
    const deltaY = event.clientY - dragStartY

    if (!dragMoved && Math.hypot(deltaX, deltaY) > DRAG_THRESHOLD_PX) {
      dragMoved = true
      isDragging.value = true
    }

    if (!dragMoved) return

    dragPos.value = {
      x: clamp(dragOriginX + deltaX, 0, viewport.value.width - LAUNCHER_SIZE),
      y: clamp(dragOriginY + deltaY, 0, viewport.value.height - LAUNCHER_SIZE),
    }
  }

  function onLauncherPointerUp() {
    removeDragListeners()

    if (!dragMoved) return
    dragMoved = false
    isDragging.value = false
    suppressClick = true

    const launcherCenterX = dragPos.value.x + LAUNCHER_SIZE / 2
    dockSide.value = launcherCenterX < viewport.value.width / 2 ? 'left' : 'right'
    dockTop.value = clamp(dragPos.value.y, EDGE_MARGIN, maxLauncherTop.value)
    persistPosition()
  }

  function onLauncherPointerCancel() {
    removeDragListeners()
    dragMoved = false
    isDragging.value = false
  }

  function removeDragListeners() {
    window.removeEventListener('pointermove', onLauncherPointerMove)
    window.removeEventListener('pointerup', onLauncherPointerUp)
    window.removeEventListener('pointercancel', onLauncherPointerCancel)
  }

  function consumeSuppressedClick(): boolean {
    if (!suppressClick) return false
    suppressClick = false
    return true
  }

  function persistPosition() {
    try {
      localStorage.setItem(
        POSITION_STORAGE_KEY,
        JSON.stringify({ side: dockSide.value, top: dockTop.value }),
      )
    } catch {
      return
    }
  }

  function restorePosition() {
    try {
      const raw = localStorage.getItem(POSITION_STORAGE_KEY)
      if (!raw) return
      const saved = JSON.parse(raw) as { side?: DockSide; top?: number }
      if (saved.side === 'left' || saved.side === 'right') dockSide.value = saved.side
      if (typeof saved.top === 'number' && Number.isFinite(saved.top)) dockTop.value = saved.top
    } catch {
      return
    }
  }

  function onViewportResize() {
    viewport.value = { width: window.innerWidth, height: window.innerHeight }
  }

  onMounted(() => {
    onViewportResize()
    restorePosition()
    window.addEventListener('resize', onViewportResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', onViewportResize)
    removeDragListeners()
  })

  return {
    isDragging,
    isSheet,
    wrapperStyle,
    windowStyle,
    onLauncherPointerDown,
    consumeSuppressedClick,
  }
}
