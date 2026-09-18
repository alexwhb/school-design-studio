/**
 * Downloads the latin subset of an open-licence English font set from Google
 * Fonts into public/fonts/, and writes the @font-face stylesheet plus the
 * font list the editor's font picker reads.
 *
 * Every family here is SIL Open Font License or Apache 2.0, so shipping the
 * files with the app is allowed. See public/fonts/LICENSES.md.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.resolve(import.meta.dirname, '..')
const OUT = path.join(ROOT, 'public', 'fonts')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

/** family, css family name, display name, weights, and how it reads on a page */
const FAMILIES = [
  ['Inter', 'Inter', 'Inter', [400, 700], 'sans'],
  ['Roboto', 'Roboto', 'Roboto', [400, 700], 'sans'],
  ['Open Sans', 'Open Sans', 'Open Sans', [400, 700], 'sans'],
  ['Lato', 'Lato', 'Lato', [400, 700], 'sans'],
  ['Montserrat', 'Montserrat', 'Montserrat', [400, 700], 'sans'],
  ['Poppins', 'Poppins', 'Poppins', [400, 700], 'sans'],
  ['Nunito', 'Nunito', 'Nunito', [400, 700], 'sans'],
  ['Quicksand', 'Quicksand', 'Quicksand', [400, 700], 'sans'],
  ['Archivo', 'Archivo', 'Archivo', [400, 700], 'sans'],
  ['Oswald', 'Oswald', 'Oswald', [400, 700], 'display'],
  ['Anton', 'Anton', 'Anton', [400], 'display'],
  ['Bebas Neue', 'Bebas Neue', 'Bebas Neue', [400], 'display'],
  ['Fredoka', 'Fredoka', 'Fredoka', [400, 700], 'display'],
  ['Merriweather', 'Merriweather', 'Merriweather', [400, 700], 'serif'],
  ['Playfair Display', 'Playfair Display', 'Playfair Display', [400, 700], 'serif'],
  ['Lora', 'Lora', 'Lora', [400, 700], 'serif'],
  ['Libre Baskerville', 'Libre Baskerville', 'Libre Baskerville', [400, 700], 'serif'],
  ['Source Serif 4', 'Source Serif 4', 'Source Serif', [400, 700], 'serif'],
  ['Caveat', 'Caveat', 'Caveat', [400, 700], 'handwriting'],
  ['Pacifico', 'Pacifico', 'Pacifico', [400], 'handwriting'],
  ['Space Grotesk', 'Space Grotesk', 'Space Grotesk', [400, 700], 'sans'],
  ['Karla', 'Karla', 'Karla', [400, 700], 'sans'],
  ['Spectral', 'Spectral', 'Spectral', [400, 700], 'serif'],
  ['DM Serif Display', 'DM Serif Display', 'DM Serif Display', [400], 'serif'],
  ['IBM Plex Mono', 'IBM Plex Mono', 'IBM Plex Mono', [400, 700], 'mono'],
  ['JetBrains Mono', 'JetBrains Mono', 'JetBrains Mono', [400, 700], 'mono'],
  // Appended, never reordered or removed: a brand kit stores a font by its id
  // and a saved design stores it by file path, so a family that moves changes
  // what somebody's heading font resolves to a year after they chose it.
  ['Raleway', 'Raleway', 'Raleway', [400, 700], 'sans'],
  ['Lexend', 'Lexend', 'Lexend', [400, 700], 'sans'],
  ['Atkinson Hyperlegible', 'Atkinson Hyperlegible', 'Atkinson Hyperlegible', [400, 700], 'sans'],
  ['Archivo Narrow', 'Archivo Narrow', 'Archivo Narrow', [400, 700], 'sans'],
  ['Barlow Condensed', 'Barlow Condensed', 'Barlow Condensed', [400, 700], 'sans'],
  ['Roboto Slab', 'Roboto Slab', 'Roboto Slab', [400, 700], 'serif'],
  ['EB Garamond', 'EB Garamond', 'EB Garamond', [400, 700], 'serif'],
  ['Alfa Slab One', 'Alfa Slab One', 'Alfa Slab One', [400], 'display'],
  ['Lilita One', 'Lilita One', 'Lilita One', [400], 'display'],
  ['Abril Fatface', 'Abril Fatface', 'Abril Fatface', [400], 'display'],
  ['Patrick Hand', 'Patrick Hand', 'Patrick Hand', [400], 'handwriting'],
  ['Permanent Marker', 'Permanent Marker', 'Permanent Marker', [400], 'handwriting'],
]

