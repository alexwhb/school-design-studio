import { chromium } from '@playwright/test'

const targets = [
  ['http://127.0.0.1:5174/home', '#page-design-canvas'],
  ['http://127.0.0.1:5273/home', '#page-design-canvas'],
  ['http://127.0.0.1:5373/embed-demo/index.html', '.ds-root #page-design-canvas'],
]
const browser = await chromium.launch()

for (const [url, selector] of targets) {
  const page = await browser.newPage()
  let ok = false
  for (let attempt = 0; attempt < 8; attempt++) {
    await page.goto(url, { waitUntil: 'load' }).catch(() => {})
    ok = await page
      .waitForSelector(selector, { timeout: 4000 })
      .then(() => true)
      .catch(() => false)
    if (ok) break
  }
  console.log(url, ok ? 'OK' : 'FAILED')
  await page.close()
}
await browser.close()
