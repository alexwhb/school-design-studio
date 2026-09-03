import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addPage, addText, armShapeTool, expandPageStrip, goToPage, openEditor, selectFirstWidget, setWidgetText, widgetCount, widgetText } from './helpers'

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

/** Picks one of the kit's two fonts out of its card. */
async function setBrandFont(page: Page, slot: 'heading' | 'body', name: string) {
  await openPanel(page, 'Brand')
  await page.locator(`.brand-font--${slot}`).click()
  await page.waitForTimeout(400)
  await page.locator('.brand-fonts__popper:visible .brand-fonts__option', { hasText: name }).first().click()
  await page.waitForTimeout(600)
}

/**
 * Every colour the line art on the page is painted in, alpha and all. The
 * shapes are where a template's palette mostly lives, and reading the SVG's
 * own attributes rather than a computed style is what keeps the eight digits:
 * a 7% wash comes back as `#rrggbb12` instead of an `rgba()` rounded to three.
 */
function svgPaints(page: Page) {
  return page.$$eval(`${WIDGET}[data-type="w-svg"] svg`, (nodes) =>
    nodes.flatMap((node) => [...node.outerHTML.matchAll(/(?:fill|stroke)="(#[0-9a-fA-F]{6,8})"/g)].map((match) => match[1].toLowerCase())),
  )
}

