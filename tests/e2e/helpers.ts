import type { Locator, Page } from '@playwright/test'

export const APP_URL = process.env.APP_URL || 'http://127.0.0.1:5273'

export const WIDGET = '#page-design-canvas [data-uuid]:not([data-uuid="-1"])'

export async function openEditor(page: Page, theme: 'dark' | 'light' = 'dark') {
  await page.addInitScript(
    ([value]) => {
      localStorage.setItem('ds_theme', value as string)
      localStorage.setItem('hide_replace_prompt', '1')
    },
    [theme],
  )
  await page.goto(APP_URL + '/home')
  await page.waitForSelector('#page-design-canvas')
  // The editor is ready once it has measured the workspace and scaled the page
  // to fit. Waiting for that rather than for a fixed delay takes about three
  // quarters of a second off every test in the suite.
  await page.waitForFunction(() => {
    const el = document.getElementById('page-design-canvas')
    return !!el && /scale\([\d.]+\)/.test(el.style.transform)
  })
  await page.locator('#widget-panel .classify-item').first().waitFor()
}

/**
 * Clicking the rail tab that is already open collapses the panel, so only
 * switch to Text when the presets are not already on screen.
 */
export async function addText(page: Page, preset: 'Heading' | 'Subheading' | 'Body text' = 'Heading') {
  const presets = page.locator('#text-list-wrap .basic-text-item', { hasText: preset })
  if (!(await presets.first().isVisible().catch(() => false))) {
    await page.locator('#widget-panel .classify-item', { hasText: 'Text' }).click()
    await page.waitForTimeout(300)
  }
  await presets.first().click()
  await page.waitForTimeout(500)
}

export async function selectFirstWidget(page: Page) {
  await page.locator(WIDGET).first().click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
}

export async function widgetCount(page: Page) {
  return page.locator(WIDGET).count()
}

/**
 * Drags the selection box's rotation handle a quarter turn clockwise. The sweep
 * is an arc around the widget's centre rather than a straight line, because
 * Moveable takes the angle from where the pointer is, not how far it has moved.
 */
export async function rotateWidget(page: Page, index = 0) {
  const handle = page.locator('.moveable-rotation .moveable-control').first()
  await handle.waitFor()
  const grip = await handle.boundingBox()
  const box = await page.locator(WIDGET).nth(index).boundingBox()
  const cx = box!.x + box!.width / 2
  const cy = box!.y + box!.height / 2
  const radius = Math.hypot(grip!.x + grip!.width / 2 - cx, grip!.y + grip!.height / 2 - cy)

  await page.mouse.move(grip!.x + grip!.width / 2, grip!.y + grip!.height / 2)
  await page.mouse.down()
  for (let step = 1; step <= 12; step++) {
    const angle = Math.PI / 2 + (Math.PI / 2) * (step / 12)
    await page.mouse.move(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius)
  }
  await page.mouse.up()
  await page.waitForTimeout(400)
}

/** The rotation the widget is actually drawn with, in degrees, or 0 for none. */
export async function widgetRotation(page: Page, index = 0) {
  return page.evaluate(
    ([selector, i]) => {
      const el = document.querySelectorAll(selector as string)[i as number] as HTMLElement
      const match = el?.style.transform.match(/rotate\(([-\d.]+)deg\)/)
      return match ? Number.parseFloat(match[1]) : 0
    },
    [WIDGET, index] as const,
  )
}

export async function widgetBox(page: Page, index = 0) {
  return page.evaluate(
    ([selector, i]) => {
      const el = document.querySelectorAll(selector as string)[i as number] as HTMLElement
      if (!el) return null
      return { left: el.style.left, top: el.style.top, width: el.style.width, height: el.style.height }
    },
    [WIDGET, index] as const,
  )
}

/**
 * Through the File menu, which works whatever is selected — the panel's own
 * Resize button is only on screen when the page itself is.
 */
