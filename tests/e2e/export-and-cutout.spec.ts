import path from 'node:path'
import { expect, test } from '@playwright/test'
import { WIDGET, addText, openEditor } from './helpers'

const PHOTO = path.resolve(process.cwd(), 'tests/fixtures/photo.png')

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

/* ------------------------------------------------------ background removal */

test('the eraser opens on the picture you chose and hands a cut-out back', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Tools' }).click()
  await page.waitForTimeout(500)
  await page.getByText('Remove background', { exact: true }).click()
  await page.waitForTimeout(700)

  await page.locator('.ds-image-cutout input[type="file"]').setInputFiles(PHOTO)
  // The eraser opens itself once the picture has been measured.
  await page.locator('.ds-image-extraction').waitFor({ timeout: 30000 })
  await page.waitForTimeout(2500)

  // Both boards are drawn: the picture with its mask, and the result.
  const boards = await page.evaluate(() => {
    const read = (sel: string) => {
      const canvas = document.querySelector<HTMLCanvasElement>(sel)
      if (!canvas) return null
      const ctx = canvas.getContext('2d')
      const { width, height } = canvas
      if (!ctx || !width || !height) return { width, height, painted: 0 }
      const data = ctx.getImageData(0, 0, width, height).data
      let painted = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++
      return { width, height, painted }
    }
    return { input: read('.matting-board'), output: read('.result-board') }
  })

  expect(boards.input!.width).toBeGreaterThan(0)
  expect(boards.input!.painted, 'the picture is on the left board').toBeGreaterThan(0)
  expect(boards.output!.painted, 'the result is on the right board').toBeGreaterThan(0)

  await page.getByRole('button', { name: 'Apply' }).click()
  await page.waitForTimeout(2000)

  // Back in the cut-out dialog, with a result to compare and to use.
  await expect(page.locator('.ds-image-cutout .scan-effect img')).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Use this picture' })).toBeVisible()
})

test('the brush controls drive the eraser', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Tools' }).click()
  await page.waitForTimeout(500)
  await page.getByText('Remove background', { exact: true }).click()
  await page.waitForTimeout(700)
  await page.locator('.ds-image-cutout input[type="file"]').setInputFiles(PHOTO)
  await page.locator('.ds-image-extraction').waitFor({ timeout: 30000 })
  await page.waitForTimeout(2500)

  await expect(page.locator('.brush', { hasText: 'Restore brush' })).toHaveClass(/is-on/)
  await page.locator('.brush', { hasText: 'Erase brush' }).click()
  await page.waitForTimeout(400)
  await expect(page.locator('.brush', { hasText: 'Erase brush' })).toHaveClass(/is-on/)

  // The brush cursor is drawn from the current size and softness.
  const cursor = await page.locator('.matting-cursor').first().getAttribute('src')
  expect(cursor).toMatch(/^data:image\/png/)
})

test('a cut-out lands in the Uploads panel', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Tools' }).click()
  await page.waitForTimeout(500)
  await page.getByText('Remove background', { exact: true }).click()
  await page.waitForTimeout(700)
  await page.locator('.ds-image-cutout input[type="file"]').setInputFiles(PHOTO)
  await page.locator('.ds-image-extraction').waitFor({ timeout: 30000 })
  await page.waitForTimeout(2500)
  await page.getByRole('button', { name: 'Apply' }).click()
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Use this picture' }).click()
  await page.waitForTimeout(2500)

  // Opened from the Tools panel there is nothing to replace, so it is placed.
  await expect(page.locator(`${WIDGET}[data-type="w-image"]`)).toHaveCount(1)

  await page.locator('#widget-panel .classify-item', { hasText: 'Uploads' }).click()
  await page.waitForTimeout(1500)
  await expect(page.locator('.user-wrap .img-list-wrap .el-image__inner').first()).toBeVisible()
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
