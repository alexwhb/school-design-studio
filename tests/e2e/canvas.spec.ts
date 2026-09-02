import { expect, test } from '@playwright/test'
import {
  WIDGET,
  addText,
  boxSelectAll,
  canvasBox,
  downloadBytes,
  openEditor,
  openResizeDialog,
  pixelOf,
  rotateWidgetBy,
  selectFirstWidget,
  setResizeSize,
  widgetBox,
  widgetRotation,
} from './helpers'

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

/* ------------------------------------------------------------------- grid */

/** True when an edge or the middle of a box sits exactly on a 50px grid line. */
function onGrid(start: string, size: string, step = 50) {
  const at = Number.parseFloat(start)
  const length = Number.parseFloat(size)
  return [at, at + length / 2, at + length].some((edge) => edge % step === 0)
}

async function openFileMenu(page: import('@playwright/test').Page) {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(300)
}

async function toggleGrid(page: import('@playwright/test').Page) {
  await openFileMenu(page)
  await page.getByText('Show grid', { exact: true }).click()
  await page.waitForTimeout(400)
}

/** The spacing the grid is actually painted at, read off the overlay itself. */
function gridStep(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const el = document.querySelector('#page-design-canvas .page-grid') as HTMLElement | null
    return el ? el.style.getPropertyValue('--ds-grid-step') : null
  })
}

test('Show grid draws a grid over the page, at the spacing you pick', async ({ page }) => {
  await expect(page.locator('#page-design-canvas .page-grid')).toHaveCount(0)

  await toggleGrid(page)
  await expect(page.locator('#page-design-canvas .page-grid')).toBeVisible()
  expect(await gridStep(page)).toBe('50px')
  const at50 = await page.locator('#page-design-canvas .grid-snap-v').count()
  expect(at50).toBeGreaterThan(1)

  // Finer squares: twice as many lines, and the menu stays open to show it.
  await openFileMenu(page)
  await page.locator('.ds-folder-menu .grid-size', { hasText: '25' }).click()
  await page.waitForTimeout(400)
  expect(await gridStep(page)).toBe('25px')
  expect(await page.locator('#page-design-canvas .grid-snap-v').count()).toBeGreaterThan(at50)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // And it goes away again.
  await toggleGrid(page)
  await expect(page.locator('#page-design-canvas .page-grid')).toHaveCount(0)
})

test('the grid is drawn for you, not exported', async ({ page }) => {
  await toggleGrid(page)
  await expect(page.locator('#page-design-canvas .page-grid')).toBeVisible()
  await addText(page, 'Heading')

  const { bytes: png } = await downloadBytes(page, () => page.getByRole('button', { name: 'Export' }).click())

  // Straight down the first grid line, in the empty top-left corner of the
  // page. On screen there is a line here; in the file the page is bare white.
  for (const x of [50, 51]) {
    expect(await pixelOf(page, png, x, 20)).toEqual({ r: 255, g: 255, b: 255, a: 255 })
  }
  // Taking it out of the copy must not take it off the editor's own page.
  await expect(page.locator('#page-design-canvas .page-grid')).toBeVisible()
})

test('a dragged layer lands on the grid', async ({ page }) => {
  await toggleGrid(page)
  await addText(page, 'Heading')
  const widget = page.locator(WIDGET).first()
  await widget.click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)

  // Aimed a couple of design pixels short of the lines at 500 and 400 — near
  // enough for the grid to take it, far enough that landing exactly on them is
  // the grid's doing and not the drag's.
  const board = await canvasBox(page)
  const before = await widgetBox(page)
  const box = (await widget.boundingBox())!
  const dx = (502 - Number.parseFloat(before!.left)) * board.scale
  const dy = (402 - Number.parseFloat(before!.top)) * board.scale
  await page.mouse.move(box.x + 40, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 40 + dx, box.y + 10 + dy, { steps: 14 })
  await page.mouse.up()
  await page.waitForTimeout(600)

  // One of the three lines a box offers — its two edges and its middle — is
  // exactly on the grid, which is all snapping ever promises: which edge took
  // depends on how wide the words are.
  const landed = await widgetBox(page)
  expect(onGrid(landed!.left, landed!.width)).toBe(true)
  expect(onGrid(landed!.top, landed!.height)).toBe(true)
})

/* --------------------------------------------------- page sizes and units */

