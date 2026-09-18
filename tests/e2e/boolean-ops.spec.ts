/**
 * Combining shapes: add, subtract, intersect and exclude.
 *
 * The four buttons sit with Group, above the alignment row, and are only ever
 * offered for a selection of more than one. What they produce is a single new
 * shape stored as markup — one layer, one undo step — so these tests mostly ask
 * what the one layer left behind is: how many contours it has, where it sits,
 * and what it is painted with.
 *
 * The shapes are drawn roughly and then given their exact geometry through the
 * transform fields, because a boolean is arithmetic and the assertions are
 * numbers. Dragging a shape out lands within a pixel or two of where it was
 * pulled, which is fine for a drawing test and not fine for this one.
 */
import { expect, test, type Page } from '@playwright/test'
import { WIDGET, armShapeTool, boxSelectAll, dragOnPage, openEditor, widgetCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

type TGeometry = { x: number; y: number; w: number; h: number; r?: number }

/** Draws a shape anywhere and then puts it exactly where the test wants it. */
async function addShape(page: Page, tool: 'Rectangle' | 'Ellipse', geometry: TGeometry) {
  await armShapeTool(page, tool)
  await dragOnPage(page, { x: 60, y: 50 }, { x: 200, y: 160 })
  const fields = page.locator('#style-panel .transform-grid input')
  const values = [geometry.x, geometry.y, geometry.w, geometry.h, geometry.r ?? 0]
  for (let index = 0; index < values.length; index += 1) {
    await fields.nth(index).fill(String(values[index]))
    await fields.nth(index).blur()
    await page.waitForTimeout(250)
  }
}

async function combine(page: Page, label: 'Add' | 'Subtract' | 'Intersect' | 'Exclude overlap') {
  await page.locator(`#style-panel .combine-row .list-item[aria-label="${label}"]`).click()
  await page.waitForTimeout(700)
}

/** The one layer left on the page: its frame, and the path it draws. */
async function result(page: Page) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector) as HTMLElement
    if (!el) return null
    const path = el.querySelector('path')
    const d = path?.getAttribute('d') || ''
    return {
      type: el.getAttribute('data-type'),
      left: Math.round(Number.parseFloat(el.style.left)),
      top: Math.round(Number.parseFloat(el.style.top)),
      width: Math.round(Number.parseFloat(el.style.width)),
      height: Math.round(Number.parseFloat(el.style.height)),
      fill: path?.getAttribute('fill') || '',
      rule: path?.getAttribute('fill-rule') || '',
      // Each `M` starts a contour, so this is how many separate pieces — or
      // how many holes — the answer came out as.
      contours: (d.match(/M/g) || []).length,
    }
  }, WIDGET)
}

/** Opens a fill swatch and types a colour into it, the way a person would. */
async function paint(page: Page, hex: string) {
  await page.locator('#style-panel .color__select').first().locator('.color__field').click()
  await page.waitForTimeout(700)
  const field = page.locator('.color-picker:visible .input').first()
  await field.fill(hex)
  await field.blur()
  await page.waitForTimeout(800)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
}

test('two shapes added together come out as one that covers both', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 100, w: 200, h: 200 })
  await addShape(page, 'Rectangle', { x: 200, y: 200, w: 200, h: 200 })
  await boxSelectAll(page)
  await combine(page, 'Add')

  expect(await widgetCount(page)).toBe(1)
  const shape = (await result(page))!
  expect(shape.type).toBe('w-svg')
  // The frame is the two boxes' frame, and the outline is a single contour
  // wrapped round the pair of them.
  expect(shape).toMatchObject({ left: 100, top: 100, width: 300, height: 300, contours: 1 })
})

test('a shape subtracted from inside another leaves a hole', async ({ page }) => {
  await addShape(page, 'Ellipse', { x: 100, y: 100, w: 400, h: 400 })
  await addShape(page, 'Ellipse', { x: 200, y: 200, w: 200, h: 200 })
  await boxSelectAll(page)
  await combine(page, 'Subtract')

  const shape = (await result(page))!
  // The outer ellipse's frame, kept whole, with the inner one taken out of the
  // middle of it: two contours, and the even-odd rule to read the second as a
  // hole rather than as a second island of paint.
  expect(shape).toMatchObject({ left: 100, top: 100, width: 400, height: 400, contours: 2 })
  expect(shape.rule).toBe('evenodd')
})

test('a subtraction that cuts a bar in two is still one layer', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 300, w: 600, h: 120 })
  await addShape(page, 'Rectangle', { x: 350, y: 200, w: 100, h: 320 })
  await boxSelectAll(page)
  await combine(page, 'Subtract')

  expect(await widgetCount(page)).toBe(1)
  const shape = (await result(page))!
  // Two disjoint pieces, which is the thing a path drawn with the pen could not
  // have held: it stores one contour, and this is two.
  expect(shape).toMatchObject({ left: 100, top: 300, width: 600, height: 120, contours: 2 })
})

