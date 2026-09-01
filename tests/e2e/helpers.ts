import type { Page } from '@playwright/test'

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
