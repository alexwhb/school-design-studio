import { expect, test } from '@playwright/test'
import {
  WIDGET,
  addText,
  expandPageStrip,
  openEditor,
  openPageMenu,
  openResizeDialog,
  pageCanvas,
  selectFirstWidget,
  setResizeSize,
  widgetBox,
  widgetCount,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/* ------------------------------------------------------------------ pages */

test('the page pill names the page you are on', async ({ page }) => {
  await expect(page.locator('.artboards .btn__label')).toHaveText('Page 1/1')
  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(800)
  await expect(page.locator('.artboards .page')).toHaveCount(2)
  await expect(page.locator('.artboards .page__name').nth(1)).toHaveText('Page 2')
})

test('the add-a-page square lines up with the thumbnails', async ({ page }) => {
  await expandPageStrip(page)
  const thumb = (await page.locator('.artboards .item-box').first().boundingBox())!
  const add = (await page.locator('.artboards .item-add').boundingBox())!
  // A page in the strip is its thumbnail plus its name, so it is taller than
  // this square; centred in the row, the square hung below the pictures.
  expect(Math.abs(add.y - thumb.y), 'the + shares a top edge with the thumbnails').toBeLessThan(1)
  expect(Math.abs(add.height - thumb.height), 'and is the same size as one').toBeLessThan(1)
})

test('duplicating a page copies its artwork onto a new page', async ({ page }) => {
  await addText(page, 'Heading')
  await expect(page.locator(WIDGET)).toHaveCount(1)
  await expandPageStrip(page)
  await openPageMenu(page)
  await page.getByText('Duplicate', { exact: true }).click()
  await page.waitForTimeout(1000)

  await expect(page.locator('.artboards .page')).toHaveCount(2)
  // The copy is what you are looking at, and it has the artwork.
  await expect(page.locator(WIDGET)).toHaveCount(1)
  // A page with no name of its own is stored as 'New page', so that is what the copy is named after.
  await expect(page.locator('.artboards .page__name').nth(1)).toHaveText('New page copy')
})

test('a duplicated page gets its own ids, so selecting one does not select both', async ({ page }) => {
  await addText(page, 'Heading')
  const original = await page.locator(WIDGET).first().getAttribute('data-uuid')
  await expandPageStrip(page)
  await openPageMenu(page)
  await page.getByText('Duplicate', { exact: true }).click()
  await page.waitForTimeout(1000)
  const copy = await page.locator(WIDGET).first().getAttribute('data-uuid')
  expect(copy).not.toBe(original)
})

test('renaming a page shows the new name on the pill', async ({ page }) => {
  await expandPageStrip(page)
  await openPageMenu(page)
  await page.getByText('Rename…', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.locator('.el-message-box__input input').fill('Welcome')
  await page.getByRole('button', { name: 'Rename' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator('.artboards .page__name').first()).toHaveText('Welcome')

  await page.locator('.artboards .icon-btn').click()
  await page.waitForTimeout(500)
  await expect(page.locator('.artboards .btn__label')).toHaveText('Welcome · 1/1')
})

test('moving a page left keeps you looking at the same page', async ({ page }) => {
  await addText(page, 'Heading')
  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
  // On the new, empty page.
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await openPageMenu(page, 1)
  await page.getByText('Move left', { exact: true }).click()
  await page.waitForTimeout(900)

  await expect(page.locator('.artboards .page')).toHaveCount(2)
  // Still the empty page, now first.
  await expect(page.locator(WIDGET)).toHaveCount(0)
  await expect(page.locator('.artboards .page').first()).toHaveClass(/is-current/)
})

test('deleting the only page empties it rather than removing it', async ({ page }) => {
  await addText(page, 'Heading')
  await expandPageStrip(page)
  await openPageMenu(page)
  await page.getByText('Empty this page', { exact: true }).click()
  await page.waitForTimeout(500)
  await page.getByRole('button', { name: 'Empty it' }).click()
  await page.waitForTimeout(900)
  await expect(page.locator('.artboards .page')).toHaveCount(1)
  await expect(page.locator(WIDGET)).toHaveCount(0)
})

test('deleting a page with nothing on it does not stop to ask', async ({ page }) => {
  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
  await openPageMenu(page, 1)
  await page.getByText('Delete', { exact: true }).click()
  await page.waitForTimeout(900)
  await expect(page.locator('.el-message-box')).toHaveCount(0)
  await expect(page.locator('.artboards .page')).toHaveCount(1)
})

/* ----------------------------------------------------------------- resize */

test('scale to fit keeps the artwork on the page', async ({ page }) => {
  await addText(page, 'Heading')
  const before = await widgetBox(page)

  await openResizeDialog(page)
  await setResizeSize(page, 960, 540)
  await page.locator('.choice', { hasText: 'Scale to fit' }).click()
  await page.getByRole('button', { name: 'Resize', exact: true }).click()
  await page.waitForTimeout(900)

  const canvas = await pageCanvas(page)
  expect(canvas.width).toBe('960px')
  const after = await widgetBox(page)
  // Half the page in each direction, so the heading halves too.
  expect(Number.parseFloat(after!.width)).toBeCloseTo(Number.parseFloat(before!.width) / 2, 0)
  expect(Number.parseFloat(after!.left)).toBeGreaterThanOrEqual(0)
  expect(Number.parseFloat(after!.left) + Number.parseFloat(after!.width)).toBeLessThanOrEqual(961)
})

test('keep sizes moves the artwork without resizing it', async ({ page }) => {
  await addText(page, 'Heading')
  const before = await widgetBox(page)

  await openResizeDialog(page)
  await setResizeSize(page, 1275, 1650)
  await page.locator('.choice', { hasText: 'Keep sizes' }).click()
  await page.getByRole('button', { name: 'Resize', exact: true }).click()
  await page.waitForTimeout(900)

  const after = await widgetBox(page)
  expect(Number.parseFloat(after!.width)).toBeCloseTo(Number.parseFloat(before!.width), 1)
  expect(after!.left).not.toBe(before!.left)
})

test('Resize stays disabled until the size actually changes', async ({ page }) => {
  await openResizeDialog(page)
  await expect(page.getByRole('button', { name: 'Resize', exact: true })).toBeDisabled()
  await setResizeSize(page, 900, 900)
  await expect(page.getByRole('button', { name: 'Resize', exact: true })).toBeEnabled()
})

test('a preset fills in the size for you', async ({ page }) => {
  await openResizeDialog(page)
  await page.locator('.el-dialog .pre-list .item', { hasText: 'Letter — portrait' }).click()
  await page.waitForTimeout(300)
  const boxes = page.locator('.el-dialog .number-input2 input')
  await expect(boxes.nth(0)).toHaveValue('1275')
  await expect(boxes.nth(1)).toHaveValue('1650')
})

test('the scope choice only appears once there is more than one page', async ({ page }) => {
  await openResizeDialog(page)
  await expect(page.locator('.el-dialog .scope')).toHaveCount(0)
  await page.getByRole('button', { name: 'Cancel' }).click()
  await page.waitForTimeout(400)

  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
  await openResizeDialog(page)
  await expect(page.locator('.el-dialog .scope')).toHaveCount(2)
})

/* -------------------------------------------------------------- animation */

test('choosing an animation names it on the card and leaves the widget alone', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const before = await widgetBox(page)

  await expect(page.locator('.animate__current')).toHaveText('None')
  await page.locator('.animate').getByText('Choose', { exact: true }).click()
  await page.waitForTimeout(1200)
  await page.locator('.picker__grid .tile', { hasText: 'Rise' }).first().click()
  await page.waitForTimeout(1800)

  await expect(page.locator('.animate__current')).toHaveText('Rise')
  // An entrance is played, never baked in: the element at rest is untouched.
  expect(await widgetBox(page)).toEqual(before)
})

test('removing the animation puts the card back to None', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.locator('.animate').getByText('Choose', { exact: true }).click()
  await page.waitForTimeout(1200)
  await page.locator('.picker__grid .tile', { hasText: 'Pop' }).first().click()
  await page.waitForTimeout(1600)
  await expect(page.locator('.animate__current')).toHaveText('Pop')

  await page.getByRole('button', { name: 'Remove' }).click()
  await page.waitForTimeout(600)
  await expect(page.locator('.animate__current')).toHaveText('None')
})

test('the animation card is not offered for the page itself', async ({ page }) => {
  await expect(page.locator('#page-style')).toBeVisible()
  await expect(page.locator('.animate')).toHaveCount(0)
})

test('the picker groups the presets and offers a way out', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.locator('.animate').getByText('Choose', { exact: true }).click()
  await page.waitForTimeout(1200)
  const groups = await page.locator('.picker__group').allTextContents()
  expect(groups).toEqual(['Fade', 'Move', 'Scale', 'Reveal', 'Flourish'])
  await expect(page.locator('.picker__grid .tile')).toHaveCount(15)
  await expect(page.locator('.picker__none')).toHaveText('No animation')
})

