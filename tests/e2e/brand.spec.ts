import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addPage, addText, armShapeTool, expandPageStrip, goToPage, openEditor, selectFirstWidget, setWidgetText, widgetText } from './helpers'

/*
 * The brand kit: the school's own name, colours, fonts and contact line, set
 * once in the Brand panel and used everywhere else. What is worth testing is
 * the joins — a template picking the name up as it lands, a swatch reaching
 * the selection, the kit surviving a reload — rather than the panel's own
 * fields, which are one-line writes into the store.
 */

/** A 96px square, teal with a transparent border, so transparency can be checked. */
const LOGO_PNG =
  'iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4AAAAqUlEQVR42u3RsQ0AQAgDMSZhXvRLPz0lLT4pC8QRkiRJkjTKet/2AwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgCMBADAAAAwAAAMAwAAAMAAADAAAAwDAAAAwAAAMAAADAMAAADAAAAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAECSJEnSyRrEBporpZNE4gAAAABJRU5ErkJggg=='

/** The Field Day poster, whose footer is `{{school.name|upper}}`. */
const FIELD_DAY = 101

async function openPanel(page: Page, name: 'Templates' | 'Brand' | 'Text') {
  const wrap = { Templates: '.temp-list-wrap', Brand: '.brand-wrap', Text: '#text-list-wrap' }[name]
  // Clicking the tab that is already open folds the panel away, so only switch
  // when the panel is not already on screen.
  if (await page.locator(wrap).first().isVisible().catch(() => false)) return
  await page.locator('#widget-panel .classify-item', { hasText: name }).click()
  await page.waitForTimeout(400)
}

async function pickTemplate(page: Page, id: number) {
  await openPanel(page, 'Templates')
  await page.locator(`.panel-card:has(img[src="/covers/template-${id}.png"])`).click()
  await page.waitForTimeout(2000)
}

/** Types the school's name into the panel and waits for the debounced save. */
async function setSchoolName(page: Page, name: string) {
  await openPanel(page, 'Brand')
  await page.locator('#brand-name').fill(name)
  await page.waitForTimeout(900)
}

/** Adds one colour to the kit through the card the Add row opens. */
async function addBrandColor(page: Page, hex: string) {
  await openPanel(page, 'Brand')
  await page.locator('.brand-swatch--add').click()
  await page.waitForTimeout(500)
  await page.locator('.brand-editor__hex input').fill(hex)
  await page.waitForTimeout(300)
  await page.locator('.brand-editor__save').click()
  await page.waitForTimeout(600)
}

/** The hexes the Colours section is showing, in kit order. */
function kitHexes(page: Page) {
  return page.locator('.brand-swatch__hex').allInnerTexts()
}

/** Every text layer on the page, markup taken off. */
function pageText(page: Page) {
  return page.locator(`${WIDGET} .edit-text`).allInnerTexts()
}

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/* --------------------------------------------------------------- the fill */

test('a template picks up the school name as it lands', async ({ page }) => {
  await setSchoolName(page, 'Oakridge Primary')
  await pickTemplate(page, FIELD_DAY)

  const lines = await pageText(page)
  // The footer is set in capitals, which the field asks for with |upper.
  expect(lines).toContain('OAKRIDGE PRIMARY')
  expect(lines.join(' ')).not.toContain('{{')
})

test('with no kit set up, a template reads as the sample school', async ({ page }) => {
  await pickTemplate(page, FIELD_DAY)

  const lines = await pageText(page)
  expect(lines).toContain('SPRINGFIELD ELEMENTARY')
  expect(lines.join(' ')).not.toContain('{{')
})

test('a field clicked in the panel lands in the text box that is selected', async ({ page }) => {
  await setSchoolName(page, 'Oakridge Primary')
  await addText(page, 'Heading')
  await selectFirstWidget(page)

  await openPanel(page, 'Brand')
  await page.locator('.brand-token', { hasText: '{{school.name}}' }).first().click()
  await page.waitForTimeout(600)

  // Appended, not replaced, and not filled in: the field is what was asked for.
  await expect(page.locator(WIDGET)).toHaveCount(1)
  expect(await widgetText(page)).toContain('{{school.name}}')
})

/* ------------------------------------------------------------- the colours */

test('a brand colour paints the shape that is selected, in one undo step', async ({ page }) => {
  await addBrandColor(page, '#C8102E')

  await armShapeTool(page, 'Rectangle')
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  await page.mouse.move(canvas.x + 100, canvas.y + 100)
  await page.mouse.down()
  for (let step = 1; step <= 10; step++) await page.mouse.move(canvas.x + 100 + 20 * step, canvas.y + 100 + 15 * step)
  await page.mouse.up()
  await page.waitForTimeout(600)

  const fill = () => page.locator(`${WIDGET} .shape__paint`).first().evaluate((el) => getComputedStyle(el).backgroundColor)
  const before = await fill()

  await openPanel(page, 'Brand')
  await page.locator('.brand-swatch__chip').first().click()
  await page.waitForTimeout(600)
  expect(await fill()).toBe('rgb(200, 16, 46)')

  // A press of a button records no history of its own, so this is the check
  // that the panel bracketed the change itself.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(700)
  expect(await fill()).toBe(before)
})

