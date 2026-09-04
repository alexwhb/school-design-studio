import { defineConfig } from 'vitest/config'
import path from 'path'

const resolve = (...data: string[]) => path.resolve(__dirname, ...data)

/**
 * The unit suite. `node` rather than jsdom on purpose: everything it covers is
 * the compose entry, and the whole claim of that entry is that it runs with no
 * DOM behind it. A jsdom environment would hide the day somebody imports one.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve('src'),
      '~data': resolve('src/assets/data'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.test.ts'],
    reporters: ['default'],
  },
})
