export function cx(...parts: (string | false | null | undefined | Record<string, boolean | undefined>)[]): string {
  const out: string[] = []
  for (const part of parts) {
    if (!part) continue
    if (typeof part === 'string') {
      out.push(part)
    } else {
      for (const key in part) {
        part[key] && out.push(key)
      }
    }
  }
  return out.join(' ')
}

export function setTransformAttribute(el: HTMLElement, attrName: string, value: string | number) {
  const tf = el.style.transform
  const iof = tf.indexOf(attrName)
  if (iof !== -1) {
    const index = iof + attrName.length
    const FRONT = tf.slice(0, index + 1)
    const half = tf.substring(index + 1)
    const END = half.substring(half.indexOf(')'))
    el.style.transform = FRONT + value + END
  } else {
    el.style.transform = tf + ` ${attrName}(${value})`
  }
}

/**
 * Markup parsed where nothing in it can run or load.
 *
 * Setting innerHTML on a detached `<div>` does not run a `<script>`, but it
 * does start loading images — so `<img src=x onerror=…>` in a design's text
 * fires its handler the moment the text is read for its words, whether or not
 * the element ever reaches the page. A document from DOMParser has no browsing
 * context: nothing in it is fetched and no handler in it ever runs.
 * `richText.ts` reads the same way.
 *
 * The leading `<body>` keeps a string that starts with `<title>` or `<meta>`
 * in the body rather than letting the parser move it into the head.
 */
export function parseInert(html: string): HTMLElement {
  return new DOMParser().parseFromString(`<body>${html}`, 'text/html').body
}
