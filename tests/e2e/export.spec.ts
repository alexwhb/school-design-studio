import { expect, test } from '@playwright/test'
import { addText, armShapeTool, clickPoints, openEditor, pixelOf } from './helpers'

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

test('a drop shadow on a photo survives the PNG export', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Photos' }).click()
  await page.waitForTimeout(1200)
  await page.locator('.photo-list-wrap .list__img').first().click()
  await page.waitForTimeout(1500)
  const widget = page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first()
  await widget.click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)

  // Straight down and unblurred, so the shadow is a hard copy of the photo
  // sixty pixels below it: a pixel that is either there or is not. It also
  // falls entirely outside the widget's own box, which is the part that used
  // to be impossible — html2canvas cannot draw a filter, and the picture the
  // export draws instead is only as big as the element unless it is told to
  // leave room.
  await page.locator('#style-panel .shadow-select .el-checkbox').click()
  await page.waitForTimeout(300)
  const blur = page.locator('#style-panel .shadow-select .field--full input')
  await blur.fill('0')
  await blur.blur()
  const offsetY = page.locator('#style-panel .shadow-select .field').nth(2).locator('input')
  await offsetY.fill('60')
  await offsetY.blur()
  await page.waitForTimeout(400)

  const box = await widget.evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    top: parseFloat((el as HTMLElement).style.top),
    width: parseFloat((el as HTMLElement).style.width),
    height: parseFloat((el as HTMLElement).style.height),
  }))

  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk as Buffer)
  const png = Buffer.concat(chunks)

  const inShadow = await pixelOf(page, png, Math.round(box.left + box.width / 2), Math.round(box.top + box.height + 30))
  // Black at 35% over the white page.
  expect(inShadow.a).toBe(255)
  expect(inShadow.r).toBeLessThan(220)
  expect(inShadow.r).toBe(inShadow.g)
  expect(inShadow.g).toBe(inShadow.b)

  // Beside the photo, where no shadow falls, the page is untouched.
  const beside = await pixelOf(page, png, Math.round(box.left - 40), Math.round(box.top + box.height + 30))
  expect(beside).toEqual({ r: 255, g: 255, b: 255, a: 255 })
})

test('a path drawn with the pen survives the PNG export', async ({ page }) => {
  // html2canvas has no SVG renderer and a path is the one drawn shape that has
  // to be one, so this is the shape most likely to come out of an export as a
  // hole in the page.
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 60 },
    { x: 260, y: 60 },
    { x: 170, y: 220 },
    { x: 80, y: 60 },
  ])
  await page.waitForTimeout(600)
  const box = await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    top: parseFloat((el as HTMLElement).style.top),
    width: parseFloat((el as HTMLElement).style.width),
    height: parseFloat((el as HTMLElement).style.height),
  }))

  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk as Buffer)
  const png = Buffer.concat(chunks)

  // Just under the top edge, between the two upper corners, is inside the
  // triangle and filled with the placeholder grey.
  const inside = await pixelOf(page, png, Math.round(box.left + box.width / 2), Math.round(box.top + 12))
  expect(inside).toEqual({ r: 216, g: 216, b: 216, a: 255 })

  // The bottom-left corner of the frame is outside the triangle, so the page
  // shows through — which is what says the shape was drawn and not just its box.
  const outside = await pixelOf(page, png, Math.round(box.left + 6), Math.round(box.top + box.height - 6))
  expect(outside).toEqual({ r: 255, g: 255, b: 255, a: 255 })

  // The bottom point of the triangle is grey like the rest of it, not the blue
  // of a grip: the export deselects, so the points a path is edited by are not
  // baked into the file.
  const apex = await pixelOf(page, png, Math.round(box.left + box.width / 2), Math.round(box.top + box.height - 4))
  expect(apex.r).toBe(apex.b)
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
