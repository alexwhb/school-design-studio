import { expect, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { WIDGET, openEditor, openFindReplace } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

const CELL = `${WIDGET}.w-table td`

/** Puts a table on the page from the Tools panel, which is how it is first found. */
async function addTable(page: Page) {
  await page.locator('#widget-panel .classify-item', { hasText: 'Tools' }).click()
  await page.waitForTimeout(300)
  await page.locator('.tools-list-wrap .item', { hasText: 'Table' }).click()
  await page.waitForTimeout(600)
}

/** What every cell reads as, row by row. */
async function cellTexts(page: Page) {
  return page.evaluate((selector) => [...document.querySelectorAll(selector)].map((td) => (td as HTMLElement).innerText.trim()), CELL)
}

/** Opens a cell for typing, the way a person does: a double-click on it. */
async function editCell(page: Page, index: number) {
  await page.locator(CELL).nth(index).dblclick()
  await page.waitForTimeout(300)
}

/** The bytes of whatever the next click downloads. */
async function downloadFrom(page: Page, click: () => Promise<void>) {
  const download = page.waitForEvent('download', { timeout: 90000 })
  await click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk as Buffer)
  return { name: file.suggestedFilename(), bytes: Buffer.concat(chunks) }
}

test('the Tools panel places a three by three table', async ({ page }) => {
  await addTable(page)
  await expect(page.locator(WIDGET)).toHaveCount(1)
  await expect(page.locator(WIDGET).first()).toHaveAttribute('data-type', 'w-table')
  await expect(page.locator(CELL)).toHaveCount(9)
  // Its height is what the rows come to, not a number anyone typed.
  const height = await page.locator(WIDGET).first().evaluate((el) => parseFloat((el as HTMLElement).style.height))
  expect(height).toBeGreaterThan(60)
})

