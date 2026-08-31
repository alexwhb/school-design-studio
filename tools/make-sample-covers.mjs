/**
 * Sizes the bundled sample components to their text, then regenerates their
 * thumbnails.
 *
 * Two reasons this exists:
 *
 *  - The widget widths were sized for the original Chinese wording. Four CJK
 *    glyphs at 180px fit the box; "Field Day" does not, so the text clipped.
 *    Pass one measures the real rendered width in the browser, with the actual
 *    font loaded, and writes the box size back.
 *  - The thumbnails were PNGs on a Chinese image host showing the old copy, so
 *    they kept showing Chinese after the samples were translated. Pass two
 *    screenshots each sample from the real editor and writes a local PNG.
 *
 *   node make-sample-covers.mjs [baseUrl]
 */
import { chromium } from '/Users/alexblack/Projects/Personal/Websites/school-planner/node_modules/playwright/index.mjs'
import fs from 'node:fs/promises'
import path from 'node:path'

const BASE = process.argv[2] || 'http://127.0.0.1:4173'
const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'covers')
const MOCK = path.join(ROOT, 'service', 'src', 'mock', 'components')
const DETAIL = path.join(MOCK, 'detail')
const LIST = path.join(MOCK, 'list')

const SAMPLES = [1, 2, 3, 4, 5, 6]
const PAD = 24

