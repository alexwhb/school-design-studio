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

// Whatever the panel is currently listing, rather than a hand-kept range: the
// text presets are ids 1-3 and 7-13, so a literal list here goes stale the
// moment make-samples.py adds one.
const SAMPLES = (await Promise.all(['text.json', 'comp.json'].map(async (name) => JSON.parse(await fs.readFile(path.join(LIST, name), 'utf8')))))
  .flat()
  .map((item) => item.id)
  .sort((a, b) => a - b)
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

/**
 * Width of a string as the browser will actually draw it.
 *
 * A widget's text can hold newlines — the canvas renders it with `pre-wrap`,
 * so those are real line breaks — and the longest line is what has to fit,
 * not the whole string run together.
 */
const measureText = (page, text, family, size, weight) =>
  page.evaluate(
    async ({ text, family, size, weight }) => {
      await document.fonts.load(`${weight} ${size}px "${family}"`)
      const ctx = document.createElement('canvas').getContext('2d')
      ctx.font = `${weight} ${size}px "${family}", sans-serif`
      return Math.max(...text.split('\n').map((line) => ctx.measureText(line).width))
    },
    { text, family, size, weight },
  )

/** Characters in the longest line — the number of letter-spacing gaps. */
const longestLine = (text) => Math.max(...text.split('\n').map((line) => line.length))

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
      const measured = await measureText(page, text, family, widget.fontSize, widget.fontWeight || 400)
      // measureText draws the glyphs and nothing else. The editor adds
      // (fontSize * letterSpacing / 100) to every gap, which on a tracked
      // line like "FAMILIES WELCOME" is most of its width.
      const run = measured + ((widget.fontSize * (widget.letterSpacing || 0)) / 100) * Math.max(longestLine(text) - 1, 0)
      // A vertical run grows down the box, not across it, so it is the
      // height that has to hold it. Measuring it against the width would
      // compare a line of type to the thickness of the column it is set
      // in and shrink it to nothing.
      const limit = String(widget.writingMode || '').startsWith('vertical') ? widget.height : widget.width
      if (!limit || run <= limit) continue
      const scaled = Math.floor(widget.fontSize * (limit / run) * 0.97)
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
  const measured = await measureText(page, text, data.fontClass?.value || 'Inter', data.fontSize, data.fontWeight || 400)

  // measureText knows nothing about the editor's own letter spacing, and the
  // box it sizes is only the lettering; everything the effect stack paints
  // outside that is added by effectBleed. The page is then laid out around
  // the result — the lettering centred horizontally, and pushed down far
  // enough that a glow or a lean above it still has page to fall on. Pass two
  // crops to the page, so room that is not on the page is room that is lost.
  const gaps = Math.max(longestLine(text) - 1, 0)
  const spacing = ((data.fontSize * (data.letterSpacing || 0)) / 100) * gaps
  // The box has to hold every line the preset is set on, not just the first.
  const lineBox = data.fontSize * (data.lineHeight || 1.2) * text.split('\n').length
  // A preset with a background colour is a plate its words sit on, and the
  // editor has no padding to set. The vertical air comes from the preset's
  // own line height; the sides are bought here.
  const sidePad = data.backgroundColor ? Math.round(data.fontSize * 0.5) : 0

  data.width = Math.ceil(measured + spacing + sidePad * 2 + data.fontSize * 0.1)
  const bleed = effectBleed(data)
  data.width = Math.ceil(data.width + bleed.x * 2)
  data.height = Math.ceil(lineBox)
  data.left = PAD
  data.top = Math.ceil(PAD + bleed.y)
  record.data = JSON.stringify(data)
  record.width = data.width + PAD * 2
  record.height = Math.ceil(data.top + lineBox + bleed.y + PAD)
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
  const record = JSON.parse(await fs.readFile(path.join(DETAIL, `${id}.json`), 'utf8'))
  await page.goto(`${BASE}/home?tempid=${id}&tempType=1`, {
    waitUntil: 'domcontentloaded',
  })
  await page.waitForTimeout(3500)
  await page.addStyleTag({ content: TRANSPARENT_PAGE })

  // Deselect, so the transform handles are not baked into the thumbnail.
  await page.mouse.click(760, 120)
  await page.waitForTimeout(600)

  // The dev server reloads the page whenever anything under src/ is saved,
  // which destroys the execution context mid-measure. One retry turns that
  // from a lost run into a lost second.
  const shot = { pageWidth: record.width, bleed: effectBleed(JSON.parse(record.data)) }
  const box = await measureArtwork(page, shot).catch(() => measureArtwork(page, shot))
  if (!box || box.width < 4 || box.height < 4) {
    console.log(`  ! ${id}: nothing on the canvas`)
    continue
  }

  await page.screenshot({
    path: path.join(OUT, `sample-${id}.png`),
    omitBackground: true,
    clip: box,
  })
  console.log(`  ✓ sample-${id}.png  ${Math.round(box.width)}x${Math.round(box.height)}`)
}

