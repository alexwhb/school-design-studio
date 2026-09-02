import { expect, test } from '@playwright/test'
import { WIDGET, addText, openEditor, selectFirstWidget } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** The layers in the order they are stacked, bottom first — which is DOM order. */
function widgetIds(page: import('@playwright/test').Page) {
  return page.locator(WIDGET).evaluateAll((els) => els.map((el) => el.getAttribute('data-uuid')))
}

async function undo(page: import('@playwright/test').Page) {
  await page.locator('.operation-item', { has: page.locator('.icon-undo') }).click()
  await page.waitForTimeout(500)
}

async function openContextMenu(page: import('@playwright/test').Page, index = 0) {
  await page.locator(WIDGET).nth(index).click({ button: 'right', position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  await expect(page.locator('.menu-list')).toBeVisible()
}

/* ---------------------------------------------------------------- z-order */

test('cmd+shift+] brings a layer to the front, and undo puts it back', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  const before = await widgetIds(page)
  expect(before).toHaveLength(3)

  await selectFirstWidget(page)
  await page.keyboard.press('ControlOrMeta+Shift+BracketRight')
  await page.waitForTimeout(300)
  expect(await widgetIds(page)).toEqual([before[1], before[2], before[0]])

  await undo(page)
  expect(await widgetIds(page)).toEqual(before)
})

test('cmd+] steps a layer up one place, cmd+[ steps it back', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  const before = await widgetIds(page)

  await selectFirstWidget(page)
  await page.keyboard.press('ControlOrMeta+BracketRight')
  await page.waitForTimeout(300)
  expect(await widgetIds(page)).toEqual([before[1], before[0], before[2]])

  await page.keyboard.press('ControlOrMeta+BracketLeft')
  await page.waitForTimeout(300)
  expect(await widgetIds(page)).toEqual(before)
})

test('the context menu sends a layer to the back, and undo brings it forward again', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  const before = await widgetIds(page)

  await openContextMenu(page, 1)
  await expect(page.locator('.menu-list .menu-item', { hasText: 'Bring to front' })).toBeVisible()
  await page.locator('.menu-list .menu-item', { hasText: 'Send to back' }).click()
  await page.waitForTimeout(300)
  expect(await widgetIds(page)).toEqual([before[1], before[0]])

  await undo(page)
  expect(await widgetIds(page)).toEqual(before)
})

test('the Arrange row in the settings panel brings a layer to the front', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  const before = await widgetIds(page)

  await selectFirstWidget(page)
  await page.locator('#style-panel .icon-item-select .list-item[aria-label="Bring to front"]').click()
  await page.waitForTimeout(300)
  expect(await widgetIds(page)).toEqual([before[1], before[0]])
})
