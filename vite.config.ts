/*
 * @Author: ShawnPhang
 * @Date: 2021-08-19 18:30:38
 * @Description: Vite配置文件
 * @LastEditors: ShawnPhang <site: book.palxp.com>
 * @LastEditTime: 2023-08-01 10:46:59
 */
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import viteCompression from 'vite-plugin-compression'
import ElementPlus from 'unplugin-element-plus/vite'
// @ts-expect-error -- plain ESM, no types; see server/content-library.mjs
import { contentLibrary } from './server/content-library.mjs'

const resolve = (...data: string[]) => path.resolve(__dirname, ...data)

/**
 * Answers `/design/*` in `npm run dev` exactly as serve.mjs does for the built
 * app, so the Templates, Elements and Photos panels have content either way.
 * The Unsplash access key stays in this process; the browser only ever talks
 * to the dev server.
 */
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

// https://vitejs.dev/config/
export default defineConfig({
  cacheDir: resolve('node_modules/.vite-vue'),
  // base: '/web',
  plugins: [
    vue(),
    contentLibraryPlugin(),
    viteCompression({
      verbose: true,
      disable: false,
      threshold: 10240,
      algorithm: 'gzip',
      ext: '.gz',
    }),
    ElementPlus({
      // options
    }),
  ],
  build: {
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
          color: `true; @import "./src/assets/styles/color.less";`,
        },
      },
    },
  },
  define: {
    // Only the two variables src/config.ts actually reads. Handing over the
    // whole of process.env — as this did — inlines every variable in the
    // building shell into the client bundle, which would put UNSPLASH_ACCESS_KEY
    // in front of every visitor the moment someone exported it before building.
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV,
      DESIGN_API_URL: process.env.DESIGN_API_URL,
    }),
  },
  server: {
    port: 5174,
    strictPort: true,
    hmr: { overlay: false },
    host: '127.0.0.1'
    // proxy: {
    //   '/api': {
    //     target: '',
    //     changeOrigin: true,
    //     rewrite: (path) => path.replace(/^\/api/, ''),
    //   },
    // },
  },
})
