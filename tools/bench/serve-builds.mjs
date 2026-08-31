import http from 'node:http'
import fs from 'node:fs'
import path from 'node:path'
import { contentLibrary } from '../../server/content-library.mjs'

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon',
}

function serve(root, port, label) {
  const server = http.createServer(async (req, res) => {
    const [rawPath, rawQuery] = (req.url || '/').split('?')
    if (rawPath.startsWith('/design/')) {
      const result = await contentLibrary(decodeURIComponent(rawPath), new URLSearchParams(rawQuery || ''))
      res.setHeader('Content-Type', 'application/json; charset=utf-8')
      res.end(JSON.stringify({ code: 200, msg: 'ok', result: result ?? undefined }))
      return
    }
    let filePath = path.join(root, decodeURIComponent(rawPath))
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(root, 'index.html')
    }
    if (!fs.existsSync(filePath)) {
      res.statusCode = 404
      res.end('not found')
      return
    }
    res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream')
    fs.createReadStream(filePath).pipe(res)
  })
  server.listen(port, '127.0.0.1', () => console.log(`${label}: http://127.0.0.1:${port}`))
  return server
}

const root = process.cwd()
serve(path.join(root, 'dist'), 4874, 'vue-prod')
serve(path.join(root, 'dist-react'), 4873, 'react-prod')
