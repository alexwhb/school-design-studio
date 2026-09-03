import { chromium } from '/Users/alexblack/Projects/Personal/Websites/school-planner/node_modules/playwright/index.mjs'

const url = process.argv[2] || 'http://127.0.0.1:5273/home'
const out = process.argv[3] || '/tmp/shot.png'
const w = Number(process.argv[4] || 1600)
const h = Number(process.argv[5] || 1000)
const waitMs = Number(process.argv[6] || 3500)

const browser = await chromium.launch()
const page = await browser.newPage({
  viewport: { width: w, height: h },
  deviceScaleFactor: 1,
})
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text().slice(0, 300))
})
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + String(e).slice(0, 300)))
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch((e) => errors.push('GOTO: ' + e.message))
await page.waitForTimeout(waitMs)
await page.screenshot({ path: out })
console.log('saved', out)
if (errors.length) console.log('--- console errors ---\n' + [...new Set(errors)].slice(0, 15).join('\n'))
await browser.close()
