import type { Page } from '@playwright/test'

export const REACT_URL = process.env.REACT_URL || 'http://127.0.0.1:5273'

export const WIDGET = '#page-design-canvas [data-uuid]:not([data-uuid="-1"])'

export async function openEditor(page: Page, theme: 'dark' | 'light' = 'dark') {
  await page.addInitScript(
    ([value]) => {
      localStorage.setItem('ds_theme', value as string)
      localStorage.setItem('hide_replace_prompt', '1')
    },
    [theme],
  )
  await page.goto(REACT_URL + '/home')
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(800)
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
