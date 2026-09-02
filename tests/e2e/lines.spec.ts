import { expect, test, type Page } from '@playwright/test'
import { WIDGET, armShapeTool, dragOnPage, drawnShape, expandPageStrip, openEditor, pathPaint, pathShape } from './helpers'
import { exportPng, pixelOf } from './pixels'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** The heads drawn on the one line on the page, with what each is painted in. */
function lineEnds(page: Page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('#page-design-canvas .path__paint .path__end')].map((el) => ({
      kind: el.getAttribute('data-end'),
      fill: el.getAttribute('fill'),
      stroke: el.getAttribute('stroke'),
      d: el.getAttribute('d'),
    })),
  )
}

/** Picks an end from one of the two pickers in the Line ends section. */
async function pickEnd(page: Page, which: 'Start' | 'End', name: string) {
  const index = which === 'Start' ? 0 : 1
  await page.locator('.line-ends .value-select').nth(index).locator('input').click()
  await page.waitForTimeout(400)
  await page.locator('.list-ul li', { hasText: name }).first().click()
  await page.waitForTimeout(500)
}

test('L arms the line tool, and a drag draws a straight two-point line', async ({ page }) => {
  await page.keyboard.press('l')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toContainText('Drag to draw a line')

  const board = await dragOnPage(page, { x: 80, y: 120 }, { x: 320, y: 120 })
  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-path')
  // As long as the drag, plus half the stroke either end; as tall as the
  // smallest frame a path is allowed, since a level line has no height.
  expect(shape!.width).toBeCloseTo(240 / board.scale + 2, -0.6)
  expect(shape!.height).toBeLessThan(12)
  const d = (await pathShape(page))!
  expect(d.match(/L/g)).toHaveLength(1)
  expect(d).not.toContain('Z')
  // And the tool has handed the pointer back.
  await expect(page.locator('.draw-hint')).toHaveCount(0)
})

test('Shift holds the line to a right angle or a diagonal', async ({ page }) => {
  await armShapeTool(page, 'Line')
  // Pulled a little downhill: without Shift this would be a shallow slope.
  await dragOnPage(page, { x: 80, y: 100 }, { x: 320, y: 130 }, 'Shift')
  const d = (await pathShape(page))!
  const [, y1, , y2] = d.match(/M\s*([\d.]+)\s+([\d.]+)\s+L\s*([\d.]+)\s+([\d.]+)/)!.slice(1).map(Number)
  expect(y1).toBeCloseTo(y2, 1)
})

test('a click with no drag drops a level line of a readable length', async ({ page }) => {
  await armShapeTool(page, 'Line')
  const board = await dragOnPage(page, { x: 200, y: 150 }, { x: 200, y: 150 })
  const shape = (await drawnShape(page))!
  expect(shape.type).toBe('w-path')
  expect(shape.width).toBeGreaterThan(100)
  expect(board.scale).toBeGreaterThan(0)
})

test('the panel puts a head on either end, drawn in the stroke colour', async ({ page }) => {
  await armShapeTool(page, 'Line')
  await dragOnPage(page, { x: 80, y: 120 }, { x: 320, y: 120 })
  await expect(page.locator('.line-ends')).toBeVisible()
  expect(await lineEnds(page)).toHaveLength(0)
  const before = (await drawnShape(page))!

  await pickEnd(page, 'End', 'Triangle')
  let ends = await lineEnds(page)
  expect(ends).toHaveLength(1)
  expect(ends[0].kind).toBe('triangle')
  const stroke = (await pathPaint(page))!.stroke
  expect(ends[0].fill).toBe(stroke)
  expect(ends[0].stroke).toBe(stroke)

  // A head has width where a line has none, so the frame grows to hold it and
  // the line itself stays where it was drawn.
  const after = (await drawnShape(page))!
  expect(after.height).toBeGreaterThan(before.height + 6)
  expect(after.top).toBeLessThan(before.top)

  await pickEnd(page, 'Start', 'Circle')
  ends = await lineEnds(page)
  expect(ends.map((end) => end.kind).sort()).toEqual(['circle', 'triangle'])

  // The line stops short of a solid head rather than running on through it:
  // the path's last point sits back from the triangle's tip.
  const d = (await pathShape(page))!
  const lineEnd = Number(d.match(/L\s*([\d.]+)\s+[\d.]+$/)![1])
  const tip = Number(ends.find((end) => end.kind === 'triangle')!.d!.match(/L\s*([\d.]+)\s+[\d.]+\s+L/)![1])
  expect(tip - lineEnd).toBeGreaterThan(4)

  // Both picks were recorded, so Ctrl+Z takes them back one at a time.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(600)
  expect(await lineEnds(page)).toHaveLength(1)
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(600)
  expect(await lineEnds(page)).toHaveLength(0)
})

