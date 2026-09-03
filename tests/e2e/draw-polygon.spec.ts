import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addText, armShapeTool, canvasBox, dragOnPage, drawnShape, expandPageStrip, openEditor, setWidgetText, widgetText } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/**
 * The corners the polygon is actually drawn with, read off its path. Its own
 * children only: the clip the outline is cut to is a copy of the same path.
 */
function cornersOf(page: Page, root = '#page-design-canvas') {
  return page.evaluate((selector) => {
    const path = document.querySelector(`${selector} .polygon__paint > path`)
    const d = path?.getAttribute('d')
    if (!d) return null
    return d
      .replace(/ Z$/, '')
      .split(/(?=[ML])/)
      .map((step) => step.slice(1).split(',').map(Number))
  }, root)
}

/** Types an exact corner count into the panel. */
async function setSides(page: Page, sides: number) {
  const box = page.locator('.polygon-sides .number-input2 input')
  await box.fill(String(sides))
  await box.blur()
  await page.waitForTimeout(400)
}

/** Drags the corner-count grip out to the right, which adds corners. */
async function dragGrip(page: Page, steps = 10) {
  const grip = (await page.locator('.polygon__sides-grip').boundingBox())!
  const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= steps; step++) {
    await page.mouse.move(from.x + 6 * step, from.y)
  }
}

test('a polygon comes out a triangle, the size it was dragged', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  const board = await dragOnPage(page, { x: 60, y: 50 }, { x: 260, y: 190 })

  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-polygon')
  // Screen pixels back into design pixels, with a pixel of slack either way for
  // the rounding the tool does on the way in.
  expect(shape!.width).toBeCloseTo(200 / board.scale, -0.5)
  expect(shape!.height).toBeCloseTo(140 / board.scale, -0.5)
  expect(shape!.left).toBeCloseTo(60 / board.scale, -0.5)
  expect(shape!.top).toBeCloseTo(50 / board.scale, -0.5)
})

test('what is drawn fills the frame it was pulled out of', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 180 })

  const shape = (await drawnShape(page))!
  const corners = (await cornersOf(page))!
  expect(corners).toHaveLength(3)
  // Apex at the top middle and the base along the bottom, touching all four
  // edges rather than sitting inside them.
  expect(corners[0][0]).toBeCloseTo(shape.width / 2, 0)
  expect(corners[0][1]).toBeCloseTo(0, 0)
  expect(corners[1][1]).toBeCloseTo(shape.height, 0)
  expect(corners[2][1]).toBeCloseTo(shape.height, 0)
  expect(Math.max(...corners.map((corner) => corner[0]))).toBeCloseTo(shape.width, 0)
  expect(Math.min(...corners.map((corner) => corner[0]))).toBeCloseTo(0, 0)
})

test('a click with no drag behind it drops a polygon you can see', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  const board = await canvasBox(page)
  await page.mouse.click(board.x + board.width / 2, board.y + board.height / 2)
  await page.waitForTimeout(500)

  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-polygon')
  expect(shape!.width).toBe(200)
  expect(shape!.height).toBe(200)
})

test('Y arms the tool and Escape puts the pointer back', async ({ page }) => {
  await page.keyboard.press('y')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toContainText('polygon')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toHaveCount(0)

  // And nothing was drawn on the way in or out.
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('the tool draws one polygon and then hands the pointer back', async ({ page }) => {
  await page.keyboard.press('y')
  await page.waitForTimeout(300)
  await dragOnPage(page, { x: 60, y: 50 }, { x: 200, y: 150 })

  await expect(page.locator('.draw-hint')).toHaveCount(0)
  // The polygon that was just drawn is what is selected, ready to be styled.
  await expect(page.locator('.polygon__sides-grip')).toHaveCount(1)
})

test('the panel counts the corners up, and the shape follows', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  expect(await cornersOf(page)).toHaveLength(3)

  await setSides(page, 7)
  expect(await cornersOf(page)).toHaveLength(7)

  // A hundred is the top of the range, and asking for more gives a hundred.
  await setSides(page, 180)
  expect(await cornersOf(page)).toHaveLength(100)
})

test('dragging the grip on the canvas adds corners', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  expect(await cornersOf(page)).toHaveLength(3)

  await dragGrip(page)
  // The count follows the grip, so the shape can be dialled in without looking
  // away at the panel.
  await expect(page.locator('.polygon__sides-readout')).toBeVisible()
  await page.mouse.up()
  await page.waitForTimeout(400)

  expect((await cornersOf(page))!.length).toBeGreaterThan(3)
})

test('a drawn polygon is in the page thumbnail too', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  await expandPageStrip(page)

  await expect(page.locator('.artboards .polygon__paint')).toHaveCount(1)
  expect(await cornersOf(page, '.artboards')).toHaveLength(3)
})

test('drawing and reshaping are each one step of undo', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })

  await dragGrip(page)
  await page.mouse.up()
  await page.waitForTimeout(400)
  const reshaped = (await cornersOf(page))!.length
  expect(reshaped).toBeGreaterThan(3)

  // The tool and the grip swallow their own presses, so neither is bracketed by
  // the document listeners the undo stack is otherwise built from.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  expect(await cornersOf(page)).toHaveLength(3)
  await expect(page.locator(WIDGET)).toHaveCount(1)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(500)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(1)
  expect(await cornersOf(page)).toHaveLength(reshaped)
})

test('an outline is drawn inside the polygon it outlines', async ({ page }) => {
  await armShapeTool(page, 'Polygon')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })

  // An eighth of the way along a slider that runs to 40, so the outline is a
  // few pixels thick rather than a hairline.
  const runway = page.locator('.ds-shape-style #number-slider', { hasText: 'Thickness' }).locator('.el-slider__runway')
  const bar = (await runway.boundingBox())!
  await page.mouse.click(bar.x + bar.width / 8, bar.y + bar.height / 2)
  await page.waitForTimeout(500)

  // Fill and outline are the same path, so the outline cannot wander off the
  // shape; it is clipped to it, which is what keeps a mitre at a triangle's
  // apex from running outside the frame it was drawn in.
  const paths = await page.evaluate(() => {
    const nodes = Array.from(document.querySelectorAll('#page-design-canvas .polygon__paint > path'))
    return nodes.map((node) => ({ d: node.getAttribute('d'), clip: node.getAttribute('clip-path'), stroke: node.getAttribute('stroke') }))
  })
  expect(paths.length).toBe(2)
  expect(paths[1].d).toBe(paths[0].d)
  expect(paths[1].clip).toMatch(/^url\(#/)
  expect(paths[1].stroke).toBeTruthy()
})

test('typing a y into a text layer is a y, not the polygon tool', async ({ page }) => {
  await addText(page, 'Heading')
  await setWidgetText(page, 'Sky')

  expect(await widgetText(page)).toBe('Sky')
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})
