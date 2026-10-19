import assert from 'node:assert/strict'
import { API_PAGE_SIZE, collectPages, MAX_TOOL_ROWS } from './paging'

function pagesOf(total: number) {
  const requested: number[] = []
  const fetchPage = async (page: number, pageSize: number) => {
    requested.push(page)
    const start = (page - 1) * pageSize
    const count = Math.max(0, Math.min(pageSize, total - start))
    return { rows: Array.from({ length: count }, (_, index) => start + index), total }
  }
  return { requested, fetchPage }
}

async function testSinglePageStopsEarly() {
  const { requested, fetchPage } = pagesOf(37)
  const { rows, total } = await collectPages(fetchPage)
  assert.equal(rows.length, 37)
  assert.equal(total, 37)
  assert.deepEqual(requested, [1])
}

async function testCollectsEveryPageInOrder() {
  const { requested, fetchPage } = pagesOf(250)
  const { rows, total } = await collectPages(fetchPage)
  assert.equal(total, 250)
  assert.deepEqual(rows, Array.from({ length: 250 }, (_, index) => index))
  assert.deepEqual([...requested].sort(), [1, 2, 3])
}

async function testStopsAtMaxRows() {
  const { requested, fetchPage } = pagesOf(2000)
  const { rows, total } = await collectPages(fetchPage)
  assert.equal(MAX_TOOL_ROWS, 500)
  assert.equal(API_PAGE_SIZE, 100)
  assert.equal(rows.length, 500)
  assert.equal(total, 2000)
  assert.deepEqual([...requested].sort(), [1, 2, 3, 4, 5])
}

async function main() {
  await testSinglePageStopsEarly()
  await testCollectsEveryPageInOrder()
  await testStopsAtMaxRows()
  console.log('ai-tools paging tests passed')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
