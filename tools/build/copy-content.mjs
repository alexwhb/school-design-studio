/**
 * The bundled templates, elements and stickers, next to the bundle.
 *
 * `design-studio/server` reads them off disk, and in this repo they live under
 * `service/src/mock` — a folder that exists to run a Puppeteer screenshot
 * backend this fork does not use and does not ship. So the JSON alone is copied
 * into `dist-embed/content`, which `createContentLibrary` looks for first.
 *
 * Two megabytes, against the fifteen that `public/` already is. Copying it is
 * cheaper than a second npm package or an endpoint the host has to proxy.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')

export default function copyContent() {
  const from = path.join(ROOT, 'service', 'src', 'mock')
  const to = path.join(ROOT, 'dist-embed', 'content')
  fs.rmSync(to, { recursive: true, force: true })
  fs.cpSync(from, to, { recursive: true })
  let files = 0
  const count = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) count(path.join(dir, entry.name))
      else files++
    }
  }
  count(to)
  console.log(`content: ${files} files copied into dist-embed/content`)
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) copyContent()