test('Swap ends turns an arrow round', async ({ page }) => {
  await armShapeTool(page, 'Line')
  await dragOnPage(page, { x: 80, y: 120 }, { x: 320, y: 120 })
  await pickEnd(page, 'End', 'Arrow')
  const before = (await lineEnds(page))[0]

  await page.locator('.line-ends__swap').click()
  await page.waitForTimeout(500)
  const after = (await lineEnds(page))[0]
  expect(after.kind).toBe('arrow')
  // Same head, other end of the line.
  const tipX = (d: string) => Number(d.match(/L\s*([\d.]+)\s+[\d.]+\s+L/)![1])
  expect(tipX(after.d!)).toBeLessThan(tipX(before.d!) - 100)
})

test('an Elements arrow preset inserts an open path with ends on', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(500)
  await page.locator('.arrow-presets__item[title="Double arrow"]').click()
  await page.waitForTimeout(600)

  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-path')
  expect(await pathShape(page)).not.toContain('Z')
  const ends = await lineEnds(page)
  expect(ends.map((end) => end.kind)).toEqual(['triangle', 'triangle'])
  // Open, so the Line ends section is up for it.
  await expect(page.locator('.line-ends')).toBeVisible()
})

test('the dotted preset arrives dotted, with round ends', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(500)
  await page.locator('.arrow-presets__item[title="Dotted line"]').click()
  await page.waitForTimeout(600)

  const dashes = await page.evaluate(() => document.querySelector('#page-design-canvas .path__paint path')?.getAttribute('stroke-dasharray'))
  expect(dashes).toMatch(/^0 /)
  expect((await lineEnds(page)).map((end) => end.kind)).toEqual(['circle', 'circle'])
})

test('a two-point line cannot be closed, so it keeps its heads and its panel section', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(500)
  await page.locator('.arrow-presets__item[title="Arrow"]').click()
  await page.waitForTimeout(600)
  // The way back from the second point lies on top of the way out.
  await expect(page.locator('.path-style__closed')).toHaveClass(/is-disabled/)
  await expect(page.locator('.line-ends')).toBeVisible()
  expect(await lineEnds(page)).toHaveLength(1)
})

test('a line with arrowheads is in the page thumbnail too', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(500)
  await page.locator('.arrow-presets__item[title="Arrow"]').click()
  await page.waitForTimeout(600)
  await expandPageStrip(page)
  await expect(page.locator('.artboards .path__end')).toHaveCount(1)
})

test('typing an l into a text layer is an l, not the line tool', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Text' }).click()
  await page.waitForTimeout(300)
  await page.locator('#text-list-wrap .basic-text-item', { hasText: 'Heading' }).first().click()
  await page.waitForTimeout(500)
  await page.locator(WIDGET).nth(0).dblclick({ position: { x: 24, y: 12 } })
  await page.waitForTimeout(400)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Hello all')
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(500)

  await expect(page.locator(`${WIDGET} .edit-text`).first()).toHaveText('Hello all')
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('the arrowhead survives the PNG export', async ({ page }) => {
  // The heads are plain geometry inside the path's own <svg>, so they go out
  // of the same door the path does: the whole <svg> serialised into an <img>.
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(500)
  await page.locator('.arrow-presets__item[title="Arrow"]').click()
  await page.waitForTimeout(600)
  const box = (await drawnShape(page))!

  const png = await exportPng(page)
  const y = Math.round(box.top + box.height / 2)
  // Just inside the right-hand end of the frame is the triangle, in the line's
  // own dark grey; the same distance in from the left is the bare line, which
  // is two pixels thick and also grey; and above the middle of the line the
  // page shows through.
  const head = await pixelOf(page, png, Math.round(box.left + box.width - 6), y)
  expect(head.r).toBeLessThan(120)
  expect(head.a).toBe(255)
  const above = await pixelOf(page, png, Math.round(box.left + box.width / 2), y - 12)
  expect(above).toEqual({ r: 255, g: 255, b: 255, a: 255 })
})
