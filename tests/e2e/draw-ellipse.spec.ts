import { expect, test } from '@playwright/test'
import { WIDGET, armShapeTool, canvasBox, dragOnPage, drawnShape, expandPageStrip, openEditor, shapeRadius } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('an ellipse comes out the size it was dragged', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  const board = await dragOnPage(page, { x: 60, y: 50 }, { x: 260, y: 190 })

  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-ellipse')
  // Screen pixels back into design pixels, with a pixel of slack either way for
  // the rounding the tool does on the way in.
  expect(shape!.width).toBeCloseTo(200 / board.scale, -0.5)
  expect(shape!.height).toBeCloseTo(140 / board.scale, -0.5)
  expect(shape!.left).toBeCloseTo(60 / board.scale, -0.5)
  expect(shape!.top).toBeCloseTo(50 / board.scale, -0.5)
})

test('what is drawn is an ellipse, not the box it was pulled out of', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 180 })

  // Half its own width by half its own height on every corner, which is what a
  // bare 50% means — so a stretched ellipse is still an ellipse.
  const radius = (await shapeRadius(page))!
  expect(radius).toContain('50%')
})

test('a click with no drag behind it drops a circle you can see', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  const board = await canvasBox(page)
  await page.mouse.click(board.x + board.width / 2, board.y + board.height / 2)
  await page.waitForTimeout(500)

  const shape = await drawnShape(page)
  expect(shape?.type).toBe('w-ellipse')
  expect(shape!.width).toBe(200)
  expect(shape!.height).toBe(200)
})

test('Shift makes it a circle', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 260, y: 120 }, 'Shift')

  const shape = await drawnShape(page)
  expect(shape!.width).toBe(shape!.height)
  expect(shape!.width).toBeGreaterThan(100)
})

test('the rubber band is the shape that is coming', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  const board = await canvasBox(page)
  await page.mouse.move(board.x + 60, board.y + 50)
  await page.mouse.down()
  for (let step = 1; step <= 6; step++) {
    await page.mouse.move(board.x + 60 + 30 * step, board.y + 50 + 20 * step)
  }

  await expect(page.locator('.draw-band')).toHaveClass(/draw-band--round/)
  await page.mouse.up()
  await page.waitForTimeout(400)
})

test('E arms the tool and Escape puts the pointer back', async ({ page }) => {
  await page.keyboard.press('e')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toContainText('Drag to draw an ellipse')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toHaveCount(0)

  // And nothing was drawn on the way in or out.
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('arming one shape tool puts the other one down', async ({ page }) => {
  await page.keyboard.press('r')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toContainText('Drag to draw a box')

  await page.keyboard.press('e')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toContainText('Drag to draw an ellipse')

  // And what is drawn is the tool that was armed last, not the one before it.
  await dragOnPage(page, { x: 60, y: 50 }, { x: 200, y: 150 })
  expect((await drawnShape(page))?.type).toBe('w-ellipse')
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('an ellipse has no corners to round', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })

  // It is selected and ready to be styled, but neither the grips a box gets nor
  // the panel section they belong to are there.
  await expect(page.locator('#style-panel')).toContainText('Fill')
  await expect(page.locator('.rect__radius-grip')).toHaveCount(0)
  await expect(page.locator('.corner-radius')).toHaveCount(0)
})

test('a drawn ellipse is in the page thumbnail too', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  await expandPageStrip(page)

  await expect(page.locator('.artboards .shape__paint')).toHaveCount(1)
})

test('drawing an ellipse is one step of undo', async ({ page }) => {
  await armShapeTool(page, 'Ellipse')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  await expect(page.locator(WIDGET)).toHaveCount(1)

  // The tool swallows both ends of the gesture, so it is not bracketed by the
  // document listeners the undo stack is otherwise built from.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})
