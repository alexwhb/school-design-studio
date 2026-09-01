import { expect, test } from '@playwright/test'
import {
  WIDGET,
  addText,
  expandPageStrip,
  openEditor,
  openPageMenu,
  openResizeDialog,
  pageCanvas,
  rotateWidget,
  selectFirstWidget,
  setResizeSize,
  widgetBox,
  widgetCount,
  widgetRotation,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('shows the editor shell', async ({ page }) => {
  await expect(page.locator('#widget-panel')).toBeVisible()
  await expect(page.locator('#style-panel')).toBeVisible()
  await expect(page.locator('#page-design-canvas')).toBeVisible()
  await expect(page.locator('#zoom-control')).toBeVisible()
  await expect(page.getByText('Design Studio', { exact: true })).toBeVisible()
})

test('starts on a 1920x1080 page with nothing on it', async ({ page }) => {
  await expect(page.locator(WIDGET)).toHaveCount(0)
  const size = await page.evaluate(() => {
    const el = document.getElementById('page-design-canvas')!
    return { width: el.style.width, height: el.style.height }
  })
  expect(size).toEqual({ width: '1920px', height: '1080px' })
})

test('adds a heading to the page', async ({ page }) => {
  await addText(page, 'Heading')
  await expect(page.locator(WIDGET)).toHaveCount(1)
  await expect(page.locator(`${WIDGET} .edit-text`).first()).toHaveText('Add a heading')
})

test('cascades repeated inserts so they do not stack', async ({ page }) => {
  await addText(page, 'Heading')
  const first = await widgetBox(page, 0)
  await page.locator('#text-list-wrap .basic-text-item', { hasText: 'Heading' }).first().click()
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(2)
  const second = await widgetBox(page, 1)
  expect(second!.top).not.toBe(first!.top)
})

test('selecting a widget opens its settings and shows the transform box', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await expect(page.locator('#w-text-style')).toBeVisible()
  await expect(page.locator('.moveable-control-box')).toBeVisible()
})

test('arrow keys nudge the selected widget by one, shift by ten', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const before = await widgetBox(page)

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(200)
  const nudged = await widgetBox(page)
  expect(Number.parseFloat(nudged!.left)).toBeCloseTo(Number.parseFloat(before!.left) + 1, 1)

  await page.keyboard.down('Shift')
  await page.keyboard.press('ArrowRight')
  await page.keyboard.up('Shift')
  await page.waitForTimeout(200)
  const jumped = await widgetBox(page)
  expect(Number.parseFloat(jumped!.left)).toBeCloseTo(Number.parseFloat(nudged!.left) + 10, 1)
})

test('backspace deletes the selected widget', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.keyboard.press('Backspace')
  await page.waitForTimeout(400)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('deleting a whole template takes its selection boxes with it', async ({ page }) => {
  // A template is cleared by marqueeing over it, which leaves Moveable holding
  // a group of elements rather than one selector. The boxes used to outlive the
  // layers they were drawn round: nothing hands Moveable a new target, because
  // the page was already the active element before the marquee began.
  await page.locator('.img-water-fall .img-box').first().click()
  await page.waitForTimeout(2500)
  expect(await widgetCount(page)).toBeGreaterThan(2)

  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  await page.mouse.move(canvas.x - 60, canvas.y + 2)
  await page.mouse.down()
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2, { steps: 10 })
  await page.mouse.move(canvas.x + canvas.width + 60, canvas.y + canvas.height - 2, { steps: 10 })
  await page.mouse.up()
  await page.waitForTimeout(500)
  expect(await page.locator('.moveable-control-box').count()).toBeGreaterThan(1)

  await page.keyboard.press('Backspace')
  await page.waitForTimeout(800)
  await expect(page.locator(WIDGET)).toHaveCount(0)
  // The zero-size box around the placeholder Moveable falls back to is fine;
  // anything with a side to it is a layer that is no longer there.
  const strayBoxes = await page.evaluate(
    () =>
      [...document.querySelectorAll('.moveable-line')].filter((el) => {
        const rect = el.getBoundingClientRect()
        return rect.width > 4 || rect.height > 4
      }).length,
  )
  expect(strayBoxes).toBe(0)
})

