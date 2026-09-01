import { chromium } from '/Users/alexblack/Projects/Personal/Websites/school-planner/node_modules/playwright/index.mjs'
const out = process.argv[2] || '/tmp/state.png'
const panel = process.argv[3] || 'Text'
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } })
await page.goto('http://127.0.0.1:5273/home', { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)
await page.getByText('Text', { exact: true }).first().click()
await page.waitForTimeout(700)
await page.getByText('Heading', { exact: true }).first().click()
await page.waitForTimeout(900)
await page.evaluate(() => {
	const el = document.querySelector('.w-text .edit-text')
	if (el) {
		el.innerHTML = 'Autumn Concert'
		el.dispatchEvent(new Event('input', { bubbles: true }))
		el.dispatchEvent(new Event('blur', { bubbles: true }))
	}
})
await page.waitForTimeout(500)
await page.locator('.w-text').first().click({ force: true })
await page.waitForTimeout(600)
if (panel !== 'Text') {
	await page.getByText(panel, { exact: true }).first().click()
	await page.waitForTimeout(1200)
}
await page.screenshot({ path: out })
console.log('saved', out)
await browser.close()
