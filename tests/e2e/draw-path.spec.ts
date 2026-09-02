import { expect, test } from '@playwright/test'
import {
  WIDGET,
  addText,
  armShapeTool,
  canvasBox,
  clickPoints,
  drawnSelectionBoxes,
  drawnShape,
  editPoints,
  expandPageStrip,
  openEditor,
  openGradient,
  pathPaint,
  pathShape,
  setWidgetText,
  widgetText,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('a path is drawn a point at a time and finished with Enter', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  const board = await clickPoints(page, [
    { x: 60, y: 60 },
    { x: 200, y: 140 },
    { x: 320, y: 60 },
  ])
  // Still being drawn: three points down, nothing on the page yet.
  await expect(page.locator('.draw-pen__point')).toHaveCount(3)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-path')
  // The frame wraps the three points, with half the outline's thickness of room
  // round them. Screen pixels back into design pixels, a pixel of slack either way.
  expect(shape!.width).toBeCloseTo(260 / board.scale + 2, -0.6)
  expect(shape!.height).toBeCloseTo(80 / board.scale + 2, -0.6)
  // Two straight runs through three points, and no Z: the path was left open.
  const d = (await pathShape(page))!
  expect(d.match(/L/g)).toHaveLength(2)
  expect(d).not.toContain('Z')
})

test('an open path is a line: outlined, and with nothing inside it', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 60, y: 60 },
    { x: 240, y: 160 },
  ])
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  const paint = (await pathPaint(page))!
  expect(paint.fill).toBe('transparent')
  expect(paint.strokeWidth).toBe('2')
  expect(paint.stroke).not.toBe('none')
})

test('clicking the first point closes the path into a filled shape', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 60 },
    { x: 240, y: 60 },
    { x: 160, y: 200 },
    // Back to where it started, which is what closes it.
    { x: 80, y: 60 },
  ])
  await page.waitForTimeout(500)

  expect((await drawnShape(page))?.type).toBe('w-path')
  expect(await pathShape(page)).toContain('Z')
  const paint = (await pathPaint(page))!
  // Closed, so it arrives filled the way a drawn box does, and bare.
  expect(paint.fill).not.toBe('transparent')
  expect(paint.stroke).toBe('none')
  // And the tool has handed the pointer back with the path selected.
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('double-clicking a path swaps the selection box for its points', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 60 },
    { x: 240, y: 60 },
    { x: 160, y: 200 },
    { x: 80, y: 60 },
  ])
  await page.waitForTimeout(500)
  // Selected, so the selection box is up and the points are not.
  expect(await drawnSelectionBoxes(page)).toBe(1)
  await expect(page.locator('.path__point')).toHaveCount(0)

  await editPoints(page)
  await expect(page.locator('.path__point')).toHaveCount(3)
  // The two cannot both be on screen: a path's corner points lie exactly under
  // the selection box's own handles.
  expect(await drawnSelectionBoxes(page)).toBe(0)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await expect(page.locator('.path__point')).toHaveCount(0)
  expect(await drawnSelectionBoxes(page)).toBe(1)
})

test('dragging a point out pulls a curve through it', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  const board = await canvasBox(page)
  await page.mouse.click(board.x + 60, board.y + 160)
  await page.waitForTimeout(120)

  // The second point is pressed and pulled, which curves the line into it.
  await page.mouse.move(board.x + 200, board.y + 160)
  await page.mouse.down()
  for (let step = 1; step <= 8; step++) await page.mouse.move(board.x + 200 + 6 * step, board.y + 160 - 6 * step)
  await expect(page.locator('.draw-pen__handle')).toBeVisible()
  await page.mouse.up()
  await page.waitForTimeout(120)
  await page.mouse.click(board.x + 340, board.y + 160)
  await page.waitForTimeout(120)
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  const d = (await pathShape(page))!
  // Both runs are curves now, because the middle point bends the line either side.
  expect(d.match(/C/g)).toHaveLength(2)
  // And the curve reaches above the points it runs through, so the frame is
  // taller than the flat line they lie on.
  expect((await drawnShape(page))!.height).toBeGreaterThan(20)
})

