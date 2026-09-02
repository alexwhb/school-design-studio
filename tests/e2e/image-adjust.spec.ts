import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addFlatImage, expandPageStrip, imageFilter, openEditor } from './helpers'
import { exportPng, pixelOf } from './pixels'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** Unfolds the Adjust section, which starts folded. */
async function openAdjust(page: Page) {
  const section = page.locator('#style-panel .image-adjust')
  await section.waitFor()
  if (!(await section.locator('.image-adjust__presets').isVisible())) {
    await section.locator('.ds-section__toggle').click()
    await page.waitForTimeout(300)
  }
}

/** Where the one photo on the page sits, in design pixels. */
function widgetBoxPx(page: Page) {
  return page.locator(WIDGET).first().evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    top: parseFloat((el as HTMLElement).style.top),
    width: parseFloat((el as HTMLElement).style.width),
    height: parseFloat((el as HTMLElement).style.height),
  }))
}

/** Drags a slider's thumb to a fraction of its runway, in a handful of steps. */
async function dragSlider(page: Page, key: string, fraction: number) {
  const runway = page.locator(`.image-adjust__slider--${key} .el-slider__runway`)
  // Seven sliders is more panel than the window is tall, so the lower ones sit
  // below the fold and a press aimed at one would land nowhere.
  await runway.scrollIntoViewIfNeeded()
  await page.waitForTimeout(200)
  const box = (await runway.boundingBox())!
  const from = { x: box.x + 2, y: box.y + box.height / 2 }
  const to = { x: box.x + box.width * fraction, y: from.y }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= 6; step++) await page.mouse.move(from.x + ((to.x - from.x) * step) / 6, from.y)
  await page.mouse.up()
  await page.waitForTimeout(400)
}

test('the brightness slider sets a filter on the picture, and Reset clears it', async ({ page }) => {
  await addFlatImage(page)
  expect(await imageFilter(page)).toBe('none')
  await openAdjust(page)

  await dragSlider(page, 'brightness', 0.75)
  expect(await imageFilter(page)).toMatch(/^brightness\(1\.\d+\)$/)
  // On the picture, not the frame, so a keyline or a shadow would be untouched.
  const frameFilter = await page.locator(WIDGET).first().evaluate((el) => getComputedStyle(el).filter)
  expect(frameFilter).toBe('none')
  await expect(page.locator('.image-adjust .ds-section__aside')).toHaveText('Edited')

  await page.locator('.image-adjust__reset').click()
  await page.waitForTimeout(400)
  expect(await imageFilter(page)).toBe('none')
})

test('a slider drag is one undo step, however far the thumb went', async ({ page }) => {
  await addFlatImage(page)
  await openAdjust(page)
  await dragSlider(page, 'contrast', 0.8)
  expect(await imageFilter(page)).toMatch(/^contrast\(/)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(600)
  expect(await imageFilter(page)).toBe('none')
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(600)
  expect(await imageFilter(page)).toMatch(/^contrast\(/)
})

test('a preset applies a look, names itself in the heading, and undoes', async ({ page }) => {
  await addFlatImage(page)
  await openAdjust(page)
  await page.locator('.image-adjust__preset', { hasText: 'Black and white' }).click()
  await page.waitForTimeout(400)
  expect(await imageFilter(page)).toContain('grayscale(1)')
  await expect(page.locator('.image-adjust .ds-section__aside')).toHaveText('Black and white')
  await expect(page.locator('.image-adjust__preset', { hasText: 'Black and white' })).toHaveAttribute('aria-pressed', 'true')

  await page.locator('.image-adjust__preset', { hasText: 'Original' }).click()
  await page.waitForTimeout(400)
  expect(await imageFilter(page)).toBe('none')

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(600)
  expect(await imageFilter(page)).toContain('grayscale(1)')
})

test('the page thumbnail draws the same adjustments', async ({ page }) => {
  await addFlatImage(page)
  await openAdjust(page)
  await page.locator('.image-adjust__preset', { hasText: 'Warm' }).click()
  await page.waitForTimeout(400)
  await expandPageStrip(page)
  const thumbFilter = await page.evaluate(() => {
    const img = document.querySelector('.artboards img.target') as HTMLElement | null
    return img ? getComputedStyle(img).filter : null
  })
  expect(thumbFilter).toContain('sepia(')
})

test('an adjusted photo exports lighter than it came', async ({ page }) => {
  await addFlatImage(page, '#808080')
  const box = await widgetBoxPx(page)
  const centre = { x: Math.round(box.left + box.width / 2), y: Math.round(box.top + box.height / 2) }

  const plain = await pixelOf(page, await exportPng(page), centre.x, centre.y)
  expect(plain.r).toBeGreaterThan(110)
  expect(plain.r).toBeLessThan(146)

  await page.locator('.ds-download-progress .backstage').click()
  await page.waitForTimeout(400)
  await page.locator(WIDGET).first().click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  await openAdjust(page)
  await dragSlider(page, 'brightness', 0.8)
  expect(await imageFilter(page)).toMatch(/^brightness\(1\.[5-7]/)

  // html2canvas cannot draw a filter, so the photo is pre-rendered by the
  // browser first; without that the export would come out as it came.
  const bright = await pixelOf(page, await exportPng(page), centre.x, centre.y)
  expect(bright.r).toBeGreaterThan(plain.r + 30)
  expect(bright.r).toBe(bright.g)
  expect(bright.g).toBe(bright.b)
})
