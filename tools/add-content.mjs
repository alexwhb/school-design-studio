/**
 * Adds shapes, stickers and photo-masks to the editor's content library from a
 * folder of files, so you never have to hand-write the JSON.
 *
 *   node add-content.mjs shapes   ~/my-svgs        # -> Elements > Shapes
 *   node add-content.mjs stickers ~/my-pngs        # -> Elements > Stickers
 *   node add-content.mjs masks    ~/my-mask-pngs   # -> Elements > Masks
 *
 * Add --replace to start the category from scratch instead of appending.
 *
 * Shapes are inlined as SVG markup, so they need no hosting and stay
 * recolourable. Stickers and masks are copied into public/ and referenced by
 * path, so nothing depends on a third-party CDN.
 *
 * A mask is a solid silhouette: white (or any solid colour) where the photo
 * should show, transparent everywhere else.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const MATERIALS = path.join(ROOT, 'service', 'src', 'mock', 'materials')
const PUBLIC = path.join(ROOT, 'public')

const KINDS = {
  shapes: { file: 'svg.json', type: 'svg', exts: ['.svg'], dir: null },
  stickers: {
    file: 'png.json',
    type: 'image',
    exts: ['.png', '.webp', '.jpg', '.jpeg'],
    dir: 'stickers',
  },
  masks: {
    file: 'mask.json',
    type: 'mask',
    exts: ['.png', '.webp', '.svg'],
    dir: 'masks',
  },
}

const [kind, source] = process.argv.slice(2).filter((a) => !a.startsWith('--'))
const replace = process.argv.includes('--replace')

if (!KINDS[kind] || !source) {
  console.error('usage: node add-content.mjs <shapes|stickers|masks> <folder> [--replace]')
  process.exit(1)
}

const MIN_PLACED_SIZE = 200

const spec = KINDS[kind]
const target = path.join(MATERIALS, spec.file)

/** Reads width/height out of an SVG's viewBox, or its width/height attributes. */
function svgSize(markup) {
  const viewBox = markup.match(/viewBox\s*=\s*"([^"]+)"/i)
  if (viewBox) {
    const [, , w, h] = viewBox[1]
      .trim()
      .split(/[\s,]+/)
      .map(Number)
    if (w > 0 && h > 0) return { width: w, height: h }
  }
  const w = Number(markup.match(/\bwidth\s*=\s*"([\d.]+)/i)?.[1])
  const h = Number(markup.match(/\bheight\s*=\s*"([\d.]+)/i)?.[1])
  return { width: w || 100, height: h || 100 }
}

/**
 * Swaps literal colours for the editor's `{{colors[N]}}` placeholders.
 *
 * This is what makes a shape recolourable: wSvg.tsx walks the parsed SVG and
 * substitutes each placeholder with the matching entry from the widget's
 * `colors`. A shape with hard-coded hex still draws, but the colour picker
 * does nothing to it.
 */
function templateColours(markup) {
  const colours = []
  // Icon sets ship stroke icons as stroke="currentColor". Nothing resolves that
  // once the markup is parsed onto the canvas, so give it a real starting
  // colour and let it be recoloured like any other.
  const DEFAULT_INK = '#333333'
  const templated = markup.replace(/(fill|stroke)\s*=\s*"(#[0-9a-f]{3,8}|currentColor)"/gi, (_, attr, raw) => {
    const hex = raw.toLowerCase() === 'currentcolor' ? DEFAULT_INK : raw
    const value = hex.toUpperCase()
    let i = colours.indexOf(value)
    if (i === -1) {
      if (colours.length >= 6) return `${attr}="${hex}"` // leave the long tail alone
      colours.push(value)
      i = colours.length - 1
    }
    return `${attr}="{{colors[${i}]}}"`
  })
  return { markup: templated, colours }
}

async function imageSize(file) {
  const buf = await fs.readFile(file)
  // PNG: width/height are big-endian 32-bit ints in the IHDR chunk.
  if (buf.slice(1, 4).toString() === 'PNG') {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) }
  }
  return { width: 1000, height: 1000 }
}

const existing = replace ? [] : JSON.parse(await fs.readFile(target, 'utf8').catch(() => '[]'))
let nextId = Math.max(0, ...existing.map((i) => Number(i.id) || 0)) + 1

const files = (await fs.readdir(source)).filter((f) => spec.exts.includes(path.extname(f).toLowerCase())).sort()

if (!files.length) {
  console.error(`No ${spec.exts.join('/')} files in ${source}`)
  process.exit(1)
}

if (spec.dir) await fs.mkdir(path.join(PUBLIC, spec.dir), { recursive: true })

const added = []
for (const name of files) {
  const from = path.join(source, name)
  const title = path.basename(name, path.extname(name)).replace(/[-_]+/g, ' ').trim()
  const id = nextId++

  // A mask is applied as a CSS -webkit-mask-image, so an SVG silhouette works
  // as well as a PNG and stays sharp at any size. CSS cannot take raw markup
  // in url(), so inline it as a data URI.
  if (spec.type === 'mask' && path.extname(name).toLowerCase() === '.svg') {
    const markup = (await fs.readFile(from, 'utf8')).replace(/\s+/g, ' ').trim()
    const { width, height } = svgSize(markup)
    const uri = `data:image/svg+xml;base64,${Buffer.from(markup, 'utf8').toString('base64')}`
    added.push({
      id,
      title,
      width,
      height,
      type: 'mask',
      model: '{}',
      thumb: uri,
      url: uri,
      state: 1,
    })
    console.log(`  + ${title}`)
    continue
  }

  if (spec.type === 'svg') {
    const raw = (await fs.readFile(from, 'utf8')).replace(/\s+/g, ' ').trim()
    const { markup, colours } = templateColours(raw)

    // width/height decide how big the shape lands on the page, not how it is
    // drawn — the viewBox handles that. Icon sets use a 24x24 viewBox, which
    // would drop a 24px icon onto a 1920px slide, so scale small artwork up to
    // a usable default while keeping its proportions.
    let { width, height } = svgSize(raw)
    const longest = Math.max(width, height)
    if (longest < MIN_PLACED_SIZE) {
      const scale = MIN_PLACED_SIZE / longest
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }
    added.push({
      id,
      title,
      width,
      height,
      type: 'svg',
      model: JSON.stringify(colours.length ? { colors: colours } : {}),
      // The panel previews a material with <el-image :src="thumb">, so the
      // markup cannot be used directly. Embedding it as a data URI keeps the
      // shape self-contained — no PNG to generate, nothing to host.
      // The thumbnail is a plain <img>, so it needs the real colours rather
      // than the placeholders the canvas substitutes at render time.
      thumb: `data:image/svg+xml;base64,${Buffer.from(raw, 'utf8').toString('base64')}`,
      url: markup,
      state: 1,
    })
  } else {
    const dest = `${spec.dir}/${id}-${name.replace(/[^\w.-]+/g, '-')}`
    await fs.copyFile(from, path.join(PUBLIC, dest))
    const { width, height } = await imageSize(from)
    added.push({
      id,
      title,
      width,
      height,
      type: spec.type,
      model: '{}',
      thumb: `/${dest}`,
      url: `/${dest}`,
      state: 1,
    })
  }
  console.log(`  + ${title}`)
}

await fs.writeFile(target, JSON.stringify([...added, ...existing], null, 2) + '\n')
console.log(`\n${added.length} added to ${spec.file} (${added.length + existing.length} total).`)
console.log('Run `npm run build` if you are serving the production build.')
