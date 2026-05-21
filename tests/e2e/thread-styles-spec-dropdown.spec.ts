import { test, expect } from '@playwright/test'

const STYLE_ID = process.env.E2E_TEST_STYLE_ID
const BASE_URL = process.env.E2E_BASE_URL ?? 'http://localhost:5173'

test.describe('Thread Styles spec dropdown — BUG #1 regression', () => {
  test.skip(!STYLE_ID, 'E2E_TEST_STYLE_ID env var required')

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/thread/styles/${STYLE_ID}`)
    await page.getByRole('tab', { name: 'Định mức chỉ' }).click()
    await page.waitForLoadState('networkidle')
  })

  test('Tex dropdown loads options when clicking new row Tex cell', async ({ page }) => {
    await page.getByTestId('spec-add-btn').click()
    await page.waitForResponse(r => r.url().includes('/api/style-thread-specs') && r.request().method() === 'POST')

    const firstTexCell = page.getByTestId('spec-cell-tex').first()
    await firstTexCell.click()

    const select = page.locator('.q-menu .q-select__dropdown-icon, .q-menu .q-item').first()
    await expect(select).toBeVisible({ timeout: 3000 })

    await page.waitForResponse(r => r.url().includes('/api/threads?supplier_id='), { timeout: 5000 })
    const options = page.locator('.q-menu .q-item')
    await expect(options.first()).toBeVisible({ timeout: 5000 })
    const count = await options.count()
    expect(count).toBeGreaterThan(0)
  })

  test('Tex dropdown loads after supplier change', async ({ page }) => {
    const firstSupplierCell = page.getByTestId('spec-cell-supplier').first()
    await firstSupplierCell.click()

    const supplierMenu = page.locator('.q-menu .q-item').nth(1)
    await supplierMenu.click()
    await page.getByRole('button', { name: 'Lưu' }).first().click()

    await page.waitForResponse(r => r.url().includes('/api/style-thread-specs/') && r.request().method() === 'PUT')

    const firstTexCell = page.getByTestId('spec-cell-tex').first()
    await firstTexCell.click()

    const options = page.locator('.q-menu .q-item')
    await expect(options.first()).toBeVisible({ timeout: 5000 })
  })
})
