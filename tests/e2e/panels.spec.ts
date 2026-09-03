import { expect, test } from '@playwright/test'
import { APP_URL, openEditor, pageCanvas } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** How large the page is drawn, which is what "Fit to screen" recomputes. */
async function canvasScale(page: import('@playwright/test').Page) {
  const { transform } = await pageCanvas(page)
  return Number.parseFloat(transform.match(/scale\(([\d.]+)\)/)?.[1] || '0')
}

test('the left panel hides from its chevron and comes back from the strip', async ({ page }) => {
  await expect(page.locator('#widget-panel .widget-wrap')).toBeVisible()

  await page.locator('#widget-panel [aria-label="Hide panel"]').click()
  await page.waitForTimeout(400)
  await expect(page.locator('#widget-panel .widget-wrap')).toBeHidden()
  // The rail is how you reach the panels at all, so it stays whatever happens.
  await expect(page.locator('#widget-panel .classify-item').first()).toBeVisible()

  await page.locator('#widget-panel .panel-strip').click()
  await page.waitForTimeout(400)
  await expect(page.locator('#widget-panel .widget-wrap')).toBeVisible()
})

test('the right panel hides from its chevron and comes back from the strip', async ({ page }) => {
  await expect(page.locator('#style-panel')).toBeVisible()

  await page.locator('.style-tab__collapse').click()
  await page.waitForTimeout(400)
  await expect(page.locator('#style-panel')).toHaveCount(0)
  await expect(page.locator('.style-panel-strip')).toBeVisible()

  await page.locator('.style-panel-strip').click()
  await page.waitForTimeout(400)
  await expect(page.locator('#style-panel')).toBeVisible()
})

test('a hidden panel is still hidden after a reload', async ({ page }) => {
  await page.locator('#widget-panel [aria-label="Hide panel"]').click()
  await page.locator('.style-tab__collapse').click()
  await page.waitForTimeout(400)

  await page.goto(APP_URL + '/home')
  await page.waitForSelector('#widget-panel')
  await page.waitForTimeout(1200)

  await expect(page.locator('#widget-panel .widget-wrap')).toBeHidden()
  await expect(page.locator('#style-panel')).toHaveCount(0)
  await expect(page.locator('#widget-panel .panel-strip')).toBeVisible()
  await expect(page.locator('.style-panel-strip')).toBeVisible()
})

test('the page is refitted to the wider workspace when both panels go', async ({ page }) => {
  const before = await canvasScale(page)
  expect(before).toBeGreaterThan(0)

  await page.locator('#widget-panel [aria-label="Hide panel"]').click()
  await page.locator('.style-tab__collapse').click()
  // The board re-measures itself the way a window resize makes it, which is
  // debounced; the toggle's own measurement is not, but wait for both.
  await page.waitForTimeout(900)

  expect(await canvasScale(page)).toBeGreaterThan(before)
})

test('a rail tab brings the hidden left panel back showing that tab', async ({ page }) => {
  await page.locator('#widget-panel [aria-label="Hide panel"]').click()
  await page.waitForTimeout(400)
  await expect(page.locator('#widget-panel .widget-wrap')).toBeHidden()

  await page.locator('#widget-panel .classify-item', { hasText: 'Photos' }).click()
  await page.waitForTimeout(600)

  await expect(page.locator('#widget-panel .widget-wrap')).toBeVisible()
  await expect(page.locator('.panel-head__title')).toHaveText('Photos')
})

test('clicking the tab already showing puts the panel away', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Text' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator('.panel-head__title')).toHaveText('Text')

  await page.locator('#widget-panel .classify-item', { hasText: 'Text' }).click()
  await page.waitForTimeout(400)
  await expect(page.locator('#widget-panel .widget-wrap')).toBeHidden()
})

test('an open-panel event opens that tab, panel hidden or not', async ({ page }) => {
  // The editor loads more than the default 250 resource entries, and the one
  // wanted below is among the first. Asking for a bigger buffer has to happen
  // before anything is fetched, so the page is opened again with it in place.
  await page.addInitScript(() => performance.setResourceTimingBufferSize(3000))
  await page.goto(APP_URL + '/home')
  await page.waitForSelector('#widget-panel')
  await page.waitForTimeout(800)

  await page.locator('#widget-panel [aria-label="Hide panel"]').click()
  await page.waitForTimeout(400)

  // Nothing emits this yet — the canvas dock's "Browse photos" will — so the
  // bus is reached as a module, which is how the dev server hands out the
  // editor's own source. The URL comes from what the page actually fetched
  // rather than from the path: after an edit Vite serves the file with a
  // version on it, and importing the bare path would hand back a second copy
  // of the bus with nobody listening to it. The import goes through
  // new Function so that TypeScript does not try to resolve it either.
  await page.evaluate(async () => {
    const loaded = performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .find((name) => name.includes('/src/utils/plugins/eventBus.ts'))
    const load = new Function('path', 'return import(path)') as (path: string) => Promise<any>
    const bus = await load(loaded || '/src/utils/plugins/eventBus.ts')
    bus.default.emit('open-panel', 'photo-list-wrap')
  })
  await page.waitForTimeout(600)

  await expect(page.locator('#widget-panel .widget-wrap')).toBeVisible()
  await expect(page.locator('.panel-head__title')).toHaveText('Photos')
})
