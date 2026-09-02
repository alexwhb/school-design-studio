import { expect, test, type Page } from '@playwright/test'
import { addPage, addText, collapsePageStrip, expandPageStrip, goToPage, openEditor, setWidgetText, widgetText } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

const DIALOG = '.ds-bulk-documents'

const THREE_PEOPLE = 'Name,Grade\nAda Lovelace,Year 6\nGrace Hopper,Year 5\nKatherine Johnson,Year 4'

/** Through the File menu, which works whatever is selected. */
async function openBulkDocuments(page: Page) {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(300)
  await page.getByText('Make one for each person…', { exact: true }).click()
  await page.waitForTimeout(600)
}

async function pasteList(page: Page, list: string) {
  await page.locator('#bulk-list').fill(list)
  await page.waitForTimeout(300)
}

async function next(page: Page) {
  await page.locator(DIALOG).getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForTimeout(400)
}

/** A certificate in miniature: one text box asking for a name and a grade. */
async function certificateTemplate(page: Page, text = '{{Name}} — {{Grade}}') {
  await addText(page, 'Heading')
  await setWidgetText(page, text)
}

/** The bytes of a download, for parsing in the test. */
async function bytesOf(file: import('@playwright/test').Download) {
  const body = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of body!) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

test('adds a filled page per person, named after them, and one undo takes them all back', async ({ page }) => {
  await certificateTemplate(page)
  await openBulkDocuments(page)
  await pasteList(page, THREE_PEOPLE)
  await expect(page.locator(`${DIALOG} .people-count`)).toHaveText('3 people')
  await expect(page.locator(`${DIALOG} .header-toggle`)).toHaveClass(/is-checked/)

  await next(page)
  await expect(page.locator(`${DIALOG} .field-row`)).toHaveCount(2)
  await expect(page.locator(`${DIALOG} .field-row.is-unmatched`)).toHaveCount(0)

  await next(page)
  await expect(page.locator(`${DIALOG} .summary`)).toContainText('3 people × 1 page = 3 pages')
  await page.locator(DIALOG).getByRole('button', { name: 'Add pages', exact: true }).click()
  await page.waitForTimeout(900)

  await expect(page.locator('.el-notification__title')).toHaveText('Pages added')
  await expandPageStrip(page)
  await expect(page.locator('.artboards .page')).toHaveCount(4)
  await expect(page.locator('.artboards .page__name').nth(1)).toHaveText('Ada Lovelace')
  await expect(page.locator('.artboards .page__name').nth(3)).toHaveText('Katherine Johnson')

  // The first copy is the page on screen, filled in.
  expect(await widgetText(page)).toBe('Ada Lovelace — Year 6')
  await goToPage(page, 2)
  expect(await widgetText(page)).toBe('Grace Hopper — Year 5')
  // And the template still asks for its fields.
  await goToPage(page, 0)
  expect(await widgetText(page)).toBe('{{Name}} — {{Grade}}')

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(1000)
  await expect(page.locator('.artboards .page')).toHaveCount(1)
  expect(await widgetText(page)).toBe('{{Name}} — {{Grade}}')
})

test('downloads a PDF with one page per person without adding pages to the design', async ({ page }) => {
  await certificateTemplate(page)
  await openBulkDocuments(page)
  await pasteList(page, THREE_PEOPLE)
  await next(page)
  await next(page)

  await page.locator(`${DIALOG} .choice`, { hasText: 'Download a PDF' }).click()
  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.locator(DIALOG).getByRole('button', { name: 'Download PDF', exact: true }).click()
  const file = await download

  expect(file.suggestedFilename()).toMatch(/ – 3 copies\.pdf$/)
  const bytes = await bytesOf(file)
  expect(bytes.subarray(0, 5).toString()).toBe('%PDF-')
  const text = bytes.toString('latin1')
  expect((text.match(/\/Type \/Page[^s]/g) || []).length).toBe(3)

  await expect(page.locator('.el-notification__title')).toHaveText('PDF downloaded')
  await expandPageStrip(page)
  await expect(page.locator('.artboards .page')).toHaveCount(1)
  await expect(page.locator('.artboards .page__name').first()).toHaveText('Page 1')
  expect(await widgetText(page), 'the template is untouched').toBe('{{Name}} — {{Grade}}')
})

test('a list with no header row is read as people from the first line', async ({ page }) => {
  await certificateTemplate(page)
  await openBulkDocuments(page)
  await pasteList(page, 'Ada Lovelace\nGrace Hopper\nKatherine Johnson')
  await expect(page.locator(`${DIALOG} .header-toggle`)).not.toHaveClass(/is-checked/)
  await expect(page.locator(`${DIALOG} .people-count`)).toHaveText('3 people')
  await expect(page.locator(`${DIALOG} .preview th`).first()).toHaveText('Column 1')

  // The guess can be overruled.
  await page.locator(`${DIALOG} .header-toggle`).click()
  await page.waitForTimeout(200)
  await expect(page.locator(`${DIALOG} .people-count`)).toHaveText('2 people')
  await expect(page.locator(`${DIALOG} .preview th`).first()).toHaveText('Ada Lovelace')
})

