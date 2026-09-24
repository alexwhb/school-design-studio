import { expect, test, type Page } from '@playwright/test'
import { WIDGET, addFlatImage, openEditor, widgetCount } from './helpers'

/**
 * A photo dropped onto a photo goes into it: the frame stays, the picture
 * changes. From the Photos panel, and from the desktop.
 */

const undoKey = process.platform === 'darwin' ? 'Meta+z' : 'Control+z'
const IMAGE = '#page-design-canvas .w-image'

/** A flat colour uploaded to the Photos panel and left there, not placed. */
async function uploadFlat(page: Page, color: string, size = { width: 600, height: 300 }) {
  const dataUrl = await page.evaluate(
    ([fill, w, h]) => {
      const canvas = document.createElement('canvas')
      canvas.width = w as number
      canvas.height = h as number
      const ctx = canvas.getContext('2d')!
      ctx.fillStyle = fill as string
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      return canvas.toDataURL('image/png')
    },
    [color, size.width, size.height] as const,
  )
  const cards = page.locator('.photo-list-wrap__uploads .panel-card')
  const before = await cards.count()
  await page.locator('.photo-list-wrap input[type="file"]').setInputFiles({ name: `${color}.png`, mimeType: 'image/png', buffer: Buffer.from(dataUrl.split(',')[1], 'base64') })
  await expect(cards).toHaveCount(before + 1)
  await page.waitForTimeout(300)
}

/** The frame of the one photo on the page, in design pixels. */
function frameOf(page: Page) {
  return page
    .locator(IMAGE)
    .first()
    .evaluate((el) => {
      const style = (el as HTMLElement).style
      return { left: style.left, top: style.top, width: style.width, height: style.height }
    })
}

const srcOf = (page: Page) => page.locator(`${IMAGE} img.target`).first().getAttribute('src')

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('a photo dragged from the panel onto a photo replaces it, in the same frame, as one undo', async ({ page }) => {
  await addFlatImage(page, '#cc0000')
  const frame = await frameOf(page)
  const oldSrc = await srcOf(page)
  const count = await widgetCount(page)

  await uploadFlat(page, '#0000cc')
  const thumb = (await page.locator('.photo-list-wrap__uploads .panel-card').first().boundingBox())!
  const target = (await page.locator(IMAGE).first().boundingBox())!

  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 })
  // While it is over the photo, the photo says what will happen.
  await expect(page.locator(`${IMAGE}.is-drop-target`)).toHaveCount(1)
  if (process.env.SHOT) await page.screenshot({ path: process.env.SHOT })
  await page.mouse.up()
  await page.waitForTimeout(600)

  await expect(page.locator(`${IMAGE}.is-drop-target`)).toHaveCount(0)
  expect(await widgetCount(page)).toBe(count)
  const newSrc = await srcOf(page)
  expect(newSrc).not.toBe(oldSrc)
  expect(await frameOf(page)).toEqual(frame)
  // Cropped to cover the 4:3 frame and centred: a 2:1 picture is scaled one
  // and a half times across, and not moved.
  const transform = await page
    .locator(`${IMAGE} img.target`)
    .first()
    .evaluate((el) => (el as HTMLElement).style.transform)
  expect(transform).toMatch(/scale\(1\.5, 1\)/)
  expect(transform).toMatch(/translate\(0px, 0px\)/)

  // One press of undo puts the old picture back.
  await page.locator('#page-design-canvas').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press(undoKey)
  await page.waitForTimeout(400)
  expect(await srcOf(page)).toBe(oldSrc)
  expect(await widgetCount(page)).toBe(count)
})

test('dragged anywhere else on the page, a photo is still added beside', async ({ page }) => {
  await addFlatImage(page, '#cc0000', { width: 200, height: 200 })
  const count = await widgetCount(page)
  await uploadFlat(page, '#0000cc')
  const thumb = (await page.locator('.photo-list-wrap__uploads .panel-card').first().boundingBox())!
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!

  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2)
  await page.mouse.down()
  await page.mouse.move(canvas.x + 40, canvas.y + 40, { steps: 12 })
  await expect(page.locator(`${IMAGE}.is-drop-target`)).toHaveCount(0)
  await page.mouse.up()
  await expect(page.locator(WIDGET)).toHaveCount(count + 1)
})

test('a picture dropped from the desktop onto a photo goes into it', async ({ page }) => {
  await addFlatImage(page, '#cc0000')
  const frame = await frameOf(page)
  const count = await widgetCount(page)
  const target = (await page.locator(IMAGE).first().boundingBox())!
  const x = target.x + target.width / 2
  const y = target.y + target.height / 2

  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"><rect width="200" height="100" fill="#007eb7"/></svg>'
  const fire = (hold: boolean) =>
    page.evaluate(
      ([markup, px, py, holdOnly]) => {
        const transfer = new DataTransfer()
        transfer.items.add(new File([markup as string], 'crest.svg', { type: 'image/svg+xml' }))
        const at = document.elementFromPoint(px as number, py as number) || document.body
        const init = { bubbles: true, cancelable: true, clientX: px as number, clientY: py as number, dataTransfer: transfer }
        at.dispatchEvent(new DragEvent('dragenter', init))
        at.dispatchEvent(new DragEvent('dragover', init))
        if (!holdOnly) at.dispatchEvent(new DragEvent('drop', init))
      },
      [svg, x, y, hold] as const,
    )

  await fire(true)
  // The photo is marked, and the page-wide "drop to add" card stands aside.
  await expect(page.locator(`${IMAGE}.is-drop-target`)).toHaveCount(1)
  await expect(page.locator('.ds-file-drop__overlay')).toHaveCount(0)

  await fire(false)
  await expect.poll(async () => (await srcOf(page)) || '').toContain('image/svg+xml')
  expect(await widgetCount(page)).toBe(count)
  expect(await frameOf(page)).toEqual(frame)
  await expect(page.locator(`${IMAGE}.is-drop-target`)).toHaveCount(0)
})

test('double-clicking a replaced photo crops it', async ({ page }) => {
  await addFlatImage(page, '#cc0000')
  await uploadFlat(page, '#0000cc', { width: 900, height: 300 })
  const thumb = (await page.locator('.photo-list-wrap__uploads .panel-card').first().boundingBox())!
  const target = (await page.locator(IMAGE).first().boundingBox())!
  await page.mouse.move(thumb.x + thumb.width / 2, thumb.y + thumb.height / 2)
  await page.mouse.down()
  await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(600)

  const box = (await page.locator(IMAGE).first().boundingBox())!
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2)
  await expect(page.locator(`${IMAGE} .crop__grip`)).toHaveCount(8)
  // The whole of the new picture is behind the frame, not the old one.
  const model = await page.locator(`${IMAGE} img.edit__model`).getAttribute('src')
  expect(model).toBe(await srcOf(page))
  await page.locator('#style-panel').getByRole('button', { name: 'Done' }).click()
  await expect(page.locator(`${IMAGE} .crop__grip`)).toHaveCount(0)
})
