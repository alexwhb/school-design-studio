import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// @ts-expect-error -- plain ESM, no types; see server/content-library.mjs
import { contentLibrary } from './server/content-library.mjs'

const resolve = (...data: string[]) => path.resolve(__dirname, ...data)

function contentLibraryPlugin() {
  return {
    name: 'design-studio-content-library',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const [rawPath, rawQuery] = (req.url || '/').split('?')
        if (!rawPath.startsWith('/design/')) return next()
        const result = await contentLibrary(decodeURIComponent(rawPath), new URLSearchParams(rawQuery || ''))
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify({ code: 200, msg: 'ok', result: result ?? undefined }))
      })
    },
  }
}

export default defineConfig({
  cacheDir: resolve('node_modules/.vite-embed-demo'),
  root: resolve('react'),
  publicDir: resolve('public'),
  plugins: [react(), contentLibraryPlugin()],
  resolve: {
    alias: {
      '@': resolve('react/src'),
      '~data': resolve('react/src/assets/data'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          color: `true; @import "${resolve('react/src/assets/styles/color.less')}";`,
        },
        javascriptEnabled: true,
      },
    },
  },
  define: {
    'process.env': JSON.stringify({ NODE_ENV: process.env.NODE_ENV }),
  },
  server: {
    port: 5373,
    strictPort: true,
    hmr: { overlay: false },
    host: '127.0.0.1',
    open: '/embed-demo/index.html',
  },
})
