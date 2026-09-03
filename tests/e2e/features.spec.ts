import { expect, test, type Locator, type Page } from '@playwright/test'
import {
  WIDGET,
  addText,
  expandPageStrip,
  openEditor,
  openGradient,
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
  await expect(page.locator('.artboards .btn__label')).toHaveText('Page 1')
  await expect(page.locator('.artboards .btn__count')).toHaveText('of 1')
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
  await expect(page.locator('.artboards .btn__label')).toHaveText('Welcome')
  // A named page has no number left in it, so the count carries the position.
  await expect(page.locator('.artboards .btn__count')).toHaveText('1 of 1')
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

  await expect(page.locator('.artboards .btn__label')).toHaveText('Page 2')
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

  // The title and page count live in `designs`; the artwork is one row per page
  // in `designPages`, so that a save rewrites only the page that changed.
  const draft = await page.evaluate(async () => {
    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const request = indexedDB.open('design-studio')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    if (!db.objectStoreNames.contains('designs') || !db.objectStoreNames.contains('designPages')) return null
    const read = (store: string, key: any) =>
      new Promise<any>((resolve) => {
        const request = db.transaction(store, 'readonly').objectStore(store).get(key)
        request.onsuccess = () => resolve(request.result ?? null)
        request.onerror = () => resolve(null)
      })
    const meta = await read('designs', 'draft')
    if (!meta) return null
    return { meta, page: await read('designPages', 'draft:0') }
  })

  expect(draft, 'a draft was saved').not.toBeNull()
  expect(draft!.meta.pageCount).toBe(1)
  expect(draft!.page, 'the page was saved').not.toBeNull()
  expect(draft!.page.layout.layers.length).toBe(1)
  expect(draft!.page.layout.layers[0].text).toContain('Add a heading')
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

/** Scrolls the Templates list to the end and answers with how many it holds. */
async function countTemplates(page: Page) {
  const body = page.locator('.temp-list-wrap .panel-wrap__body')
  for (let i = 0; i < 12; i++) {
    if (await page.locator('.temp-list-wrap .panel-wrap__status', { hasText: 'That is everything' }).count()) break
    await body.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await page.waitForTimeout(700)
  }
  return page.locator('.temp-list-wrap .panel-card').count()
}

test('the gallery is filed into categories', async ({ page }) => {
  const chips = page.locator('.cates__chip')
  await expect(chips.first()).toHaveText('All')
  await expect(chips.first()).toHaveClass(/cates__chip--on/)
  expect(await chips.count()).toBeGreaterThan(3)

  // Both lists are paged, so they have to be run to the end before the counts
  // mean anything — a first page of twenty is a first page of twenty either way.
  const all = await countTemplates(page)
  await chips.filter({ hasText: 'Slides' }).click()
  await page.waitForTimeout(1800)
  await expect(chips.filter({ hasText: 'Slides' })).toHaveClass(/cates__chip--on/)
  const slides = await countTemplates(page)
  expect(slides).toBeGreaterThan(0)
  expect(slides).toBeLessThan(all)
})

test('a search that matches nothing says so, and names the category', async ({ page }) => {
  await page.locator('.cates__chip', { hasText: 'Posters' }).click()
  await page.waitForTimeout(1500)
  await page.getByPlaceholder('Search templates').fill('zzzznothing')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(1800)
  await expect(page.locator('.temp-list-wrap .panel-wrap__status')).toHaveText('No posters match “zzzznothing”')

  // Clearing empties the box. It deliberately does not re-run the search,
  // which would only repeat the one that just came back empty.
  await page.locator('.temp-list-wrap .search-well__clear').click()
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
  await page.locator('#w-text-style .text-colour .color__field').click()
  await page.waitForTimeout(700)
  const hex = page.locator('.color-picker:visible .input').first()
  await hex.fill('#FF0000FF')
  await hex.blur()
  await page.waitForTimeout(1400)

  const stackAfter = await stack()
  expect(stackAfter, 'the stack followed the new colour').not.toEqual(stackBefore)
  expect(stackAfter, 'and it followed it to red').toContain('rgb(255, 0, 0)')
})

/**
 * Applies one named preset out of the Choose grid. The covers are served as
 * `sample-<id>.png`, which is the only thing on screen that says which preset a
 * tile is — picking by position would be picking by list order.
 */
async function applyEffectPreset(page: Page, id: number) {
  await page.locator('.effects').getByText('Choose', { exact: true }).click()
  await page.locator('.select__box__select-item img').first().waitFor()
  await page.waitForTimeout(1500)
  await page.locator(`.select__box__select-item img[src*="sample-${id}."]`).click()
  await page.waitForTimeout(1800)
}

/** What the fill layer of the stack actually paints, lowercased. */
function fillPaint(page: Page) {
  return page.locator(`${WIDGET} .effect-text`).evaluateAll((els) =>
    els
      .map((el) => decodeURIComponent(getComputedStyle(el).backgroundImage))
      .join(' ')
      .toLowerCase(),
  )
}

async function setColorTo(page: Page, field: Locator, value: string) {
  await field.click()
  await page.waitForTimeout(700)
  const hex = page.locator('.color-picker:visible .input').first()
  await hex.fill(value)
  await hex.blur()
  await page.waitForTimeout(1400)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
}

test('a patterned preset is recoloured by both the Colour swatch and the palette', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  // Checker fill: a navy-and-brass tile. Its colours used to be pixels inside a
  // baked data URI, so neither swatch could reach them and the panel offered no
  // control for the second tone at all.
  await applyEffectPreset(page, 65)

  const before = await fillPaint(page)
  expect(before, 'the tile paints both of its tones').toContain('#1e3a5f')
  expect(before).toContain('#e1a731')

  // The preset is drawn around navy, so navy is the text's own colour and the
  // Colour swatch carries it — into the tile as well as under it.
  await setColorTo(page, page.locator('#w-text-style .text-colour .color__field'), '#FF0000FF')
  const recoloured = await fillPaint(page)
  expect(recoloured, 'the navy squares followed the text colour').toContain('#ff0000')
  expect(recoloured).not.toContain('#1e3a5f')

  // Brass was never the text's colour, so it gets a swatch of its own.
  const palette = page.locator('#w-text-style .effect-palette .color__field')
  await expect(palette, 'one swatch for the one colour Colour does not carry').toHaveCount(1)
  await setColorTo(page, palette.first(), '#00FF00FF')
  const repalletted = await fillPaint(page)
  expect(repalletted, 'the brass squares followed the palette swatch').toContain('#00ff00')
  expect(repalletted).not.toContain('#e1a731')
  expect(repalletted, 'and the squares Colour owns were left alone').toContain('#ff0000')
})

