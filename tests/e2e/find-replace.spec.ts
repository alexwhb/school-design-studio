import { expect, test, type Page } from '@playwright/test'
import {
  WIDGET,
  addPage,
  addText,
  collapsePageStrip,
  drawnSelectionBoxes,
  expandPageStrip,
  goToPage,
  openEditor,
  openFindReplace,
  selectFirstWidget,
  setWidgetText,
  widgetText,
} from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

const TALLY = '.ds-find-replace .tally'

/**
 * The design the feature exists for, in miniature: the same date typed on two
 * pages, and you are looking at the first one.
 */
async function twoPagesSayingTheDate(page: Page) {
  await addText(page, 'Heading')
  await setWidgetText(page, 'Sports Day 14 June')
  await expandPageStrip(page)
  await addPage(page)
  await addText(page, 'Heading')
  await setWidgetText(page, 'Coaches leave 14 June')
  await goToPage(page, 0)
  await collapsePageStrip(page)
}

async function search(page: Page, find: string, replace?: string) {
  await page.locator('#find-replace-find').fill(find)
  await page.waitForTimeout(400)
  if (replace !== undefined) {
    await page.locator('#find-replace-with').fill(replace)
    await page.waitForTimeout(200)
  }
}

test('the count covers the pages you are not looking at', async ({ page }) => {
  await twoPagesSayingTheDate(page)
  await openFindReplace(page)
  await search(page, '14 June')
  await expect(page.locator(TALLY)).toHaveText('2 matches, on 2 pages')
})

test('Next goes to the page the match is on and selects the box holding it', async ({ page }) => {
  await twoPagesSayingTheDate(page)
  await openFindReplace(page)
  await search(page, '14 June')

  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForTimeout(700)
  await expect(page.locator(TALLY)).toHaveText('1 of 2, on 2 pages')

  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.waitForTimeout(900)
  await expect(page.locator(TALLY)).toHaveText('2 of 2, on 2 pages')
  await expect(page.locator('.artboards .btn__label')).toHaveText('Page 2')
  expect(await drawnSelectionBoxes(page), 'the box holding the match is selected').toBe(1)
})

test('Replace all says how many it changed and on how many pages', async ({ page }) => {
  await twoPagesSayingTheDate(page)
  await openFindReplace(page)
  await search(page, '14 June', '21 June')

  await page.getByRole('button', { name: 'Replace all' }).click()
  await page.waitForTimeout(900)
  await expect(page.locator('.el-message')).toHaveText('Replaced 2 matches across 2 pages.')
  await expect(page.locator(TALLY)).toContainText('Nothing on this design says')

  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  expect(await widgetText(page)).toBe('Sports Day 21 June')
  await expandPageStrip(page)
  await goToPage(page, 1)
  expect(await widgetText(page)).toBe('Coaches leave 21 June')
})

test('one press of undo takes a whole replace all back off every page', async ({ page }) => {
  await twoPagesSayingTheDate(page)
  await openFindReplace(page)
  await search(page, '14 June', '21 June')
  await page.getByRole('button', { name: 'Replace all' }).click()
  await page.waitForTimeout(900)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(700)

  await page.keyboard.press('ControlOrMeta+z')
  await page.waitForTimeout(1000)

  expect(await widgetText(page), 'the page you are on is back').toBe('Sports Day 14 June')
  await expandPageStrip(page)
  await goToPage(page, 1)
  expect(await widgetText(page), 'and so is the one you are not').toBe('Coaches leave 14 June')
})

test('replacing inside a bulleted list leaves the bullets standing', async ({ page }) => {
  await addText(page, 'Body text')
  await selectFirstWidget(page)
  await page.locator('#w-text-style .list-item[aria-label="Bulleted list"]').click()
  await page.waitForTimeout(500)

  await page.locator(WIDGET).first().dblclick()
  await page.waitForTimeout(400)
  await page.keyboard.press('ControlOrMeta+a')
  await page.keyboard.type('Bring a water bottle')
  await page.keyboard.press('Enter')
  await page.keyboard.type('Meet on 14 June')
  await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
  await page.waitForTimeout(600)

  await openFindReplace(page)
  await search(page, '14 June', '21 June')
  await page.getByRole('button', { name: 'Replace all' }).click()
  await page.waitForTimeout(900)

  const bullets = page.locator(`${WIDGET} .edit-text ul li`)
  await expect(bullets, 'the list is still a list').toHaveCount(2)
  await expect(bullets.nth(0)).toHaveText('Bring a water bottle')
  await expect(bullets.nth(1)).toHaveText('Meet on 21 June')
})

test('Ctrl+F opens it, and keeps out of the way while text is being typed', async ({ page }) => {
  await addText(page, 'Heading')
  await page.keyboard.press('ControlOrMeta+f')
  await page.waitForTimeout(700)
  await expect(page.locator('.ds-find-replace')).toHaveCount(1)

  await page.keyboard.press('Escape')
  await page.waitForTimeout(600)
  await expect(page.locator('.ds-find-replace')).toHaveCount(0)

  await page.locator(WIDGET).first().dblclick({ position: { x: 24, y: 12 } })
  await page.waitForTimeout(500)
  await page.keyboard.press('ControlOrMeta+f')
  await page.waitForTimeout(600)
  await expect(page.locator('.ds-find-replace'), 'the caret keeps the shortcut').toHaveCount(0)
})

test('nothing typed means nothing to press', async ({ page }) => {
  await addText(page, 'Heading')
  await openFindReplace(page)
  await expect(page.getByRole('button', { name: 'Replace all' })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()

  await search(page, 'heading')
  await expect(page.getByRole('button', { name: 'Replace all' })).toBeEnabled()
})

test('Match case tells June from june', async ({ page }) => {
  await addText(page, 'Heading')
  await setWidgetText(page, 'June trip, back in june')
  await openFindReplace(page)
  await search(page, 'june')
  await expect(page.locator(TALLY)).toHaveText('2 matches, on one page')

  await page.locator('.ds-find-replace .el-checkbox').click()
  await page.waitForTimeout(400)
  await expect(page.locator(TALLY)).toHaveText('1 match, on one page')
})
