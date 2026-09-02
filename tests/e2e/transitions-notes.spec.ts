import { expect, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { addPage, addText, collapsePageStrip, expandPageStrip, goToPage, openEditor } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/* ------------------------------------------------------------ transitions */

/** Picks a transition for the page that is selected, through the page settings panel. */
async function chooseTransition(page: Page, name: string) {
  await page.locator('.ds-transition__type').click()
  await page.waitForTimeout(400)
  await page.locator('.el-select-dropdown__item', { hasText: name }).click()
  await page.waitForTimeout(400)
}

/** Two pages, the second with a transition, and the strip put away. */
async function deckWithTransition(page: Page, name = 'Push') {
  await addText(page, 'Heading')
  await expandPageStrip(page)
  await addPage(page)
  await addText(page, 'Heading')
  // The panel shows the page once nothing on it is selected.
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(400)
  await chooseTransition(page, name)
  await goToPage(page, 0)
  await collapsePageStrip(page)
}

test('a transition is chosen for a page and marked on its thumbnail', async ({ page }) => {
  await expandPageStrip(page)
  await addPage(page)
  await chooseTransition(page, 'Fade')
  await expect(page.locator('.ds-transition__hint')).toHaveText('One slide dissolves into the next')
  await expect(page.locator('.artboards .page-transition')).toHaveCount(1)
  await expect(page.locator('.artboards .page').nth(1).locator('.page-transition')).toHaveAttribute('data-transition', 'fade')

  // Undo takes it off again, mark and all.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(500)
  await expect(page.locator('.artboards .page-transition')).toHaveCount(0)
})

test('Apply to all pages gives every page the same transition', async ({ page }) => {
  await expandPageStrip(page)
  await addPage(page)
  await addPage(page)
  await chooseTransition(page, 'Zoom')
  await page.getByRole('button', { name: 'Apply to all pages' }).click()
  await page.waitForTimeout(500)
  await expect(page.locator('.el-message')).toContainText('Zoom applied to 3 pages')
  await expect(page.locator('.artboards .page-transition')).toHaveCount(3)
})

test('the presenter plays the transition, and a second press does not stack on it', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await deckWithTransition(page, 'Push')

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1000)
  await expect(page.locator('.present__counter')).toContainText('1 / 2')

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(120)
  const running = await page.evaluate(() =>
    [...document.querySelectorAll('.present__slot')].flatMap((slot) => slot.getAnimations()).filter((a) => a.id === 'page-transition').length,
  )
  expect(running, 'both slots are moving').toBe(2)

  // Straight back before it has finished: the run is cancelled, not queued.
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(700)
  await expect(page.locator('.present__counter')).toContainText('1 / 2')
  const left = await page.evaluate(() => [...document.querySelectorAll('.present__slot')].flatMap((slot) => slot.getAnimations()).filter((a) => a.id === 'page-transition').length)
  expect(left).toBe(0)
  const resting = await page.evaluate(() => {
    const slots = [...document.querySelectorAll('.present__slot')] as HTMLElement[]
    return slots.map((slot) => ({ opacity: getComputedStyle(slot).opacity, transform: getComputedStyle(slot).transform, z: slot.style.zIndex }))
  })
  expect(resting[0]).toEqual({ opacity: '1', transform: 'none', z: '' })
  expect(resting[1].opacity).toBe('0')
  expect(errors).toEqual([])
  await page.keyboard.press('Escape')
})

test('asking the system for less motion turns the transition into a cut', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await deckWithTransition(page, 'Slide')
  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1000)
  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(80)
  const animations = await page.evaluate(() => [...document.querySelectorAll('.present__slot')].flatMap((slot) => slot.getAnimations()).length)
  expect(animations).toBe(0)
  await expect(page.locator('.present__counter')).toContainText('2 / 2')
  await page.keyboard.press('Escape')
})

test('a transition survives a reload', async ({ page }) => {
  await expandPageStrip(page)
  await addPage(page)
  await chooseTransition(page, 'Wipe')
  await page.waitForTimeout(3200)

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Restore it' }).click()
  await page.waitForTimeout(1200)
  await expandPageStrip(page)
  await expect(page.locator('.artboards .page').nth(1).locator('.page-transition')).toHaveAttribute('data-transition', 'wipe')
})

/* ----------------------------------------------------------------- notes */

