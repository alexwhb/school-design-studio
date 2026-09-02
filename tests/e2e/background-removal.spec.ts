import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addFlatImage, openEditor } from './helpers'

const PHOTO = '#page-design-canvas .w-image img.target'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/**
 * Stands in for the model, so the test needs neither a network nor 44MB of
 * weights. `works` hands back a plain red picture, which is nothing like the
 * grey one that went in and is therefore easy to tell apart.
 *
 * The hook it reaches for is compiled out of a production build, so this file
 * wants the dev server rather than `npm run serve`.
 */
async function installRemover(page: Page, mode: 'works' | 'fails') {
  await page.waitForFunction(() => Boolean((window as any).__designStudio?.setBackgroundRemover))
  await page.evaluate((how) => {
    ;(window as any).__designStudio.setBackgroundRemover(async () => {
      if (how === 'fails') throw new Error('the model could not be reached')
      const canvas = document.createElement('canvas')
      canvas.width = 40
      canvas.height = 30
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = '#ff0000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return await new Promise<Blob>((resolve) => canvas.toBlob((blob) => resolve(blob!), 'image/png'))
    })
  }, mode)
}

test('removing the background swaps the picture, and Restore brings it back', async ({ page }) => {
  await addFlatImage(page)
  await installRemover(page, 'works')
  const before = await page.locator(PHOTO).getAttribute('src')
  expect(before).toBeTruthy()

  const section = page.locator('#style-panel .image-background')
  await section.locator('.image-background__button').click()
  await expect(section.locator('.image-background__note')).toHaveText('The background has been removed.')

  const after = await page.locator(PHOTO).getAttribute('src')
  expect(after).not.toBe(before)
  expect(after).toContain('data:image/png')
  // The cut-out only replaces the picture: the frame it sits in is untouched.
  const box = await page.locator(WIDGET).first().evaluate((el) => (el as HTMLElement).style.width)
  expect(parseFloat(box)).toBeGreaterThan(0)

  await section.locator('.image-background__button', { hasText: 'Restore original' }).click()
  await expect(page.locator(PHOTO)).toHaveAttribute('src', before!)
  await expect(section.locator('.image-background__note')).toHaveCount(0)
})

test('the whole thing is one undo entry', async ({ page }) => {
  await addFlatImage(page)
  await installRemover(page, 'works')
  const before = await page.locator(PHOTO).getAttribute('src')

  await page.locator('#style-panel .image-background__button').click()
  await expect(page.locator('#style-panel .image-background__note')).toBeVisible()

  await page.keyboard.press('ControlOrMeta+z')
  await expect(page.locator(PHOTO)).toHaveAttribute('src', before!)
  await expect(page.locator('#style-panel .image-background__note')).toHaveCount(0)
})

test('a remover that cannot do it says so in plain English', async ({ page }) => {
  await addFlatImage(page)
  await installRemover(page, 'fails')
  const before = await page.locator(PHOTO).getAttribute('src')

  await page.locator('#style-panel .image-background__button').click()
  // The Uploaded notice from placing the photo is still on screen, so pick the
  // notification by what it says rather than by being the only one.
  const notice = page.locator('.el-notification', { hasText: 'The background could not be removed' })
  await expect(notice).toBeVisible()
  await expect(notice.locator('.el-notification__content')).toContainText('the model could not be reached')
  // Nothing was changed, so the picture is still the one that was there.
  await expect(page.locator(PHOTO)).toHaveAttribute('src', before!)
  await expect(page.locator('#style-panel .image-background__button')).toHaveText('Remove background')
})
