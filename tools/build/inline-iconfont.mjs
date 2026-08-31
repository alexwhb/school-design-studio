import fs from 'node:fs'
import path from 'node:path'

/**
 * Makes the toolbar's icon fonts part of the embed's own stylesheet.
 *
 * Standalone they are a <link> to public/iconfont, which is fine because the
 * app owns the page. Embedded they cannot be: a stylesheet fetched at runtime
 * never passes through the build, so its rules are never scoped, and
 * `.iconfont` and a hundred `.icon-*` rules land on the host — `.iconfont` sets
 * font-family with !important, so a host element carrying that class renders as
 * boxes.
 *
 * Bundling it means PostCSS scopes it with everything else. The woff2 files go
 * in as data URLs (about 12kB together), which also drops a thing the host
 * would otherwise have to serve.
 */
const VIRTUAL_ID = 'virtual:ds-iconfont.css'

export default function inlineIconfont(cssPath) {
  const resolved = '\0' + VIRTUAL_ID
  return {
    name: 'design-studio-inline-iconfont',
    enforce: 'pre',
    resolveId(id) {
      return id === VIRTUAL_ID ? resolved : null
    },
    load(id) {
      if (id !== resolved) return null
      const dir = path.dirname(cssPath)
      const css = fs.readFileSync(cssPath, 'utf8')
      return css.replace(/url\(\s*['"]?\.\/([^'")]+)['"]?\s*\)/g, (whole, file) => {
        const asset = path.join(dir, file)
        if (!fs.existsSync(asset)) return whole
        const type = file.endsWith('.woff2') ? 'font/woff2' : 'application/octet-stream'
        return `url(data:${type};base64,${fs.readFileSync(asset).toString('base64')})`
      })
    },
  }
}
