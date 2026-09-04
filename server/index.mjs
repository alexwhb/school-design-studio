/**
 * `design-studio/server` — the read-only content library the editor's panels
 * ask for templates, elements, stickers and photographs.
 *
 * The editor is a browser component and needs six `/design/*` endpoints behind
 * it. Five of them are the JSON bundled in this package; the sixth proxies
 * Unsplash, which has to be a proxy because the access key must never reach a
 * browser. A host mounts this on its own router:
 *
 *   const library = createContentLibrary({ unsplashAccessKey: process.env.UNSPLASH_ACCESS_KEY })
 *   const { status, body, headers } = await library.handle(url.pathname, url.searchParams)
 *
 * See EMBEDDING.md.
 */
export { createContentLibrary, default } from './library.mjs'