/** Opens the drawer under the canvas, types into it, and clicks away to finish the edit. */
async function typeNotes(page: Page, text: string) {
  if (!(await page.locator('#page-notes').count())) {
    await page.locator('.notes-toggle').first().click()
    await page.waitForTimeout(600)
  }
  const box = page.locator('#page-notes')
  await box.click()
  await box.fill(text)
  await page.waitForTimeout(200)
  // Somewhere that is not the textarea, so the edit is blurred and recorded.
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(500)
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

test('notes are typed under the canvas and survive a reload', async ({ page }) => {
  await addText(page, 'Heading')
  await typeNotes(page, 'Welcome everyone, and thank the choir.')
  // The button carries a dot once the page has notes.
  await expect(page.locator('.notes-toggle').first()).toHaveClass(/has-notes/)
  await page.waitForTimeout(3200)

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(2000)
  await page.getByRole('button', { name: 'Restore it' }).click()
  await page.waitForTimeout(1200)
  await page.locator('.notes-toggle').first().click()
  await page.waitForTimeout(600)
  await expect(page.locator('#page-notes')).toHaveValue('Welcome everyone, and thank the choir.')
})

test('notes belong to the page they were written on, and Ctrl+Z takes them back', async ({ page }) => {
  await expandPageStrip(page)
  await addPage(page)
  await typeNotes(page, 'Page two only.')
  await goToPage(page, 0)
  await expect(page.locator('#page-notes')).toHaveValue('')
  await goToPage(page, 1)
  await expect(page.locator('#page-notes')).toHaveValue('Page two only.')

  // One press takes back the whole paragraph, not the last letter.
  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(700)
  await expect(page.locator('#page-notes')).toHaveValue('')
})

test('N in the presenter shows the notes for the slide', async ({ page }) => {
  await addText(page, 'Heading')
  await typeNotes(page, 'Mention the fire drill on Thursday.')

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1000)
  await expect(page.locator('.present__notes')).toHaveCount(0)

  await page.keyboard.press('n')
  await page.waitForTimeout(400)
  await expect(page.locator('.present__notes-body')).toHaveText('Mention the fire drill on Thursday.')

  await page.keyboard.press('n')
  await page.waitForTimeout(400)
  await expect(page.locator('.present__notes')).toHaveCount(0)
  await page.keyboard.press('Escape')
})

test('the PowerPoint export carries the notes into the notes pane', async ({ page }) => {
  await addText(page, 'Heading')
  await typeNotes(page, 'Hand out the letters before the bell.')

  await page.locator('.export-caret').click()
  await page.waitForTimeout(400)
  const { name, bytes } = await downloadFrom(page, () => page.locator('.export-menu__list').getByText('PowerPoint', { exact: true }).click())
  expect(name).toMatch(/\.pptx$/)

  const zip = await JSZip.loadAsync(bytes)
  const notes = zip.file('ppt/notesSlides/notesSlide1.xml')
  expect(notes, 'the deck has a notes slide').toBeTruthy()
  expect(await notes!.async('string')).toContain('Hand out the letters before the bell.')
})

test('the presenter view opens in a second window and stays in step both ways', async ({ page, context }) => {
  await addText(page, 'Heading')
  await expandPageStrip(page)
  await addPage(page)
  await addText(page, 'Heading')
  await typeNotes(page, 'Ask them what they noticed.')
  await goToPage(page, 0)
  await collapsePageStrip(page)

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1000)

  const opening = context.waitForEvent('page')
  await page.keyboard.press('s')
  const view = await opening
  await view.waitForSelector('.presenter', { timeout: 15000 })
  await expect(view.locator('.presenter__count')).toContainText('Slide 1 of 2')

  // Pressed in the second window, acted on in the first.
  await view.getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForTimeout(900)
  await expect(page.locator('.present__counter')).toContainText('2 / 2')
  await expect(view.locator('.presenter__count')).toContainText('Slide 2 of 2')
  await expect(view.locator('.presenter__notes')).toContainText('Ask them what they noticed.')

  // And the other way about.
  await page.keyboard.press('ArrowLeft')
  await page.waitForTimeout(900)
  await expect(view.locator('.presenter__count')).toContainText('Slide 1 of 2')

  // Ending the talk takes the second window with it.
  await page.keyboard.press('Escape')
  await page.waitForTimeout(800)
  expect(view.isClosed()).toBe(true)
})