/* ------------------------------------------------------------- presenting */

test('Present opens a full-screen stage on the page you were editing', async ({ page }) => {
  await addText(page, 'Heading')
  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1200)

  await expect(page.locator('.present')).toBeVisible()
  await expect(page.locator('.present__counter')).toContainText('1 / 1')
  await expect(page.locator('.present .slide')).toHaveCount(1)
  await expect(page.locator('.present .edit-text').first()).toHaveText('Add a heading')
})

test('arrow keys move through the slides and Escape ends the show', async ({ page }) => {
  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
  await page.locator('.artboards .icon-btn').click()
  await page.waitForTimeout(500)

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1200)
  await expect(page.locator('.present__counter')).toContainText('2 / 2')

  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(600)
  await expect(page.locator('.present__counter')).toContainText('1 / 2')

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(600)
  await expect(page.locator('.present__counter')).toContainText('2 / 2')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  await expect(page.locator('.present')).toHaveCount(0)
})

test('B blanks the screen and any key brings it back', async ({ page }) => {
  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1200)
  await page.keyboard.press('b')
  await page.waitForTimeout(400)
  await expect(page.locator('.present__curtain--black')).toBeVisible()
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(400)
  await expect(page.locator('.present__curtain--black')).toHaveCount(0)
  await page.keyboard.press('Escape')
})

