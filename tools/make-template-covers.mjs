/**
 * Screenshots each generated template and writes its thumbnail.
 *
 * The gallery lays its grid out from the width/height in list.json and fills
 * each cell with the cover image, so a template with no cover is an invisible
 * one. There is no way to render a page outside the editor — the widgets are
 * React components and the fonts load as web fonts — so this drives the real app
 * and screenshots the canvas.
 *
 * Start the app first, then:
 *
 *   node make-template-covers.mjs [baseUrl] [id...]     # default http://127.0.0.1:4173
 *   node make-template-covers.mjs --pack=slide-themes   # one pack rather than all
 *
 * Covers land in public/covers and, if a build is already sitting there, in
 * dist/covers too, so `npm run serve` picks them up without a rebuild.
 */
import { chromium } from '/Users/alexblack/Projects/Personal/Websites/school-planner/node_modules/playwright/index.mjs'
import fs from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const args = process.argv.slice(2)
const packArg = args.find((arg) => arg.startsWith('--pack='))
const positional = args.filter((arg) => !arg.startsWith('--'))

const BASE = positional[0] || 'http://127.0.0.1:4173'
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'covers')
const DIST_OUT = path.join(ROOT, 'dist', 'covers')
const LIST = path.join(ROOT, 'service', 'src', 'mock', 'templates', 'list.json')

// Every generated template carries a pack marker; --pack narrows the run to
// one of them, and without it every packed template is shot. Any ids after the
// base URL narrow it further, which is the difference between a two-second
// check on one layout and re-shooting all of them.
const PACK = packArg?.slice('--pack='.length)
const only = new Set(positional.slice(1))
const templates = JSON.parse(await fs.readFile(LIST, 'utf8')).filter(
	(item) =>
		(PACK ? item.pack === PACK : Boolean(item.pack)) &&
		(only.size === 0 || only.has(String(item.id))),
)
if (!templates.length) {
	console.error(
		`No ${PACK ? `"${PACK}"` : 'packed'} templates in list.json. Run the generator first.`,
	)
	process.exit(1)
}

await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({
	viewport: { width: 1600, height: 1000 },
	deviceScaleFactor: 2,
})

let failed = 0
for (const template of templates) {
	await page.goto(`${BASE}/home?tempid=${template.id}`, {
		waitUntil: 'domcontentloaded',
	})

	// Wait for the canvas to hold every layer, rather than a fixed sleep — the
	// web fonts and the inline SVGs both resolve after the first paint, and a
	// cover shot too early has the right shapes in the wrong typeface.
	const ready = await page
		.waitForFunction(
			() => {
				const canvas = document.getElementById('page-design-canvas')
				if (!canvas) return false
				const drawn = canvas.querySelectorAll(
					'.w-text, .w-svg, .w-image',
				).length
				return drawn > 0 && document.fonts.status === 'loaded' ? drawn : false
			},
			null,
			{ timeout: 20000 },
		)
		.catch(() => null)

	if (!ready) {
		console.log(`  ! ${template.id} (${template.title}): nothing rendered`)
		failed += 1
		continue
	}
	await page.waitForTimeout(800)

	// Deselect, so the transform handles are not baked into the thumbnail.
	await page.mouse.click(20, 900)
	await page.waitForTimeout(400)

	// The zoom control and the artboard strip float over the bottom of the well,
	// inside the area this screenshot covers, so without this a cover of a poster
	// has "Fit" printed in its corner.
	await page.addStyleTag({
		content: `
			.moveable-control-box, .moveable-control, .moveable-line, .moveable-area,
			.page-resize, .resize__bar, .artboards, .zoom-control-wrap { display: none !important; }
			#page-design-canvas .layer, #page-design-canvas .layer:hover { outline: none !important; }
		`,
	})

	const file = `template-${template.id}.png`
	await page
		.locator('#page-design-canvas')
		.screenshot({ path: path.join(OUT, file) })
	if (existsSync(DIST_OUT))
		await fs.copyFile(path.join(OUT, file), path.join(DIST_OUT, file))
	console.log(`  ✓ ${file}  ${template.title}`)
}

await browser.close()
process.exit(failed ? 1 : 0)