test('with nothing selected, a brand colour paints the page', async ({ page }) => {
  await addBrandColor(page, '#C8102E')
  await page.locator('.brand-swatch__chip').first().click()
  await page.waitForTimeout(600)

  const background = () => page.locator('#page-design-canvas').evaluate((el) => getComputedStyle(el).backgroundColor)
  expect(await background()).toBe('rgb(200, 16, 46)')
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(700)
  expect(await background()).toBe('rgb(255, 255, 255)')
})

test('the brand colours sit above the swatches in every colour picker', async ({ page }) => {
  await addBrandColor(page, '#C8102E')
  await addText(page, 'Heading')
  await selectFirstWidget(page)

  await page.locator('#style-panel .color__field').first().click()
  await page.waitForTimeout(700)

  const presets = page.locator('.cp__presets')
  await expect(presets).toBeVisible()
  await expect(presets.locator('.cp__presets-label')).toHaveText('Brand')
  await expect(presets.locator('.item-color')).toHaveCount(1)

  // And it is a colour you can pick, not just a label.
  await presets.locator('.item-color').first().click()
  await page.waitForTimeout(500)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  const colour = await page.locator(`${WIDGET} .edit-text`).first().evaluate((el) => getComputedStyle(el).color)
  expect(colour).toBe('rgb(200, 16, 46)')
})

test('a colour is edited in its own row, and nothing changes until it is saved', async ({ page }) => {
  await addBrandColor(page, '#C8102E')
  // The label is derived from the place in the kit, not typed in.
  await expect(page.locator('.brand-swatch__role').first()).toHaveText('Primary · red')

  await page.locator('.brand-swatch__edit').first().click()
  await page.waitForTimeout(400)
  await expect(page.locator('.brand-editor')).toBeVisible()
  // The card says where the colour already is before it is changed.
  await expect(page.locator('.brand-editor__note')).toHaveText('Not used in this design yet.')

  await page.locator('.brand-editor__hex input').fill('#1F3B63')
  await page.waitForTimeout(300)
  await page.locator('.brand-editor__cancel').click()
  await page.waitForTimeout(400)
  expect(await kitHexes(page)).toEqual(['#C8102E'])

  await page.locator('.brand-swatch__edit').first().click()
  await page.waitForTimeout(400)
  await page.locator('.brand-editor__hex input').fill('#1F3B63')
  await page.waitForTimeout(300)
  await page.locator('.brand-editor__save').click()
  await page.waitForTimeout(500)
  expect(await kitHexes(page)).toEqual(['#1F3B63'])
  await expect(page.locator('.brand-swatch__role').first()).toHaveText('Primary · navy')
})

