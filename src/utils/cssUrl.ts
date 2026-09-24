/**
 * The one way a design's URL is put into CSS.
 *
 * A URL field is checked by the host against its own origin before it is
 * stored, but a check like that looks at an address, and CSS reads the text
 * round it. Interpolated bare — `url(${image})` — the value `/a.png),url(https://evil/p.png`
 * passes as a same-origin relative path and then closes the `url()` and opens a
 * second one pointing anywhere; in single quotes a `'` does the same. So every
 * `url()` built from a document goes through here: the value is written as a
 * double-quoted CSS string with its quotes and backslashes escaped, and nothing
 * in it can end the string, the `url()` or the declaration.
 *
 * Tabs and line breaks are taken out rather than escaped, which is what the
 * URL parser does with them anyway. Any other control character is written as
 * a CSS escape. What comes out is always exactly one `url()`.
 */
export function cssUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const text = value.replace(/[\t\n\r\f]/g, '').trim()
  if (!text) return null
  // eslint-disable-next-line no-control-regex
  const escaped = text.replace(/["\\]/g, (char) => `\\${char}`).replace(/[\u0000-\u001f\u007f]/g, (char) => `\\${char.charCodeAt(0).toString(16)} `)
  return `url("${escaped}")`
}