/** The colour and the face of each text box, in the order they are stacked. */
function textFaces(page: Page) {
  return page.$$eval(`${WIDGET} .edit-text`, (nodes) =>
    nodes.map((node) => ({
      text: (node as HTMLElement).innerText.slice(0, 20),
      color: getComputedStyle(node).color,
      font: getComputedStyle(node).fontFamily.replace(/"/g, ''),
    })),
  )
}

/**
 * Serves one template doctored on the way past, for the cases the bundled
 * three do not cover — a template that would rather keep its own palette, or
 * a line whose face is the artwork. The block is what the file carries, so
 * changing it here is the same as authoring it.
 */
async function serveTemplate(page: Page, change: (detail: any) => void) {
  await page.route('**/design/temp*', async (route) => {
    const response = await route.fetch()
    const body = await response.json()
    change(body.result)
    await route.fulfill({ response, json: body })
  })
}

/** Every text layer on the page, markup taken off. */
function pageText(page: Page) {
  return page.locator(`${WIDGET} .edit-text`).allInnerTexts()
}

/**
 * The contrast module, run inside the page.
 *
 * There is no unit runner in this project, and the WCAG numbers below are the
 * published ones — 21:1 for black on white, 4.54:1 for #767676 on white — so
 * they are worth checking against the maths itself rather than only through
 * what the maths went on to paint. The module is pulled in over the dev
 * server's own module graph, which is what `APP_URL` points at.
 */
function contrastIn(page: Page, a: string, b: string) {
  return page.evaluate(
    async ([one, two]) => {
      // Held in a variable so this stays a runtime import of a path on the dev
      // server rather than something the test's own typecheck tries to resolve.
      const url = '/src/common/methods/contrast.ts'
      const mod = await import(/* @vite-ignore */ url)
      return mod.contrastRatio(one, two) as number
    },
    [a, b],
  )
}

/** The rendered colour of the text box whose words start with `starts`. */
async function faceColor(page: Page, starts: string) {
  const faces = await textFaces(page)
  return faces.find((face) => face.text.startsWith(starts))?.color
}

/** `rgb(r, g, b)` back as `#rrggbb`, so it can go into the contrast maths. */
function toHex(rgb: string | undefined): string {
  const parts = (rgb || '').match(/\d+/g) || []
  return '#' + parts.slice(0, 3).map((part) => Number(part).toString(16).padStart(2, '0')).join('')
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

/* ------------------------------ a template in the school's colours and fonts */

test('a template lands in the school’s colours, at the template’s own alphas', async ({ page }) => {
  await addBrandColor(page, '#0F7A6E')
  await addBrandColor(page, '#E4572E')
  await pickTemplate(page, FIELD_DAY)

  const paints = await svgPaints(page)
  // The poster says its navy is the primary and its gold the secondary, so the
  // school's first colour goes wherever the navy was and its second where the
  // gold was — no counting, no guessing.
  expect(paints).toContain('#0f7a6eff')
  expect(paints).toContain('#e4572eff')
  // Including the 7% wash behind the details, which stays a 7% wash.
  expect(paints).toContain('#0f7a6e12')
  expect(paints.join(' ')).not.toContain('1e3a5f')
  expect(paints.join(' ')).not.toContain('e1a731')

  // Text painted the navy follows it too.
  const faces = await textFaces(page)
  expect(faces.find((face) => face.text.startsWith('Friday'))?.color).toBe('rgb(15, 122, 110)')
  // The paper and the ink are neutrals, which a kit says nothing about.
  expect(await page.locator('#page-design-canvas').evaluate((el) => getComputedStyle(el).backgroundColor)).toBe('rgb(251, 247, 239)')
  expect(faces.find((face) => face.text.startsWith('Grades'))?.color).toBe('rgb(34, 37, 42)')
})

test('with no colours in the kit, a template lands in its own', async ({ page }) => {
  await pickTemplate(page, FIELD_DAY)

  const paints = await svgPaints(page)
  expect(paints).toContain('#1e3a5fff')
  expect(paints).toContain('#e1a731ff')
  expect(paints).toContain('#1e3a5f12')
})

test('a template lands in the school’s fonts, headings and body apart', async ({ page }) => {
  await setBrandFont(page, 'heading', 'Playfair Display')
  await setBrandFont(page, 'body', 'Karla')
  await pickTemplate(page, FIELD_DAY)

  const faces = await textFaces(page)
  expect(faces.find((face) => face.text.startsWith('FIELD DAY'))?.font).toBe('Playfair Display')
  expect(faces.find((face) => face.text.startsWith('Friday'))?.font).toBe('Playfair Display')
  expect(faces.find((face) => face.text.startsWith('Grades'))?.font).toBe('Karla')
  expect(faces.find((face) => face.text.startsWith('Sunscreen'))?.font).toBe('Karla')
})

test('a text box that asks to keep its face keeps it', async ({ page }) => {
  await serveTemplate(page, (detail) => {
    const pages = JSON.parse(detail.data)
    pages[0].layers.find((layer: any) => (layer.text || '').includes('FIELD DAY')).brandRole = 'keep'
    detail.data = JSON.stringify(pages)
  })
  await setBrandFont(page, 'heading', 'Playfair Display')
  await setBrandFont(page, 'body', 'Karla')
  await pickTemplate(page, FIELD_DAY)

  const faces = await textFaces(page)
  // The title is the artwork, so it is left in the face it was drawn in; the
  // heading beneath it, which said nothing, still follows the kit.
  expect(faces.find((face) => face.text.startsWith('FIELD DAY'))?.font).toBe('Anton')
  expect(faces.find((face) => face.text.startsWith('Friday'))?.font).toBe('Playfair Display')
})

test('a template that would rather keep its palette keeps it, and still fills', async ({ page }) => {
  await serveTemplate(page, (detail) => {
    detail.brand.keep = true
  })
  await setSchoolName(page, 'Oakridge Primary')
  await addBrandColor(page, '#0F7A6E')
  await setBrandFont(page, 'heading', 'Playfair Display')
  await pickTemplate(page, FIELD_DAY)

  const paints = await svgPaints(page)
  expect(paints).toContain('#1e3a5fff')
  expect(paints).toContain('#e1a731ff')
  const faces = await textFaces(page)
  expect(faces.find((face) => face.text.startsWith('FIELD DAY'))?.font).toBe('Anton')
  // Only the palette and the lettering are the template's own; the name is the
  // school's either way.
  expect(faces.map((face) => face.text)).toContain('OAKRIDGE PRIMARY')
})

test('undo after adding a recoloured template takes the whole template off', async ({ page }) => {
  await addBrandColor(page, '#0F7A6E')
  await pickTemplate(page, FIELD_DAY)
  expect(await widgetCount(page)).toBeGreaterThan(10)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(900)
  // One entry, not two: the recolour is part of adding the template rather
  // than a step of its own to be peeled off first.
  expect(await widgetCount(page)).toBe(0)
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

/* --------------------------------------------------- readable whatever the kit */

/**
 * The pale yellow below is the case the guard exists for: a perfectly ordinary
 * school colour that happens to be lighter than the white the poster's headline
 * is set in and darker than the cream it is printed on.
 */
const PALE = '#F2E38A'
const DARK = '#123A6B'

test('the contrast maths gives WCAG’s own numbers', async ({ page }) => {
  expect(await contrastIn(page, '#ffffff', '#000000')).toBeCloseTo(21, 2)
  expect(await contrastIn(page, '#767676', '#ffffff')).toBeCloseTo(4.54, 1)
  expect(await contrastIn(page, '#1e3a5f', '#1e3a5f')).toBeCloseTo(1, 5)
})

test('a pale primary does not leave a white headline on a pale band', async ({ page }) => {
  await addBrandColor(page, PALE)
  await pickTemplate(page, FIELD_DAY)

  // The band is the kit's colour, as it should be; the headline on it is no
  // longer white, because white on that band is nothing at all.
  expect(await svgPaints(page)).toContain('#f2e38aff')
  const headline = await faceColor(page, 'FIELD DAY')
  expect(headline).not.toBe('rgb(255, 255, 255)')
  // It takes the ink the poster already sets its body copy in, not black.
  expect(headline).toBe('rgb(34, 37, 42)')
  expect(await contrastIn(page, toHex(headline), '#f2e38a')).toBeGreaterThan(4.5)

  // And the footer band, which is the same shape of problem lower down.
  expect(await faceColor(page, 'SPRINGFIELD')).toBe('rgb(34, 37, 42)')
})

test('a pale primary darkens a heading set in it rather than losing it on the paper', async ({ page }) => {
  await addBrandColor(page, PALE)
  await pickTemplate(page, FIELD_DAY)

  // "Friday, May 15" is painted in the template's navy, which is the primary,
  // so it becomes the kit's colour — then as much darker as it takes to be
  // read on cream, and no darker.
  const heading = toHex(await faceColor(page, 'Friday'))
  expect(heading).not.toBe('#f2e38a')
  expect(await contrastIn(page, heading, '#fbf7ef')).toBeGreaterThanOrEqual(3)
  // Still the same colour, though: a gold darkened, not a grey.
  const [r, g, b] = (heading.match(/[0-9a-f]{2}/g) || []).map((part) => parseInt(part, 16))
  expect(Math.min(r, g)).toBeGreaterThan(b + 40)
})

test('a dark primary leaves the white headline white', async ({ page }) => {
  await addBrandColor(page, DARK)
  await pickTemplate(page, FIELD_DAY)

  expect(await svgPaints(page)).toContain('#123a6bff')
  // Nothing to repair: white on a dark band is what the poster was drawn as.
  expect(await faceColor(page, 'FIELD DAY')).toBe('rgb(255, 255, 255)')
  expect(await faceColor(page, 'SPRINGFIELD')).toBe('rgb(255, 255, 255)')
  expect(await faceColor(page, 'Friday')).toBe('rgb(18, 58, 107)')
})

test('apply brand repairs the same design, and says that it did', async ({ page }) => {
  // The retrofit route: the poster lands in its own navy, and the kit arrives
  // afterwards, so Apply brand has to rank the colours and then repair.
  await pickTemplate(page, FIELD_DAY)
  expect(await faceColor(page, 'FIELD DAY')).toBe('rgb(255, 255, 255)')

  await addBrandColor(page, PALE)
  await page.locator('.brand-card__apply').click()
  await page.waitForTimeout(600)
  await page.locator('.ds-apply-brand .el-button--primary').click()
  await page.waitForTimeout(1500)

  await expect(page.locator('.el-notification')).toContainText('adjusted to stay readable')
  expect(await faceColor(page, 'FIELD DAY')).toBe('rgb(34, 37, 42)')
  expect(await contrastIn(page, toHex(await faceColor(page, 'Friday')), '#fbf7ef')).toBeGreaterThanOrEqual(3)

  // Still one entry: the repair is part of applying the brand, not a step of
  // its own to be peeled off first.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(1000)
  expect(await faceColor(page, 'FIELD DAY')).toBe('rgb(255, 255, 255)')
})

test('the panel says a pale colour cannot be read on paper', async ({ page }) => {
  await addBrandColor(page, PALE)

  // Two marks on the row: the colour as words on paper, and the better of
  // white and ink on the colour as a band.
  await expect(page.locator('.brand-swatch__mark')).toHaveCount(2)
  await expect(page.locator('.brand-swatch__reads')).toHaveAttribute('title', /As text on white: 1\.3:1/)

  await page.locator('.brand-swatch__edit').first().click()
  await page.waitForTimeout(400)
  await expect(page.locator('.brand-editor__reads')).toHaveText('Reads on white at 1.3:1 — lighter text will be darkened on posters.')

  // A colour that passes gets the plain version of the same line.
  await page.locator('.brand-editor__hex input').fill(DARK)
  await page.waitForTimeout(400)
  await expect(page.locator('.brand-editor__reads')).toContainText('White reads on it at')
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
  await page.locator('#style-panel .font-select .real-input').click()
  await page.waitForTimeout(700)

  // First group in the list, so the school's own fonts are one click away
  // rather than found by remembering which category the family belongs to.
  const groups = page.locator('.el-popper:visible .select-list__group')
  await expect(groups.first().locator('.select-list__name')).toHaveText('Brand')
  await expect(groups.first().locator('li')).toHaveText(['Bebas Neue'])
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
