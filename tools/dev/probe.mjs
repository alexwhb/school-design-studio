import { chromium } from '@playwright/test'
const browser = await chromium.launch()
for (const [name, base] of [['vue', 'http://127.0.0.1:5174'], ['react', 'http://127.0.0.1:5273']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  page.on('pageerror', (e) => console.log(name, 'PAGEERROR', e.message))
  await page.addInitScript(() => localStorage.setItem('ds_theme', 'dark'))
  await page.goto(base + '/psd')
  await page.waitForTimeout(3000)
  const info = await page.evaluate(() => ({
    uploader: !!document.querySelector('.uploader__box'),
    title: document.querySelector('.top-left .name')?.textContent,
    guidelines: !!Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('PSD guidelines')),
    canvas: !!document.getElementById('page-design-canvas'),
  }))
  console.log(name, JSON.stringify(info))
  await page.close()
}
await browser.close()
