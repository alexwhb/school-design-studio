/**
 * The content library, configured from this repo's own `.env`.
 *
 * A thin wrapper over `library.mjs`, which is the implementation and takes its
 * configuration as an argument. Two callers in this repo share this one —
 * `serve.mjs` and the dev-server middleware in the Vite configs — so that the
 * Photos panel behaves the same whether you ran `npm start` or `npm run dev`.
 *
 * A host app embedding the editor should call `createContentLibrary` itself,
 * with its own key, rather than going through here: `.env` files are this
 * repo's way of being configured, not a planner's.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createContentLibrary } from './library.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(HERE, '..')

/**
 * Reads `.env` / `.env.local` into a plain object. Vite loads those files for
 * the client bundle, but this module also runs inside plain `node serve.mjs`,
 * where nothing has read them yet.
 *
 * The access key must never reach the browser, so it is read here rather than
 * exposed through `import.meta.env`.
 */
function readEnvFiles() {
  const values = {}
  for (const name of ['.env', '.env.local']) {
    const file = path.join(ROOT, name)
    if (!fs.existsSync(file)) continue
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/.exec(line)
      if (!match) continue
      values[match[1]] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  }
  return values
}

const env = { ...readEnvFiles(), ...process.env }

const library = createContentLibrary({
  unsplashAccessKey: env.UNSPLASH_ACCESS_KEY || '',
  unsplashAppName: env.UNSPLASH_APP_NAME || 'design-studio',
  unsplashApiBase: env.UNSPLASH_API_BASE || '',
  contentRoot: path.join(ROOT, 'service', 'src', 'mock'),
})

export const hasUnsplashKey = library.hasUnsplashKey

/**
 * Answers one `/design/*` lookup. `query` is a URLSearchParams.
 * Returns the `result` payload; the caller wraps it in the envelope.
 */
export function contentLibrary(pathname, query) {
  return library.lookup(pathname, query)
}

export { library }