export async function openResizeDialog(page: Page) {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText('Resize design\u2026', { exact: true }).click()
  await page.waitForTimeout(700)
}

export async function setResizeSize(page: Page, width: number, height: number) {
  const boxes = page.locator('.el-dialog .number-input2 input')
  await boxes.nth(0).fill(String(width))
  await boxes.nth(0).blur()
  await page.waitForTimeout(300)
  await boxes.nth(1).fill(String(height))
  await boxes.nth(1).blur()
  await page.waitForTimeout(300)
}

/** The canvas's own rectangle and the scale the page is drawn at. */
export async function canvasBox(page: Page) {
  const box = (await page.locator('#page-design-canvas').boundingBox())!
  const scale = await page.evaluate(() => {
    const el = document.getElementById('page-design-canvas')!
    return el.getBoundingClientRect().width / el.offsetWidth
  })
  return { ...box, scale }
}

/** Arms a drawing tool from the Tools panel, which is how it is first found. */
export async function armShapeTool(page: Page, label: 'Rectangle' | 'Ellipse' | 'Polygon' | 'Pen') {
  await page.locator('#widget-panel .classify-item', { hasText: 'Tools' }).click()
  await page.waitForTimeout(300)
  await page.locator('.tools-list-wrap .item', { hasText: label }).click()
  await page.waitForTimeout(300)
}

/** Pulls a shape out of the page, from one screen offset to another. */
export async function dragOnPage(page: Page, from: { x: number; y: number }, to: { x: number; y: number }, key?: string) {
  const board = await canvasBox(page)
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

/** What the one shape on the page is, in design pixels. */
export async function drawnShape(page: Page) {
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

/** The corners the one shape on the page is drawn with, as CSS gives them back. */
export function shapeRadius(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('#page-design-canvas .shape__paint') as HTMLElement
    return el ? getComputedStyle(el).borderRadius : null
  })
}

export async function expandPageStrip(page: Page) {
  await page.locator('.artboards .btn').click()
  await page.locator('.artboards .list').waitFor()
  await page.waitForTimeout(600)
}

export async function openPageMenu(page: Page, index = 0) {
  await page.locator('.artboards .item-box').nth(index).hover()
  await page.waitForTimeout(200)
  await page.locator('.artboards .page-menu').nth(index).click({ force: true })
  await page.waitForTimeout(500)
}

export function pageCanvas(page: Page) {
  return page.evaluate(() => {
    const el = document.getElementById('page-design-canvas')!
    return { width: el.style.width, height: el.style.height, transform: el.style.transform }
  })
}

/**
 * How many transform boxes are drawn over the workspace. Moveable keeps one for
 * the stand-in it is handed when nothing is selected, parked far off to the
 * left, so only the boxes that are actually on screen are counted.
 */
export async function drawnSelectionBoxes(page: Page) {
  return page.evaluate(
    () => [...document.querySelectorAll('.moveable-control-box')].filter((el) => el.getBoundingClientRect().x > -1000).length,
  )
}

/** Clicks the bare board around the page — the nearest thing to clicking away. */
export async function clickPasteboard(page: Page) {
  const point = await page.evaluate(() => {
    const board = document.getElementById('page-design')!.getBoundingClientRect()
    const canvas = document.getElementById('page-design-canvas')!.getBoundingClientRect()
    return { x: canvas.x + canvas.width / 2, y: (canvas.bottom + Math.min(board.bottom, window.innerHeight)) / 2 }
  })
  await page.mouse.click(point.x, point.y)
  await page.waitForTimeout(500)
}

