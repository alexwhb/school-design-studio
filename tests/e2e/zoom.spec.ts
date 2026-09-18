import { expect, test } from '@playwright/test'
import { openEditor } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** What the pill reads, as a number. */
async function zoom(page: import('@playwright/test').Page) {
  const text = await page.locator('#zoom-control .zoom-text').innerText()
  return Number(text.replace('%', ''))
}

/** Where a screen point lands on the artwork, in the design's own pixels. */
async function designPointUnder(page: import('@playwright/test').Page, x: number, y: number) {
  return page.evaluate(
    ([px, py]) => {
      const el = document.getElementById('page-design-canvas')!
      const rect = el.getBoundingClientRect()
      const scale = rect.width / el.offsetWidth
      return { x: (px - rect.left) / scale, y: (py - rect.top) / scale }
    },
    [x, y],
  )
}

async function centreOfCanvas(page: import('@playwright/test').Page) {
  const box = (await page.locator('#page-design-canvas').boundingBox())!
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 }
}

test('the wheel zooms the board', async ({ page }) => {
  const start = await zoom(page)
  const { x, y } = await centreOfCanvas(page)
  await page.mouse.move(x, y)

  await page.mouse.wheel(0, -120)
  const zoomedIn = await zoom(page)
  expect(zoomedIn).toBeGreaterThan(start)

  await page.mouse.wheel(0, 120)
  await page.mouse.wheel(0, 120)
  expect(await zoom(page)).toBeLessThan(start)
})

test('a pinch zooms the board', async ({ page }) => {
  const start = await zoom(page)
  const { x, y } = await centreOfCanvas(page)
  await page.mouse.move(x, y)

  // What a trackpad pinch arrives as: a wheel event with ctrlKey set that
  // nobody's hand is on.
  await page.keyboard.down('Control')
  await page.mouse.wheel(0, -40)
  await page.mouse.wheel(0, -40)
  await page.keyboard.up('Control')
  expect(await zoom(page)).toBeGreaterThan(start)
})

test('the page does not slide out from under the pointer', async ({ page }) => {
  // Zoom in first: while the artwork still fits the board, the board keeps it
  // centred and there is no scroll for an anchor to ride on. The pointer only
  // has something to hold once the page is bigger than the well.
  const first = await centreOfCanvas(page)
  await page.mouse.move(first.x, first.y)
  for (let i = 0; i < 8; i++) await page.mouse.wheel(0, -120)

  const box = (await page.locator('#page-design-canvas').boundingBox())!
  // Off-centre, so a zoom that ignored the pointer would move this a long way.
  const x = box.x + Math.min(box.width * 0.25, 300)
  const y = box.y + Math.min(box.height * 0.3, 300)
  await page.mouse.move(x, y)

  const before = await designPointUnder(page, x, y)
  for (let i = 0; i < 3; i++) await page.mouse.wheel(0, -120)
  const after = await designPointUnder(page, x, y)

  // A design pixel is a fraction of a screen pixel at these zooms, so the
  // tolerance is rounding, not drift: ignoring the pointer moves this by
  // hundreds.
  expect(Math.abs(after.x - before.x)).toBeLessThan(12)
  expect(Math.abs(after.y - before.y)).toBeLessThan(12)
})

test('the zoom keys step and fit', async ({ page }) => {
  const fitted = await zoom(page)

  await page.keyboard.press('Control+Equal')
  const up = await zoom(page)
  expect(up).toBeGreaterThan(fitted)

  await page.keyboard.press('Control+Minus')
  expect(await zoom(page)).toBeLessThan(up)

  await page.keyboard.press('Control+Equal')
  await page.keyboard.press('Control+Equal')
  expect(await zoom(page)).toBeGreaterThan(fitted)

  await page.keyboard.press('Control+Digit0')
  expect(await zoom(page)).toBe(fitted)
})

test('the wheel does not snap back to the nearest preset', async ({ page }) => {
  const { x, y } = await centreOfCanvas(page)
  await page.mouse.move(x, y)
  const start = await zoom(page)
  await page.mouse.wheel(0, -120)
  const stepped = await zoom(page)
  // One notch is about a fifth, not a jump to 50% or 100%.
  expect(stepped).toBeGreaterThan(start)
  expect(stepped).toBeLessThan(start * 1.3)
})

test('the wheel stops at the ends rather than running away', async ({ page }) => {
  const { x, y } = await centreOfCanvas(page)
  await page.mouse.move(x, y)
  for (let i = 0; i < 30; i++) await page.mouse.wheel(0, -120)
  expect(await zoom(page)).toBe(500)
  for (let i = 0; i < 40; i++) await page.mouse.wheel(0, 120)
  expect(await zoom(page)).toBe(10)
})