test('G shows every slide at once, and clicking one goes to it', async ({ page }) => {
  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
  await page.locator('.artboards .icon-btn').click()
  await page.waitForTimeout(500)

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1200)
  await page.keyboard.press('g')
  await page.waitForTimeout(600)
  await expect(page.locator('.present__thumb')).toHaveCount(2)

  await page.locator('.present__thumb').first().click()
  await page.waitForTimeout(700)
  await expect(page.locator('.present__overview')).toHaveCount(0)
  await expect(page.locator('.present__counter')).toContainText('1 / 2')
  await page.keyboard.press('Escape')
})

test('ending the show leaves the editor on the slide it finished on', async ({ page }) => {
  await expandPageStrip(page)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(900)
  await page.locator('.artboards .page').first().click()
  await page.waitForTimeout(700)
  await page.locator('.artboards .icon-btn').click()
  await page.waitForTimeout(500)

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1200)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(700)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(900)

  await expect(page.locator('.artboards .btn__label')).toHaveText('Page 2/2')
})

/* ------------------------------------------------------------------ menus */

test('the File menu offers resizing and shows what is switched on', async ({ page }) => {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(500)
  const menu = page.locator('.ds-folder-menu')
  await expect(menu.getByText('Resize design…')).toBeVisible()
  // Spelling is checked by default, so its row is ticked and the rulers' is not.
  await expect(menu.locator('.item--toggle', { hasText: 'Check spelling' }).locator('.tick')).toHaveCount(1)
  await expect(menu.locator('.item--toggle', { hasText: 'Rulers and guides' }).locator('.tick')).toHaveCount(0)
})