test('the palette reaches the second colour of a preset that is not patterned', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await applyEffectPreset(page, 17) // Stripe fill: a two-tone gradient

  const stripes = () =>
    page.locator(`${WIDGET} .effect-text`).evaluateAll((els) => els.map((el) => getComputedStyle(el).backgroundImage).join(' '))
  expect(await stripes()).toContain('rgb(225, 167, 49)')

  const palette = page.locator('#w-text-style .effect-palette .color__field')
  await expect(palette).toHaveCount(1)
  await setColorTo(page, palette.first(), '#00FF00FF')

  const after = await stripes()
  expect(after, 'the brass stripes followed').toContain('rgb(0, 255, 0)')
  expect(after).not.toContain('rgb(225, 167, 49)')
  expect(after, 'the navy stripes did not').toContain('rgb(30, 58, 95)')
})

test('a patterned effect layer offers a swatch for each tone of its tile', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await applyEffectPreset(page, 65)

  await page.locator('.advanced').getByText('Advanced', { exact: true }).click()
  await page.waitForTimeout(800)
  // A tiling fill used to be the one layer the panel drew no Fill row for.
  const fill = page.locator('.layers .layer').first().locator('.feature', { hasText: 'Fill' })
  await expect(fill).toHaveCount(1)
  await expect(fill.locator('.color__field')).toHaveCount(2)
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

/* ------------------------------------------------------------ curved text */

/** Puts the Curve slider a fraction of the way along its run: 1 is a half turn. */
async function setCurve(page: import('@playwright/test').Page, fraction: number) {
  const runway = page.locator('#w-text-style #number-slider', { hasText: 'Curve' }).locator('.el-slider__runway')
  const box = (await runway.boundingBox())!
  await page.mouse.move(box.x + Math.min(box.width * fraction, box.width - 1), box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(600)
}

/** How far each character of the arc is turned, in reading order. */
function glyphAngles(page: import('@playwright/test').Page) {
  return page.locator(`${WIDGET} .curved-text__glyph`).evaluateAll((els) =>
    els.map((el) => Number((el as HTMLElement).style.transform.match(/rotate\((-?[\d.]+)deg\)/)?.[1] ?? 0)),
  )
}

test('the Curve slider bends a heading into an arc', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await expect(page.locator(`${WIDGET} .curved-text`)).toHaveCount(0)
  const before = (await widgetBox(page))!

  await setCurve(page, 1)

  const angles = await glyphAngles(page)
  expect(angles.length, 'a character apiece, bar the spaces').toBeGreaterThan(3)
  // Turned as they travel: the first character leans back, the last leans on.
  expect(angles[0]).toBeLessThan(-20)
  expect(angles[angles.length - 1]).toBeGreaterThan(20)
  for (let i = 1; i < angles.length; i++) expect(angles[i], 'each one further round than the last').toBeGreaterThan(angles[i - 1])

  const after = (await widgetBox(page))!
  // The box is fitted to the arc, which is taller and narrower than the line.
  expect(parseFloat(after.height)).toBeGreaterThan(parseFloat(before.height))
  expect(parseFloat(after.width)).toBeLessThan(parseFloat(before.width))
  const centre = (box: typeof before) => parseFloat(box.left) + parseFloat(box.width) / 2
  expect(Math.abs(centre(after) - centre(before)), 'and it bent where it stood').toBeLessThan(2)
})

test('a curved heading straightens out to be typed in, and curves back', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await setCurve(page, 1)
  await expect(page.locator(`${WIDGET} .curved-text`)).toHaveCount(1)

  // Into a corner of the box: the middle of a selected widget is under the
  // selection's own rotation handle, which takes the click instead.
  await page.locator(WIDGET).first().dblclick({ position: { x: 24, y: 24 } })
  await page.waitForTimeout(500)
  // There is nowhere to put a cursor in an arc, so the caret gets the plain run.
  await expect(page.locator(`${WIDGET} .curved-text`)).toHaveCount(0)
  await expect(page.locator(`${WIDGET} [contenteditable]`)).toHaveCount(1)

  await page.keyboard.type('Sports Day')
  await page.locator('#page-design-canvas').click({ position: { x: 4, y: 4 } })
  await page.waitForTimeout(800)

  await expect(page.locator(`${WIDGET} .curved-text`)).toHaveCount(1)
  const chars = await page.locator(`${WIDGET} .curved-text__glyph`).allTextContents()
  expect(chars.join(''), 'the new words, on the arc, spaces drawing nothing').toBe('SportsDay')
})

