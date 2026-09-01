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
  await picker.locator('.my-tab__title', { hasText: 'Gradient' }).click()
  await page.waitForTimeout(600)
  if (type === 'radial') {
    await picker.locator('.cpgt__option').nth(1).click()
    await page.waitForTimeout(600)
  }
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)
}
