import { expect, test, type Page } from '@playwright/test'
import { addFlatImage, addText, openEditor } from './helpers'

/** The check the standalone editor runs before its own Download. */

const DIALOG = '.check-before-download'

async function openExportMenu(page: Page) {
  await page.locator('.export-caret').click()
  await page.waitForTimeout(400)
}

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('a photo with no alt text is caught before a PDF, and Show me selects it', async ({ page }) => {
  await addFlatImage(page)
  await page.locator('#page-design-canvas').click({ position: { x: 5, y: 5 } })
  await page.waitForTimeout(300)

  await openExportMenu(page)
  await page.locator('.export-menu__list').getByText('PDF', { exact: true }).click()
  await expect(page.locator(DIALOG)).toBeVisible()
  await expect(page.locator(DIALOG)).toContainText('Before you download')
  await expect(page.locator(`${DIALOG}__item`)).toHaveCount(1)
  await expect(page.locator(`${DIALOG}__item`)).toContainText('Page 1')
  await expect(page.locator(`${DIALOG}__item`)).toContainText('This picture has no alt text. Describe it, or mark it decorative.')

  await page.locator(`${DIALOG}__show`).first().click()
  await expect(page.locator(DIALOG)).toHaveCount(0)
  // The photo is selected, with its panel open where the alt text goes.
  const field = page.locator('#style-panel').getByRole('textbox', { name: 'Alt text' })
  await expect(field).toBeVisible()
  await field.fill('A grey card')
  await field.blur()
  await page.waitForTimeout(300)

  // Nothing left to say, so the download just happens.
  await openExportMenu(page)
  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.locator('.export-menu__list').getByText('PDF', { exact: true }).click()
  await expect(page.locator(DIALOG)).toHaveCount(0)
  expect((await download).suggestedFilename()).toMatch(/\.pdf$/)
})

test('Download anyway downloads', async ({ page }) => {
  await addFlatImage(page)
  await openExportMenu(page)
  await page.locator('.export-menu__list').getByText('PowerPoint', { exact: true }).click()
  await expect(page.locator(DIALOG)).toBeVisible()
  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.locator(DIALOG).getByRole('button', { name: 'Download anyway' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.pptx$/)
})

test('a PNG is not held up for alt text it cannot carry', async ({ page }) => {
  await addFlatImage(page)
  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.getByRole('button', { name: 'Export' }).click()
  await expect(page.locator(DIALOG)).toHaveCount(0)
  expect((await download).suggestedFilename()).toMatch(/\.png$/)
})

test('text too small to read is caught for any download', async ({ page }) => {
  await addText(page, 'Body text')
  await page.locator('#page-design-canvas .w-text').first().click()
  await page.waitForTimeout(300)
  // The way a pasted footnote ends up.
  const size = page.locator('#style-panel .size-select input')
  await size.fill('12')
  await size.blur()
  await page.waitForTimeout(300)

  await page.getByRole('button', { name: 'Export' }).click()
  await expect(page.locator(DIALOG)).toBeVisible()
  await expect(page.locator(`${DIALOG}__item`).first()).toContainText('This text is too small to read on a screen. Make it at least 20px.')
  await page.keyboard.press('Escape')
  await expect(page.locator(DIALOG)).toHaveCount(0)
})
