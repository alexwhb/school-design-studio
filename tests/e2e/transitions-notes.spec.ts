import { expect, test, type Page } from '@playwright/test'
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
