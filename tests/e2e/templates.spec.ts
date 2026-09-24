import { expect, test, type Page } from '@playwright/test'
import { addText, expandPageStrip, goToPage, openEditor, widgetCount, widgetText } from './helpers'

/**
 * Picking a template in the gallery, over a page that already has something
 * on it.
 */

const undoKey = process.platform === 'darwin' ? 'Meta+z' : 'Control+z'
const ASK = '.temp-list-wrap__ask'

/** Templates is the panel the editor opens on, and a second click on its tab closes it. */
async function openTemplates(page: Page) {
  const cards = page.locator('.temp-list-wrap .panel-card')
  // The list loads after the panel does, so give it a moment before deciding.
  const open = await cards
    .first()
    .waitFor({ state: 'visible', timeout: 3000 })
    .then(() => true)
    .catch(() => false)
  if (!open) await page.locator('#widget-panel .classify-item', { hasText: 'Templates' }).click()
  await cards.first().waitFor()
}

/** The words on every text box on the page on screen. */
const words = (page: Page) => page.locator('#page-design-canvas [data-uuid] .edit-text').allInnerTexts()

test.beforeEach(async ({ page }) => {
  await openEditor(page)
  // The suite's editor is opened with the old "never ask" flag set; these are
  // the tests of asking.
  await page.evaluate(() => localStorage.removeItem('hide_replace_prompt'))
  // As slow as a template is in production, and slower than the moment the
  // undo step used to close after the click.
  await page.route('**/design/temp?*', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 900))
    await route.continue()
  })
})

test('replacing a page is one undo step, however long the template takes', async ({ page }) => {
  await addText(page, 'Heading')
  const mine = await words(page)
  await openTemplates(page)

  await page.locator('.temp-list-wrap .panel-card').first().click()
  await expect(page.locator(ASK)).toBeVisible()
  await expect(page.locator(ASK)).toContainText('This page already has things on it.')
  await page.locator(ASK).getByRole('button', { name: 'Replace this page' }).click()

  await expect.poll(() => widgetCount(page), { timeout: 10000 }).toBeGreaterThan(2)
  const template = await words(page)
  expect(template).not.toEqual(mine)

  await page.locator('#page-design-canvas').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press(undoKey)
  await page.waitForTimeout(500)
  // Exactly the page that was there. It used to come back with the template's
  // widgets still on it, the old ones laid over the top.
  expect(await words(page)).toEqual(mine)
  expect(await widgetCount(page)).toBe(1)
})

test('adding a template as a new page leaves this one alone', async ({ page }) => {
  await addText(page, 'Heading')
  const mine = await widgetText(page)
  await openTemplates(page)
  await page.locator('.temp-list-wrap .panel-card').first().click()
  await page.locator(ASK).getByRole('button', { name: 'Add as new page' }).click()

  // The canvas moves to the new page, after the one that was there.
  await expect.poll(() => widgetCount(page), { timeout: 10000 }).toBeGreaterThan(2)
  await expandPageStrip(page)
  await expect(page.locator('.artboards .page')).toHaveCount(2)
  await goToPage(page, 0)
  expect(await widgetCount(page)).toBe(1)
  expect(await widgetText(page)).toBe(mine)

  // And one undo takes the new page away again.
  await page.locator('#page-design-canvas').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press(undoKey)
  await expect(page.locator('.artboards .page')).toHaveCount(1)
  expect(await widgetText(page)).toBe(mine)
})

test('Cancel changes nothing', async ({ page }) => {
  await addText(page, 'Heading')
  const mine = await words(page)
  await openTemplates(page)
  await page.locator('.temp-list-wrap .panel-card').first().click()
  await page.locator(ASK).getByRole('button', { name: 'Cancel' }).click()
  await expect(page.locator(ASK)).toHaveCount(0)
  await page.waitForTimeout(1500)
  expect(await words(page)).toEqual(mine)
})

test('an empty page just takes the template', async ({ page }) => {
  await openTemplates(page)
  await page.locator('.temp-list-wrap .panel-card').first().click()
  await expect(page.locator(ASK)).toHaveCount(0)
  await expect.poll(() => widgetCount(page), { timeout: 10000 }).toBeGreaterThan(2)
})

test('the address is the editor’s own when it is the whole tab, and keeps its history state', async ({ page }) => {
  await page.evaluate(() => window.history.replaceState({ kept: true }, ''))
  await openTemplates(page)
  await page.locator('.temp-list-wrap .panel-card').first().click()
  await expect.poll(() => page.evaluate(() => new URLSearchParams(location.search).get('tempid'))).toBeTruthy()
  expect(await page.evaluate(() => window.history.state)).toEqual({ kept: true })
})