test('the page thumbnail draws the arc too', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await setCurve(page, 0)

  await expandPageStrip(page)
  expect(await page.locator('.artboards .curved-text__glyph').count()).toBeGreaterThan(3)
})

/* ------------------------------------------------------------------ drag */

test('the Photos panel shows the photographs, not just their placeholders', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Photos' }).click()
  await page.waitForTimeout(1200)
  const thumbs = page.locator('.photo-list-wrap img')
  await expect(thumbs.first()).toBeVisible()

  // A thumbnail hidden with display: none is never near enough to the viewport
  // for loading="lazy" to fetch it, so it would sit on its placeholder forever.
  await expect
    .poll(
      () =>
        page.evaluate(() => {
          const imgs = Array.from(document.querySelectorAll('.photo-list-wrap img')) as HTMLImageElement[]
          return imgs.length > 0 && imgs.every((img) => img.complete && img.naturalWidth > 0)
        }),
      { timeout: 15000 },
    )
    .toBe(true)
})

/* ------------------------------------------------------------------ crop */

async function addPhoto(page: Page) {
  await page.locator('#widget-panel .classify-item', { hasText: 'Photos' }).click()
  await page.waitForTimeout(1200)
  await page.locator('.photo-list-wrap__library .panel-card').first().click()
  await page.waitForTimeout(1500)
  await expect(page.locator(WIDGET)).toHaveCount(1)
}

async function startCrop(page: Page) {
  await page.locator('#style-panel button', { hasText: 'Crop' }).click()
  await page.waitForTimeout(400)
}