test('the editing card says where the colour is already painted, and can take it out', async ({ page }) => {
  await addBrandColor(page, '#C8102E')
  // Nothing selected, so this paints the page itself.
  await page.locator('.brand-swatch__chip').first().click()
  await page.waitForTimeout(600)

  await page.locator('.brand-swatch__edit').first().click()
  await page.waitForTimeout(400)
  await expect(page.locator('.brand-editor__note')).toHaveText('Used as the background on 1 page.')

  await page.locator('.brand-editor__remove').click()
  await page.waitForTimeout(500)
  await expect(page.locator('.brand-swatch')).toHaveCount(0)
  await expect(page.locator('.brand-editor')).toHaveCount(0)
  // The page keeps the colour it was painted; the kit is what changed.
  expect(await page.locator('#page-design-canvas').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(200, 16, 46)')
})

test('the same colour is not added twice', async ({ page }) => {
  await addBrandColor(page, '#C8102E')
  await addBrandColor(page, '#C8102E')
  expect(await kitHexes(page)).toEqual(['#C8102E'])
  await expect(page.locator('.el-message')).toContainText('already in the kit')
})

/* --------------------------------------------------------------- the fonts */

test('the school fonts head the text panel’s font list', async ({ page }) => {
  await openPanel(page, 'Brand')
  await page.locator('.brand-font--heading').click()
  await page.waitForTimeout(500)
  await page.locator('.brand-fonts__option', { hasText: 'Bebas Neue' }).first().click()
  await page.waitForTimeout(700)

  // The card is the preview: the name is set in the font it names.
  const card = page.locator('.brand-font--heading .brand-font__name')
  await expect(card).toHaveText('Bebas Neue')
  expect(await card.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Bebas Neue')

  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await page.locator('#style-panel .value-select', { hasText: 'Text' }).locator('.real-input').click()
  await page.waitForTimeout(700)

  // First tab, so the school's own fonts are one click away rather than found
  // by remembering which group the family belongs to.
  const tabs = page.locator('.el-popper:visible .tabs-wrap .el-tabs__item')
  await expect(tabs.first()).toHaveText('Brand')
  await expect(page.locator('.el-popper:visible .list-ul li')).toHaveText(['Bebas Neue'])
})

/* ---------------------------------------------------------------- the logo */

test('the logo can be uploaded and put on the page', async ({ page }) => {
  await openPanel(page, 'Brand')
  await page.locator('.brand-upload input[type="file"]').setInputFiles({ name: 'crest.png', mimeType: 'image/png', buffer: Buffer.from(LOGO_PNG, 'base64') })
  await page.waitForTimeout(1500)

  const thumb = page.locator('.brand-logo__thumb img')
  await expect(thumb).toBeVisible()
  // A small PNG is stored as it came, so the crest keeps its transparency.
  const source = await thumb.getAttribute('src')
  expect(source).toContain('data:image/png')

  // The tile is the button: clicking the crest puts the crest on the page.
  await page.locator('.brand-logo__thumb').click()
  await page.waitForTimeout(800)
  await expect(page.locator(WIDGET)).toHaveCount(1)
  await expect(page.locator(WIDGET).first()).toHaveAttribute('data-type', 'w-image')

  // Uploading again replaces the one logo rather than adding a second tile.
  await expect(page.locator('.brand-upload')).toContainText('Replace')

  await page.locator('.brand-logo__remove').click()
  await page.waitForTimeout(500)
  await expect(page.locator('.brand-logo__thumb')).toHaveCount(0)
  await expect(page.locator('.brand-upload')).toContainText('Upload')
})

/* ------------------------------------------------- the school's own card */

test('the card counts the pages Apply brand would touch', async ({ page }) => {
  await openPanel(page, 'Brand')
  const card = page.locator('.brand-card')
  await expect(card.locator('.brand-card__name')).toHaveText('Your school')
  await expect(card.locator('.brand-card__impact')).toContainText('across this page')
  // Nothing in the kit, so there is nothing for the button to apply.
  await expect(card.locator('.brand-card__apply')).toBeDisabled()

  await expandPageStrip(page)
  await addPage(page)
  await openPanel(page, 'Brand')
  await expect(card.locator('.brand-card__impact')).toContainText('across all 2 pages')

  // The card takes its name and its line from the details underneath it.
  await setSchoolName(page, 'Oakridge Primary')
  await page.locator('#brand-tagline').fill('Learning together')
  await page.waitForTimeout(400)
  await expect(card.locator('.brand-card__name')).toHaveText('Oakridge Primary')
  await expect(card.locator('.brand-card__note')).toHaveText('Learning together')
  await expect(card.locator('.brand-card__apply')).toBeEnabled()
})

/* --------------------------------------------------------- apply the brand */

test('apply brand fills the fields on every page, in one undo step', async ({ page }) => {
  // A design written before the kit was: the field is typed in by hand, on two
  // pages, and nothing fills it until Apply brand is pressed.
  await addText(page, 'Heading')
  await setWidgetText(page, '{{school.name}}')
  await expandPageStrip(page)
  await addPage(page)
  await addText(page, 'Heading')
  await setWidgetText(page, '{{school.name}}')
  expect(await widgetText(page)).toBe('{{school.name}}')

  await setSchoolName(page, 'Oakridge Primary')
  await page.locator('.brand-card__apply').click()
  await page.waitForTimeout(600)
  await expect(page.locator('.ds-apply-brand')).toBeVisible()
  await page.locator('.ds-apply-brand .el-button--primary').click()
  await page.waitForTimeout(1200)

  await expect(page.locator('.el-notification')).toContainText('2 pages')
  expect(await widgetText(page)).toBe('Oakridge Primary')
  await goToPage(page, 0)
  expect(await widgetText(page)).toBe('Oakridge Primary')

  // Both pages come back together: the whole thing is one entry.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(900)
  expect(await widgetText(page)).toBe('{{school.name}}')
  await goToPage(page, 1)
  expect(await widgetText(page)).toBe('{{school.name}}')
})

/* --------------------------------------------------------------- it sticks */

test('the kit is still there after a reload', async ({ page }) => {
  await setSchoolName(page, 'Oakridge Primary')
  await addBrandColor(page, '#C8102E')

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.locator('#widget-panel .classify-item').first().waitFor()
  // Nothing was drawn, so there is no draft to be asked about.
  await openPanel(page, 'Brand')

  await expect(page.locator('#brand-name')).toHaveValue('Oakridge Primary')
  await expect(page.locator('.brand-swatch')).toHaveCount(1)
  expect(await kitHexes(page)).toEqual(['#C8102E'])
})
