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
      external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
      output: {
        assetFileNames: 'design-studio.[ext]',
      },
    },
  },
})
