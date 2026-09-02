import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addText, expandPageStrip, openEditor, setWidgetText, widgetText } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** The canvas's own rectangle and the scale the page is drawn at. */
async function canvas(page: Page) {
  const box = (await page.locator('#page-design-canvas').boundingBox())!
  const scale = await page.evaluate(() => {
    const el = document.getElementById('page-design-canvas')!
    return el.getBoundingClientRect().width / el.offsetWidth
  })
  return { ...box, scale }
}

/** Arms the box tool from the Tools panel, which is how it is first found. */
async function armFromPanel(page: Page) {
  await page.locator('#widget-panel .classify-item', { hasText: 'Tools' }).click()
  await page.waitForTimeout(300)
  await page.locator('.tools-list-wrap .item', { hasText: 'Rectangle' }).click()
  await page.waitForTimeout(300)
}

/** Pulls a box out of the page, from one screen offset to another. */
async function drag(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, key?: string) {
  const board = await canvas(page)
  if (key) await page.keyboard.down(key)
  await page.mouse.move(board.x + from.x, board.y + from.y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(board.x + from.x + ((to.x - from.x) * step) / 10, board.y + from.y + ((to.y - from.y) * step) / 10)
  }
  await page.mouse.up()
  if (key) await page.keyboard.up(key)
  await page.waitForTimeout(500)
  return board
}

/** What the one box on the page is, in design pixels. */
async function boxOf(page: Page) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector) as HTMLElement
    if (!el) return null
    return {
      type: el.getAttribute('data-type'),
      left: Number.parseFloat(el.style.left),
      top: Number.parseFloat(el.style.top),
      width: Number.parseFloat(el.style.width),
      height: Number.parseFloat(el.style.height),
    }
  }, WIDGET)
}

/** The corners the box is actually drawn with, as CSS gives them back. */
function radiusOf(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('#page-design-canvas .rect__paint') as HTMLElement
    return el ? getComputedStyle(el).borderRadius : null
  })
}

test('a box comes out the size it was dragged', async ({ page }) => {
  await armFromPanel(page)
  const board = await drag(page, { x: 60, y: 50 }, { x: 260, y: 190 })

  const box = await boxOf(page)
  expect(box?.type).toBe('w-rect')
  // Screen pixels back into design pixels, with a pixel of slack either way for
  // the rounding the tool does on the way in.
  expect(box!.width).toBeCloseTo(200 / board.scale, -0.5)
  expect(box!.height).toBeCloseTo(140 / board.scale, -0.5)
  expect(box!.left).toBeCloseTo(60 / board.scale, -0.5)
  expect(box!.top).toBeCloseTo(50 / board.scale, -0.5)
})

test('a click with no drag behind it drops a box you can see', async ({ page }) => {
  await armFromPanel(page)
  const board = await canvas(page)
  await page.mouse.click(board.x + board.width / 2, board.y + board.height / 2)
  await page.waitForTimeout(500)

  const box = await boxOf(page)
  expect(box?.type).toBe('w-rect')
  expect(box!.width).toBe(200)
  expect(box!.height).toBe(200)
})

test('Shift keeps the box square', async ({ page }) => {
  await armFromPanel(page)
  await drag(page, { x: 60, y: 50 }, { x: 260, y: 120 }, 'Shift')

  const box = await boxOf(page)
  expect(box!.width).toBe(box!.height)
  expect(box!.width).toBeGreaterThan(100)
})