/** The frame's picture and the faded whole one behind it, to the nearest pixel. */
function croppedBoxes(page: Page) {
  return page.evaluate(() => {
    const round = (el: Element | null) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      return [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)]
    }
    return {
      model: round(document.querySelector('.svg__edit__wrap')),
      target: round(document.querySelector('.w-image .target')),
      transform: (document.querySelector('.w-image .target') as HTMLElement)?.style.transform,
    }
  })
}

test('the crop scale reaches the picture the moment the slider moves', async ({ page }) => {
  await addPhoto(page)
  await startCrop(page)

  const runway = page.locator('.inner-tool-bar .el-slider__runway')
  const track = (await runway.boundingBox())!
  await page.mouse.click(track.x + track.width / 2, track.y + track.height / 2)
  await page.waitForTimeout(400)

  await expect(page.locator('.inner-bar .value')).toHaveText('2')
  const { model, target, transform } = await croppedBoxes(page)
  expect(transform).toContain('scale(2)')
  // The faded picture is what you aim with, so it has to sit exactly where the
  // framed one does. They came apart when the slider moved and the frame did not.
  expect(model).toEqual(target)
})

test('the crop grips reframe the picture without moving it', async ({ page }) => {
  await addPhoto(page)
  await startCrop(page)
  await expect(page.locator('.crop__grip')).toHaveCount(8)

  const before = await croppedBoxes(page)
  const frameBefore = (await page.locator(WIDGET).first().boundingBox())!

  // The grip on the right edge, pulled in towards the middle.
  const grip = (await page.locator('.crop__grip').nth(4).boundingBox())!
  const gx = grip.x + grip.width / 2
  const gy = grip.y + grip.height / 2
  await page.mouse.move(gx, gy)
  await page.mouse.down()
  await page.mouse.move(gx - 40, gy, { steps: 5 })
  await page.mouse.up()
  await page.waitForTimeout(400)

  const frameAfter = (await page.locator(WIDGET).first().boundingBox())!
  expect(frameAfter.width).toBeLessThan(frameBefore.width - 20)
  expect(Math.round(frameAfter.height)).toBe(Math.round(frameBefore.height))

  // Cropping narrows the window, it does not shove the photograph about.
  const after = await croppedBoxes(page)
  expect(after.target).toEqual(before.target)
  expect(after.model).toEqual(after.target)
})

test('leaving an image mid-crop and coming back offers to crop it again', async ({ page }) => {
  await addPhoto(page)
  await startCrop(page)
  await expect(page.locator('.inner-tool-bar')).toBeVisible()

  await page.locator('#page-design').click({ position: { x: 40, y: 40 } })
  await page.waitForTimeout(400)
  await page.locator(WIDGET).first().click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)

  await expect(page.locator('.inner-tool-bar')).toHaveCount(0)
  await expect(page.locator('.svg__edit__wrap')).toHaveCount(0)
  await expect(page.locator('#style-panel button', { hasText: 'Crop' })).toHaveCount(1)
})

test('cropping gives a flipped image its flip back', async ({ page }) => {
  await addPhoto(page)
  const box = page.locator('.w-image .img__box').first()
  await page.locator('#style-panel .icon.sd-zuoyoufanzhuan').click()
  await page.waitForTimeout(300)
  await expect(box).toHaveCSS('transform', /matrix/)

  await startCrop(page)
  await page.locator('#style-panel button', { hasText: 'Done' }).click()
  await page.waitForTimeout(400)
  await expect(box).toHaveCSS('transform', /matrix/)
})

