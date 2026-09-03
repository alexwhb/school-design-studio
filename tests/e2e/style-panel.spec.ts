/**
 * The Design tab: the header that says what you have selected, the transform
 * fields, and the rows that switch a fill or a border on and off.
 */
import { expect, test } from '@playwright/test'
import { WIDGET, addText, armShapeTool, dragOnPage, openEditor, selectFirstWidget, widgetCount } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** One box on the page, selected, with its settings showing. */
async function addBox(page: import('@playwright/test').Page) {
  await armShapeTool(page, 'Rectangle')
  await dragOnPage(page, { x: 60, y: 50 }, { x: 300, y: 220 })
  await expect(page.locator('.ds-shape-style')).toBeVisible()
}

test('the panel names what is selected, and its kind', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)

  const header = page.locator('#style-panel .selection-header')
  await expect(header.locator('.selection-header__name')).toHaveText('Add a heading')
  await expect(header.locator('.layer-badge')).toHaveText('T')
})

test('the header duplicates what is selected, offset from the original', async ({ page }) => {
  await addBox(page)
  expect(await widgetCount(page)).toBe(1)

  await page.locator('#style-panel .selection-header__action[aria-label="Duplicate"]').click()
  await page.waitForTimeout(500)
  expect(await widgetCount(page)).toBe(2)

  // One undo entry for the whole copy, the way the right-click menu makes one.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(600)
  expect(await widgetCount(page)).toBe(1)
})

test('the header deletes what is selected', async ({ page }) => {
  await addBox(page)
  await page.locator('#style-panel .selection-header__action[aria-label="Delete"]').click()
  await page.waitForTimeout(500)
  expect(await widgetCount(page)).toBe(0)
  // Nothing selected, so the panel falls back to the page.
  await expect(page.locator('#style-panel .style-empty')).toHaveText('Nothing selected')
})

test('the transform fields move and size what is selected', async ({ page }) => {
  await addBox(page)
  const fields = page.locator('#style-panel .transform-grid input')
  await expect(fields).toHaveCount(5)

  await fields.nth(0).fill('120')
  await fields.nth(0).blur()
  await fields.nth(2).fill('260')
  await fields.nth(2).blur()
  await page.waitForTimeout(400)

  const box = await page.locator(WIDGET).first().evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    width: parseFloat((el as HTMLElement).style.width),
  }))
  expect(box.left).toBe(120)
  expect(box.width).toBe(260)
})

test('the fill row switches a shape’s fill off and back on', async ({ page }) => {
  await addBox(page)
  const fill = page.locator('#style-panel .color__select.is-row', { hasText: 'Fill' })
  const painted = () => page.locator(`${WIDGET} .shape__paint`).first().evaluate((el) => getComputedStyle(el).backgroundColor)

  const before = await painted()
  expect(before).not.toMatch(/rgba\(0, 0, 0, 0\)/)

  await fill.locator('.el-checkbox').click()
  await page.waitForTimeout(400)
  // The colour is kept on the widget with its alpha out, so switching it back
  // on returns the same colour rather than a default.
  expect(await painted()).toMatch(/, 0\)$/)

  await fill.locator('.el-checkbox').click()
  await page.waitForTimeout(400)
  expect(await painted()).toBe(before)
})

test('the border row switches an outline on at a readable thickness', async ({ page }) => {
  await addBox(page)
  const border = page.locator('#style-panel .border-controls')
  const outline = () => page.locator(`${WIDGET} .shape__paint`).first().evaluate((el) => getComputedStyle(el).borderTopWidth)

  expect(await outline()).toBe('0px')

  await border.locator('.el-checkbox').click()
  await page.waitForTimeout(400)
  expect(parseFloat(await outline())).toBeGreaterThan(0)

  await border.locator('.el-checkbox').click()
  await page.waitForTimeout(400)
  expect(await outline()).toBe('0px')
})