const slug = (s) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

async function cssFor(family, weights) {
  const q = `family=${encodeURIComponent(family)}:wght@${weights.join(';')}&display=swap`
  const res = await fetch(`https://fonts.googleapis.com/css2?${q}`, {
    headers: { 'User-Agent': UA },
  })
  if (!res.ok) throw new Error(`${family}: css ${res.status}`)
  return res.text()
}

/** Pull the latin (not latin-ext) block for each weight. */
function latinUrls(css, weights) {
  const blocks = css.split('@font-face').slice(1)
  const found = {}
  for (const b of blocks) {
    // the latin subset is the one covering basic ASCII
    if (!/unicode-range:[^;]*U\+0000-00FF/.test(b)) continue
    const w = b.match(/font-weight:\s*(\d+)/)?.[1]
    const url = b.match(/url\((https:[^)]+\.woff2)\)/)?.[1]
    if (w && url && weights.includes(Number(w)) && !found[w]) found[w] = url
  }
  return found
}

await fs.mkdir(OUT, { recursive: true })

const faces = []
const list = []
let id = 1

for (const [family, cssName, alias, weights, kind] of FAMILIES) {
  const css = await cssFor(family, weights)
  const urls = latinUrls(css, weights)
  // Google serves a single variable file for most families, so the 400 and 700
  // URLs are often the same bytes. Ship it once and declare a weight range;
  // the browser then interpolates real bold off the wght axis.
  const got = []
  const byUrl = new Map()
  for (const w of weights) {
    const url = urls[w]
    if (!url) {
      console.warn(`  ! ${family} ${w}: no latin subset found`)
      continue
    }
    if (byUrl.has(url)) {
      byUrl.get(url).weights.push(w)
      continue
    }
    byUrl.set(url, { weights: [w] })
  }
  for (const [url, entry] of byUrl) {
    const ws = entry.weights
    const file = `${slug(family)}-${ws.join('-')}.woff2`
    // A file that has already shipped is left exactly as it is. Designs point
    // at their font by path and reflow if the metrics move underneath them, so
    // adding a family must not quietly restyle every design made before it.
    const dest = path.join(OUT, file)
    const existing = await fs.readFile(dest).catch(() => null)
    const buf = existing ?? Buffer.from(await (await fetch(url, { headers: { 'User-Agent': UA } })).arrayBuffer())
    if (!existing) await fs.writeFile(dest, buf)
    const descriptor = ws.length > 1 ? `${Math.min(...ws)} ${Math.max(...ws)}` : String(ws[0])
    faces.push(`@font-face {\n  font-family: '${cssName}';\n  font-style: normal;\n  font-weight: ${descriptor};\n  font-display: swap;\n  src: url('/fonts/${file}') format('woff2');\n}`)
    got.push({ w: Math.min(...ws), ws, file, size: buf.length })
  }
  if (!got.length) continue
  const regular = got.find((g) => g.ws.includes(400)) || got[0]
  list.push({
    id: id++,
    oid: 0,
    value: cssName,
    alias,
    kind,
    preview: '',
    url: `/fonts/${regular.file}`,
    bold: got.some((g) => g.w === 700),
  })
  console.log(`${family.padEnd(20)} ${got.map((g) => `${g.w}:${(g.size / 1024).toFixed(0)}kb`).join(' ')}`)
}

await fs.writeFile(path.join(OUT, 'fonts.css'), faces.join('\n\n') + '\n')
await fs.writeFile(path.join(import.meta.dirname, 'font-list.json'), JSON.stringify(list, null, 2))

const total = faces.length
console.log(`\n${list.length} families, ${total} files -> ${OUT}`)
