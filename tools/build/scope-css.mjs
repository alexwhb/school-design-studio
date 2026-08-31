/**
 * Rewrites the editor's global CSS so it cannot touch the app it is embedded
 * in: every selector is prefixed with the editor's own root, and the rules that
 * target the document itself are re-pointed at that root.
 *
 * Only used for the embed build. The standalone app owns its page and keeps the
 * original, unprefixed CSS.
 */
const ROOT = '.ds-root'
const DARK = '.ds-root.ds-dark'

const SKIP_AT_RULES = new Set(['keyframes', 'font-face', 'import', 'charset', 'namespace', 'property', 'counter-style'])

/**
 * `-webkit-keyframes` is still `keyframes`. Element Plus ships the prefixed
 * form, and prefixing `0%` with a class turns the whole block into a parse
 * error — which is how an embedded spinner stops spinning.
 */
function atRuleName(name) {
  return name.toLowerCase().replace(/^-\w+-/, '')
}

function prefixSelector(selector) {
  const trimmed = selector.trim()
  if (!trimmed) return trimmed
  if (trimmed.startsWith('%')) return trimmed

  if (trimmed === ':root' || trimmed === 'html' || trimmed === 'body' || trimmed === 'html, body') return ROOT
  if (trimmed === 'html.dark' || trimmed === '.dark') return DARK
  if (trimmed.startsWith('html.dark ')) return DARK + trimmed.slice('html.dark'.length)
  if (trimmed.startsWith('html ')) return ROOT + trimmed.slice('html'.length)
  if (trimmed.startsWith('body ')) return ROOT + trimmed.slice('body'.length)
  if (trimmed.startsWith('::')) return `${ROOT} ${trimmed}`
  if (trimmed.startsWith(ROOT)) return trimmed
  return `${ROOT} ${trimmed}`
}

export default function scopeCss() {
  return {
    postcssPlugin: 'design-studio-scope',
    Rule(rule) {
      const parent = rule.parent
      if (parent && parent.type === 'atrule' && SKIP_AT_RULES.has(atRuleName(parent.name))) return
      if (rule.__dsScoped) return
      rule.__dsScoped = true
      rule.selectors = rule.selectors.map(prefixSelector)
    },
  }
}
scopeCss.postcss = true