/** What the two size boxes of the open dialog read, as numbers. */
async function sizeBoxes(page: import('@playwright/test').Page) {
  const boxes = page.locator('.el-dialog .number-input2 input')
  return [Number(await boxes.nth(0).inputValue()), Number(await boxes.nth(1).inputValue())]
}

async function pickUnit(page: import('@playwright/test').Page, unit: string) {
  await page.locator('.el-dialog .size-units .size-unit', { hasText: new RegExp(`^${unit}$`) }).click()
  await page.waitForTimeout(300)
}

test('the presets cover the paper a school prints on', async ({ page }) => {
  await openResizeDialog(page)
  const list = page.locator('.el-dialog .pre-list .item')
  for (const [name, size] of [
    ['A4 — portrait', '1240 × 1754 px'],
    ['A4 — landscape', '1754 × 1240 px'],
    ['A3 — portrait', '1754 × 2480 px'],
    ['A3 — landscape', '2480 × 1754 px'],
    ['A5 — portrait', '874 × 1240 px'],
    ['Legal — portrait', '1275 × 2100 px'],
  ]) {
    await expect(list.filter({ hasText: name }).first()).toContainText(size)
  }
})

test('the size boxes can be read and typed in millimetres', async ({ page }) => {
  await openResizeDialog(page)
  await page.locator('.el-dialog .pre-list .item', { hasText: 'A4 — portrait' }).click()
  await page.waitForTimeout(400)
  expect(await sizeBoxes(page)).toEqual([1240, 1754])

  // The size A4 is actually called by, not the pixels it happens to be stored as.
  await pickUnit(page, 'mm')
  expect(await sizeBoxes(page)).toEqual([210, 297])
  await pickUnit(page, 'in')
  expect(await sizeBoxes(page)).toEqual([8.27, 11.69])
  // Reading it a third way has not changed the page.
  await pickUnit(page, 'px')
  expect(await sizeBoxes(page)).toEqual([1240, 1754])

  // And typing millimetres in gives the page those millimetres describe: A5.
  await pickUnit(page, 'mm')
  await setResizeSize(page, 148, 210)
  await pickUnit(page, 'px')
  expect(await sizeBoxes(page)).toEqual([874, 1240])
})

test('the page settings panel says what the page is on paper', async ({ page }) => {
  await openResizeDialog(page)
  await page.locator('.el-dialog .pre-list .item', { hasText: 'A4 — landscape' }).click()
  await page.waitForTimeout(400)
  await page.getByRole('button', { name: 'Resize', exact: true }).click()
  await page.waitForTimeout(900)

  const readout = page.locator('#page-style .page-size__value')
  await expect(readout).toContainText('1754 × 1240 px')
  await expect(page.locator('#page-style .page-size__paper')).toHaveText('A4 landscape · 297 × 210 mm')
})

/* ---------------------------------------------------------- context menu */

test('Duplicate on the right-click menu puts a copy on the page', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await openContextMenu(page)
  await page.locator('.menu-list .menu-item', { hasText: 'Duplicate' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(2)

  await undo(page)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('Hide on the right-click menu takes the layer off the canvas', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await openContextMenu(page)
  await page.locator('.menu-list .menu-item', { hasText: 'Hide' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  // Off the canvas, not gone: it is still a layer, and undo brings it back.
  await undo(page)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('the menu groups a selection, and ungroups what it made', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Body text')
  await boxSelectAll(page)

  // The box round several things covers them, so this is where the right-click
  // that means "these ones" actually lands.
  await page.locator('.moveable-area').first().click({ button: 'right', position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  await page.locator('.menu-list .menu-item', { hasText: 'Group' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator('#page-design-canvas > [data-type="w-group"]')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)
  await page.locator('#page-design-canvas > [data-type="w-group"]').click({ button: 'right', position: { x: 20, y: 20 } })
  await page.waitForTimeout(400)
  await page.locator('.menu-list .menu-item', { hasText: 'Ungroup' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator('#page-design-canvas > [data-type="w-group"]')).toHaveCount(0)
  await expect(page.locator(WIDGET)).toHaveCount(2)
})

test('every stacking item fits on one line', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await openContextMenu(page)

  const items = page.locator('.menu-list .menu-item')
  for (const label of ['Bring forward', 'Send backward', 'Bring to front', 'Send to back', 'Lock', 'Duplicate', 'Hide']) {
    await expect(items.filter({ hasText: label }).first()).toBeVisible()
  }
  // A wrapped item is twice as tall as one that fits, which is the whole test.
  const heights = await items.evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().height)))
  expect(new Set(heights).size).toBe(1)
})
