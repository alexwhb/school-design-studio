/*
 * Finding and replacing inside a text widget's markup.
 *
 * A widget's `text` is HTML, not a string: wText writes back whatever
 * contentEditable produced, so it carries <br>s, <ul>/<li> lists, and whatever
 * spans a paste dragged in with it. Running `text.replace(find, to)` over that
 * would match inside tag names and attribute values — searching for "li" would
 * rewrite every bullet into garbage — and would silently shred formatting the
 * author cannot get back.
 *
 * So nothing here ever touches the markup as a string. The HTML is parsed once,
 * the text nodes are walked in document order to build the plain string a
 * reader actually sees, and each character keeps a note of the node it came
 * from. A hit found in the plain string is then spliced into those specific
 * text nodes, and the markup is re-serialised around them. Tags, attributes and
 * entities are never in the search space at all, and the only thing that
 * changes is the characters that matched.
 *
 * Line breaks are separators, not characters: a <br> or the edge of a block
 * contributes a newline to the plain string that belongs to no text node. Since
 * the Find box holds one line, a hit can never straddle one — which is what
 * stops "Sports<br>Day" from matching "sD".
 */

/** Elements whose edges are a line break in the rendered text. */
const BLOCK = /^(ADDRESS|BLOCKQUOTE|DIV|DL|DD|DT|H[1-6]|LI|OL|P|PRE|TABLE|TD|TH|TR|UL)$/

type TSegment = {
  node: Text
  /** Where this node's first character sits in the plain string. */
  start: number
  /** The node's length when it was read, before any splicing moved it. */
  length: number
}

type TReading = {
  root: HTMLElement
  text: string
  segments: TSegment[]
}

/** A run of the rendered text, as an offset into it and a length. */
export type TTextHit = {
  start: number
  length: number
}

function read(html: string | undefined): TReading {
  const root = document.createElement('div')
  root.innerHTML = html ?? ''
  const segments: TSegment[] = []
  let text = ''

  const walk = (parent: Node) => {
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === Node.TEXT_NODE) {
        const data = (child as Text).data
        if (!data) continue
        segments.push({ node: child as Text, start: text.length, length: data.length })
        text += data
        continue
      }
      if (child.nodeType !== Node.ELEMENT_NODE) continue
      const el = child as HTMLElement
      if (el.tagName === 'BR') {
        text += '\n'
        continue
      }
      const block = BLOCK.test(el.tagName)
      // One newline per edge, and never two in a row: a <ul> closing inside a
      // <li> that is also closing is one line ending, not three.
      if (block && text && !text.endsWith('\n')) text += '\n'
      walk(el)
      if (block && text && !text.endsWith('\n')) text += '\n'
    }
  }
  walk(root)

  return { root, text, segments }
}

/**
 * The comparable form of a string: one output character per input character,
 * always, so an offset found in the folded string is an offset in the original.
 *
 * That is why this is not `toLowerCase()`. A handful of characters lower-case
 * into two — 'İ' is the one anybody meets — which would shift every offset
 * after them and splice the replacement into the wrong place. Those characters
 * are left as they are and simply do not match case-insensitively.
 *
 * A non-breaking space is folded to a plain one. Browsers put &nbsp; into
 * contentEditable wherever a run of spaces would otherwise collapse, and
 * nobody types one deliberately; without this, "14 June" fails to find "14
 * June".
 */
function fold(text: string, matchCase: boolean): string {
  let out = ''
  for (let i = 0; i < text.length; i++) {
    const char = text[i] === '\u00a0' ? ' ' : text[i]
    if (matchCase) {
      out += char
      continue
    }
    const lower = char.toLowerCase()
    out += lower.length === 1 ? lower : char
  }
  return out
}

/**
 * What a text widget reads as on the page, with its markup taken off.
 *
 * Memoised on the markup itself, which is safe because the markup is the whole
 * input. The search runs again on every keystroke in the Find box, and a
 * twenty-five slide deck is a few hundred text boxes to parse each time; the
 * design does not change between those runs, so parsing it once is enough.
 */
const parsed = new Map<string, string>()

export function renderedText(html: string | undefined): string {
  const key = html ?? ''
  const known = parsed.get(key)
  if (known !== undefined) return known
  const text = read(key).text
  // Emptied rather than evicted one by one. Every entry is stale together once
  // the design has moved on, and a design large enough to reach this has been
  // retyped several times over.
  if (parsed.size >= 2000) parsed.clear()
  parsed.set(key, text)
  return text
}

/**
 * Every occurrence of `query` in the widget's rendered text, left to right and
 * non-overlapping, as offsets into that rendered text.
 */
export function findInMarkup(html: string | undefined, query: string, matchCase: boolean): TTextHit[] {
  if (!query) return []
  const haystack = fold(renderedText(html), matchCase)
  const needle = fold(query, matchCase)
  const hits: TTextHit[] = []
  let from = 0
  for (;;) {
    const at = haystack.indexOf(needle, from)
    if (at === -1) break
    hits.push({ start: at, length: needle.length })
    from = at + needle.length
  }
  return hits
}

/**
 * The widget's markup with each of `hits` replaced by `replacement`.
 *
 * Worked back to front, so a hit's offsets are still true when its turn comes:
 * splicing a later run cannot move an earlier one. A hit that spans two text
 * nodes — "14 June" written as "<b>14</b> June" — puts the whole replacement in
 * the first of them and empties its share of the rest, which is the only
 * reading of "replace this run" that keeps the surrounding markup intact.
 */
export function replaceInMarkup(html: string | undefined, hits: TTextHit[], replacement: string): string {
  if (hits.length === 0) return html ?? ''
  const { root, segments } = read(html)

  for (const hit of [...hits].sort((a, b) => b.start - a.start)) {
    const end = hit.start + hit.length
    const touched = segments.filter((seg) => seg.start < end && seg.start + seg.length > hit.start)
    if (touched.length === 0) continue
    touched.forEach((seg, index) => {
      const from = Math.max(0, hit.start - seg.start)
      const to = Math.min(seg.length, end - seg.start)
      const data = seg.node.data
      seg.node.data = data.slice(0, from) + (index === 0 ? replacement : '') + data.slice(to)
    })
  }

  return root.innerHTML
}
