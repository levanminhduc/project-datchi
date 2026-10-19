import assert from 'node:assert/strict'
import { ref } from 'vue'
import { useDragScroll } from '../use-drag-scroll'

function wheelOn(scrollLeft: number, deltaY: number) {
  const element = { scrollLeft, clientWidth: 300, scrollWidth: 421 }
  const { onWheel } = useDragScroll(ref(element as unknown as HTMLElement))
  let prevented = false
  onWheel({ deltaX: 0, deltaY, preventDefault: () => { prevented = true } } as unknown as WheelEvent)
  return { prevented, scrollLeft: element.scrollLeft }
}

function testWheelScrollsRowSideways() {
  assert.deepEqual(wheelOn(0, 40), { prevented: true, scrollLeft: 40 })
}

function testWheelAtFractionalRightEdgeLetsPageScroll() {
  assert.equal(wheelOn(120.5, 40).prevented, false)
}

function testWheelAtLeftEdgeLetsPageScroll() {
  assert.equal(wheelOn(0, -40).prevented, false)
}

function main() {
  testWheelScrollsRowSideways()
  testWheelAtFractionalRightEdgeLetsPageScroll()
  testWheelAtLeftEdgeLetsPageScroll()
  console.log('use-drag-scroll tests passed')
}

main()
