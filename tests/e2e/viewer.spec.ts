import { expect, test, devices } from '@playwright/test'

/**
 * `DesignViewer` on a phone, from the built package, the way the planner shows
 * a design on a narrow screen instead of the editor.
 */
const VIEWER_URL = (process.env.EMBED_URL || 'http://127.0.0.1:5373/embed-demo/index.html').replace('index.html', 'viewer.html')

test.use({ ...devices['iPhone 13'], defaultBrowserType: 'chromium' })

test.beforeEach(async ({ page }) => {
  await page.goto(VIEWER_URL)
  await page.locator('.ds-viewer__page').first().waitFor()
})

test('draws every page, labelled, as wide as the phone', async ({ page }) => {
  const pages = page.locator('.ds-viewer__page')
  await expect(pages).toHaveCount(4)
  await expect(pages.nth(1)).toHaveAttribute('aria-label', 'Page 2 of 4')
  await expect(page.getByRole('region', { name: 'Page 1 of 4' })).toBeVisible()

  const viewport = page.viewportSize()!
  const slide = (await pages.first().locator('.slide').boundingBox())!
  // The column's width, less the host's padding, at the slide's own shape.
  expect(slide.width).toBeGreaterThan(viewport.width - 40)
  expect(slide.width).toBeLessThanOrEqual(viewport.width)
  expect(Math.abs(slide.height - (slide.width * 1080) / 1920)).toBeLessThan(2)
  // No sideways scrolling on a phone.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
})

test('the words are text a person can select and a screen reader can read', async ({ page }) => {
  await expect(page.getByRole('region', { name: 'Page 1 of 4' })).toContainText('Open House')
  const selected = await page.evaluate(() => {
    const words = Array.from(document.querySelectorAll('.ds-viewer__page .edit-text')).find((el) => el.textContent?.includes('Open House'))!
    const range = document.createRange()
    range.selectNodeContents(words)
    const selection = window.getSelection()!
    selection.removeAllRanges()
    selection.addRange(range)
    return { text: selection.toString(), userSelect: getComputedStyle(words).userSelect }
  })
  expect(selected.text).toContain('Open House')
  expect(selected.userSelect).toBe('text')
  await expect(page.locator('.ds-viewer__page img[alt="The book fair poster"]')).toHaveCount(1)
})

test('tells the host which page is in view', async ({ page }) => {
  await expect(page.locator('#host-page')).toHaveText('0')
  await page
    .locator('.ds-viewer__page')
    .nth(3)
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await expect(page.locator('#host-page')).toHaveText('3')
})

test('Present opens the presenter on the page in view, and the editor never loads', async ({ page }) => {
  await page
    .locator('.ds-viewer__page')
    .nth(2)
    .evaluate((el) => el.scrollIntoView({ block: 'center' }))
  await expect(page.locator('#host-page')).toHaveText('2')
  await page.getByRole('button', { name: 'Present' }).click()
  await expect(page.locator('.ds-viewer .present')).toBeVisible()
  await expect(page.locator('.ds-viewer .present')).toContainText('3 / 4')
  await page.keyboard.press('Escape')
  await expect(page.locator('.ds-viewer .present')).toHaveCount(0)

  // Only the viewer's chunk was fetched, not the editor's.
  const scripts = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /dist-embed\/.*\.(m?js)(\?|$)/.test(name)),
  )
  expect(scripts.some((name) => /DesignViewer-/.test(name))).toBe(true)
  expect(scripts.some((name) => /\/index-[^/]*\.mjs/.test(name))).toBe(false)
})

test('a sign is drawn at the paper’s shape', async ({ page }) => {
  await page.goto(VIEWER_URL + '?sign=1')
  const slide = (await page.locator('.ds-viewer__page .slide').first().boundingBox())!
  expect(Math.abs(slide.height - (slide.width * 1650) / 1275)).toBeLessThan(2)
  await expect(page.locator('.ds-viewer__page')).toHaveCount(1)
  await expect(page.getByRole('region', { name: 'Page 1 of 1' })).toContainText('Gymnasium')
})