test('turning spelling off stops the canvas checking it', async ({ page }) => {
  await addText(page, 'Heading')
  await expect(page.locator(`${WIDGET} .edit-text`).first()).toHaveAttribute('spellcheck', 'true')

  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByText('Check spelling', { exact: true }).click()
  await page.waitForTimeout(600)

  await expect(page.locator(`${WIDGET} .edit-text`).first()).toHaveAttribute('spellcheck', 'false')
})

test('the export menu offers a PDF and a quality to make it at', async ({ page }) => {
  await page.locator('.export-caret').click()
  await page.waitForTimeout(600)
  const menu = page.locator('.export-menu__list')
  await expect(menu.getByText('PDF', { exact: true })).toBeVisible()
  await expect(menu.locator('.quality__btn')).toHaveCount(3)
  await expect(menu.locator('.quality__btn.is-on')).toHaveText(/Standard/)
  await expect(menu.locator('.quality__size')).toContainText('1920 × 1080 px')

  await menu.locator('.quality__btn', { hasText: 'Print' }).click()
  await page.waitForTimeout(300)
  await expect(menu.locator('.quality__btn.is-on')).toHaveText(/Print/)
  await expect(menu.locator('.quality__size')).toContainText('3840 × 2160 px')
})

/* --------------------------------------------------------------- autosave */

test('the design is written to the browser as it is edited', async ({ page }) => {
  await addText(page, 'Heading')
  // Autosave settles two seconds after the last change.
  await page.waitForTimeout(3200)

  const draft = await page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const request = indexedDB.open('design-studio')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    if (!db.objectStoreNames.contains('designs')) return null
    return new Promise<any>((resolve) => {
      const request = db.transaction('designs', 'readonly').objectStore('designs').get('draft')
      request.onsuccess = () => resolve(request.result ?? null)
      request.onerror = () => resolve(null)
    })
  })

  expect(draft, 'a draft was saved').not.toBeNull()
  expect(draft.layouts.length).toBe(1)
  expect(draft.layouts[0].layers.length).toBe(1)
  expect(draft.layouts[0].layers[0].text).toContain('Add a heading')
})

test('a saved design is offered back on the next visit', async ({ page }) => {
  await addText(page, 'Heading')
  await page.waitForTimeout(3200)

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(2000)

  await expect(page.locator('.el-message-box__title')).toHaveText('Pick up where you left off?')
  await page.getByRole('button', { name: 'Restore it' }).click()
  await page.waitForTimeout(1200)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('starting fresh throws the saved design away', async ({ page }) => {
  await addText(page, 'Heading')
  await page.waitForTimeout(3200)

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Start fresh' }).click()
  await page.waitForTimeout(800)
  await expect(page.locator(WIDGET)).toHaveCount(0)

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(2000)
  await expect(page.locator('.el-message-box')).toHaveCount(0)
})

/* ------------------------------------------------------------- templates */

test('the gallery is filed into categories', async ({ page }) => {
  const chips = page.locator('.cates__chip')
  await expect(chips.first()).toHaveText('All')
  await expect(chips.first()).toHaveClass(/cates__chip--on/)
  expect(await chips.count()).toBeGreaterThan(3)

  const all = await page.locator('.img-water-fall .img-box').count()
  await chips.filter({ hasText: 'Slides' }).click()
  await page.waitForTimeout(1800)
  await expect(chips.filter({ hasText: 'Slides' })).toHaveClass(/cates__chip--on/)
  const slides = await page.locator('.img-water-fall .img-box').count()
  expect(slides).toBeGreaterThan(0)
  expect(slides).toBeLessThan(all)
})

test('a search that matches nothing says so, and names the category', async ({ page }) => {
  await page.locator('.cates__chip', { hasText: 'Posters' }).click()
  await page.waitForTimeout(1500)
  await page.getByPlaceholder('Search templates').fill('zzzznothing')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1800)
  await expect(page.locator('.temp-list-wrap .loading')).toHaveText('No posters match “zzzznothing”')

  // Clearing empties the box. It deliberately does not re-run the search,
  // which would only repeat the one that just came back empty.
  await page.locator('.temp-list-wrap .el-input__clear').click()
  await page.waitForTimeout(1500)
  await expect(page.getByPlaceholder('Search templates')).toHaveValue('')
})

/* ----------------------------------------------------------- text effects */

test('a text effect preset applies its stack and its colour', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await expect(page.locator(`${WIDGET} .effect-text`)).toHaveCount(0)

  await page.locator('.effects').getByText('Choose', { exact: true }).click()
  await page.locator('.select__box__select-item img').first().waitFor()
  await page.waitForTimeout(1500)
  await page.locator('.select__box__select-item img').first().click()
  await page.waitForTimeout(1800)

  // The stack is painted as extra copies of the text over the plain one.
  expect(await page.locator(`${WIDGET} .effect-text`).count()).toBeGreaterThan(0)
  // A preset carries the colour it was drawn around.
  await expect(page.locator('#w-text-style .color__field').first()).toBeVisible()
  const colour = await page.locator(WIDGET).first().evaluate((el) => getComputedStyle(el).color)
  expect(colour).not.toBe('rgb(0, 0, 0)')
})