test('clicking a shape in the Graphics panel places it', async ({ page }) => {
  await page.locator('#widget-panel .classify-item', { hasText: 'Graphics' }).click()
  await page.waitForTimeout(2000)
  await page.locator('.graph-list-wrap .cates__chip', { hasText: 'Shapes' }).click()
  await page.waitForTimeout(1500)
  await page.locator('.graph-list-wrap .panel-card.art--svg').first().click()
  await page.waitForTimeout(1800)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

/* ---------------------------------------------------------------- shadow */

/** The Shadow section's on/off switch, which both artwork panels share. */
function shadowToggle(page: Page) {
  return page.locator('#style-panel .shadow-select .el-checkbox')
}

test('a photo can be given a drop shadow, and lose it again', async ({ page }) => {
  await addPhoto(page)
  await selectFirstWidget(page)
  const widget = page.locator(WIDGET).first()
  await expect(widget).toHaveCSS('filter', 'none')

  await shadowToggle(page).click()
  await page.waitForTimeout(400)
  // A drop-shadow rather than a box-shadow, so a cut-out photo casts the shape
  // of what is in it and not the shape of its bounding box.
  await expect(widget).toHaveCSS('filter', /drop-shadow/)

  await shadowToggle(page).click()
  await page.waitForTimeout(400)
  await expect(widget).toHaveCSS('filter', 'none')
})

test('the blur and offsets survive switching the shadow off and on', async ({ page }) => {
  await addPhoto(page)
  await selectFirstWidget(page)
  await shadowToggle(page).click()
  await page.waitForTimeout(400)

  const blur = page.locator('#style-panel .shadow-select .field--full input')
  await blur.fill('40')
  await blur.blur()
  await page.waitForTimeout(400)
  await expect(page.locator(WIDGET).first()).toHaveCSS('filter', /40px/)

  // Switching off clears the shadow out of the design entirely, so the panel is
  // the only thing left holding what was dialled in.
  await shadowToggle(page).click()
  await page.waitForTimeout(400)
  await shadowToggle(page).click()
  await page.waitForTimeout(400)
  await expect(page.locator(WIDGET).first()).toHaveCSS('filter', /40px/)
})

test('a shape casts its shadow in the page thumbnail too', async ({ page }) => {
  await addShape(page, 'apple')
  await selectFirstWidget(page)
  await shadowToggle(page).click()
  await page.waitForTimeout(400)
  await expect(page.locator(WIDGET).first()).toHaveCSS('filter', /drop-shadow/)

  await expandPageStrip(page)
  await expect(page.locator('.artboards .list [style*="drop-shadow"]')).toHaveCount(1)
})

test('the colour picker keeps the colours you have used', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  const swatch = page.locator('#w-text-style .text-colour .color__field')

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

/* ----------------------------------------------------------- distributing */

/** Every widget's top edge and drawn height, in page pixels, top to bottom. */
async function verticalBands(page: import('@playwright/test').Page) {
  const bands = await page.evaluate(
    (selector) =>
      [...document.querySelectorAll(selector)].map((el) => ({
        top: Number.parseFloat((el as HTMLElement).style.top),
        height: (el as HTMLElement).offsetHeight,
      })),
    WIDGET,
  )
  return bands.sort((a, b) => a.top - b.top)
}

async function selectEverything(page: import('@playwright/test').Page) {
  await page.locator('#page-design-canvas').click({ position: { x: 4, y: 4 } })
  await page.waitForTimeout(300)
  await page.keyboard.press('ControlOrMeta+a')
  await page.waitForTimeout(600)
  await expect(page.locator('.gounp__btn')).toBeVisible()
}

test('distributing evens out the gaps and leaves the outermost alone', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Body text')
  await addText(page, 'Subheading')
  await expect(page.locator(WIDGET)).toHaveCount(3)

  const before = await verticalBands(page)
  await selectEverything(page)
  await page.getByLabel('Distribute vertically').click()
  await page.waitForTimeout(400)

  const after = await verticalBands(page)
  // The two that were on the outside are exactly where they were left.
  expect(after[0].top).toBe(before[0].top)
  expect(after[2].top + after[2].height).toBe(before[2].top + before[2].height)
  // And the widget between them has moved to the middle of what is left over.
  const gaps = [after[1].top - (after[0].top + after[0].height), after[2].top - (after[1].top + after[1].height)]
  expect(Math.abs(gaps[0] - gaps[1])).toBeLessThanOrEqual(1)
  expect(after[1].top).not.toBe(before[1].top)
})

test('there is nothing to distribute below three widgets', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Body text')
  await expect(page.locator(WIDGET)).toHaveCount(2)

  const before = await verticalBands(page)
  await selectEverything(page)
  await expect(page.getByLabel('Distribute vertically')).toHaveClass(/disabled/)
  await page.getByLabel('Distribute vertically').click()
  await page.waitForTimeout(400)

  expect(await verticalBands(page)).toEqual(before)
})

/* -------------------------------------------------------------- outlines */

/**
 * Places the first shape the Graphics panel finds under `search`.
 *
 * Only the SVG results: the library answers "apple" with a photographic sticker
 * as well as the line drawing, and a picture would land on the canvas as an
 * image widget with no outline settings on it at all.
 */
async function addShape(page: Page, search: string) {
  await page.locator('#widget-panel .classify-item', { hasText: 'Graphics' }).click()
  await page.waitForTimeout(1500)
  await page.locator('.graph-list-wrap input').first().fill(search)
  await page.waitForTimeout(1800)
  await page.locator('.graph-list-wrap .list__item.art--svg').first().click()
  await page.waitForTimeout(1500)
}

/** Puts a slider a fraction of the way along its run, and reads back where it landed. */
async function dragSlider(page: Page, panel: string, label: string, fraction: number) {
  const slider = page.locator(`${panel} #number-slider`, { hasText: label })
  const runway = slider.locator('.el-slider__runway')
  const box = (await runway.boundingBox())!
  await page.mouse.move(box.x + Math.min(box.width * fraction, box.width - 1), box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(500)
  return Number(await slider.locator('.value').innerText())
}

/** What the outline was written onto the shape's own geometry as. */
function outlinedShape(page: Page) {
  return page.evaluate((selector) => {
    const el = document.querySelector(`${selector} svg [data-border]`)
    if (!el) return null
    return {
      stroke: el.getAttribute('stroke'),
      width: Number(el.getAttribute('stroke-width')),
      effect: el.getAttribute('vector-effect'),
      clipped: /^url\(#/.test(el.getAttribute('clip-path') || ''),
    }
  }, WIDGET)
}

test('a shape can be outlined, and the outline does not grow it', async ({ page }) => {
  await addShape(page, 'Rectangle')
  await selectFirstWidget(page)
  expect(await outlinedShape(page)).toBeNull()
  const before = await widgetBox(page)

  const thickness = await dragSlider(page, '.ds-svg-style', 'Thickness', 0.25)
  expect(thickness).toBeGreaterThan(0)

  const outline = (await outlinedShape(page))!
  // Twice what was asked for, clipped back to the shape: a stroke straddles the
  // edge it follows, so half of a double-width one lands inside it.
  expect(outline.width).toBe(thickness * 2)
  expect(outline.clipped, 'the half that would hang outside is cut away').toBe(true)
  // Measured in the shape's own viewport, so stretching the shape does not
  // stretch its outline with it.
  expect(outline.effect).toBe('non-scaling-stroke')
  expect(await widgetBox(page)).toEqual(before)
})

test('taking the thickness back to nothing leaves no trace of the outline', async ({ page }) => {
  await addShape(page, 'Circle')
  await selectFirstWidget(page)
  await dragSlider(page, '.ds-svg-style', 'Thickness', 0.4)
  expect(await outlinedShape(page)).not.toBeNull()

  expect(await dragSlider(page, '.ds-svg-style', 'Thickness', 0)).toBe(0)
  expect(await outlinedShape(page)).toBeNull()
  // Every pass undoes the one before it, so dragging the slider cannot stack
  // clip paths up in the markup.
  expect(await page.locator(`${WIDGET} svg [data-border-clip]`).count()).toBe(0)
})

test('outlining leaves a line drawing alone rather than repainting it', async ({ page }) => {
  await addShape(page, 'apple')
  await selectFirstWidget(page)
  await dragSlider(page, '.ds-svg-style', 'Thickness', 0.4)

  // A sticker is drawn as strokes, not fills. Adding to that stroke would not
  // outline the apple, it would fatten it and take its colour off.
  expect(await outlinedShape(page)).toBeNull()
  await expect(page.locator(`${WIDGET} svg`)).toHaveAttribute('stroke', /#/)
})

test('a photograph can be given a keyline, and it follows the corners', async ({ page }) => {
  await addPhoto(page)
  await selectFirstWidget(page)
  await expect(page.locator(`${WIDGET} .img__keyline`)).toHaveCount(0)
  const before = await widgetBox(page)

  const thickness = await dragSlider(page, '.ds-image-style', 'Thickness', 0.2)
  const keyline = page.locator(`${WIDGET} .img__keyline`)
  await expect(keyline).toHaveCSS('border-top-width', `${thickness}px`)
  // Laid over the picture rather than around it, so the photograph is still the
  // size it was set to.
  expect(await widgetBox(page)).toEqual(before)

  const radius = await dragSlider(page, '.ds-image-style', 'Corner radius', 0.2)
  await expect(keyline).toHaveCSS('border-top-left-radius', `${radius}px`)
})

test('the outline is drawn in the page thumbnails too', async ({ page }) => {
  await addShape(page, 'Rectangle')
  await selectFirstWidget(page)
  await dragSlider(page, '.ds-svg-style', 'Thickness', 0.25)

  await expandPageStrip(page)
  expect(await page.locator('.artboards svg [data-border]').count()).toBeGreaterThan(0)
})

/* ------------------------------------------------------------- gradients */

/**
 * The shape's own drawing, once the placeholders have been painted over.
 *
 * Not the copy of it inside `<defs>`: an outline clips itself to a silhouette
 * of the shape, and that clone keeps the fill the shape had when it was made.
 */
function shapeArt(page: Page) {
  return page.locator(`${WIDGET} svg :is(polygon, path, rect, circle):not(defs *)`).first()
}

test('a shape can be filled with a gradient', async ({ page }) => {
  await addShape(page, 'Rectangle')
  await selectFirstWidget(page)
  await openGradient(page, page.locator('#style-panel .color__select').first().locator('.color__field'))

  // An SVG attribute cannot hold a CSS gradient, so the fill is a reference to
  // a paint server the shape carries with it.
  await expect(shapeArt(page)).toHaveAttribute('fill', /^url\(#/)
  await expect(page.locator(`${WIDGET} svg defs linearGradient`)).toHaveCount(1)
  await expect(page.locator('#style-panel .color__select').first().locator('.color__value')).toHaveText('Gradient')
})

test('a gradient can be radial as well as linear', async ({ page }) => {
  await addShape(page, 'Rectangle')
  await selectFirstWidget(page)
  await openGradient(page, page.locator('#style-panel .color__select').first().locator('.color__field'), 'radial')

  await expect(page.locator(`${WIDGET} svg defs radialGradient`)).toHaveCount(1)
  await expect(page.locator(`${WIDGET} svg defs linearGradient`)).toHaveCount(0)
})

test('a shape outline can be a gradient too', async ({ page }) => {
  await addShape(page, 'Rectangle')
  await selectFirstWidget(page)
  await dragSlider(page, '.ds-svg-style', 'Thickness', 0.25)
  await openGradient(page, page.locator('.ds-svg-style .border-controls .color__field'))

  // The outline's paint server sits in the same <defs> as its clip paths, so
  // taking the outline off takes the gradient with it.
  const outline = (await outlinedShape(page))!
  expect(outline.stroke).toMatch(/^url\(#/)
  await expect(page.locator(`${WIDGET} svg defs[data-border-clip] linearGradient`)).toHaveCount(1)

  // The fill is painted onto the markup by one module and the outline by
  // another, so a shape carrying both keeps both: two paint servers, in two
  // <defs>, neither writing over the other's attributes.
  await openGradient(page, page.locator('.ds-svg-style .color__select').first().locator('.color__field'))
  await expect(shapeArt(page)).toHaveAttribute('fill', /^url\(#/)
  expect((await outlinedShape(page))!.stroke).toMatch(/^url\(#/)

  await dragSlider(page, '.ds-svg-style', 'Thickness', 0)
  expect(await outlinedShape(page)).toBeNull()
  await expect(page.locator(`${WIDGET} svg defs[data-border-clip]`)).toHaveCount(0)
})

test('a keyline on a photograph can be a gradient', async ({ page }) => {
  await addPhoto(page)
  await selectFirstWidget(page)
  await dragSlider(page, '.ds-image-style', 'Thickness', 0.2)
  await openGradient(page, page.locator('.ds-image-style .border-controls .color__field'))

  // `border` takes a colour and nothing else, so a gradient keyline is the
  // whole element painted and masked down to its own padding.
  const keyline = page.locator(`${WIDGET} .img__keyline`)
  await expect(keyline).toHaveCSS('background-image', /gradient/)
  await expect(keyline).toHaveCSS('border-top-width', '0px')
})
