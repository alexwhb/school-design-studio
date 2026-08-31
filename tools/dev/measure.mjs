import { chromium } from '@playwright/test'

const script = () => {
  const out = []
  const push = (label, el) => {
    if (!el) return out.push({ label, missing: true })
    const r = el.getBoundingClientRect()
    const cs = getComputedStyle(el)
    out.push({ label, x: Math.round(r.x*10)/10, y: Math.round(r.y*10)/10, w: Math.round(r.width*10)/10, h: Math.round(r.height*10)/10, pad: cs.padding, margin: cs.margin, display: cs.display })
  }
  const items = document.querySelectorAll('#w-image-style .el-collapse-item')
  items.forEach((it, i) => push('item' + i, it))
  push('select0', document.querySelector('#w-image-style .el-select'))
  push('caret', document.querySelector('#w-image-style .el-select__caret'))
  push('textarea', document.querySelector('#w-image-style #text-input-area'))
  const wraps = document.querySelectorAll('#w-image-style .slide-wrap')
  wraps.forEach((w, i) => push('slide-wrap' + i, w))
  push('logo-layout', document.querySelector('#w-image-style .logo__layout'))
  push('upload', document.querySelector('#w-image-style .options__upload'))
  push('content-body', document.querySelectorAll('#w-image-style .el-collapse-item__content')[2])
  return out
}

const browser = await chromium.launch()
for (const [name, url] of [['vue', 'http://127.0.0.1:5174/home'], ['react', 'http://127.0.0.1:5273/home']]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => localStorage.setItem('ds_theme', 'dark'))
  await page.goto(url)
  await page.waitForTimeout(1500)
  await page.getByText('Tools', { exact: true }).click()
  await page.waitForTimeout(400)
  await page.getByText('QR code', { exact: true }).click()
  await page.waitForTimeout(1200)
  await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().click({ position: { x: 20, y: 20 } })
  await page.waitForTimeout(1000)
  console.log('==', name)
  for (const o of await page.evaluate(script)) console.log(' ', JSON.stringify(o))
  await page.close()
}
await browser.close()
