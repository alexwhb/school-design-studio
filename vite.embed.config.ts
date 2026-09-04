import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// @ts-expect-error -- plain ESM, no types
import scopeCss from './tools/build/scope-css.mjs'
// @ts-expect-error -- plain ESM, no types; see tools/build/inline-iconfont.mjs
import inlineIconfont from './tools/build/inline-iconfont.mjs'

const resolve = (...data: string[]) => path.resolve(__dirname, ...data)

export default defineConfig({
  plugins: [react(), inlineIconfont(resolve('public/iconfont/iconfont.css'))],
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
    postcss: {
      plugins: [scopeCss()],
    },
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    outDir: resolve('dist-embed'),
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: resolve('src/index.ts'),
      name: 'DesignStudio',
      formats: ['es'],
      fileName: () => 'design-studio.js',
    },
    rollupOptions: {
      /**
       * React, because the host's copy has to be the only one on the page.
       *
       * Transformers.js, because bundling it puts a 63 MB chunk in a package
       * the host has to install for a button most designs never touch. It is
       * behind a dynamic import already (`backgroundRemoval.ts`), so leaving it
       * external means a host that wants background removal in the browser adds
       * `@huggingface/transformers` itself, and one that does not — or that
       * installs its own remover with `setBackgroundRemover`, or points
       * `BACKGROUND_REMOVAL_URL` at a service — carries none of it. The button
       * says so if it is reached with nothing behind it.
       */
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client', '@huggingface/transformers'],
      output: {
        assetFileNames: 'design-studio.[ext]',
      },
    },
  },
})
