import { chromium } from '@playwright/test'

const target = process.argv[2] || 'http://127.0.0.1:5273'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
await page.addInitScript(() => {
  localStorage.setItem('ds_theme', 'dark')
  localStorage.setItem('hide_replace_prompt', '1')
})
await page.goto(target + '/home')
await page.waitForSelector('#page-design-canvas')
await page.waitForTimeout(1500)

await page.getByText('Text', { exact: true }).click()
await page.waitForTimeout(300)
const body = page.getByText('Body text', { exact: true })
for (let i = 0; i < 30; i++) await body.click()
await page.waitForTimeout(600)

const client = await page.context().newCDPSession(page)
await client.send('Profiler.enable')
await client.send('Profiler.setSamplingInterval', { interval: 100 })
await client.send('Profiler.start')

const canvas = await page.locator('#page-design').boundingBox()
await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2)
await page.keyboard.down('Control')
for (let i = 0; i < 30; i++) await page.mouse.wheel(0, -60)
await page.keyboard.up('Control')
await page.waitForTimeout(300)

const { profile } = await client.send('Profiler.stop')

const byId = new Map(profile.nodes.map((n) => [n.id, n]))
const self = new Map()
for (let i = 0; i < profile.samples.length; i++) {
  const id = profile.samples[i]
  const delta = profile.timeDeltas[i] ?? 0
  self.set(id, (self.get(id) || 0) + delta)
}

const rows = []
for (const [id, time] of self) {
  const node = byId.get(id)
  if (!node) continue
  const cf = node.callFrame
  const name = cf.functionName || '(anonymous)'
  const url = (cf.url || '').split('/').slice(-2).join('/')
  rows.push({ label: `${name} @ ${url}:${cf.lineNumber}`, ms: time / 1000 })
}
rows.sort((a, b) => b.ms - a.ms)

const total = rows.reduce((a, r) => a + r.ms, 0)
console.log(`\n${target} — zoom CPU profile (total sampled ${total.toFixed(1)}ms)\n`)
for (const row of rows.slice(0, 22)) {
  console.log(`${row.ms.toFixed(1).padStart(8)}ms  ${row.label}`)
}

await browser.close()