await fs.mkdir(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({
	viewport: { width: 1600, height: 1000 },
	deviceScaleFactor: 2,
})

// ---- pass one: size the single-text samples to their wording --------------
await page.goto(`${BASE}/home`, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(3000)

/** Width of a string as the browser will actually draw it. */
const measureText = (page, text, family, size, weight) =>
	page.evaluate(
		async ({ text, family, size, weight }) => {
			await document.fonts.load(`${weight} ${size}px "${family}"`)
			const ctx = document.createElement('canvas').getContext('2d')
			ctx.font = `${weight} ${size}px "${family}", sans-serif`
			return ctx.measureText(text).width
		},
		{ text, family, size, weight },
	)

for (const id of SAMPLES) {
	const file = path.join(DETAIL, `${id}.json`)
	const record = JSON.parse(await fs.readFile(file, 'utf8'))
	const data = JSON.parse(record.data)

	if (Array.isArray(data)) {
		// A grouped sample sits on a fixed decorative backdrop, so widening a text
		// box would push the words off the shape. Shrink the type to fit instead —
		// English is wider than the four CJK glyphs these were laid out for.
		let changed = false
		for (const widget of data) {
			if (widget.type !== 'w-text' || !widget.width) continue
			const text = decodeURIComponent(widget.text || '')
			if (!text) continue
			const family = widget.fontClass?.value || 'Inter'
			const width = await measureText(
				page,
				text,
				family,
				widget.fontSize,
				widget.fontWeight || 400,
			)
			if (width <= widget.width) continue
			const scaled = Math.floor(widget.fontSize * (widget.width / width) * 0.97)
			console.log(`  fit ${id}: "${text}" ${widget.fontSize} -> ${scaled}px`)
			widget.fontSize = scaled
			changed = true
		}
		if (changed) {
			record.data = JSON.stringify(data)
			await fs.writeFile(file, JSON.stringify(record))
		}
		continue
	}

	const text = decodeURIComponent(data.text || '')
	const measured = await page.evaluate(
		async ({ text, family, size, weight }) => {
			await document.fonts.load(`${weight} ${size}px "${family}"`)
			const ctx = document.createElement('canvas').getContext('2d')
			ctx.font = `${weight} ${size}px "${family}", sans-serif`
			return ctx.measureText(text).width
		},
		{
			text,
			family: data.fontClass?.value || 'Inter',
			size: data.fontSize,
			weight: data.fontWeight || 400,
		},
	)

	// measureText knows nothing about the editor's own spacing or effects, both
	// of which push glyphs past the measured width:
	//   - letterSpacing is applied as (fontSize * letterSpacing / 100) per gap
	//   - a stroke effect draws outward from the glyph edge on both sides
	const gaps = Math.max(text.length - 1, 0)
	const spacing = ((data.fontSize * (data.letterSpacing || 0)) / 100) * gaps
	const widestStroke = Math.max(
		0,
		...(data.textEffects || []).map((e) =>
			e?.stroke?.enable ? e.stroke.width || 0 : 0,
		),
	)
	const widestOffset = Math.max(
		0,
		...(data.textEffects || []).map((e) =>
			e?.offset?.enable ? Math.abs(e.offset.x || 0) : 0,
		),
	)
	const width = Math.ceil(
		measured + spacing + widestStroke * 2 + widestOffset + data.fontSize * 0.1,
	)
	const verticalOffset = Math.max(
		0,
		...(data.textEffects || []).map((e) =>
			e?.offset?.enable ? Math.abs(e.offset.y || 0) : 0,
		),
	)
	const height = Math.ceil(
		data.fontSize * (data.lineHeight || 1.2) +
			widestStroke * 2 +
			verticalOffset,
	)

	data.width = width
	data.height = height
	data.left = PAD
	data.top = PAD
	record.data = JSON.stringify(data)
	record.width = width + PAD * 2
	record.height = height + PAD * 2
	await fs.writeFile(file, JSON.stringify(record))
	console.log(`  sized ${id}: "${text}" -> ${record.width}x${record.height}`)
}

// ---- pass two: screenshot each sample -------------------------------------
// The page itself is painted out, so what lands in the PNG is the artwork on
// transparency. `omitBackground` alone is not enough — it clears the browser's
// backdrop, not an element that paints white — and the difference matters:
// with the paper baked in, every thumbnail carries a white slab that sits on
// the panel's tile and glares on the dark theme. Alpha lets the tile show
// through in whichever theme is on.
// Every layer behind the artwork has to go, not just the page: the app's own
// background is opaque, so leaving it in would simply show through wherever
// the page stopped painting.
const TRANSPARENT_PAGE = `
  html, body, #app, #page-design-index, .page-design-bg-color, .page-design-index-wrap,
  #main, #page-design, .out-page, #page-design-canvas,
  .shelter, .shelter-bg, .transparent-bg {
    background: transparent !important;
    box-shadow: none !important;
  }
  /* Editor chrome. The deselect click below usually clears the transform
     handles, but a sample whose artwork reaches the click point keeps them,
     and the hover outline on a layer survives either way. The artboard strip
     and the zoom control float over the bottom of the well, so a tall sample
     — the award badge is square — is clipped with them inside it. All of this
     used to be lost in the white paper; on transparency it is plainly there. */
  .moveable-control-box, .moveable-control, .moveable-line, .moveable-area,
  .page-resize, .resize__bar, .artboards, .zoom-control-wrap {
    display: none !important;
  }
  #page-design-canvas .layer,
  #page-design-canvas .layer:hover {
    outline: none !important;
  }
`

for (const id of SAMPLES) {
	await page.goto(`${BASE}/home?tempid=${id}&tempType=1`, {
		waitUntil: 'domcontentloaded',
	})
	await page.waitForTimeout(3500)
	await page.addStyleTag({ content: TRANSPARENT_PAGE })

	// Deselect, so the transform handles are not baked into the thumbnail.
	await page.mouse.click(760, 120)
	await page.waitForTimeout(600)

	const box = await page.evaluate(() => {
		const canvas = document.getElementById('page-design-canvas')
		if (!canvas) return null
		const page = canvas.getBoundingClientRect()
		const nodes = canvas.querySelectorAll('.w-text, .w-image, .w-svg')
		if (!nodes.length) return null

		let l = Infinity,
			t = Infinity,
			r = -Infinity,
			b = -Infinity
		for (const n of nodes) {
			const box = n.getBoundingClientRect()
			if (box.width < 2 || box.height < 2) continue
			l = Math.min(l, box.left)
			t = Math.min(t, box.top)
			r = Math.max(r, box.right)
			b = Math.max(b, box.bottom)
		}
		if (!Number.isFinite(l)) return null

		// Clamp to the page. Effect layers can overflow it, and anything past the
		// edge is the editor's grey background rather than artwork.
		return {
			x: Math.max(l, page.left),
			y: Math.max(t, page.top),
			width: Math.min(r, page.right) - Math.max(l, page.left),
			height: Math.min(b, page.bottom) - Math.max(t, page.top),
		}
	})

	if (!box || box.width < 4 || box.height < 4) {
		console.log(`  ! ${id}: nothing on the canvas`)
		continue
	}

	await page.screenshot({
		path: path.join(OUT, `sample-${id}.png`),
		omitBackground: true,
		clip: box,
	})
	console.log(
		`  ✓ sample-${id}.png  ${Math.round(box.width)}x${Math.round(box.height)}`,
	)
}

await browser.close()

// ---- point the panel at the local thumbnails ------------------------------
for (const name of ['text.json', 'comp.json']) {
	const file = path.join(LIST, name)
	const items = JSON.parse(await fs.readFile(file, 'utf8'))
	for (const item of items) {
		item.cover = `/covers/sample-${item.id}.png`
		const record = JSON.parse(
			await fs.readFile(path.join(DETAIL, `${item.id}.json`), 'utf8'),
		)
		item.width = record.width
		item.height = record.height
	}
	await fs.writeFile(file, JSON.stringify(items, null, 2) + '\n')
	console.log(`  ${name}: covers and sizes updated`)
}
