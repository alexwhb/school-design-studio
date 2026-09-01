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
  cacheDir: resolve('node_modules/.vite-app'),
  plugins: [react(), contentLibraryPlugin()],
  build: {
    outDir: resolve('dist'),
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve('src'),
      '~data': resolve('src/assets/data'),
    },
  },
  css: {
    preprocessorOptions: {
      less: {
        modifyVars: {
          color: `true; @import "${resolve('src/assets/styles/color.less')}";`,
        },
        javascriptEnabled: true,
      },
    },
  },
  define: {
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      DESIGN_API_URL: process.env.DESIGN_API_URL,
    }),
  },
  server: {
    port: 5273,
    strictPort: true,
    hmr: { overlay: false },
    host: '127.0.0.1',
  },
})
