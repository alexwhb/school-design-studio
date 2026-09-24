import { expect, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { addFlatImage, addText, downloadFrom, openEditor } from './helpers'

/** The PDF text-string form a description is written in: UTF-16BE, as hex. */
function pdfHex(value: string): string {
  let hex = 'FEFF'
  for (const character of value) hex += (character.codePointAt(0) as number).toString(16).padStart(4, '0')
  return `<${hex.toUpperCase()}>`
}

async function selectImage(page: Page) {
  const image = page.locator('#page-design-canvas .w-image').first()
  await image.click()
  await page.waitForTimeout(300)
}

async function describe(page: Page, words: string) {
  const field = page.locator('#style-panel').getByRole('textbox', { name: 'Alt text' })
  await field.fill(words)
  await field.blur()
  await page.waitForTimeout(300)
}

async function exportAs(page: Page, kind: 'PowerPoint' | 'PDF') {
  await page.locator('.export-caret').click()
  await page.waitForTimeout(400)
  return downloadFrom(page, () => page.locator('.export-menu__list').getByText(kind, { exact: true }).click())
}

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('a photo’s alt text is on the canvas, in the PowerPoint and in the PDF', async ({ page }) => {
  await addFlatImage(page)
  await selectImage(page)
  const words = 'Grey card (a test) & "nothing" else'
  await describe(page, words)

  // On the canvas, as the img's alt, escaped by the browser like any attribute.
  await expect(page.locator('#page-design-canvas .w-image img.target')).toHaveAttribute('alt', words)

  const pptx = await exportAs(page, 'PowerPoint')
  const slide = await (await JSZip.loadAsync(pptx.bytes)).file('ppt/slides/slide1.xml')!.async('string')
  expect(slide).toContain('descr="Grey card (a test) &amp; &quot;nothing&quot; else"')
  expect(slide).not.toContain('preencoded.png')

  await page
    .locator('.ds-download-progress .backstage')
    .click({ timeout: 5000 })
    .catch(() => {})
  const pdf = (await exportAs(page, 'PDF')).bytes.toString('latin1')
  expect(pdf).toContain(`/Alt ${pdfHex(words)}`)
  expect(pdf).toContain('/StructTreeRoot')
  expect(pdf).toContain('/Lang ')
})

test('decorative is said the way PowerPoint says it, and nothing is written for it', async ({ page }) => {
  await addFlatImage(page)
  await selectImage(page)
  await describe(page, 'Something')
  await page.locator('#style-panel .alt-text__decorative').click()
  await page.waitForTimeout(300)
  await expect(page.locator('#style-panel').getByRole('textbox', { name: 'Alt text' })).toBeDisabled()
  await expect(page.locator('#page-design-canvas .w-image img.target')).toHaveAttribute('alt', '')

  const pptx = await exportAs(page, 'PowerPoint')
  const slide = await (await JSZip.loadAsync(pptx.bytes)).file('ppt/slides/slide1.xml')!.async('string')
  expect(slide).toContain('<adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/>')
  expect(slide).not.toContain('descr="Something"')
})

test('the PDF carries the page’s words as text', async ({ page }) => {
  await addText(page, 'Heading')
  const pdf = (await exportAs(page, 'PDF')).bytes.toString('latin1')
  // Invisible text over the picture, tagged as a heading.
  expect(pdf).toContain('3 Tr')
  expect(pdf).toMatch(/\/S \/(H1|P)/)
})

test('undo takes a description back', async ({ page }) => {
  await addFlatImage(page)
  await selectImage(page)
  await describe(page, 'First try')
  await page.locator('#page-design-canvas').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+z' : 'Control+z')
  await page.waitForTimeout(300)
  await expect(page.locator('#page-design-canvas .w-image img.target')).toHaveAttribute('alt', '')
})