test('a cell is typed into in place, and Tab moves to the next one', async ({ page }) => {
  await addTable(page)
  await editCell(page, 0)
  await expect(page.locator(CELL).nth(0).locator('[contenteditable]')).toHaveCount(1)

  await page.keyboard.type('Monday')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(200)
  // The caret is now in the second cell, and the first has been written.
  await expect(page.locator(CELL).nth(1).locator('[contenteditable]')).toHaveCount(1)
  await page.keyboard.type('Tuesday')
  await page.keyboard.press('Shift+Tab')
  await page.waitForTimeout(200)
  await expect(page.locator(CELL).nth(0).locator('[contenteditable]')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  const texts = await cellTexts(page)
  expect(texts.slice(0, 2)).toEqual(['Monday', 'Tuesday'])
  // Escape ended the edit and left the table selected, not the page.
  await expect(page.locator(`${CELL} [contenteditable]`)).toHaveCount(0)
  // A Backspace typed into a cell was a Backspace, not "delete this table".
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('Enter goes down a row, and Tab off the last cell adds one', async ({ page }) => {
  await addTable(page)
  await editCell(page, 0)
  await page.keyboard.type('Top')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(200)
  await expect(page.locator(CELL).nth(3).locator('[contenteditable]')).toHaveCount(1)
  await page.keyboard.type('Under')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  await editCell(page, 8)
  await page.keyboard.type('Last')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(300)
  await expect(page.locator(CELL)).toHaveCount(12)
  await expect(page.locator(CELL).nth(9).locator('[contenteditable]')).toHaveCount(1)
  await page.keyboard.press('Escape')

  const texts = await cellTexts(page)
  expect(texts[0]).toBe('Top')
  expect(texts[3]).toBe('Under')
  expect(texts[8]).toBe('Last')
})

test('rows and columns are added and removed from the panel', async ({ page }) => {
  await addTable(page)
  const panel = page.locator('#style-panel')
  await expect(panel.locator('.table-shape__count')).toHaveText('3 rows × 3 columns')

  await panel.getByRole('button', { name: 'Add row' }).click()
  await page.waitForTimeout(200)
  await panel.getByRole('button', { name: 'Add column' }).click()
  await page.waitForTimeout(200)
  await expect(panel.locator('.table-shape__count')).toHaveText('4 rows × 4 columns')
  await expect(page.locator(CELL)).toHaveCount(16)
  // The new column took an even share and the rest gave it up: four columns
  // of a quarter each.
  const widths = await page.evaluate(() => [...document.querySelectorAll('#page-design-canvas .w-table col')].map((col) => (col as HTMLElement).style.width))
  expect(widths).toEqual(['25%', '25%', '25%', '25%'])

  await panel.getByRole('button', { name: 'Remove row' }).click()
  await page.waitForTimeout(200)
  await panel.getByRole('button', { name: 'Remove column' }).click()
  await page.waitForTimeout(200)
  await expect(page.locator(CELL)).toHaveCount(9)

  // Ctrl+Z takes the last one back.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  await expect(page.locator(CELL)).toHaveCount(12)
})

test('a right-click on a cell offers rows and columns at that cell', async ({ page }) => {
  await addTable(page)
  await editCell(page, 4)
  await page.keyboard.type('Middle')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(200)

  await page.locator(CELL).nth(4).click({ button: 'right' })
  await page.waitForTimeout(300)
  await expect(page.locator('.w-table__menu')).toBeVisible()
  await page.locator('.w-table__menu li', { hasText: 'Insert row above' }).click()
  await page.waitForTimeout(300)
  await expect(page.locator(CELL)).toHaveCount(12)
  const texts = await cellTexts(page)
  // The middle cell moved down a row; the new row above it is empty.
  expect(texts[7]).toBe('Middle')
  expect(texts.slice(3, 6)).toEqual(['', '', ''])
})

test('a column divider is dragged to trade width between its neighbours', async ({ page }) => {
  await addTable(page)
  const divider = page.locator('#page-design-canvas .w-table__divider').first()
  await expect(divider).toHaveCount(1)
  const grip = (await divider.boundingBox())!
  const x = grip.x + grip.width / 2
  const y = grip.y + grip.height / 2
  await page.mouse.move(x, y)
  await page.mouse.down()
  for (let step = 1; step <= 8; step++) await page.mouse.move(x + step * 10, y)
  await page.mouse.up()
  await page.waitForTimeout(300)

  const widths = await page.evaluate(() => [...document.querySelectorAll('#page-design-canvas .w-table col')].map((col) => parseFloat((col as HTMLElement).style.width)))
  expect(widths[0]).toBeGreaterThan(34)
  expect(widths[1]).toBeLessThan(33)
  // The column on the far side of the pair did not move.
  expect(Math.round(widths[2] * 10) / 10).toBeCloseTo(33.3, 0)
  // And the width is a whole of the table, however it is split.
  expect(widths.reduce((sum, w) => sum + w, 0)).toBeCloseTo(100, 1)

  // A drag is one undo step.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  const back = await page.evaluate(() => [...document.querySelectorAll('#page-design-canvas .w-table col')].map((col) => (col as HTMLElement).style.width))
  expect(back.every((w) => w.startsWith('33.33'))).toBe(true)
})

test('find and replace reaches inside the cells', async ({ page }) => {
  await addTable(page)
  await editCell(page, 1)
  await page.keyboard.type('Sports Day 14 June')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  await openFindReplace(page)
  await page.locator('#find-replace-find').fill('14 June')
  await page.waitForTimeout(400)
  await expect(page.locator('.ds-find-replace .tally')).toContainText('1 match')
  await page.locator('#find-replace-with').fill('21 June')
  await page.getByRole('button', { name: 'Replace all' }).click()
  await page.waitForTimeout(600)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  const texts = await cellTexts(page)
  expect(texts[1]).toBe('Sports Day 21 June')
})

test('the image export paints the table, heading fill and all', async ({ page }) => {
  await addTable(page)
  const box = await page.locator(WIDGET).first().evaluate((el) => ({
    left: parseFloat((el as HTMLElement).style.left),
    top: parseFloat((el as HTMLElement).style.top),
    width: parseFloat((el as HTMLElement).style.width),
  }))
  const { bytes } = await downloadFrom(page, () => page.getByRole('button', { name: 'Export' }).click())
  const pixel = await page.evaluate(
    async ([data, x, y]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + data
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const [r, g, b] = Array.from(ctx.getImageData(x as number, y as number, 1, 1).data)
      return { r, g, b }
    },
    [bytes.toString('base64'), Math.round(box.left + box.width / 2), Math.round(box.top + 12)] as const,
  )
  // The heading row's blue (#2b5797), give or take a JPEG-free pixel.
  expect(pixel.b).toBeGreaterThan(pixel.r + 60)
  expect(pixel).toEqual({ r: 43, g: 87, b: 151 })
})

test('the PowerPoint export writes a real table with the words in it', async ({ page }) => {
  await addTable(page)
  await editCell(page, 0)
  await page.keyboard.type('Term dates')
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  await page.locator('.export-caret').click()
  await page.waitForTimeout(400)
  const { name, bytes } = await downloadFrom(page, () => page.locator('.export-menu__list').getByText('PowerPoint', { exact: true }).click())
  expect(name).toMatch(/\.pptx$/)

  const zip = await JSZip.loadAsync(bytes)
  const slide = await zip.file('ppt/slides/slide1.xml')!.async('string')
  expect(slide).toContain('<a:tbl>')
  expect(slide).toContain('Term dates')
  // Three columns, three rows.
  expect((slide.match(/<a:gridCol /g) || []).length).toBe(3)
  expect((slide.match(/<a:tr /g) || []).length).toBe(3)
})
