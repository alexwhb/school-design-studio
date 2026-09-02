import { expect, test } from '@playwright/test'
import { WIDGET, addText, boxSelectAll, openEditor, rotateWidgetBy, selectFirstWidget, widgetRotation } from './helpers'

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

/* --------------------------------------------------------------- rotation */

test('holding Shift while rotating lands on a multiple of 15 degrees', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)

  await rotateWidgetBy(page, 37, { shift: true })
  const turned = await widgetRotation(page)
  expect(turned).toBeGreaterThan(20)
  expect(Math.abs(turned) % 15).toBe(0)
})

test('without Shift the angle is whatever you turned it to, unless it is nearly a diagonal', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)

  await rotateWidgetBy(page, 37)
  const free = await widgetRotation(page)
  expect(free).toBeGreaterThan(30)
  expect(free).toBeLessThan(42)
  expect(Math.abs(free) % 15).not.toBe(0)

  // Another eight degrees or so brings it within reach of 45, which takes it.
  await rotateWidgetBy(page, 7)
  expect(await widgetRotation(page)).toBe(45)
})

test('the angle is read out beside the pointer while turning', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const handle = page.locator('.moveable-rotation .moveable-control').first()
  const grip = (await handle.boundingBox())!
  const box = (await page.locator(WIDGET).first().boundingBox())!
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const radius = Math.hypot(grip.x + grip.width / 2 - cx, grip.y + grip.height / 2 - cy)

  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
  await page.mouse.down()
  const angle = Math.PI / 2 + Math.PI / 4
  await page.mouse.move(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius, { steps: 6 })
  await expect(page.locator('.ds-rotate-readout')).toHaveText('45°')
  await page.mouse.up()
  await expect(page.locator('.ds-rotate-readout')).toHaveCount(0)
})

/* ------------------------------------------------------ multi-select resize */

/** Size and type size of every widget on the page, in design pixels. */
function widgetSizes(page: import('@playwright/test').Page) {
  return page.locator(WIDGET).evaluateAll((els) =>
    els.map((el) => {
      const style = (el as HTMLElement).style
      return { width: Number.parseFloat(style.width), fontSize: Number.parseFloat(style.fontSize) }
    }),
  )
}

test('a corner of a multi-selection scales every widget, type and all', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Body text')
  await expect(page.locator(WIDGET)).toHaveCount(2)
  const before = await widgetSizes(page)

  await boxSelectAll(page)
  const corner = page.locator('.moveable-control.moveable-se').first()
  await expect(corner).toBeVisible()
  const grip = (await corner.boundingBox())!
  await page.mouse.move(grip.x + grip.width / 2, grip.y + grip.height / 2)
  await page.mouse.down()
  await page.mouse.move(grip.x + grip.width / 2 + 120, grip.y + grip.height / 2 + 120, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(500)

  const after = await widgetSizes(page)
  const ratio = after[0].width / before[0].width
  expect(ratio).toBeGreaterThan(1.1)
  // The same ratio for both, and for the type inside them.
  expect(after[1].width / before[1].width).toBeCloseTo(ratio, 1)
  expect(after[0].fontSize / before[0].fontSize).toBeCloseTo(ratio, 1)
  expect(after[1].fontSize / before[1].fontSize).toBeCloseTo(ratio, 1)

  await undo(page)
  const undone = await widgetSizes(page)
  expect(undone[0].width).toBeCloseTo(before[0].width, 0)
  expect(undone[0].fontSize).toBeCloseTo(before[0].fontSize, 0)
})

/* ------------------------------------------------------- multi-select nudge */

function widgetLefts(page: import('@playwright/test').Page) {
  return page.locator(WIDGET).evaluateAll((els) => els.map((el) => Number.parseFloat((el as HTMLElement).style.left)))
}

test('arrow keys nudge a whole multi-selection, one pixel or ten, and undo takes it back', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  const before = await widgetLefts(page)

  await boxSelectAll(page)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  expect(await widgetLefts(page)).toEqual(before.map((left) => left + 1))

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.up('Shift')
  await page.waitForTimeout(300)
  expect(await widgetLefts(page)).toEqual(before.map((left) => left + 11))

  await undo(page)
  expect(await widgetLefts(page)).toEqual(before.map((left) => left + 1))
})

/* ------------------------------------------------------------------ locks */

test('a locked layer refuses delete and nudge, and says so; unlocking restores both', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const before = await widgetLefts(page)

  await page.keyboard.press('ControlOrMeta+Shift+KeyL')
  await page.waitForTimeout(300)
  // The box is still there — you can see what you have selected — but has no handles
  await expect(page.locator('.moveable-control-box.is-locked')).toBeVisible()
  await expect(page.locator('.moveable-control.moveable-se')).toHaveCount(0)

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  expect(await widgetLefts(page)).toEqual(before)
  await expect(page.locator('.el-message', { hasText: 'locked' })).toBeVisible()

  await page.keyboard.press('Backspace')
  await page.waitForTimeout(300)
  await expect(page.locator(WIDGET)).toHaveCount(1)

  await page.keyboard.press('ControlOrMeta+Shift+KeyL')
  await page.waitForTimeout(300)
  await expect(page.locator('.moveable-control-box.is-locked')).toHaveCount(0)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(300)
  expect(await widgetLefts(page)).toEqual(before.map((left) => left + 1))
  await page.keyboard.press('Backspace')
  await page.waitForTimeout(300)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('the Arrange row and the context menu both lock and unlock', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)

  await page.locator('#style-panel .icon-item-select .list-item[aria-label="Lock"]').click()
  await page.waitForTimeout(300)
  await expect(page.locator('#style-panel .icon-item-select .list-item[aria-label="Unlock"]')).toBeVisible()
  await expect(page.locator('#style-panel .icon-item-select .list-item[aria-label="Bring to front"]')).toHaveClass(/disabled/)

  await openContextMenu(page)
  await page.locator('.menu-list .menu-item', { hasText: 'Unlock' }).click()
  await page.waitForTimeout(300)
  await expect(page.locator('#style-panel .icon-item-select .list-item[aria-label="Lock"]')).toBeVisible()
})

test('a locked layer can still be clicked, but dragging it goes nowhere', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.keyboard.press('ControlOrMeta+Shift+KeyL')
  await page.waitForTimeout(300)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  const before = await widgetLefts(page)

  const box = (await page.locator(WIDGET).first().boundingBox())!
  await page.mouse.move(box.x + 20, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 120, box.y + 70, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  await expect(page.locator('#w-text-style')).toBeVisible()
  expect(await widgetLefts(page)).toEqual(before)
  await expect(page.locator('.el-message', { hasText: 'locked' })).toBeVisible()
})
