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

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, 'dist')
const MOCK = path.join(HERE, 'service', 'src', 'mock')
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
 * shapes, stickers, masks and photo lists.
 *
 * Upstream only serves these through the Express backend in service/, which
 * pulls in Puppeteer and a Chromium download just to render screenshots. That
 * is a lot of setup for what is really a folder of JSON, so the read-only
 * lookups are answered here instead and the panels have content out of the box.
 * Anything that writes still needs the real backend.
 */
function readMock(relative) {
  const file = path.join(MOCK, relative)
  if (!file.startsWith(MOCK) || !fs.existsSync(file)) return null
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

function contentLibrary(pathname, query) {
  const cate = query.get('cate')
  const type = query.get('type')
  const id = query.get('id')

  switch (pathname) {
    case '/design/cate':
      return readMock('cates.json')
    case '/design/list':
      // type=1 is the element/text component list, anything else is templates
      return { list: readMock(type === '1' ? `components/list/${cate}.json` : 'templates/list.json') || [] }
    case '/design/temp':
      return readMock(type === '1' ? `components/detail/${id}.json` : `templates/${id}.json`)
    case '/design/material':
      return { list: readMock(`materials/${cate}.json`) || [] }
    case '/design/imgs':
      return { list: readMock(`materials/photos/${cate || 1}.json`) || [] }
    default:
      // Routes that serve a signed-in user's own files and designs. There is
      // no account system here, so answer with nothing rather than a 404 the
      // app would surface as an error.
      return { list: [], records: [], total: 0 }
  }
}

const server = http.createServer((req, res) => {
  const [rawPath, rawQuery] = (req.url || '/').split('?')
  const url = decodeURIComponent(rawPath)

  if (url.startsWith('/design/')) {
    const result = contentLibrary(url, new URLSearchParams(rawQuery || ''))
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
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
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

  res.writeHead(200, {
    'Content-Type': type,
    'Cache-Control': immutable ? 'public, max-age=31536000, immutable' : 'no-cache',
  })
  fs.createReadStream(filePath).pipe(res)
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`\n  Design Studio is running at  http://127.0.0.1:${PORT}\n`)
  console.log('  Press Ctrl+C to stop.\n')
})
