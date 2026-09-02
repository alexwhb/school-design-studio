import { expect, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { WIDGET, addText, drawnSelectionBoxes, openEditor, openFindReplace, selectFirstWidget } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

const EDITING = `${WIDGET} .w-text.editing .edit-text, ${WIDGET}.editing .edit-text`

/**
 * Puts the caret in the first text box. Nothing is left selected first: a line
 * of body text is barely taller than the selection box's own handles, and one
 * of them would take the press instead.
 */
async function enterBox(page: Page) {
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(200)
  await page.locator(WIDGET).first().dblclick()
  await page.waitForTimeout(400)
}

/** Puts the caret in the first text box and replaces what it says. */
async function startTyping(page: Page, text: string) {
  await enterBox(page)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type(text)
  await page.waitForTimeout(200)
}

/** Selects one word of the box being edited, the way a double-click on it would. */
async function selectWord(page: Page, word: string) {
  await page.evaluate(
    ([selector, w]) => {
      const host = document.querySelector(selector as string)
      if (!host) throw new Error('no box is being edited')
      const walker = document.createTreeWalker(host, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const at = node.textContent!.indexOf(w as string)
        if (at < 0) continue
        const range = document.createRange()
        range.setStart(node, at)
        range.setEnd(node, at + (w as string).length)
        const selection = getSelection()!
        selection.removeAllRanges()
        selection.addRange(range)
        return
      }
      throw new Error(`the box does not say ${w}`)
    },
    [EDITING, word] as const,
  )
  await page.waitForTimeout(300)
}

/** Clicks off the box, which is what stores what was typed. */
async function clickAway(page: Page) {
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(500)
}

function markup(page: Page) {
  return page.locator(`${WIDGET} .edit-text`).first().innerHTML()
}

const TOOLBAR = '.inline-toolbar'

/**
 * Body text throughout: it is the regular-weight preset. A heading is bold all
 * over, and inside one Bold means the box — see boxHas in inlineFormat.ts.
 */

test('Ctrl+B bolds the word that is selected and nothing else', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day 14 June')
  await selectWord(page, 'June')
  await page.keyboard.press('ControlOrMeta+b')
  await page.waitForTimeout(200)
  await clickAway(page)

  expect(await markup(page)).toBe('Sports Day 14 <b>June</b>')
  // The box itself is still regular weight: the word carries the bold.
  const weight = await page.evaluate((s) => (document.querySelector(s) as HTMLElement).style.fontWeight, WIDGET)
  expect(weight).not.toBe('bold')
})

test('the floating bar colours a word and the panel swatch shows that colour', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day 14 June')
  await selectWord(page, 'Day')
  await expect(page.locator(TOOLBAR)).toBeVisible()

  await page.locator(`${TOOLBAR} .color__field`).click()
  await page.waitForTimeout(600)
  // The hex field commits on blur, not on Enter.
  const hex = page.locator('.color-picker:visible .input').first()
  await hex.fill('#FF0000FF')
  await hex.blur()
  await page.waitForTimeout(600)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Still editing: colouring a word is not leaving the box.
  await expect(page.locator(`${WIDGET}.editing`)).toHaveCount(1)
  await expect(page.locator('#w-text-style .color__value').first()).toHaveText('#FF0000')
  await clickAway(page)
  expect(await markup(page)).toBe('Sports <span style="color:#ff0000">Day</span> 14 June')
})

test('the panel buttons style the selection while there is one, and say so', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day 14 June')
  await expect(page.locator('#w-text-style .inline-scope')).toContainText('whole box')
  await selectWord(page, 'Sports')
  await expect(page.locator('#w-text-style .inline-scope')).toContainText('selected text')

  // Italic is the second style button.
  await page.locator('#w-text-style .list-item').nth(1).click()
  await page.waitForTimeout(300)
  await expect(page.locator('#w-text-style .list-item').nth(1)).toHaveClass(/active/)
  await clickAway(page)
  expect(await markup(page)).toBe('<i>Sports</i> Day 14 June')
  const style = await page.evaluate((s) => (document.querySelector(s) as HTMLElement).style.fontStyle, WIDGET)
  expect(style, 'the box is not italic, the word is').not.toBe('italic')
})

test('a link goes on through the bar and is stored as a real href', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Book by 14 June')
  await selectWord(page, 'Book')
  await page.locator(`${TOOLBAR} [aria-label="Link"]`).click()
  await page.waitForTimeout(400)
  await page.locator('.inline-link__url').fill('school.org/trips')
  await page.getByRole('button', { name: 'Add link' }).click()
  await page.waitForTimeout(400)
  await clickAway(page)

  expect(await markup(page)).toBe('<a href="https://school.org/trips">Book</a> by 14 June')
  // On the canvas a link is not followed.
  await selectFirstWidget(page)
  expect(page.url()).toContain('/home')
})

test('undo takes the bold back off', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day 14 June')
  await clickAway(page)
  await startTyping(page, 'Sports Day 14 June')
  await selectWord(page, 'June')
  await page.keyboard.press('ControlOrMeta+b')
  await clickAway(page)
  expect(await markup(page)).toContain('<b>June</b>')

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(800)
  expect(await markup(page)).toBe('Sports Day 14 June')
})

test('Escape and Delete stay with the text while it is being typed', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day')
  await page.keyboard.press('Backspace')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Delete')
  await expect(page.locator(WIDGET), 'the box is still on the page').toHaveCount(1)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  await expect(page.locator(`${WIDGET}.editing`)).toHaveCount(0)
  expect(await markup(page)).toBe('Sports D')
  // One step back, not two: the box you were typing into is the box you now
  // have selected.
  expect(await drawnSelectionBoxes(page)).toBe(1)
})