/**
 * How far outside its own box an effect stack paints, in design pixels.
 *
 * The crop below is the widget's rectangle as the browser lays it out, and the
 * editor sets a text widget's height from its line box — so a glow, a lean or
 * a descender is simply outside the rectangle and would be sliced off. This is
 * how much to give back. Grouped samples sit on a backdrop that already
 * contains them, so they need none of it.
 */
function effectBleed(data) {
  if (Array.isArray(data)) return { x: 0, y: 0 }
  const layers = data.textEffects || []
  const size = data.fontSize || 0
  const lineBox = size * (data.lineHeight || 1.2)
  const widest = (pick) => Math.max(0, ...layers.map(pick), 0)
  const lean = (degrees, across) => Math.tan((Math.abs(degrees || 0) * Math.PI) / 180) * across

  const stroke = widest((e) => (e?.stroke?.enable ? e.stroke.width || 0 : 0))
  const blur = widest((e) => (e?.shadow?.enable ? e.shadow.blur || 0 : 0))
  return {
    x: stroke + blur + widest((e) => (e?.shadow?.enable ? Math.abs(e.shadow.offsetX || 0) : 0)) + widest((e) => (e?.offset?.enable ? Math.abs(e.offset.x || 0) : 0)) + widest((e) => (e?.skew?.enable ? lean(e.skew.x, lineBox) : 0)),
    // A display face routinely hangs below the line box it is set in, so
    // every sample gets a little vertical room whether or not it has effects.
    y: stroke + blur + size * 0.35 + widest((e) => (e?.shadow?.enable ? Math.abs(e.shadow.offsetY || 0) : 0)) + widest((e) => (e?.offset?.enable ? Math.abs(e.offset.y || 0) : 0)) + widest((e) => (e?.skew?.enable ? lean(e.skew.y, data.width || 0) : 0)),
  }
}

/** The rectangle the artwork occupies, plus its bleed, clamped to the page. */
function measureArtwork(page, { pageWidth, bleed }) {
  return page.evaluate(
    ({ pageWidth, bleed }) => {
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

      // The canvas is zoomed to fit the well, so a design pixel is not a
      // screen pixel and the bleed, which arrives in design pixels, has to be
      // scaled with it. The clamp stops at the page: the page itself paints
      // transparent here, but the panel of template thumbnails beyond it does
      // not, and a wide sample reaches it.
      const scale = pageWidth ? page.width / pageWidth : 1
      const padX = (bleed?.x || 0) * scale
      const padY = (bleed?.y || 0) * scale
      const left = Math.max(l - padX, page.left)
      const top = Math.max(t - padY, page.top)
      const right = Math.min(r + padX, page.right)
      const bottom = Math.min(b + padY, page.bottom)
      return { x: left, y: top, width: right - left, height: bottom - top }
    },
    { pageWidth, bleed },
  )
}

await browser.close()

// ---- point the panel at the local thumbnails ------------------------------
for (const name of ['text.json', 'comp.json']) {
  const file = path.join(LIST, name)
  const items = JSON.parse(await fs.readFile(file, 'utf8'))
  for (const item of items) {
    item.cover = `/covers/sample-${item.id}.png`
    const record = JSON.parse(await fs.readFile(path.join(DETAIL, `${item.id}.json`), 'utf8'))
    item.width = record.width
    item.height = record.height
  }
  await fs.writeFile(file, JSON.stringify(items, null, 2) + '\n')
  console.log(`  ${name}: covers and sizes updated`)
}