test('P arms the pen, and pressing it again puts the pointer back', async ({ page }) => {
  await page.keyboard.press('p')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toBeVisible()

  await page.keyboard.press('p')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('Escape keeps the path that has been drawn, and Ctrl+Z takes it back', async ({ page }) => {
  await page.keyboard.press('p')
  await page.waitForTimeout(300)
  await clickPoints(page, [
    { x: 60, y: 60 },
    { x: 200, y: 160 },
    { x: 320, y: 80 },
  ])
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(1)

  // The tool swallows every press the path was made of, so it brackets its own
  // undo entry — one for the whole path, however many points it took.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(600)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(600)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('a lone click is not a path', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [{ x: 120, y: 120 }])
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)

  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('dragging a point grip reshapes the path, and the frame follows it', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 80 },
    { x: 240, y: 80 },
    { x: 240, y: 200 },
    { x: 80, y: 80 },
  ])
  await page.waitForTimeout(500)
  await editPoints(page)
  const before = (await drawnShape(page))!

  const grip = (await page.locator('.path__point').nth(1).boundingBox())!
  const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) await page.mouse.move(from.x + 8 * step, from.y)
  // The figure follows the grip, so a point can be placed without looking away.
  await expect(page.locator('.path__readout')).toBeVisible()
  await page.mouse.up()
  await page.waitForTimeout(600)

  const after = (await drawnShape(page))!
  // The point went right, so the frame is wider by however far it went.
  expect(after.width).toBeGreaterThan(before.width + 40)
  expect(after.left).toBeCloseTo(before.left, -0.6)
})

test('Alt-clicking a point curves it, and clicking again squares it off', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 160 },
    { x: 200, y: 80 },
    { x: 320, y: 160 },
  ])
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  await editPoints(page)
  expect(await pathShape(page)).not.toContain('C')

  const grip = (await page.locator('.path__point').nth(1).boundingBox())!
  const at = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
  await page.keyboard.down('Alt')
  await page.mouse.click(at.x, at.y)
  await page.keyboard.up('Alt')
  await page.waitForTimeout(500)

  expect(await pathShape(page)).toContain('C')
  // The two control handles it grew are on screen to be dragged.
  await expect(page.locator('.path__handle')).toHaveCount(2)

  await page.keyboard.down('Alt')
  await page.mouse.click(at.x, at.y)
  await page.keyboard.up('Alt')
  await page.waitForTimeout(500)
  expect(await pathShape(page)).not.toContain('C')
  await expect(page.locator('.path__handle')).toHaveCount(0)
})

test('the panel closes an open path and opens it again', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 80 },
    { x: 240, y: 80 },
    { x: 160, y: 200 },
  ])
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  expect(await pathShape(page)).not.toContain('Z')

  const toggle = page.locator('.path-style__closed')
  await toggle.click()
  await page.waitForTimeout(500)
  expect(await pathShape(page)).toContain('Z')
  // Closing is geometry and nothing else: the fill and the outline are untouched.
  expect((await pathPaint(page))!.fill).toBe('transparent')

  await toggle.click()
  await page.waitForTimeout(500)
  expect(await pathShape(page)).not.toContain('Z')
})

test('a path takes a gradient fill, which SVG needs a paint server for', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 60 },
    { x: 260, y: 60 },
    { x: 170, y: 220 },
    { x: 80, y: 60 },
  ])
  await page.waitForTimeout(500)

  await openGradient(page, page.locator('#style-panel .color__select').first().locator('.color__field'))
  // `fill` cannot hold a CSS gradient, so it comes out as a reference to a
  // gradient built alongside the shape.
  const paint = (await pathPaint(page))!
  expect(paint.fill).toMatch(/^url\(#/)
  const id = paint.fill!.slice(5, -1)
  await expect(page.locator(`#page-design-canvas .path__paint defs #${id}`)).toHaveCount(1)
})

test('a drawn path is in the page thumbnail too', async ({ page }) => {
  await armShapeTool(page, 'Pen')
  await clickPoints(page, [
    { x: 80, y: 80 },
    { x: 240, y: 200 },
  ])
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  await expandPageStrip(page)

  await expect(page.locator('.artboards .path__paint')).toHaveCount(1)
})

test('typing a p into a text layer is a p, not the pen', async ({ page }) => {
  await addText(page, 'Heading')
  await setWidgetText(page, 'Spring open day')

  expect(await widgetText(page)).toBe('Spring open day')
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})
