import { test, expect, type Locator, type Page } from '@playwright/test'
import { REACT_URL, VUE_URL, prepare } from './helpers'

/*
 * Menus and poppers, compared as layout rather than as pixels.
 *
 * A popper's own x is fractional — its width is text-driven, and Element Plus
 * pins the right edge to the trigger while Radix rounds the left edge to a whole
 * pixel. The two therefore render the same text a third of a pixel apart, which
 * a person cannot see and a pixel diff cannot ignore. Every number the layout
 * actually depends on is compared here instead, which also catches things a
 * screenshot would not: a missing divider, an item that stopped being disabled.
 */

type MenuItem = {
  tag: string
  cls: string
  top: number
  height: number
  padding: number[]
  text: string
}

async function readMenu(menu: Locator): Promise<MenuItem[]> {
  return menu.evaluate((root: Element) => {
    const base = root.getBoundingClientRect().top
    const round = (n: number) => Math.round(n * 100) / 100
    return Array.from(root.children).map((el) => {
      const cs = getComputedStyle(el)
      const r = el.getBoundingClientRect()
      return {
        tag: el.tagName.toLowerCase(),
        cls: Array.from(el.classList).sort().join(' '),
        top: round(r.top - base),
        height: round(r.height),
        padding: [cs.paddingTop, cs.paddingRight, cs.paddingBottom, cs.paddingLeft].map((v) => Number.parseFloat(v)),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim(),
      }
    })
  })
}

/** The popper's size, and where it sits relative to what opened it. */
async function readPopperBox(page: Page, triggerSelector: string, menu: Locator) {
  const trigger = await page.locator(triggerSelector).first().boundingBox()
  const popper = await menu.evaluateHandle((el: Element) => el.closest('.el-popper'))
  const box = await popper.asElement()?.boundingBox()
  if (!trigger || !box) return null
  const round = (n: number) => Math.round(n * 100) / 100
  return {
    width: round(box.width),
    height: round(box.height),
    gapBelowTrigger: round(box.y - (trigger.y + trigger.height)),
    // Element Plus pins a bottom-end popper's right edge to the trigger's;
    // Radix rounds the left edge instead, so this lands within a pixel.
    rightEdgeOffset: Math.round(box.x + box.width - (trigger.x + trigger.width)),
  }
}

type MenuCase = {
  name: string
  open: (page: Page) => Promise<void>
  /** Menus are found by what they say, so one selector works on both apps. */
  menu: (page: Page) => Locator
  trigger?: string
}

const cases: MenuCase[] = [
  {
    name: 'export menu',
    open: async (page) => {
      await page.locator('.export-caret').click()
      await page.waitForTimeout(800)
    },
    menu: (page) => page.locator('.el-dropdown-menu').filter({ hasText: 'PowerPoint (exact copy)' }).first(),
    trigger: '.export-caret',
  },
  {
    name: 'file menu',
    open: async (page) => {
      await page.getByText('File', { exact: true }).click()
      await page.waitForTimeout(800)
    },
    menu: (page) => page.locator('.el-dropdown-menu').filter({ hasText: 'Version history' }).first(),
  },
  {
    name: 'help menu',
    open: async (page) => {
      await page.getByText('Help', { exact: true }).click()
      await page.waitForTimeout(800)
    },
    menu: (page) => page.locator('.el-dropdown-menu').filter({ hasText: 'Take the tour' }).first(),
  },
  {
    name: 'page menu',
    open: async (page) => {
      await page.locator('.artboards .btn').click()
      await page.locator('.artboards .list').waitFor()
      await page.waitForTimeout(700)
      await page.locator('.artboards .item-box').first().hover()
      await page.waitForTimeout(300)
      await page.locator('.artboards .page-menu').first().click({ force: true })
      await page.waitForTimeout(800)
    },
    menu: (page) => page.locator('.el-dropdown-menu').filter({ hasText: 'Move left' }).first(),
  },
]

/*
 * The text-effect picker is compared here rather than as pixels for a different
 * reason: it is 626px of presets opened from a control near the bottom of the
 * panel, and the two engines disagree about where that goes. Element Plus lets
 * it hang 283px off the bottom of the window, so a third of the presets cannot
 * be reached; Radix shifts it up until it fits. The port keeps Radix's, which is
 * the reason the picker is usable at all — so what is checked is that the same
 * presets are laid out the same way, not where the box lands.
 */
test('picker parity: text effects', async ({ browser }) => {
  const open = async (page: Page) => {
    await page.getByText('Text', { exact: true }).click()
    await page.waitForTimeout(400)
    await page.getByText('Heading', { exact: true }).click()
    await page.waitForTimeout(900)
    await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
    await page.waitForTimeout(700)
    await page.locator('.effects').getByText('Choose', { exact: true }).click()
    await page.locator('.select__box__select-item img').first().waitFor()
    await page.waitForTimeout(2500)
  }

  const read = (page: Page) =>
    page.evaluate(() => {
      const box = document.querySelector('.select__box')!
      const first = box.querySelector('.select__box__select-item') as HTMLElement
      const round = (n: number) => Math.round(n * 100) / 100
      const rect = first.getBoundingClientRect()
      return {
        width: round(box.getBoundingClientRect().width),
        tiles: box.querySelectorAll('.select__box__select-item').length,
        tile: { width: round(rect.width), height: round(rect.height) },
        covers: Array.from(box.querySelectorAll('img')).map((img) => (img.getAttribute('src') || '').split('/').pop()),
      }
    })

  const vuePage = await browser.newPage()
  const reactPage = await browser.newPage()
  await prepare(vuePage, VUE_URL, '/home', 'dark')
  await prepare(reactPage, REACT_URL, '/home', 'dark')
  await open(vuePage)
  await open(reactPage)

  const vue = await read(vuePage)
  const react = await read(reactPage)
  await vuePage.close()
  await reactPage.close()

  expect(vue.tiles, 'the picker has presets').toBeGreaterThan(20)
  expect(react.tiles, 'preset count').toBe(vue.tiles)
  expect(react.tile, 'tile size').toEqual(vue.tile)
  expect(react.width, 'picker width').toBe(vue.width)
  expect(react.covers, 'the same presets, in the same order').toEqual(vue.covers)
})

for (const item of cases) {
  test(`menu parity: ${item.name}`, async ({ browser }) => {
    const vuePage = await browser.newPage()
    const reactPage = await browser.newPage()

    await prepare(vuePage, VUE_URL, '/home', 'dark')
    await prepare(reactPage, REACT_URL, '/home', 'dark')

    await item.open(vuePage)
    await item.open(reactPage)

    const vueItems = await readMenu(item.menu(vuePage))
    const reactItems = await readMenu(item.menu(reactPage))

    const vueBox = item.trigger ? await readPopperBox(vuePage, item.trigger, item.menu(vuePage)) : null
    const reactBox = item.trigger ? await readPopperBox(reactPage, item.trigger, item.menu(reactPage)) : null

    await vuePage.close()
    await reactPage.close()

    expect(vueItems.length, 'the menu has items').toBeGreaterThan(0)
    expect(reactItems.map((i) => i.text), 'item labels').toEqual(vueItems.map((i) => i.text))
    expect(reactItems.map((i) => i.cls), 'item classes').toEqual(vueItems.map((i) => i.cls))
    expect(reactItems.map((i) => [i.top, i.height]), 'item geometry').toEqual(vueItems.map((i) => [i.top, i.height]))
    expect(reactItems.map((i) => i.padding), 'item padding').toEqual(vueItems.map((i) => i.padding))
    if (vueBox) expect(reactBox, 'popper box and offset').toEqual(vueBox)
  })
}
