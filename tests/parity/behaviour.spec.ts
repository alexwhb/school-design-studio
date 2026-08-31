import { test, expect, type Page } from '@playwright/test'
import { REACT_URL, VUE_URL, prepare } from './helpers'
import { readCanvas, widgetCount } from './canvas'

type Scenario = {
  name: string
  run: (page: Page) => Promise<void>
}

async function addHeading(page: Page) {
  await page.getByText('Text', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByText('Heading', { exact: true }).click()
  await page.waitForTimeout(500)
}

/**
 * Through the File menu, which works whatever is selected — the panel's own
 * Resize button is only on screen when the page itself is.
 */
async function openResizeDialog(page: Page) {
  await page.getByText('File', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByText('Resize design\u2026', { exact: true }).click()
  await page.waitForTimeout(800)
}

/** The dialog's size editor keeps the ratio locked off, so both boxes are free. */
async function setResizeSize(page: Page, width: number, height: number) {
  const boxes = page.locator('.el-dialog .number-input2 input')
  await boxes.nth(0).fill(String(width))
  await boxes.nth(0).blur()
  await page.waitForTimeout(400)
  await boxes.nth(1).fill(String(height))
  await boxes.nth(1).blur()
  await page.waitForTimeout(400)
}

async function clickWidget(page: Page) {
  const widget = page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first()
  await widget.click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(400)
}

const scenarios: Scenario[] = [
  {
    name: 'add-heading',
    run: async (page) => {
      await addHeading(page)
    },
  },
  {
    name: 'add-heading-twice-cascades',
    run: async (page) => {
      await addHeading(page)
      await page.getByText('Heading', { exact: true }).click()
      await page.waitForTimeout(500)
    },
  },
  {
    name: 'add-subheading-and-body',
    run: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Subheading', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Body text', { exact: true }).click()
      await page.waitForTimeout(500)
    },
  },
  {
    name: 'select-widget',
    run: async (page) => {
      await addHeading(page)
      await clickWidget(page)
    },
  },
  {
    name: 'arrow-key-nudge',
    run: async (page) => {
      await addHeading(page)
      await clickWidget(page)
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowDown')
      await page.waitForTimeout(400)
    },
  },
  {
    name: 'shift-arrow-nudge',
    run: async (page) => {
      await addHeading(page)
      await clickWidget(page)
      await page.keyboard.down('Shift')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.up('Shift')
      await page.waitForTimeout(400)
    },
  },
  {
    name: 'delete-widget',
    run: async (page) => {
      await addHeading(page)
      await clickWidget(page)
      await page.keyboard.press('Backspace')
      await page.waitForTimeout(500)
    },
  },
  {
    name: 'add-qrcode',
    run: async (page) => {
      await page.getByText('Tools', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('QR code', { exact: true }).click()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'zoom-in-twice',
    run: async (page) => {
      await page.locator('#zoom-control .zoom-icon.radius-right').click()
      await page.waitForTimeout(300)
      await page.locator('#zoom-control .zoom-icon.radius-right').click()
      await page.waitForTimeout(400)
    },
  },
  {
    name: 'zoom-preset-100',
    run: async (page) => {
      await page.locator('#zoom-control .zoom-text').click()
      await page.waitForTimeout(300)
      await page.locator('#zoom-control .zoom-item', { hasText: '100%' }).click()
      await page.waitForTimeout(400)
    },
  },
  {
    name: 'layers-tab-lists-widgets',
    run: async (page) => {
      await addHeading(page)
      await page.getByText('Layers', { exact: true }).click()
      await page.waitForTimeout(400)
    },
  },
  {
    // The page-size box became the Resize dialog, which reflows the artwork as
    // well as the page — so the scenario carries a heading across the change.
    name: 'resize-design-scale-to-fit',
    run: async (page) => {
      await addHeading(page)
      await openResizeDialog(page)
      await setResizeSize(page, 900, 1200)
      await page.locator('.choice', { hasText: 'Scale to fit' }).click()
      await page.getByRole('button', { name: 'Resize', exact: true }).click()
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'resize-design-keep-sizes',
    run: async (page) => {
      await addHeading(page)
      await openResizeDialog(page)
      await setResizeSize(page, 1275, 1650)
      await page.locator('.choice', { hasText: 'Keep sizes' }).click()
      await page.getByRole('button', { name: 'Resize', exact: true }).click()
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'add-page-then-go-back',
    run: async (page) => {
      await addHeading(page)
      await page.locator('.artboards .btn').click()
      await page.waitForTimeout(500)
      await page.locator('.artboards .item-add').click()
      await page.waitForTimeout(900)
      await page.locator('.artboards .page').first().click()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'duplicate-page',
    run: async (page) => {
      await addHeading(page)
      await page.locator('.artboards .btn').click()
      await page.waitForTimeout(500)
      await page.locator('.artboards .page').first().hover()
      await page.locator('.artboards .page-menu').first().click()
      await page.waitForTimeout(500)
      await page.getByText('Duplicate', { exact: true }).click()
      await page.waitForTimeout(1200)
    },
  },
  {
    // An entrance changes nothing about the design at rest. That is what keeps
    // every export untouched by it, so it is worth asserting rather than assuming.
    name: 'animation-leaves-the-canvas-alone',
    run: async (page) => {
      await addHeading(page)
      await clickWidget(page)
      await page.locator('.animate-card').getByText('Choose', { exact: true }).click()
      await page.waitForTimeout(1400)
      await page.locator('.picker__grid .tile', { hasText: 'Rise' }).first().click()
      await page.waitForTimeout(2000)
    },
  },
]

for (const scenario of scenarios) {
  test(`behaviour: ${scenario.name}`, async ({ browser }) => {
    const vuePage = await browser.newPage()
    const reactPage = await browser.newPage()

    await prepare(vuePage, VUE_URL, '/home', 'dark')
    await prepare(reactPage, REACT_URL, '/home', 'dark')

    await scenario.run(vuePage)
    await scenario.run(reactPage)

    const vueState = await readCanvas(vuePage)
    const reactState = await readCanvas(reactPage)

    await vuePage.close()
    await reactPage.close()

    expect(reactState.widgets.length, 'widget count').toBe(vueState.widgets.length)
    expect(reactState.page, 'page geometry').toEqual(vueState.page)
    expect(reactState.widgets, 'widget geometry and styles').toEqual(vueState.widgets)
    expect(reactState.selection.present, 'selection visible').toBe(vueState.selection.present)
    expect(reactState.layers, 'layer list').toEqual(vueState.layers)
    expect(reactState.zoom, 'zoom label').toBe(vueState.zoom)
  })
}
