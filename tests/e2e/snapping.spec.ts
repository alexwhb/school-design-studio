import { expect, test } from '@playwright/test'
import { WIDGET, addText, openEditor } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** The page's CSS scale, read off the canvas rather than the zoom readout. */
function zoomOf(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const el = document.getElementById('page-design-canvas')!
    return el.getBoundingClientRect().width / el.offsetWidth
  })
}

function boxOf(page: import('@playwright/test').Page, index: number) {
  return page.evaluate((i) => {
    const el = document.querySelectorAll(
      '#page-design-canvas [data-uuid]:not([data-uuid="-1"])',
    )[i] as HTMLElement
    return { left: Number.parseFloat(el.style.left), top: Number.parseFloat(el.style.top) }
  }, index)
}

/** Drags the nth widget by a distance in screen pixels. */
async function dragWidget(page: import('@playwright/test').Page, index: number, dx: number, dy = 0) {
  const widget = page.locator(WIDGET).nth(index)
  await widget.click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  const box = (await widget.boundingBox())!
  await page.mouse.move(box.x + 40, box.y + 10)
  await page.mouse.down()
  await page.mouse.move(box.x + 40 + dx, box.y + 10 + dy, { steps: 14 })
  await page.mouse.up()
  await page.waitForTimeout(600)
}

/** Brings the nth widget's left edge to within `slack` screen px of `target`. */
async function dragNear(page: import('@playwright/test').Page, index: number, target: number, slack = 3) {
  const zoom = await zoomOf(page)
  const { left } = await boxOf(page, index)
  await dragWidget(page, index, (target - left) * zoom + slack)
}

async function toggleSnapping(page: import('@playwright/test').Page) {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByText('Snap to objects', { exact: true }).click()
  await page.waitForTimeout(500)
}

test('a dragged element lands exactly on a neighbour’s edge', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  await expect(page.locator(WIDGET)).toHaveCount(2)
  const anchor = (await boxOf(page, 0)).left

  // Away from every target first, so the snap back is what is measured.
  await dragWidget(page, 1, 120)
  expect((await boxOf(page, 1)).left).toBeGreaterThan(anchor + 100)

  await dragNear(page, 1, anchor)
  // Exactly, not nearly: Moveable rounds to a tenth of a screen pixel, which at
  // this zoom is several page pixels. snapBox is what closes that.
  expect((await boxOf(page, 1)).left).toBe(anchor)
})

test('with snapping off it lands where you put it', async ({ page }) => {
  await toggleSnapping(page)
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  const anchor = (await boxOf(page, 0)).left

  await dragWidget(page, 1, 120)
  await dragNear(page, 1, anchor)
  const landed = (await boxOf(page, 1)).left
  expect(landed).not.toBe(anchor)
  expect(landed).toBeGreaterThan(anchor)
})

test('an element snaps to the centre of the page', async ({ page }) => {
  await addText(page, 'Heading')
  const width = await page.locator(WIDGET).first().evaluate((el) => (el as HTMLElement).offsetWidth)
  const pageWidth = await page.evaluate(() => document.getElementById('page-design-canvas')!.offsetWidth)
  const centred = (pageWidth - width) / 2

  await dragWidget(page, 0, 140)
  await dragNear(page, 0, centred)
  expect((await boxOf(page, 0)).left).toBe(centred)
})

test('the distance a snap reports is legible on its chip', async ({ page }) => {
  // Three, because a figure is only worth reporting when there is a gap or a
  // distance between neighbours to report. Repeat inserts cascade down the
  // page, so they land in a column with the third at the bottom.
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  await addText(page, 'Heading')
  await expect(page.locator(WIDGET)).toHaveCount(3)

  const widget = page.locator(WIDGET).nth(2)
  await widget.click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
  const box = (await widget.boundingBox())!
  await page.mouse.move(box.x + 40, box.y + 10)
  await page.mouse.down()

  // The chips only exist mid-drag, and only where there is something to say,
  // so walk the third one down past the other two until one shows up.
  let chips: { text: string; color: string; background: string }[] = []
  for (let step = 1; step <= 30 && chips.length === 0; step++) {
    await page.mouse.move(box.x + 40, box.y + 10 + step * 6, { steps: 2 })
    await page.waitForTimeout(90)
    chips = await page.evaluate(() =>
      [...document.querySelectorAll('.moveable-size-value')].map((el) => {
        const style = getComputedStyle(el)
        return { text: el.textContent || '', color: style.color, background: style.backgroundColor }
      }),
    )
  }
  await page.mouse.up()

  expect(chips.length, 'a gap or a distance was reported').toBeGreaterThan(0)
  for (const chip of chips) {
    expect(chip.text, 'the chip carries a figure').toMatch(/\d/)
    // Moveable styles these itself, at the same weight and later in the
    // document, so its own red landed on the chip's pink and the figures could
    // not be read at all.
    expect(chip.color, 'and the figure is not the colour of the chip under it').toBe('rgb(255, 255, 255)')
    expect(chip.color).not.toBe(chip.background)
  }
})

test('the File menu offers snapping, ticked, and remembers the choice', async ({ page }) => {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  const row = page.locator('.ds-folder-menu .item--toggle', { hasText: 'Snap to objects' })
  await expect(row.locator('.tick')).toHaveCount(1)
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  await toggleSnapping(page)
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  await expect(row.locator('.tick')).toHaveCount(0)
  await page.keyboard.press('Escape')

  await page.reload()
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(1200)
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  await expect(row.locator('.tick'), 'the choice survived a reload').toHaveCount(0)
})

test('a ruler guide is recorded, and gets a stand-in inside the page', async ({ page }) => {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByText('Rulers and guides', { exact: true }).click()
  await page.waitForTimeout(900)
  await expect(page.locator('.my-horizontal')).toBeVisible()

  // Pull a guide down out of the top ruler onto the page.
  const ruler = (await page.locator('.my-horizontal').boundingBox())!
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  await page.mouse.move(canvas.x + canvas.width / 2, ruler.y + ruler.height / 2)
  await page.mouse.down()
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + 60, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(800)

  const guides = await page.evaluate(() => document.querySelectorAll('#page-design-canvas .snap-guide-h').length)
  expect(guides, 'the guide has a stand-in Moveable can measure').toBeGreaterThan(0)
})

test('putting the rulers away takes the guides with them', async ({ page }) => {
  const openRulers = async () => {
    await page.getByText('File', { exact: true }).click()
    await page.waitForTimeout(400)
    await page.getByText('Rulers and guides', { exact: true }).click()
    await page.waitForTimeout(800)
  }

  await openRulers()
  const ruler = (await page.locator('.my-horizontal').boundingBox())!
  const canvas = (await page.locator('#page-design-canvas').boundingBox())!
  await page.mouse.move(canvas.x + canvas.width / 2, ruler.y + ruler.height / 2)
  await page.mouse.down()
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + 60, { steps: 12 })
  await page.mouse.up()
  await page.waitForTimeout(800)
  expect(await page.locator('#page-design-canvas .snap-guide-h').count()).toBeGreaterThan(0)

  await openRulers()
  await expect(page.locator('.my-horizontal')).toHaveCount(0)
  await expect(page.locator('#page-design-canvas .snap-guide-h')).toHaveCount(0)
})
