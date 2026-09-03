import { expect, test, type Page } from '@playwright/test'
import { WIDGET, openEditor } from './helpers'

/**
 * The four browsing panels on the left. What is checked here is that each one
 * still shows the sections it is supposed to and that clicking a card in one
 * puts the thing on the page — the panels were rebuilt around a shared card and
 * eyebrow, and a section that quietly stops rendering looks like an empty panel
 * rather than an error.
 */

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

const openTab = async (page: Page, name: string) => {
  await page.locator('#widget-panel .classify-item', { hasText: name }).click()
  await page.waitForTimeout(1200)
}

const eyebrow = (page: Page, label: string) => page.locator('.panel-eyebrow__label', { hasText: label })

test('Photos opens on your own uploads, above the library', async ({ page }) => {
  await openTab(page, 'Photos')

  await expect(eyebrow(page, 'My uploads')).toBeVisible()
  await expect(page.locator('.photo-list-wrap .upload-tile')).toBeVisible()
  await expect(eyebrow(page, 'Photo library')).toBeVisible()

  // Uploads come first: they are yours, and the library is always there.
  const uploads = (await page.locator('.photo-list-wrap__uploads').boundingBox())!
  const library = (await page.locator('.photo-list-wrap__library').boundingBox())!
  expect(uploads.y).toBeLessThan(library.y)

  const dataUrl = await page.evaluate(() => {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 64
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#2fbf6b'
    ctx.fillRect(0, 0, 64, 64)
    return canvas.toDataURL('image/png')
  })
  await page.locator('.photo-list-wrap input[type="file"]').setInputFiles({
    name: 'square.png',
    mimeType: 'image/png',
    buffer: Buffer.from(dataUrl.split(',')[1], 'base64'),
  })
  await expect(page.locator('.photo-list-wrap__uploads .panel-card')).toHaveCount(1)
})

test('Graphics shows every shelf it has, and drills into one', async ({ page }) => {
  await openTab(page, 'Graphics')

  for (const section of ['Arrows', 'Stickers', 'Shapes', 'Masks', 'Ready-made groups']) {
    await expect(eyebrow(page, section), `the ${section} section`).toBeVisible()
  }

  await page.locator('.graph-list-wrap .cates__chip', { hasText: 'Masks' }).click()
  await page.waitForTimeout(1500)
  // One shelf now, not all of them.
  await expect(eyebrow(page, 'Stickers')).toHaveCount(0)
  await expect(page.locator('.graph-list-wrap .panel-card.art--mask').first()).toBeVisible()
})

test('a text effect card puts a text box on the page', async ({ page }) => {
  await openTab(page, 'Text')

  await expect(eyebrow(page, 'Text styles')).toBeVisible()
  await expect(eyebrow(page, 'Text with effects')).toBeVisible()

  await page.locator('#text-list-wrap .card-grid .panel-card').first().click()
  await page.waitForTimeout(1800)
  await expect(page.locator(WIDGET)).toHaveCount(1)
})

test('the search box filters the text presets without leaving the panel', async ({ page }) => {
  await openTab(page, 'Text')
  const cards = page.locator('#text-list-wrap .card-grid .panel-card')
  const all = await cards.count()
  expect(all).toBeGreaterThan(1)

  await page.getByPlaceholder('Search text styles').fill('shadow')
  await page.waitForTimeout(600)
  const some = await cards.count()
  expect(some).toBeGreaterThan(0)
  expect(some).toBeLessThan(all)
  // A search over effects has nothing to say about the three basic styles.
  await expect(eyebrow(page, 'Text styles')).toHaveCount(0)
})
