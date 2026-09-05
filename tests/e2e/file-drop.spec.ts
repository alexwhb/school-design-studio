import { expect, test } from '@playwright/test'
import { WIDGET, openEditor, widgetCount } from './helpers'

/**
 * Dropping a picture from the desktop onto the design.
 *
 * Playwright cannot hand the operating system a file to drag, so the drag is
 * built the way the browser would: a `DataTransfer` with a real `File` on it,
 * dispatched at the point the pointer would be over. That is the same object
 * the handler reads, so everything under it — the overlay, the upload, the
 * arithmetic that decides where the picture lands — is the real thing.
 */

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100" width="200" height="100"><rect width="200" height="100" fill="#007eb7"/></svg>`

type DroppedFile = { name: string; type: string; text?: string }

/** Builds the drag on the page and fires it at `x, y` in client coordinates. */
async function dropFiles(page: import('@playwright/test').Page, files: DroppedFile[], x: number, y: number, { holdOnly = false } = {}) {
  await page.evaluate(
    async ([spec, px, py, hold]) => {
      const transfer = new DataTransfer()
      for (const file of spec as DroppedFile[]) {
        transfer.items.add(new File([new TextEncoder().encode(file.text || '')], file.name, { type: file.type }))
      }
      const target = document.elementFromPoint(px as number, py as number) || document.body
      const init = { bubbles: true, cancelable: true, clientX: px as number, clientY: py as number, dataTransfer: transfer }
      target.dispatchEvent(new DragEvent('dragenter', init))
      target.dispatchEvent(new DragEvent('dragover', init))
      if (hold) return
      target.dispatchEvent(new DragEvent('drop', init))
    },
    [files, x, y, holdOnly] as const,
  )
}

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

test('a picture dragged off the desktop lands where it was let go', async ({ page }) => {
  const before = await widgetCount(page)
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!

  // A quarter in from the top-left corner, so "where it was dropped" is
  // distinguishable from "the middle of the page", which is where every other
  // way of adding a picture puts it.
  const x = canvas.x + canvas.width * 0.25
  const y = canvas.y + canvas.height * 0.25
  await dropFiles(page, [{ name: 'crest.svg', type: 'image/svg+xml', text: SVG }], x, y)

  await expect(page.locator(WIDGET)).toHaveCount(before + 1)
  const placed = (await page.locator(WIDGET).last().boundingBox())!
  // Centred on the pointer, within a few pixels of rounding and the border.
  expect(Math.abs(placed.x + placed.width / 2 - x)).toBeLessThan(6)
  expect(Math.abs(placed.y + placed.height / 2 - y)).toBeLessThan(6)

  // And it is the SVG, kept as one rather than turned into pixels on the way in.
  const src = await page.locator(`${WIDGET} img`).last().getAttribute('src')
  expect(src).toContain('image/svg+xml')
})

test('the overlay says a drop will be taken, and goes once it has been', async ({ page }) => {
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  const x = canvas.x + canvas.width / 2
  const y = canvas.y + canvas.height / 2

  await dropFiles(page, [{ name: 'crest.svg', type: 'image/svg+xml', text: SVG }], x, y, { holdOnly: true })
  await expect(page.locator('.ds-file-drop__overlay')).toBeVisible()

  await dropFiles(page, [{ name: 'crest.svg', type: 'image/svg+xml', text: SVG }], x, y)
  await expect(page.locator('.ds-file-drop__overlay')).toHaveCount(0)
})

test('several pictures at once land as several pictures', async ({ page }) => {
  const before = await widgetCount(page)
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!

  await dropFiles(
    page,
    // The same picture twice, so the only thing that can move the second one is
    // the cascade — two different sizes are centred on different points and
    // would compare as offset whether or not anything offset them.
    [
      { name: 'a.svg', type: 'image/svg+xml', text: SVG },
      { name: 'b.svg', type: 'image/svg+xml', text: SVG },
    ],
    canvas.x + canvas.width / 2,
    canvas.y + canvas.height / 2,
  )

  await expect(page.locator(WIDGET)).toHaveCount(before + 2)
  // Cascaded rather than stacked, or the second is invisible under the first.
  const first = (await page.locator(WIDGET).nth(before).boundingBox())!
  const second = (await page.locator(WIDGET).nth(before + 1).boundingBox())!
  expect(second.x).toBeGreaterThan(first.x)
  expect(second.y).toBeGreaterThan(first.y)
})

test('a file that is not a picture is refused, not navigated to', async ({ page }) => {
  const before = await widgetCount(page)
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  const url = page.url()

  await dropFiles(page, [{ name: 'notes.txt', type: 'text/plain', text: 'hello' }], canvas.x + 40, canvas.y + 40)

  await expect(page.getByText('That file is not a picture')).toBeVisible()
  expect(await widgetCount(page)).toBe(before)
  // The whole reason to handle the drop at all: an unhandled one replaces the
  // editor with the file, and everything unsaved goes with it.
  expect(page.url()).toBe(url)
})