test('a turned shape is combined where it sits, not where it was drawn', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 100, w: 200, h: 200 })
  // A tall thin bar well clear of the box on the right, turned a quarter turn
  // so that it lies across the box's bottom edge instead. Left flat it has
  // nothing in common with the box at all, so an intersection that ignored the
  // turn would leave nothing behind and refuse.
  await addShape(page, 'Rectangle', { x: 390, y: 100, w: 20, h: 400, r: 90 })
  await boxSelectAll(page)
  await combine(page, 'Intersect')

  expect(await widgetCount(page)).toBe(1)
  const shape = (await result(page))!
  // The bar turns about its own centre, so it ends up 400 wide and 20 tall
  // across y 290–310, and what the two have in common is the 100×10 sliver
  // inside the box's bottom-left quarter.
  expect(shape).toMatchObject({ left: 200, top: 290, width: 100, height: 10 })
})

test('shapes that do not meet are refused rather than emptied off the page', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 100, w: 150, h: 150 })
  await addShape(page, 'Rectangle', { x: 500, y: 500, w: 150, h: 150 })
  await boxSelectAll(page)
  await combine(page, 'Intersect')

  // Both still there, and a notice rather than a blank page.
  expect(await widgetCount(page)).toBe(2)
  await expect(page.locator('.el-message')).toContainText('nothing left to draw')
})

test('a selection that is not all shapes cannot be combined', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 100, w: 200, h: 200 })
  await page.locator('#widget-panel .classify-item', { hasText: 'Text' }).click()
  await page.waitForTimeout(300)
  await page.locator('#text-list-wrap .basic-text-item', { hasText: 'Heading' }).first().click()
  await page.waitForTimeout(600)
  await boxSelectAll(page)

  // All four greyed out rather than gone: a button that vanishes teaches
  // nobody why text has no outline to combine.
  await expect(page.locator('#style-panel .combine-row .list-item')).toHaveCount(4)
  await expect(page.locator('#style-panel .combine-row .list-item.disabled')).toHaveCount(4)

  await page.locator('#style-panel .combine-row .list-item[aria-label*="Add"]').click()
  await page.waitForTimeout(600)
  expect(await widgetCount(page)).toBe(2)
})

test('a shape from the graphics library can be combined too', async ({ page }) => {
  // The one operand that is not drawn geometry but markup: it is parsed back
  // into curves and stretched to its frame the way the canvas stretches it.
  await page.locator('#widget-panel .classify-item', { hasText: 'Graphics' }).click()
  await page.waitForTimeout(1200)
  await page.locator('.graph-list-wrap .cates__chip', { hasText: 'Shapes' }).click()
  await page.waitForTimeout(1500)
  await page.locator('.graph-list-wrap .panel-card').first().click()
  await page.waitForTimeout(1200)

  const fields = page.locator('#style-panel .transform-grid input')
  for (const [index, value] of [100, 100, 300, 300].entries()) {
    await fields.nth(index).fill(String(value))
    await fields.nth(index).blur()
    await page.waitForTimeout(250)
  }
  await addShape(page, 'Rectangle', { x: 250, y: 250, w: 200, h: 200 })
  await boxSelectAll(page)
  await combine(page, 'Add')

  expect(await widgetCount(page)).toBe(1)
  const shape = (await result(page))!
  // The box runs to 450 on both axes and the artwork does not, so that corner
  // of the union is the box's. The other corner is wherever the artwork's own
  // ink starts, which is inside the frame it was given and is not a number to
  // hard-code.
  expect(shape.left + shape.width).toBe(450)
  expect(shape.top + shape.height).toBe(450)
  expect(shape.left).toBeGreaterThanOrEqual(100)
  expect(shape.left).toBeLessThan(250)
})

test('combining is one step of undo', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 100, w: 200, h: 200 })
  await addShape(page, 'Ellipse', { x: 200, y: 200, w: 200, h: 200 })
  await boxSelectAll(page)
  await combine(page, 'Exclude overlap')
  expect(await widgetCount(page)).toBe(1)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(700)
  expect(await widgetCount(page)).toBe(2)

  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(700)
  expect(await widgetCount(page)).toBe(1)
})

test('the result takes the bottom shape’s fill, and can still be recoloured', async ({ page }) => {
  await addShape(page, 'Rectangle', { x: 100, y: 100, w: 200, h: 200 })
  await paint(page, '#2E7D32FF')
  // Drawn second, so it is the one on top; its fill is the one that is lost.
  await addShape(page, 'Ellipse', { x: 200, y: 200, w: 200, h: 200 })
  await boxSelectAll(page)
  await combine(page, 'Add')

  expect((await result(page))!.fill.toLowerCase()).toBe('#2e7d32ff')

  // And the fill is still a setting rather than something baked into markup:
  // the panel offers it, and the shape follows.
  await paint(page, '#B71C1CFF')
  expect((await result(page))!.fill.toLowerCase()).toBe('#b71c1cff')
})
