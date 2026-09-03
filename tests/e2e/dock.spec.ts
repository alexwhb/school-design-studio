import { expect, test } from '@playwright/test'
import { WIDGET, canvasBox, openEditor, widgetCount } from './helpers'

/*
 * The tool dock at the foot of the canvas. What is worth testing is that each
 * slot does the one thing it says, that the two popovers open and hand the
 * gesture on, and the two things the dock's position depends on: that a press
 * on it still reaches the document, so undo gets its entry, and that it rises
 * off the bottom when the notes drawer takes it.
 */

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

const item = (tool: string) => `.tool-dock__item[data-tool="${tool}"]`

test('the dock is on the canvas and the Tools tab is gone', async ({ page }) => {
  await expect(page.locator('.tool-dock__bar')).toBeVisible()
  await expect(page.locator('#widget-panel .classify-item', { hasText: 'Tools' })).toHaveCount(0)
  // Nothing armed, so the pointer is the tool that is lit.
  await expect(page.locator(item('select'))).toHaveAttribute('aria-pressed', 'true')
})

test('the Text tool drops a text box in the middle and selects it', async ({ page }) => {
  await page.locator(item('text')).click()
  await page.waitForTimeout(600)
  await expect(page.locator(WIDGET)).toHaveCount(1)
  await expect(page.locator(WIDGET).first()).toHaveAttribute('data-type', 'w-text')
  await expect(page.locator('.moveable-control-box').first()).toBeVisible()
})

test('the QR and Table buttons put one of theirs on the page', async ({ page }) => {
  await page.locator(item('qrcode')).click()
  await page.waitForTimeout(700)
  await expect(page.locator(`${WIDGET}[data-type="w-qrcode"]`)).toHaveCount(1)

  await page.locator(item('table')).click()
  await page.waitForTimeout(700)
  await expect(page.locator(`${WIDGET}[data-type="w-table"]`)).toHaveCount(1)
})

test('undo takes back what the dock added', async ({ page }) => {
  await page.locator(item('qrcode')).click()
  await page.waitForTimeout(700)
  expect(await widgetCount(page)).toBe(1)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(700)
  expect(await widgetCount(page)).toBe(0)
})

test('the Shapes popover arms a tool, and the tool draws', async ({ page }) => {
  await page.locator(item('shapes')).click()
  await page.waitForTimeout(300)
  await expect(page.locator('.tool-dock__shapes')).toBeVisible()

  await page.locator('.tool-dock__shape[data-tool="ellipse"]').click()
  await page.waitForTimeout(300)
  // The popover gets out of the way, and the dock says what the tool wants.
  await expect(page.locator('.tool-dock__shapes')).toHaveCount(0)
  await expect(page.locator('.draw-hint')).toContainText('Drag to draw an ellipse')
  await expect(page.locator(item('shapes'))).toHaveAttribute('aria-pressed', 'true')

  const board = await canvasBox(page)
  await page.mouse.move(board.x + 120, board.y + 120)
  await page.mouse.down()
  await page.mouse.move(board.x + 240, board.y + 220, { steps: 8 })
  await page.mouse.up()
  await page.waitForTimeout(600)
  await expect(page.locator(`${WIDGET}[data-type="w-ellipse"]`)).toHaveCount(1)
})

test('the pen has a slot of its own', async ({ page }) => {
  await page.locator(item('pen')).click()
  await page.waitForTimeout(300)
  await expect(page.locator(item('pen'))).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.draw-hint')).toContainText('Click to place a point')
})

test('Escape and the hint’s own chip both put the pointer back', async ({ page }) => {
  await page.locator(item('pen')).click()
  await page.waitForTimeout(300)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(item('select'))).toHaveAttribute('aria-pressed', 'true')

  await page.locator(item('pen')).click()
  await page.waitForTimeout(300)
  await page.locator('.draw-hint__esc').click()
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toHaveCount(0)
})

test('the Image popover offers a file and the photo panel', async ({ page }) => {
  await page.locator(item('image')).click()
  await page.waitForTimeout(300)
  await expect(page.locator('.tool-dock__menu')).toContainText('Upload from device')
  await expect(page.locator('.tool-dock__menu')).toContainText('Browse photos')
  await expect(page.locator('.tool-dock__menu input[type="file"]')).toHaveCount(1)
})

test('the dock stands on the notes drawer when it opens', async ({ page }) => {
  const dockTop = async () => (await page.locator('.tool-dock__bar').boundingBox())!.y

  const before = await dockTop()
  await page.locator('.notes-toggle').click()
  await page.waitForTimeout(700)
  const after = await dockTop()
  // The drawer is 156px tall; the dock has to be at least that much higher.
  expect(before - after).toBeGreaterThan(140)
  await expect(page.locator('.notes-drawer')).toBeVisible()
})

test('the dock clears the page strip when the strip is opened', async ({ page }) => {
  const dockBottom = async () => (await page.locator('.tool-dock__bar').boundingBox())!.y + 43
  const before = await dockBottom()

  await page.locator('.artboards .btn').click()
  await page.locator('.artboards .list').waitFor()
  await page.waitForTimeout(700)

  const strip = (await page.locator('.artboards').boundingBox())!
  expect(await dockBottom()).toBeLessThanOrEqual(strip.y)
  expect(await dockBottom()).toBeLessThan(before)
})

test('the page chip adds a page and still opens the strip', async ({ page }) => {
  await expect(page.locator('.artboards .btn__label')).toHaveText('Page 1')
  await expect(page.locator('.artboards .btn__count')).toHaveText('of 1')

  await page.locator('.artboards .chip-add').click()
  await page.waitForTimeout(900)
  await expect(page.locator('.artboards .btn__count')).toHaveText('of 2')

  await page.locator('.artboards .btn').click()
  await expect(page.locator('.artboards .list')).toBeVisible()
})

test('the zoom pill fits the page from its own button', async ({ page }) => {
  await page.locator('#zoom-control .zoom-text').click()
  await page.locator('#zoom-control .zoom-item', { hasText: '200%' }).click()
  await page.waitForTimeout(600)
  await expect(page.locator('#zoom-control .zoom-text')).toHaveText('200%')

  await page.locator('#zoom-control .zoom-fit').click()
  await page.waitForTimeout(600)
  await expect(page.locator('#zoom-control .zoom-text')).not.toHaveText('200%')
})
