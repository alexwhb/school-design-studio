import { chromium } from '@playwright/test'
const base = process.env.APP_URL || 'http://127.0.0.1:5303'
const out = process.env.OUT || '/tmp/pd-ui-right-panel-shots'
const theme = process.env.THEME || 'dark'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: theme })
const page = await ctx.newPage()
await page.addInitScript(([t]) => { try { localStorage.setItem('ds_theme', t); localStorage.setItem('hide_replace_prompt', '1') } catch {} }, [theme])
await page.goto(base + '/home', { waitUntil: 'networkidle' })
await page.waitForSelector('#page-design-canvas')
await page.waitForTimeout(1800)
const shot = (n) => page.screenshot({ path: `${out}/${theme}-${n}.png` })

await shot('page')

// a text box
await page.locator('#widget-panel .classify-item', { hasText: 'Text' }).click()
await page.waitForTimeout(600)
await page.locator('#text-list-wrap .basic-text-item', { hasText: 'Heading' }).first().click()
await page.waitForTimeout(900)
await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 10 } })
await page.waitForTimeout(600)
await shot('text')

// a rectangle, drawn with the R tool
await page.keyboard.press('r')
await page.waitForTimeout(300)
const board = await page.locator('#page-design-canvas').boundingBox()
await page.mouse.move(board.x + 120, board.y + 260)
await page.mouse.down()
await page.mouse.move(board.x + 420, board.y + 480, { steps: 8 })
await page.mouse.up()
await page.waitForTimeout(800)
await shot('shape')

// a photograph
await page.locator('#widget-panel .classify-item', { hasText: 'Photos' }).click()
await page.waitForTimeout(1800)
const photo = page.locator('.photo-list-wrap .list__img').first()
if (await photo.count()) {
  await photo.click()
  await page.waitForTimeout(2200)
  await shot('image')
}

// the layers tab, with three things on the page
await page.getByRole('radio', { name: 'Layers' }).click()
await page.waitForTimeout(500)
await shot('layers')

// back to the page
await page.getByRole('radio', { name: 'Settings' }).click()
await page.waitForTimeout(300)
await page.locator('#page-design').click({ position: { x: 30, y: 30 } })
await page.waitForTimeout(600)
await shot('page-with-art')

await browser.close()
console.log('done')