test('find and replace works across a word that is half bold', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day 14 June')
  await selectWord(page, '14')
  await page.keyboard.press('ControlOrMeta+b')
  await clickAway(page)
  expect(await markup(page)).toBe('Sports Day <b>14</b> June')

  await openFindReplace(page)
  await page.locator('#find-replace-find').fill('14 June')
  await page.locator('#find-replace-with').fill('21 June')
  await page.waitForTimeout(300)
  await page.getByRole('button', { name: 'Replace all' }).click()
  await page.waitForTimeout(700)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(400)
  expect(await markup(page)).toBe('Sports Day <b>21 June</b>')
})

/** Pastes into the box being edited, as the clipboard would. */
async function pasteInto(page: Page, html: string, plain: string) {
  await page.evaluate(
    ([selector, richText, plainText]) => {
      const host = document.querySelector(selector) as HTMLElement
      const data = new DataTransfer()
      data.setData('text/html', richText)
      data.setData('text/plain', plainText)
      host.dispatchEvent(new ClipboardEvent('paste', { clipboardData: data, bubbles: true, cancelable: true }))
    },
    [EDITING, html, plain] as const,
  )
  await page.waitForTimeout(300)
}

test('a paste from elsewhere brings its words and leaves its fonts behind', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, '')
  await pasteInto(page, '<span style="font-family: Comic Sans MS; font-size: 40px"><b>Bake</b> sale</span>', 'Bake sale')
  await clickAway(page)
  expect(await markup(page)).toBe('Bake sale')
})

test('a paste from another of these boxes keeps its formatting and nothing else', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, '')
  // The marker is what a copy out of one of these boxes carries; the rest is
  // what a stylesheet, a class and a script look like on the way in.
  await pasteInto(
    page,
    '<!--ds-text--><span style="font-family: Papyrus; color: rgb(0, 128, 0)">Bake</span> <strong class="x">sale</strong><style>b{color:red}</style><script>1</script>',
    'Bake sale',
  )
  await clickAway(page)
  expect(await markup(page)).toBe('<span style="color:#008000">Bake</span> <b>sale</b>')
})

test('inside a box that is bold all over, Bold means the box', async ({ page }) => {
  await addText(page, 'Heading')
  await startTyping(page, 'Sports Day 14 June')
  await selectWord(page, 'June')
  await expect(page.locator(`${TOOLBAR} [aria-label^="Bold"]`)).toHaveClass(/active/)
  await page.keyboard.press('ControlOrMeta+b')
  await page.waitForTimeout(300)
  const weight = await page.evaluate((s) => (document.querySelector(s) as HTMLElement).style.fontWeight, WIDGET)
  expect(weight).toBe('normal')
  await clickAway(page)
  expect(await markup(page), 'no markup saying "not bold" is written').toBe('Sports Day 14 June')
})

test('the PowerPoint export keeps the bold and the link as text', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Book by 14 June')
  await selectWord(page, 'June')
  await page.keyboard.press('ControlOrMeta+b')
  await selectWord(page, 'Book')
  await page.locator(`${TOOLBAR} [aria-label="Link"]`).click()
  await page.waitForTimeout(400)
  await page.locator('.inline-link__url').fill('https://school.org/trips')
  await page.getByRole('button', { name: 'Add link' }).click()
  await page.waitForTimeout(300)
  await clickAway(page)

  await page.locator('.export-caret').click()
  await page.waitForTimeout(500)
  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.locator('.export-menu__list').getByText('PowerPoint', { exact: true }).click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk as Buffer)
  const zip = await JSZip.loadAsync(Buffer.concat(chunks))

  const slide = await zip.file('ppt/slides/slide1.xml')!.async('string')
  expect(slide).toMatch(/<a:rPr[^>]*\bb="1"[^>]*>(?:(?!<\/a:r>).)*<a:t>June<\/a:t>/s)
  expect(slide).toMatch(/<a:hlinkClick r:id="rId\d+"/)
  const rels = await zip.file('ppt/slides/_rels/slide1.xml.rels')!.async('string')
  expect(rels).toMatch(/Type="[^"]*\/hyperlink" Target="https:\/\/school\.org\/trips" TargetMode="External"/)
})

test('a curved heading keeps a bold word bold, one character at a time', async ({ page }) => {
  await addText(page, 'Body text')
  await startTyping(page, 'Sports Day')
  await selectWord(page, 'Day')
  await page.keyboard.press('ControlOrMeta+b')
  await clickAway(page)
  await selectFirstWidget(page)

  const runway = page.locator('#w-text-style #number-slider', { hasText: 'Curve' }).locator('.el-slider__runway')
  const box = (await runway.boundingBox())!
  await page.mouse.move(box.x + box.width - 1, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.up()
  await page.waitForTimeout(600)

  const glyphs = page.locator(`${WIDGET} .curved-text__glyph`)
  await expect(glyphs).toHaveCount('SportsDay'.length)
  const weights = await glyphs.evaluateAll((els) => els.map((el) => (el as HTMLElement).style.fontWeight))
  expect(weights.slice(0, 6).every((w) => w !== 'bold'), 'Sports is regular').toBe(true)
  expect(weights.slice(6).every((w) => w === 'bold'), 'Day is bold').toBe(true)
})