test('a field the list has no column for is flagged', async ({ page }) => {
  await certificateTemplate(page, '{{Name}} of {{House}}')
  await openBulkDocuments(page)
  await pasteList(page, THREE_PEOPLE)
  await next(page)

  const flagged = page.locator(`${DIALOG} .field-row.is-unmatched`)
  await expect(flagged).toHaveCount(1)
  await expect(flagged).toContainText('{{House}}')
  await expect(flagged).toContainText('left as typed')
})

test('a list that would take the design past its page limit is steered to the PDF', async ({ page }) => {
  await certificateTemplate(page)
  await openBulkDocuments(page)
  const rows = Array.from({ length: 51 }, (_, i) => `Person ${i + 1},Year ${(i % 6) + 1}`)
  await pasteList(page, ['Name,Grade', ...rows].join('\n'))
  await expect(page.locator(`${DIALOG} .people-count`)).toHaveText('51 people')
  await next(page)
  await next(page)

  // Opens on the PDF, since the other choice cannot be made; picking it says why.
  await expect(page.locator(`${DIALOG} .choice.is-on`)).toContainText('Download a PDF')
  await page.locator(`${DIALOG} .choice`, { hasText: 'Add pages' }).click()
  await expect(page.locator(`${DIALOG} .cap-note`)).toContainText('a design can hold 50')
  await expect(page.locator(DIALOG).getByRole('button', { name: 'Add pages', exact: true })).toBeDisabled()
})

test('school fields are filled by the brand kit, not matched to a column', async ({ page }) => {
  await certificateTemplate(page, '{{school.name}} presents {{Name}}')
  await openBulkDocuments(page)
  await pasteList(page, THREE_PEOPLE)
  await next(page)

  await expect(page.locator(`${DIALOG} .field-row`)).toHaveCount(1)
  await expect(page.locator(`${DIALOG} .field-row`)).toContainText('{{Name}}')
  await expect(page.locator(`${DIALOG} .reserved`)).toContainText('{{school.name}}')
})

test('clicking a column adds its field to the selected text box, or a new one', async ({ page }) => {
  await addText(page, 'Heading')
  await setWidgetText(page, 'Awarded to')
  await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)

  await openBulkDocuments(page)
  await pasteList(page, THREE_PEOPLE)
  await next(page)
  await page.locator(`${DIALOG} .chip`, { hasText: '{{Name}}' }).click()
  await page.waitForTimeout(400)
  expect(await widgetText(page)).toBe('Awarded to {{Name}}')
  await expect(page.locator(`${DIALOG} .field-row`)).toHaveCount(1)
})

test('All pages copies every page per person and can take the template pages out, still as one undo', async ({ page }) => {
  // A two-page document: the name on the first page, the grade on the second.
  await certificateTemplate(page, '{{Name}}')
  await expandPageStrip(page)
  await addPage(page)
  await addText(page, 'Heading')
  await setWidgetText(page, '{{Grade}}')
  await goToPage(page, 0)
  await collapsePageStrip(page)

  await openBulkDocuments(page)
  await pasteList(page, THREE_PEOPLE)
  await next(page)
  await next(page)
  await page.locator(`${DIALOG} .scope`, { hasText: 'All 2 pages' }).click()
  await expect(page.locator(`${DIALOG} .summary`)).toContainText('3 people × 2 pages = 6 pages')
  await page.locator(`${DIALOG} .remove-toggle`).click()
  await page.locator(DIALOG).getByRole('button', { name: 'Add pages', exact: true }).click()
  await page.waitForTimeout(900)

  await expandPageStrip(page)
  await expect(page.locator('.artboards .page')).toHaveCount(6)
  const names = page.locator('.artboards .page__name')
  await expect(names.nth(0)).toHaveText('Ada Lovelace')
  await expect(names.nth(1)).toHaveText('Ada Lovelace')
  await expect(names.nth(2)).toHaveText('Grace Hopper')
  await expect(names.nth(5)).toHaveText('Katherine Johnson')
  expect(await widgetText(page)).toBe('Ada Lovelace')
  await goToPage(page, 1)
  expect(await widgetText(page)).toBe('Year 6')
  await goToPage(page, 4)
  expect(await widgetText(page)).toBe('Katherine Johnson')

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(1000)
  await expect(page.locator('.artboards .page')).toHaveCount(2)
  await expect(names.nth(0)).toHaveText('Page 1')
})