test('recolouring the text carries the effect stack with it', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.locator('.effects').getByText('Choose', { exact: true }).click()
  await page.locator('.select__box__select-item img').first().waitFor()
  await page.waitForTimeout(1500)
  await page.locator('.select__box__select-item img').first().click()
  await page.waitForTimeout(1800)

  // The whole stack, not its first layer: the layers that carry no fill are
  // transparent in both states, and it is the one that does that has to follow.
  const stack = () =>
    page.locator(`${WIDGET} .effect-text`).evaluateAll((els) => els.map((el) => getComputedStyle(el).color))
  const stackBefore = await stack()

  // Through the picker the Colour swatch opens, as a person would. The hex
  // field commits on blur, not on Enter.
  await page.locator('#w-text-style .style-item', { hasText: 'Colour' }).locator('.color__field').click()
  await page.waitForTimeout(700)
  const hex = page.locator('.color-picker:visible .input').first()
  await hex.fill('#FF0000FF')
  await hex.blur()
  await page.waitForTimeout(1400)

  const stackAfter = await stack()
  expect(stackAfter, 'the stack followed the new colour').not.toEqual(stackBefore)
  expect(stackAfter, 'and it followed it to red').toContain('rgb(255, 0, 0)')
})

test('an effect layer offers Skew, which older presets did not carry', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.locator('.effects').getByText('Choose', { exact: true }).click()
  await page.locator('.select__box__select-item img').first().waitFor()
  await page.waitForTimeout(1500)
  await page.locator('.select__box__select-item img').first().click()
  await page.waitForTimeout(1800)

  await page.locator('.advanced').getByText('Advanced', { exact: true }).click()
  await page.waitForTimeout(800)
  const first = page.locator('.layers .layer').first()
  await expect(first.locator('.feature', { hasText: 'Skew' })).toHaveCount(1)
  await expect(first.locator('.feature', { hasText: 'Fill' })).toHaveCount(1)
  await expect(first.locator('.feature', { hasText: 'Outline' })).toHaveCount(1)
})

/* ------------------------------------------------------------------ drag */

test('clicking a shape in the Elements panel places it', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Elements' }).click()
  await page.waitForTimeout(2000)
  await page.locator('.list-wrap').nth(1).locator('.el-image').first().click()
  await page.waitForTimeout(1800)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('the colour picker keeps the colours you have used', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const swatch = page.locator('#w-text-style .style-item').filter({ hasText: 'Colour' }).locator('.color__field')

  await swatch.click()
  await page.waitForTimeout(600)
  await expect(page.locator('.color-picker:visible .item-color')).toHaveCount(1)
  const hex = page.locator('.color-picker:visible .input').first()
  await hex.fill('#FF0000FF')
  await hex.blur()
  await page.waitForTimeout(800)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(500)

  // Reopening does not start the row again: Radix unmounts the popover, so the
  // list is held by the control that owns it.
  await swatch.click()
  await page.waitForTimeout(600)
  await expect(page.locator('.color-picker:visible .item-color')).toHaveCount(2)
})