test('undo puts a deleted widget back and redo removes it again', async ({ page }) => {
  await addText(page, 'Heading')
  await expect(page.locator(WIDGET)).toHaveCount(1)
  await selectFirstWidget(page)
  await page.keyboard.press('Backspace')
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.locator('.operation-item', { has: page.locator('.icon-undo') }).click()
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(1)

  await page.locator('.operation-item', { has: page.locator('.icon-redo') }).click()
  await page.waitForTimeout(500)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('undo takes a rotation back off and redo puts it on again', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  expect(await widgetRotation(page)).toBe(0)

  await rotateWidget(page)
  const turned = await widgetRotation(page)
  expect(turned).toBeGreaterThan(45)

  await page.locator('.operation-item', { has: page.locator('.icon-undo') }).click()
  await page.waitForTimeout(500)
  expect(await widgetRotation(page)).toBe(0)

  await page.locator('.operation-item', { has: page.locator('.icon-redo') }).click()
  await page.waitForTimeout(500)
  expect(await widgetRotation(page)).toBeCloseTo(turned, 1)
})

test('undo takes a rotation off a QR code too', async ({ page }) => {
  await page.getByText('Tools', { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText('QR code', { exact: true }).click()
  await page.waitForTimeout(900)
  await selectFirstWidget(page)

  await rotateWidget(page)
  expect(await widgetRotation(page)).toBeGreaterThan(45)

  await page.locator('.operation-item', { has: page.locator('.icon-undo') }).click()
  await page.waitForTimeout(500)
  expect(await widgetRotation(page)).toBe(0)
})

test('dragging a widget moves it and the move survives the drop', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const before = await widgetBox(page)
  const box = await page.locator(WIDGET).first().boundingBox()

  await page.mouse.move(box!.x + 20, box!.y + 10)
  await page.mouse.down()
  await page.mouse.move(box!.x + 120, box!.y + 70, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  const after = await widgetBox(page)
  expect(Number.parseFloat(after!.left)).toBeGreaterThan(Number.parseFloat(before!.left))
  expect(Number.parseFloat(after!.top)).toBeGreaterThan(Number.parseFloat(before!.top))
})

test('adds a QR code from the tools panel', async ({ page }) => {
  await page.getByText('Tools', { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText('QR code', { exact: true }).click()
  await page.waitForTimeout(900)
  await expect(page.locator(`${WIDGET}[data-type="w-qrcode"]`)).toHaveCount(1)
  await expect(page.locator(`${WIDGET} canvas`).first()).toBeVisible()
})

test('zoom presets change the canvas scale', async ({ page }) => {
  await page.locator('#zoom-control .zoom-text').click()
  await page.locator('#zoom-control .zoom-item', { hasText: '100%' }).click()
  await page.waitForTimeout(400)
  await expect(page.locator('#zoom-control .zoom-text')).toHaveText('100%')
  const transform = await page.evaluate(() => document.getElementById('page-design-canvas')!.style.transform)
  expect(transform).toBe('scale(1)')
})

test('zoom minus steps down through the presets', async ({ page }) => {
  await page.locator('#zoom-control .zoom-text').click()
  await page.locator('#zoom-control .zoom-item', { hasText: '100%' }).click()
  await page.waitForTimeout(300)
  await page.locator('#zoom-control .zoom-icon.radius-left').click()
  await page.waitForTimeout(300)
  await expect(page.locator('#zoom-control .zoom-text')).toHaveText('75%')
})

test('the layers tab lists what is on the page', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Body text')
  await page.getByText('Layers', { exact: true }).click()
  await page.waitForTimeout(400)
  const names = await page.locator('.widget-list .widget-name').allTextContents()
  expect(names.map((n) => n.trim())).toEqual(['Add a little bit of body text', 'Add a heading'])
})

test('resizing the design changes the canvas and refits the zoom', async ({ page }) => {
  const before = await pageCanvas(page)
  await openResizeDialog(page)
  await setResizeSize(page, 900, 1200)
  await page.getByRole('button', { name: 'Resize', exact: true }).click()
  await page.waitForTimeout(900)
  const after = await pageCanvas(page)
  expect(after.width).toBe('900px')
  expect(after.height).toBe('1200px')
  expect(after.transform).not.toBe(before.transform)
})

test('adds and switches pages from the artboard strip', async ({ page }) => {
  await addText(page, 'Heading')
  await page.locator('.artboards .btn').click()
  await page.waitForTimeout(500)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(700)
  await expect(page.locator('.artboards .item-box')).toHaveCount(2)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.locator('.artboards .item-box').first().click()
  await page.waitForTimeout(700)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('the theme toggle flips the editor between light and dark', async ({ page }) => {
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.locator('.theme-toggle').click()
  await page.waitForTimeout(400)
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.locator('.theme-toggle').click()
  await page.waitForTimeout(400)
  await expect(page.locator('html')).toHaveClass(/dark/)
})

test('switching panels shows the matching content', async ({ page }) => {
  await page.getByText('Elements', { exact: true }).click()
  await page.waitForTimeout(1200)
  await expect(page.getByText('Stickers', { exact: true })).toBeVisible()

  await page.getByText('Tools', { exact: true }).click()
  await page.waitForTimeout(400)
  await expect(page.getByText('Remove background', { exact: true })).toBeVisible()

  await page.getByText('Uploads', { exact: true }).click()
  await page.waitForTimeout(400)
  await expect(page.getByText('Upload image', { exact: true })).toBeVisible()
})

test('clicking the active panel tab collapses the panel', async ({ page }) => {
  await expect(page.locator('.widget-wrap')).toBeVisible()
  await page.getByText('Templates', { exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.locator('.widget-wrap')).toBeHidden()
})

test('editing text in place updates the widget', async ({ page }) => {
  await addText(page, 'Heading')
  const widget = page.locator(WIDGET).first()
  await widget.dblclick()
  await page.waitForTimeout(400)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Sports day')
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(400)
  await expect(page.locator(`${WIDGET} .edit-text`).first()).toHaveText('Sports day')
})

test('right-clicking a widget opens the context menu', async ({ page }) => {
  await addText(page, 'Heading')
  await page.locator(WIDGET).first().click({ button: 'right', position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  await expect(page.locator('.menu-list')).toBeVisible()
  await expect(page.locator('.menu-list .menu-item', { hasText: 'Delete' })).toBeVisible()
})

test('deleting through the context menu removes the widget', async ({ page }) => {
  await addText(page, 'Heading')
  await page.locator(WIDGET).first().click({ button: 'right', position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  await page.locator('.menu-list .menu-item', { hasText: 'Delete' }).click()
  await page.waitForTimeout(400)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('the File menu opens and offers a new design', async ({ page }) => {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('New design', { exact: true })).toBeVisible()
  await expect(page.getByText('Rulers and guides', { exact: true })).toBeVisible()
})

test('the Help menu lists the keyboard shortcuts', async ({ page }) => {
  await page.getByText('Help', { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText('Keyboard shortcuts', { exact: true }).click()
  await page.waitForTimeout(300)
  await expect(page.getByText('Pan the page', { exact: true })).toBeVisible()
})

test('the export menu offers image and PowerPoint', async ({ page }) => {
  await page.locator('.export-caret').click()
  await page.waitForTimeout(300)
  await expect(page.getByText('A PNG picture of this page', { exact: true })).toBeVisible()
  await expect(page.getByText('One slide per page, text stays editable', { exact: true })).toBeVisible()
})

test('the text style panel changes colour and size', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await expect(page.locator('#w-text-style')).toBeVisible()

  await page.locator('#w-text-style .value-select').nth(1).locator('input').click()
  await page.waitForTimeout(400)
  await page.locator('.list-ul li', { hasText: '48px' }).first().click()
  await page.waitForTimeout(500)

  const fontSize = await page.evaluate(
    (selector) => (document.querySelector(selector) as HTMLElement).style.fontSize,
    WIDGET,
  )
  expect(fontSize).toBe('48px')
})

test('bold toggles the selected text', async ({ page }) => {
  await addText(page, 'Body text')
  await selectFirstWidget(page)
  const before = await page.evaluate((s) => (document.querySelector(s) as HTMLElement).style.fontWeight, WIDGET)
  expect(before).toBe('normal')
  await page.locator('#w-text-style .list-item').first().click()
  await page.waitForTimeout(400)
  const after = await page.evaluate((s) => (document.querySelector(s) as HTMLElement).style.fontWeight, WIDGET)
  expect(after).toBe('bold')
})

test('a rubber band selects into the store, not just onto the canvas', async ({ page }) => {
  const crashes: string[] = []
  page.on('pageerror', (e) => crashes.push(e.message))

  await addText(page, 'Heading')
  await addText(page, 'Body text')

  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  await page.mouse.move(canvas.x + 4, canvas.y + 4)
  await page.mouse.down()
  await page.mouse.move(canvas.x + canvas.width - 4, canvas.y + canvas.height - 4, { steps: 15 })
  await page.mouse.up()
  await page.waitForTimeout(600)

  await expect(page.locator(`${WIDGET}.widget-selected`)).toHaveCount(2)
  // Group only appears once the store agrees more than one widget is selected.
  await expect(page.locator('.gounp__btn')).toBeVisible()
  expect(crashes).toEqual([])
})

test('an element you place stays clickable on the canvas', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(2000)
  // Section 0 places a w-image, which is the one that used to lock the canvas.
  await page.locator('.list-wrap').first().locator('.el-image').first().click()
  await page.waitForTimeout(1800)
  await expect(page.locator(WIDGET)).toHaveCount(1)

  // Nothing was locked, so nothing has had its pointer events taken away.
  await expect(page.locator('#page-design-canvas .layer-lock')).toHaveCount(0)

  const placed = page.locator(WIDGET).first()
  const uuid = await placed.getAttribute('data-uuid')
  const box = (await placed.boundingBox())!
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!

  await page.mouse.click(canvas.x + 20, canvas.y + canvas.height - 20)
  await page.waitForTimeout(500)
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForTimeout(600)

  await expect(page.locator('#page-design-canvas .layer.layer-no-hover')).toHaveAttribute('data-uuid', uuid!)
})
