import { expect, test } from '@playwright/test'
import { addText, openEditor } from './helpers'

/** The finished-export overlay covers the toolbar until it is closed. */
async function dismissProgress(page: import('@playwright/test').Page) {
  const close = page.locator('.ds-download-progress .backstage')
  if (await close.isVisible().catch(() => false)) {
    await close.click()
    await page.waitForTimeout(400)
  }
}

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/* ---------------------------------------------------------------- exports */

test('Export writes a PNG of the page', async ({ page }) => {
  await addText(page, 'Heading')
  const download = page.waitForEvent('download', { timeout: 60000 })
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download

  expect(file.suggestedFilename()).toMatch(/\.png$/)
  const body = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of body!) chunks.push(chunk as Buffer)
  const bytes = Buffer.concat(chunks)
  // A real PNG, not a web server's error page saved under a .png name.
  expect(bytes.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a')
  expect(bytes.length).toBeGreaterThan(2000)
})

test('the PDF export writes a real PDF, one page per page of the design', async ({ page }) => {
  await addText(page, 'Heading')
  await page.locator('.export-caret').click()
  await page.waitForTimeout(500)

  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.locator('.export-menu__list').getByText('PDF', { exact: true }).click()
  const file = await download

  expect(file.suggestedFilename()).toMatch(/\.pdf$/)
  const body = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of body!) chunks.push(chunk as Buffer)
  const bytes = Buffer.concat(chunks)

  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  expect(bytes.subarray(-6).toString()).toContain('%%EOF')
  const text = bytes.toString('latin1')
  expect(text).toContain('/Type /Catalog')
  expect((text.match(/\/Type \/Page[^s]/g) || []).length).toBe(1)
  // 1920 × 1080 design pixels at 150 DPI is 921.6 × 518.4 points.
  expect(text).toMatch(/\/MediaBox \[0 0 921\.6 518\.4\]/)
})

test('the quality choice changes the size of the exported image', async ({ page }) => {
  const sizeOf = async (quality: string) => {
    await dismissProgress(page)
    await page.locator('.export-caret').click()
    await page.waitForTimeout(400)
    await page.locator('.export-menu__list .quality__btn', { hasText: quality }).click()
    await page.waitForTimeout(200)
    const download = page.waitForEvent('download', { timeout: 90000 })
    await page.locator('.export-menu__list').getByText('Image', { exact: true }).click()
    const file = await download
    const stream = await file.createReadStream()
    const chunks: Buffer[] = []
    for await (const chunk of stream!) chunks.push(chunk as Buffer)
    const bytes = Buffer.concat(chunks)
    // Width and height live in the IHDR chunk, at a fixed offset.
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
  }

  await addText(page, 'Heading')
  const standard = await sizeOf('Standard')
  expect(standard).toEqual({ width: 1920, height: 1080 })

  const print = await sizeOf('Print')
  expect(print).toEqual({ width: 3840, height: 2160 })
})

test('the finished-export overlay can be dismissed', async ({ page }) => {
  await addText(page, 'Heading')
  const download = page.waitForEvent('download', { timeout: 60000 })
  await page.getByRole('button', { name: 'Export' }).click()
  await download
  await expect(page.locator('.ds-download-progress')).toBeVisible()

  await page.locator('.ds-download-progress .backstage').click()
  await page.waitForTimeout(400)
  await expect(page.locator('.ds-download-progress')).toHaveCount(0)
  // And the editor is usable again.
  await page.locator('.export-caret').click()
  await expect(page.locator('.export-menu__list')).toBeVisible()
})
