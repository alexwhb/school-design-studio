import { test, expect } from '@playwright/test'
import { REACT_URL, VUE_URL, compare, prepare } from './helpers'

const MAX_RATIO = 0.0005

type Case = {
  name: string
  route: string
  theme: 'dark' | 'light'
  prepareStep?: (page: import('@playwright/test').Page) => Promise<void>
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

    const vueShot = await vuePage.screenshot({ animations: 'disabled' })
    const reactShot = await reactPage.screenshot({ animations: 'disabled' })

    const result = compare(item.name, vueShot, reactShot)
    await vuePage.close()
    await reactPage.close()

    console.log(`  [parity] ${item.name}: ${(result.ratio * 100).toFixed(3)}% mismatch (${result.mismatched}/${result.total})`)
    expect(result.ratio, `pixel mismatch ${(result.ratio * 100).toFixed(3)}% (see ${result.diffPath})`).toBeLessThan(MAX_RATIO)
  })
}
