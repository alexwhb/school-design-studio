import { test, expect } from '@playwright/test'
import { REACT_URL, VUE_URL, compare, prepare } from './helpers'

const MAX_RATIO = 0.0005

type Case = {
  name: string
  route: string
  theme: 'dark' | 'light'
  prepareStep?: (page: import('@playwright/test').Page) => Promise<void>
  /**
   * Shoot one element instead of the viewport.
   *
   * For anything that floats over the editor — a dialog, a menu, the presenter —
   * the whole viewport drags in the panel behind it, where a lazily loaded
   * template thumbnail landing a frame apart is noise rather than a difference.
   */
  target?: string
}

const cases: Case[] = [
  { name: 'home-dark', route: '/home', theme: 'dark' },
  { name: 'home-light', route: '/home', theme: 'light' },
  {
    name: 'panel-elements-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Elements', { exact: true }).click()
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'panel-text-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'panel-tools-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Tools', { exact: true }).click()
      await page.waitForTimeout(800)
    },
  },
  {
    name: 'text-style-panel-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Heading', { exact: true }).click()
      await page.waitForTimeout(900)
      await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'qrcode-style-panel-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Tools', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('QR code', { exact: true }).click()
      await page.waitForTimeout(1200)
      await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 20 } })
      await page.waitForTimeout(1000)
    },
  },
  {
    name: 'svg-style-panel-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Elements', { exact: true }).click()
      await page.waitForTimeout(1500)
      await page.locator('.list-wrap').nth(1).locator('.el-image').first().click()
      await page.waitForTimeout(1500)
      await page.locator('#page-design-canvas [data-uuid="' + (await page.locator('#page-design-canvas [data-uuid]:not([data-uuid=\'-1\'])').first().getAttribute('data-uuid')) + '"]').click({ position: { x: 10, y: 10 }, force: true })
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'template-loaded-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.waitForTimeout(1500)
      await page.locator('.img-water-fall .img-box').first().click()
      await page.waitForTimeout(3000)
    },
  },
  {
    name: 'template-loaded-light',
    route: '/home',
    theme: 'light',
    prepareStep: async (page) => {
      await page.waitForTimeout(1500)
      await page.locator('.img-water-fall .img-box').first().click()
      await page.waitForTimeout(3000)
    },
  },
  {
    name: 'draw-render-dark',
    route: '/draw?tempid=101',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.waitForTimeout(2500)
    },
  },
  {
    name: 'html-render-dark',
    route: '/html?tempid=101',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.waitForTimeout(2500)
    },
  },
  {
    name: 'psd-import-dark',
    route: '/psd',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.waitForTimeout(1500)
    },
  },
  {
    name: 'resize-dialog-dark',
    route: '/home',
    theme: 'dark',
    target: '.el-dialog',
    prepareStep: async (page) => {
      await page.locator('#page-style').getByText('Resize…', { exact: true }).click()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'animate-section-dark',
    route: '/home',
    theme: 'dark',
    target: '.el-popper.animate-popper, .animate-popper',
    prepareStep: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Heading', { exact: true }).click()
      await page.waitForTimeout(900)
      await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
      await page.waitForTimeout(700)
      await page.locator('.animate').getByText('Choose', { exact: true }).click()
      await page.waitForTimeout(2200)
    },
  },
  {
    name: 'animate-section-chosen-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Heading', { exact: true }).click()
      await page.waitForTimeout(900)
      await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
      await page.waitForTimeout(700)
      await page.locator('.animate').getByText('Choose', { exact: true }).click()
      await page.waitForTimeout(1600)
      await page.locator('.picker__grid .tile', { hasText: 'Rise' }).first().click()
      await page.waitForTimeout(2200)
    },
  },
  {
    name: 'pages-strip-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Heading', { exact: true }).click()
      await page.waitForTimeout(900)
      await page.locator('.artboards .btn').click()
      await page.waitForTimeout(600)
      await page.locator('.artboards .item-add').click()
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'present-mode-dark',
    route: '/home',
    theme: 'dark',
    target: '.present__stage',
    prepareStep: async (page) => {
      await page.waitForTimeout(1200)
      await page.locator('.img-water-fall .img-box').first().click()
      await page.waitForTimeout(2600)
      await page.getByRole('button', { name: 'Present' }).click()
      await page.waitForTimeout(2600)
    },
  },
  {
    name: 'templates-category-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.waitForTimeout(1400)
      await page.locator('.cates__chip', { hasText: 'Posters' }).first().click()
      await page.waitForTimeout(2200)
    },
  },
  {
    name: 'templates-search-empty-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.waitForTimeout(1200)
      await page.getByPlaceholder('Search templates').fill('zzzznothing')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(2200)
    },
  },
  {
    name: 'text-effect-applied-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Text', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Heading', { exact: true }).click()
      await page.waitForTimeout(900)
      await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
      await page.waitForTimeout(700)
      await page.locator('.effects').getByText('Choose', { exact: true }).click()
      await page.waitForTimeout(1800)
      await page.locator('.select__box__select-item img').first().click()
      await page.waitForTimeout(1800)
      // The Advanced list, so the layers a preset brought with it are on screen.
      await page.locator('.advanced').getByText('Advanced', { exact: true }).click()
      await page.waitForTimeout(900)
    },
  },
  {
    name: 'rulers-and-guides-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('File', { exact: true }).click()
      await page.waitForTimeout(400)
      await page.getByText('Rulers and guides', { exact: true }).click()
      await page.waitForTimeout(1400)
      // A guide dragged onto the page, so its casing and readout are on screen.
      const ruler = (await page.locator('.my-horizontal').boundingBox())!
      const canvas = (await page.locator('#page-design-canvas').boundingBox())!
      await page.mouse.move(canvas.x + canvas.width / 2, ruler.y + ruler.height / 2)
      await page.mouse.down()
      await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + 120, { steps: 12 })
      await page.mouse.up()
      await page.waitForTimeout(1200)
    },
  },
  {
    name: 'panel-uploads-dark',
    route: '/home',
    theme: 'dark',
    prepareStep: async (page) => {
      await page.getByText('Uploads', { exact: true }).click()
      await page.waitForTimeout(800)
    },
  },
]

for (const item of cases) {
  test(`parity: ${item.name}`, async ({ browser }) => {
    const vuePage = await browser.newPage()
    const reactPage = await browser.newPage()

    await prepare(vuePage, VUE_URL, item.route, item.theme)
    await prepare(reactPage, REACT_URL, item.route, item.theme)

    if (item.prepareStep) {
      await item.prepareStep(vuePage)
      await item.prepareStep(reactPage)
    }

    const shoot = (page: import('@playwright/test').Page) =>
      item.target ? page.locator(item.target).first().screenshot({ animations: 'disabled' }) : page.screenshot({ animations: 'disabled' })

    const vueShot = await shoot(vuePage)
    const reactShot = await shoot(reactPage)

    const result = compare(item.name, vueShot, reactShot)
    await vuePage.close()
    await reactPage.close()

    console.log(`  [parity] ${item.name}: ${(result.ratio * 100).toFixed(3)}% mismatch (${result.mismatched}/${result.total})`)
    expect(result.ratio, `pixel mismatch ${(result.ratio * 100).toFixed(3)}% (see ${result.diffPath})`).toBeLessThan(MAX_RATIO)
  })
}
