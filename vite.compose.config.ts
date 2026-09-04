import { defineConfig } from 'vite'
import path from 'path'

const resolve = (...data: string[]) => path.resolve(__dirname, ...data)

/**
 * `design-studio/compose`, built on its own rather than as a second entry
 * beside the editor.
 *
 * One build with two entries would let Rollup put anything the two share into a
 * chunk they both import — and the moment one of those chunks reaches a
 * browser-only module, `import('design-studio/compose')` stops working on Node
 * and nothing says why until a request handler throws. Two builds cannot share
 * a chunk, so the guarantee holds by construction rather than by inspection.
 *
 * `emptyOutDir` is off because this writes into the editor's own output folder,
 * which the embed build has just filled.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src'),
      '~data': resolve('src/assets/data'),
    },
  },
  // Same reason as the editor build: a library has no page, and `public/` is
  // shipped beside the bundle rather than inside it.
  publicDir: false,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
  },
  build: {
    outDir: resolve('dist-embed'),
    emptyOutDir: false,
    // Node, not a browser: no polyfills, and modern syntax rather than
    // whatever the editor's own browserslist asks for.
    target: 'node20',
    lib: {
      entry: resolve('src/compose/index.ts'),
      formats: ['es'],
      fileName: () => 'compose.js',
    },
    rollupOptions: {
      // Nothing is external. A host that imports this on a server should get one
      // file it can run, not a module graph it has to install the rest of.
      external: [],
      output: { inlineDynamicImports: true },
    },
  },
})