/** Pulls a selection box round every layer on the page, starting off all of them. */
export async function boxSelectAll(page: Page) {
  const bounds = await page.evaluate((selector) => {
    const rects = [...document.querySelectorAll(selector)].map((el) => el.getBoundingClientRect())
    return {
      left: Math.min(...rects.map((r) => r.x)),
      top: Math.min(...rects.map((r) => r.y)),
      right: Math.max(...rects.map((r) => r.right)),
      bottom: Math.max(...rects.map((r) => r.bottom)),
    }
  }, WIDGET)
  const from = { x: bounds.left - 30, y: bounds.top - 30 }
  const to = { x: bounds.right + 30, y: bounds.bottom + 30 }
  await page.mouse.move(from.x, from.y)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) {
    await page.mouse.move(from.x + ((to.x - from.x) * step) / 10, from.y + ((to.y - from.y) * step) / 10)
  }
  await page.mouse.up()
  await page.waitForTimeout(600)
}

/** Opens a swatch in the shape panel and switches it to a gradient. */
export async function openGradient(page: Page, swatch: Locator, type: 'linear' | 'radial' = 'linear') {
  await swatch.click()
  await page.waitForTimeout(600)
  const picker = page.locator('.color-picker:visible')
  await picker.locator('.ds-segmented__option', { hasText: 'Gradient' }).click()
  await page.waitForTimeout(600)
  if (type === 'radial') {
    await picker.locator('.cpgt__option').nth(1).click()
    await page.waitForTimeout(600)
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
}

/**
 * Through the File menu, for the same reason the resize dialog is: it works
 * whatever happens to be selected. Ctrl+F opens the same dialog and is
 * exercised on its own.
 */
export async function openFindReplace(page: Page) {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText('Find and replace…', { exact: true }).click()
  await page.waitForTimeout(600)
}

/** Retypes a text widget's contents the way someone would: caret in, select all, type. */
export async function setWidgetText(page: Page, text: string, index = 0) {
  await page.locator(WIDGET).nth(index).dblclick({ position: { x: 24, y: 12 } })
  await page.waitForTimeout(400)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(text)
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(500)
}

/** Adds a page after the current one and moves to it, through the page strip. */
export async function addPage(page: Page) {
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
}

/** Moves to a page by clicking its thumbnail. The strip has to be open already. */
export async function goToPage(page: Page, index: number) {
  await page.locator('.artboards .page').nth(index).click()
  await page.waitForTimeout(700)
}

/** What a text widget on the current page reads as, markup taken off. */
export async function widgetText(page: Page, index = 0) {
  return page.locator(`${WIDGET} .edit-text`).nth(index).innerText()
}

/** Puts the page strip back into its pill, so it stops covering the board. */
export async function collapsePageStrip(page: Page) {
  await page.locator('.artboards .icon-btn').click()
  await page.waitForTimeout(500)
}

/**
 * Clicks a run of points on the page with the pen, one at a time, and leaves the
 * path unfinished — how it is finished is what the test is usually about.
 */
export async function clickPoints(page: Page, points: { x: number; y: number }[]) {
  const board = await canvasBox(page)
  for (const point of points) {
    await page.mouse.click(board.x + point.x, board.y + point.y)
    await page.waitForTimeout(120)
  }
  return board
}

/** The `d` the one path on the page is drawn with. */
export function pathShape(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('#page-design-canvas .path__paint path') as SVGPathElement
    return el ? el.getAttribute('d') : null
  })
}

/** What the one path on the page is painted and stroked with. */
export function pathPaint(page: Page) {
  return page.evaluate(() => {
    const el = document.querySelector('#page-design-canvas .path__paint path') as SVGPathElement
    if (!el) return null
    return { fill: el.getAttribute('fill'), stroke: el.getAttribute('stroke'), strokeWidth: el.getAttribute('stroke-width') }
  })
}

/**
 * Opens the selected path up for editing, which is what a double-click on it
 * does. Aimed at the middle of the widget rather than at its centre, which for
 * a path may be somewhere the shape does not cover.
 */
export async function editPoints(page: Page) {
  await page.locator(WIDGET).first().dblclick({ position: { x: 4, y: 4 } })
  await page.waitForTimeout(400)
}
