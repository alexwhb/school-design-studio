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

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist')
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

const server = http.createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])

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
