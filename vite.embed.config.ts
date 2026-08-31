import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
// @ts-expect-error -- plain ESM, no types
import scopeCss from './tools/build/scope-css.mjs'

const resolve = (...data: string[]) => path.resolve(__dirname, ...data)

export default defineConfig({
  plugins: [react()],
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
      entry: resolve('react/src/index.ts'),
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