test('R arms the tool and Escape puts the pointer back', async ({ page }) => {
  await page.keyboard.press('r')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toBeVisible()

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-hint')).toHaveCount(0)

  // And nothing was drawn on the way in or out.
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('the tool draws one box and then hands the pointer back', async ({ page }) => {
  await page.keyboard.press('r')
  await page.waitForTimeout(300)
  await drag(page, { x: 60, y: 50 }, { x: 200, y: 150 })

  await expect(page.locator('.draw-hint')).toHaveCount(0)
  // The box that was just drawn is what is selected, ready to be styled.
  await expect(page.locator('.rect__radius-grip')).toHaveCount(4)
})

test('dragging a corner grip rounds all four', async ({ page }) => {
  await armFromPanel(page)
  const board = await drag(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  expect(await radiusOf(page)).toBe('0px')

  const grip = (await page.locator('.rect__radius-grip').first().boundingBox())!
  const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(from.x + 4 * step, from.y + 4 * step)
  }
  // The figure follows the grip, so the radius can be read without looking away.
  await expect(page.locator('.rect__radius-readout')).toBeVisible()
  await page.mouse.up()
  await page.waitForTimeout(400)

  const radius = Number.parseFloat((await radiusOf(page))!)
  // One value back from CSS means all four corners agree.
  expect(await radiusOf(page)).toBe(`${radius}px`)
  expect(radius).toBeCloseTo(40 / board.scale, -0.5)
})

test('Alt-dragging a grip rounds that corner alone, and the panel lets the four go', async ({ page }) => {
  await armFromPanel(page)
  await drag(page, { x: 60, y: 50 }, { x: 300, y: 220 })

  const grip = (await page.locator('.rect__radius-grip').first().boundingBox())!
  const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
  await page.keyboard.down('Alt')
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(from.x + 4 * step, from.y + 4 * step)
  }
  await page.mouse.up()
  await page.keyboard.up('Alt')
  await page.waitForTimeout(400)

  // Only the top-left moved, so CSS has four values to give back rather than one.
  const radius = (await radiusOf(page))!.split(' ')
  expect(radius.length).toBeGreaterThan(1)
  expect(Number.parseFloat(radius[0])).toBeGreaterThan(0)
  // Corners held apart are four boxes in the panel, not one slider.
  await expect(page.locator('.corner-radius .number-input2')).toHaveCount(4)
})

test('the panel’s chain puts the four corners back together', async ({ page }) => {
  await armFromPanel(page)
  await drag(page, { x: 60, y: 50 }, { x: 300, y: 220 })

  const link = page.locator('.corner-radius__link')
  await link.click()
  await page.waitForTimeout(300)
  const boxes = page.locator('.corner-radius .number-input2 input')
  await expect(boxes).toHaveCount(4)

  await boxes.nth(1).fill('30')
  await boxes.nth(1).blur()
  await page.waitForTimeout(400)
  expect((await radiusOf(page))!.split(' ').length).toBeGreaterThan(1)

  await link.click()
  await page.waitForTimeout(400)
  // Back to one number for all four, taken from the corner the eye lands on.
  expect(await radiusOf(page)).toBe('0px')
  await expect(page.locator('.corner-radius .number-input2')).toHaveCount(0)
})

test('a drawn box is in the page thumbnail too', async ({ page }) => {
  await armFromPanel(page)
  await drag(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  await expandPageStrip(page)

  await expect(page.locator('.artboards .rect__paint')).toHaveCount(1)
})

test('drawing and rounding are each one step of undo', async ({ page }) => {
  await armFromPanel(page)
  await drag(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  expect(await radiusOf(page)).toBe('0px')

  const grip = (await page.locator('.rect__radius-grip').first().boundingBox())!
  const from = { x: grip.x + grip.width / 2, y: grip.y + grip.height / 2 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(from.x + 4 * step, from.y + 4 * step)
  }
  await page.mouse.up()
  await page.waitForTimeout(400)
  const rounded = await radiusOf(page)
  expect(Number.parseFloat(rounded!)).toBeGreaterThan(0)

  // The tool and the grips swallow their own presses, so neither is bracketed
  // by the document listeners the undo stack is otherwise built from.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  expect(await radiusOf(page)).toBe('0px')
  await expect(page.locator(WIDGET)).toHaveCount(1)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(500)
  await page.keyboard.press('ControlOrMeta+Shift+z')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(1)
  expect(await radiusOf(page)).toBe(rounded)
})

test('typing an r into a text layer is an r, not the box tool', async ({ page }) => {
  await addText(page, 'Heading')
  await setWidgetText(page, 'Sports day')

  expect(await widgetText(page)).toBe('Sports day')
  await expect(page.locator('.draw-hint')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('Escape part way through a drag leaves no box behind', async ({ page }) => {
  await armFromPanel(page)
  const board = await canvas(page)
  await page.mouse.move(board.x + 60, board.y + 50)
  await page.mouse.down()
  for (let step = 1; step <= 6; step++) {
    await page.mouse.move(board.x + 60 + 30 * step, board.y + 50 + 20 * step)
  }
  await expect(page.locator('.draw-band')).toBeVisible()

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await expect(page.locator('.draw-band')).toHaveCount(0)
  await expect(page.locator('.draw-hint')).toHaveCount(0)

  // The release that follows belongs to the drag that was abandoned, so it must
  // not finish it off.
  await page.mouse.up()
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})
