/**
 * Captures a walkthrough of the editor into a folder.
 *
 *   node screenshots.mjs [outDir] [baseUrl]
 */
import { chromium } from '/Users/alexblack/Projects/Personal/Websites/school-planner/node_modules/playwright/index.mjs'
import fs from 'node:fs/promises'
import path from 'node:path'

const OUT =
	process.argv[2] ||
	path.join(process.env.HOME, 'Desktop', 'design-studio-screenshots')
const BASE = process.argv[3] || 'http://127.0.0.1:4173'
const W = 1680
const H = 1050

await fs.mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({
	viewport: { width: W, height: H },
	deviceScaleFactor: 2,
})
const shot = async (name) => {
	await page.screenshot({ path: path.join(OUT, name) })
	console.log('  ✓', name)
}
const pause = (ms) => page.waitForTimeout(ms)
const click = async (locator, ms = 700) => {
	await locator
		.click({ timeout: 8000 })
		.catch((e) => console.log('  ! click failed:', String(e).split('\n')[0]))
	await pause(ms)
}

await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
await pause(4000)

console.log('capturing to', OUT)

// 1. the editor as it opens
await shot('01-editor-overview.png')

// 2. text presets
await click(page.getByText('Text', { exact: true }).first(), 900)
await shot('02-text-panel.png')

// 3. add a heading and a line of body text, then select it
await pause(600)
await click(page.getByText('Heading', { exact: true }).first(), 1200)
await page.evaluate(() => {
	const el = document.querySelector('.w-text .edit-text')
	if (el) {
		el.innerHTML = 'Autumn Concert'
		el.dispatchEvent(new Event('input', { bubbles: true }))
		el.dispatchEvent(new Event('blur', { bubbles: true }))
	}
})
await pause(500)
await click(page.getByText('Body text', { exact: true }).first(), 1000)
await page.evaluate(() => {
	const els = document.querySelectorAll('.w-text .edit-text')
	const el = els[els.length - 1]
	if (el) {
		el.innerHTML = 'Thursday 12 November · 7pm · School Hall'
		el.dispatchEvent(new Event('input', { bubbles: true }))
		el.dispatchEvent(new Event('blur', { bubbles: true }))
	}
})
await pause(600)
await click(page.locator('.w-text').first(), 800)
await shot('03-text-selected.png')

// 4. the font picker, showing the English families
await click(
	page.locator('#w-text-style .value-select .input-wrap').first(),
	1000,
)
await shot('04-font-picker.png')
await page.keyboard.press('Escape').catch(() => {})
await pause(400)
await page.mouse.click(830, 900)
await pause(400)

// 5. the export menu — the PowerPoint options
await click(page.locator('.export-caret'), 900)
await shot('05-export-menu.png')
await page.keyboard.press('Escape').catch(() => {})
await pause(500)

// 6. the elements panel
await click(page.getByText('Elements', { exact: true }).first(), 1400)
await shot('06-elements-panel.png')

// 7. the tools panel
await click(page.getByText('Tools', { exact: true }).first(), 1400)
await shot('07-tools-panel.png')

// 8. pages: add a second one and open the strip
await click(page.locator('.artboards .btn').first(), 700)
await click(page.locator('.item-add').first(), 1200)
await shot('08-pages.png')

// 9. layers
await click(page.getByText('Layers', { exact: true }).first(), 900)
await shot('09-layers.png')

// 10. the new-design dialog, with school page sizes
await click(page.getByText('Settings', { exact: true }).first(), 400)
await click(page.getByText('File', { exact: true }).first(), 700)
await click(page.getByText('New design', { exact: true }).first(), 1200)
await shot('10-new-design-sizes.png')

await browser.close()
console.log('\ndone —', OUT)
