/**
 * End-to-end check of the PowerPoint export.
 *
 * Drives the real editor: adds text, adds a second page, exports, then unzips
 * the .pptx and asserts the text actually made it into the slide XML.
 */
import { chromium } from '/Users/alexblack/Projects/Personal/Websites/school-planner/node_modules/playwright/index.mjs'
import fs from 'node:fs/promises'
import { execSync } from 'node:child_process'

const URL = process.argv[2] || 'http://127.0.0.1:5173/home'
const MODE = process.argv[3] || 'pptx-editable'
const OUT = '/tmp/pptx-test'

await fs.rm(OUT, { recursive: true, force: true })
await fs.mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
const errors = []
page.on('pageerror', (e) =>
	errors.push('PAGEERROR: ' + String(e).slice(0, 400)),
)
page.on('console', (m) => {
	if (m.type() === 'error' && !m.text().includes('ERR_CONNECTION_REFUSED'))
		errors.push('CONSOLE: ' + m.text().slice(0, 300))
})

await page.goto(URL, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)

// --- add a text element -------------------------------------------------
await page.getByText('Text', { exact: true }).first().click()
await page.waitForTimeout(800)
await page.getByText('Heading', { exact: true }).first().click()
await page.waitForTimeout(1200)

// type into it so we have a distinctive string to look for
const MARKER = 'Autumn Concert 2026'
const typed = await page.evaluate((marker) => {
	const el = document.querySelector('.w-text .edit-text')
	if (!el) return false
	el.innerHTML = marker
	el.dispatchEvent(new Event('input', { bubbles: true }))
	el.dispatchEvent(new Event('blur', { bubbles: true }))
	return true
}, MARKER)
await page.waitForTimeout(600)
console.log('text element seeded:', typed)

// --- add a second page --------------------------------------------------
await page
	.locator('.artboards .btn')
	.first()
	.click()
	.catch(() => {})
await page.waitForTimeout(500)
await page
	.locator('.item-add')
	.first()
	.click()
	.catch(() => {})
await page.waitForTimeout(900)
const pageCount = await page.locator('.item-box').count()
console.log('pages in the design:', pageCount)

await page.screenshot({ path: '/tmp/export-before.png' })

// --- export -------------------------------------------------------------
const downloadPromise = page.waitForEvent('download', { timeout: 90000 })
await page.locator('.export-caret').click()
await page.waitForTimeout(600)
await page.screenshot({ path: '/tmp/export-menu.png' })

const label = MODE === 'pptx-picture' ? 'PowerPoint (exact copy)' : 'PowerPoint'
await page.getByText(label, { exact: true }).first().click()

const download = await downloadPromise
const file = `${OUT}/${download.suggestedFilename()}`
await download.saveAs(file)
console.log('downloaded:', file, (await fs.stat(file)).size, 'bytes')

// --- inspect ------------------------------------------------------------
execSync(
	`cd ${OUT} && unzip -o -q "${download.suggestedFilename()}" -d unpacked`,
)
const slides = (await fs.readdir(`${OUT}/unpacked/ppt/slides`)).filter((f) =>
	f.endsWith('.xml'),
)
console.log('slides in the deck:', slides.length, slides.join(', '))

let foundText = false
let foundImage = false
for (const s of slides) {
	const xml = await fs.readFile(`${OUT}/unpacked/ppt/slides/${s}`, 'utf8')
	if (xml.includes(MARKER)) foundText = true
	if (xml.includes('<p:pic>')) foundImage = true
}
const media = await fs.readdir(`${OUT}/unpacked/ppt/media`).catch(() => [])

// slide dimensions
const pres = await fs.readFile(`${OUT}/unpacked/ppt/presentation.xml`, 'utf8')
const dims = pres.match(/sldSz[^/]*cx="(\d+)"\s+cy="(\d+)"/)
if (dims) {
	const EMU = 914400
	console.log(
		`slide size: ${(dims[1] / EMU).toFixed(2)}in x ${(dims[2] / EMU).toFixed(2)}in`,
	)
}

console.log('\n--- results ---')
console.log('editable text found in slide XML:', foundText)
console.log('picture shapes found:', foundImage, '| media files:', media.length)
if (errors.length)
	console.log('\nerrors:\n' + [...new Set(errors)].slice(0, 10).join('\n'))

await browser.close()

const expectText = MODE === 'pptx-editable'
if (expectText && !foundText) {
	console.log('\nFAIL: expected editable text in the deck')
	process.exit(1)
}
if (MODE === 'pptx-picture' && !foundImage) {
	console.log('\nFAIL: expected a picture on each slide')
	process.exit(1)
}
console.log('\nPASS')
