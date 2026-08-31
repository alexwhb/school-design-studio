import fs from 'node:fs'
import path from 'node:path'
import { chromium } from '@playwright/test'

const TARGETS = [
  { name: 'vue', url: process.env.VUE_URL || 'http://127.0.0.1:5174' },
  { name: 'react', url: process.env.REACT_URL || 'http://127.0.0.1:5273' },
]

const RUNS = Number(process.env.BENCH_RUNS || 5)
const OUT = path.resolve(process.cwd(), 'test-results/bench')

function stats(values) {
  const sorted = values.slice().sort((a, b) => a - b)
  const sum = sorted.reduce((a, b) => a + b, 0)
  return {
    n: sorted.length,
    min: round(sorted[0]),
    median: round(sorted[Math.floor(sorted.length / 2)]),
    mean: round(sum / sorted.length),
    max: round(sorted[sorted.length - 1]),
  }
}

const round = (n) => Math.round(n * 100) / 100

async function newPage(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => {
    localStorage.setItem('ds_theme', 'dark')
    localStorage.setItem('hide_replace_prompt', '1')
  })
  await page.goto(url + '/home')
  await page.waitForSelector('#page-design-canvas')
  await page.waitForTimeout(1500)
  return page
}

/** Wall-clock from navigation start to the canvas being on screen. */
async function benchColdLoad(browser, url) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript(() => localStorage.setItem('ds_theme', 'dark'))
  const started = Date.now()
  await page.goto(url + '/home')
  await page.waitForSelector('#page-design-canvas')
  const elapsed = Date.now() - started
  const nav = await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0]
    const paints = performance.getEntriesByType('paint')
    return {
      domContentLoaded: entry ? entry.domContentLoadedEventEnd : 0,
      fcp: paints.find((p) => p.name === 'first-contentful-paint')?.startTime ?? 0,
    }
  })
  await page.close()
  return { canvasReady: elapsed, ...nav }
}

/** How long the editor takes to place and lay out a batch of text widgets. */
async function benchAddWidgets(page, count) {
  await page.getByText('Text', { exact: true }).click()
  await page.waitForTimeout(300)
  const heading = page.getByText('Body text', { exact: true })
  const started = Date.now()
  for (let i = 0; i < count; i++) {
    await heading.click()
  }
  await page.waitForFunction(
    (n) => document.querySelectorAll('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').length >= n,
    count,
    { timeout: 30_000 },
  )
  return Date.now() - started
}

/**
 * Frame timing while an element is dragged across the page. Measured from
 * rAF inside the page so it reflects what the user actually sees.
 */
async function benchDrag(page) {
  const box = await page.locator('#page-design-canvas [data-uuid]:not([data-uuid="-1"])').first().boundingBox()
  if (!box) return null

  await page.evaluate(() => {
    const w = window
    w.__frames = []
    w.__recording = true
    let last = performance.now()
    const tick = (now) => {
      if (!w.__recording) return
      w.__frames.push(now - last)
      last = now
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  for (let i = 0; i < 40; i++) {
    await page.mouse.move(box.x + box.width / 2 + i * 6, box.y + box.height / 2 + i * 3)
  }
  await page.mouse.up()
  await page.waitForTimeout(150)

  return page.evaluate(() => {
    const w = window
    w.__recording = false
    const frames = w.__frames.slice(2)
    if (!frames.length) return null
    const sorted = frames.slice().sort((a, b) => a - b)
    const sum = frames.reduce((a, b) => a + b, 0)
    return {
      frames: frames.length,
      meanFrameMs: Math.round((sum / frames.length) * 100) / 100,
      p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100,
      longFrames: frames.filter((f) => f > 32).length,
    }
  })
}

/** Frame timing while zooming with the wheel, which repaints the whole page. */
async function benchZoom(page) {
  await page.evaluate(() => {
    const w = window
    w.__frames = []
    w.__recording = true
    let last = performance.now()
    const tick = (now) => {
      if (!w.__recording) return
      w.__frames.push(now - last)
      last = now
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })

  const canvas = await page.locator('#page-design').boundingBox()
  await page.mouse.move(canvas.x + canvas.width / 2, canvas.y + canvas.height / 2)
  await page.keyboard.down('Control')
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel(0, -60)
  }
  await page.keyboard.up('Control')
  await page.waitForTimeout(200)

  return page.evaluate(() => {
    const w = window
    w.__recording = false
    const frames = w.__frames.slice(2)
    if (!frames.length) return null
    const sorted = frames.slice().sort((a, b) => a - b)
    const sum = frames.reduce((a, b) => a + b, 0)
    return {
      frames: frames.length,
      meanFrameMs: Math.round((sum / frames.length) * 100) / 100,
      p95FrameMs: Math.round(sorted[Math.floor(sorted.length * 0.95)] * 100) / 100,
      longFrames: frames.filter((f) => f > 32).length,
    }
  })
}

/** Cost of switching the active page in a multi-page design. */
async function benchPageSwitch(page) {
  await page.locator('.artboards .btn').click()
  await page.waitForTimeout(500)
  await page.locator('.artboards .item-add').click()
  await page.waitForTimeout(600)
  const started = Date.now()
  for (let i = 0; i < 6; i++) {
    await page.locator('.artboards .item-box').nth(i % 2).click()
    await page.waitForTimeout(120)
  }
  return Date.now() - started
}

async function run() {
  fs.mkdirSync(OUT, { recursive: true })
  const browser = await chromium.launch()
  const report = {}

  for (const target of TARGETS) {
    const cold = []
    for (let i = 0; i < RUNS; i++) {
      cold.push((await benchColdLoad(browser, target.url)).canvasReady)
    }

    const addWidgets = []
    const drag = []
    const zoom = []
    const pageSwitch = []

    for (let i = 0; i < RUNS; i++) {
      const page = await newPage(browser, target.url)
      addWidgets.push(await benchAddWidgets(page, 30))
      const dragResult = await benchDrag(page)
      dragResult && drag.push(dragResult)
      const zoomResult = await benchZoom(page)
      zoomResult && zoom.push(zoomResult)
      pageSwitch.push(await benchPageSwitch(page))
      await page.close()
    }

    report[target.name] = {
      coldLoadMs: stats(cold),
      add30WidgetsMs: stats(addWidgets),
      dragMeanFrameMs: stats(drag.map((d) => d.meanFrameMs)),
      dragP95FrameMs: stats(drag.map((d) => d.p95FrameMs)),
      dragLongFrames: stats(drag.map((d) => d.longFrames)),
      zoomMeanFrameMs: stats(zoom.map((d) => d.meanFrameMs)),
      zoomP95FrameMs: stats(zoom.map((d) => d.p95FrameMs)),
      zoomLongFrames: stats(zoom.map((d) => d.longFrames)),
      pageSwitchMs: stats(pageSwitch),
    }
  }

  await browser.close()

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  fs.writeFileSync(path.join(OUT, `bench-${stamp}.json`), JSON.stringify(report, null, 2))
  fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify(report, null, 2))

  const metrics = Object.keys(report.vue)
  const pad = (s, n) => String(s).padEnd(n)
  console.log('')
  console.log(pad('metric', 22), pad('vue (median)', 16), pad('react (median)', 16), 'delta')
  console.log('-'.repeat(72))
  for (const metric of metrics) {
    const v = report.vue[metric].median
    const r = report.react[metric].median
    const delta = v === 0 ? 'n/a' : `${r <= v ? '' : '+'}${round(((r - v) / v) * 100)}%`
    console.log(pad(metric, 22), pad(v, 16), pad(r, 16), delta)
  }
  console.log('')
}

run()
