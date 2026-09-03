import { expect, test } from '@playwright/test'
import { WIDGET, canvasBox, dragOnPage, drawnShape, openEditor, widgetCount } from './helpers'

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

test('the Text tool pulls a box out of the page and the words wrap in it', async ({ page }) => {
  await page.locator(item('text')).click()
  await page.waitForTimeout(300)
  await expect(page.locator(item('text'))).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.draw-hint')).toContainText('Drag to draw a text box, or click to place one.')

  const board = await dragOnPage(page, { x: 60, y: 50 }, { x: 260, y: 150 })
  await page.waitForTimeout(500)
  const box = await drawnShape(page)
  expect(box?.type).toBe('w-text')
  // The width is the one that was pulled out, which is what the words wrap at.
  expect(box!.width).toBeCloseTo(200 / board.scale, -0.5)
  expect(box!.left).toBeCloseTo(60 / board.scale, -0.5)

  // The caret is in it already, so typing is the next thing you do.
  await expect(page.locator('.w-text.editing')).toHaveCount(1)
  await page.keyboard.type('A run of words long enough to need a second line inside the box it was given.')
  await page.waitForTimeout(400)

  const typed = await drawnShape(page)
  expect(typed!.width).toBe(box!.width)
  // Wrapped rather than run on: more than one line's worth of height.
  expect(typed!.height).toBeGreaterThan(box!.height)
})

test('a click with the text tool places a box where it was clicked', async ({ page }) => {
  await page.locator(item('text')).click()
  await page.waitForTimeout(300)
  const board = await canvasBox(page)
  await page.mouse.click(board.x + 80, board.y + 80)
  await page.waitForTimeout(600)

  const box = await drawnShape(page)
  expect(box?.type).toBe('w-text')
  expect(box!.left).toBeCloseTo(80 / board.scale, -0.5)
  await expect(page.locator('.w-text.editing')).toHaveCount(1)
  // The tool is spent, the way every other one is after it has drawn.
  await expect(page.locator('.draw-hint')).toHaveCount(0)
})

test('Escape mid-drag leaves the page as it was', async ({ page }) => {
  await page.locator(item('text')).click()
  await page.waitForTimeout(300)
  const board = await canvasBox(page)
  await page.mouse.move(board.x + 60, board.y + 50)
  await page.mouse.down()
  await page.mouse.move(board.x + 240, board.y + 150, { steps: 8 })
  await expect(page.locator('.draw-text-band')).toBeVisible()
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.mouse.up()
  await page.waitForTimeout(500)

  expect(await widgetCount(page)).toBe(0)
  await expect(page.locator('.draw-hint')).toHaveCount(0)
})

test('a text box nobody typed into is taken back off the page', async ({ page }) => {
  await page.locator(item('text')).click()
  await page.waitForTimeout(300)
  const board = await dragOnPage(page, { x: 60, y: 50 }, { x: 260, y: 150 })
  await page.waitForTimeout(500)
  expect(await widgetCount(page)).toBe(1)

  // Clicked away from without a word typed into it, so there is nothing to keep.
  await page.mouse.click(board.x + board.width - 30, board.y + board.height - 30)
  await page.waitForTimeout(800)
  expect(await widgetCount(page)).toBe(0)
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

test('the Shapes menu offers the shapes and leaves the pen its own slot', async ({ page }) => {
  await page.locator(item('shapes')).click()
  await page.waitForTimeout(300)
  await expect(page.locator('.tool-dock__shape')).toHaveCount(4)
  await expect(page.locator('.tool-dock__shape[data-tool="pen"]')).toHaveCount(0)
  await expect(page.locator(item('pen'))).toBeVisible()
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
