/**
 * Serves the built app from dist/.
 *
 * Deliberately dependency-free so `npm start` works on a fresh checkout with
 * nothing extra to install. Falls back to index.html for unknown paths, which
 * is what the client-side router needs.
 *
 *   node serve.mjs [port]
 */
import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { contentLibrary, hasUnsplashKey } from './server/content-library.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, 'dist')
const PORT = Number(process.argv[2] || process.env.PORT || 4173)

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

if (!fs.existsSync(ROOT)) {
  console.error('dist/ is missing. Run `npm run build` first.')
  process.exit(1)
}

/**
 * The content library that ships in service/src/mock — sample templates,
 * shapes, stickers, masks — plus the Unsplash-backed Photos panel.
 *
 * Upstream only serves these through the Express backend in service/, which
 * pulls in Puppeteer and a Chromium download just to render screenshots. That
 * is a lot of setup for what is really a folder of JSON, so the read-only
 * lookups are answered here instead and the panels have content out of the box.
 * Anything that writes still needs the real backend.
 *
 * The handler lives in server/content-library.mjs because the Vite dev server
 * mounts the same one.
 */

const server = http.createServer(async (req, res) => {
  const [rawPath, rawQuery] = (req.url || '/').split('?')
  const url = decodeURIComponent(rawPath)

  if (url.startsWith('/design/')) {
    const result = await contentLibrary(url, new URLSearchParams(rawQuery || ''))
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ code: 200, msg: 'ok', result: result ?? undefined }))
    return
  }

  // Resolve inside dist/ only, so a crafted path cannot escape the web root.
  let filePath = path.join(ROOT, url)
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403).end('Forbidden')
    return
  }
  // `throwIfNoEntry: false` rather than existsSync-then-stat: the two-call
  // version throws if the file disappears between them, and a synchronous
  // throw in a request handler is another way to lose the whole server.
  const stat = fs.statSync(filePath, { throwIfNoEntry: false })
  if (stat?.isDirectory()) {
    filePath = path.join(filePath, 'index.html')
  }
  if (!fs.existsSync(filePath)) {
    // Hand extensionless paths ("/home") to the SPA router, and 404 anything
    // that asked for a specific file. Falling back for everything would answer
    // the app's own API calls with index.html, and a 200 full of HTML is far
    // more confusing to debug than an honest 404.
    if (path.extname(url)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found')
      return
    }
    filePath = path.join(ROOT, 'index.html')
  }

  const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
  const immutable = filePath.includes(`${path.sep}assets${path.sep}`) || filePath.includes(`${path.sep}fonts${path.sep}`)

  const stream = fs.createReadStream(filePath)

  // Headers wait for the file to actually open. Everything above this point
  // only proves the file existed a moment ago, and `vite build` empties dist/
  // before rewriting it — so on a shared checkout the file can be gone by the
  // time the stream opens. Committing to a 200 first would leave nothing to
  // answer with when that happens.
  stream.on('open', () => {
    res.writeHead(200, {
      'Content-Type': type,
      'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
    })
    stream.pipe(res)
  })

  // Without this listener Node promotes the stream's error to an uncaught
  // exception and the whole server exits — one unreadable file taking down
  // every other request, which is what a concurrent rebuild used to do.
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '5' })
    }
    res.end('Rebuilding, try again in a moment.')
  })

  // A browser that navigates away mid-download leaves the read open otherwise.
  res.on('close', () => stream.destroy())
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Design Studio is running at  http://127.0.0.1:${PORT}\n`)
  if (!hasUnsplashKey) {
    console.log('  Photos: bundled samples only. Set UNSPLASH_ACCESS_KEY in .env.local to turn on stock photo search.\n')
  }
  console.log('  Press Ctrl+C to stop.\n')
})
