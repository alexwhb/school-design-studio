/**
 * What markup a design is allowed to hold, decided without a browser.
 *
 * A text widget's `text` is an HTML string, and the planner stores those and
 * renders them back into every colleague's browser. So something has to say
 * what may be in one, and it has to be able to say it on a server, before the
 * bytes are written down — by the time a `<img src=x onerror=…>` is in the
 * database it is too late to be careful.
 *
 * The rule is the editor's own, not a second one: this file parses the markup
 * and `richText.ts` reads the tree and writes it back out. That writing is an
 * allowlist by construction rather than a list of forbidden tags — every run of
 * text is escaped and re-emitted inside at most six known elements, with a
 * colour normalised to a hex triple and a link normalised to an http, https,
 * mailto or tel address. An element nobody listed contributes its words and
 * nothing else; `<script>` and `<style>` contribute nothing at all. There is no
 * path by which an attribute survives, so there is no `onerror` to forget.
 *
 * The parser below is a tokeniser rather than a DOM, and it is deliberately
 * unambitious: it does not implement HTML's error recovery, only enough of it
 * that a document written by the editor, by a paste, or by a model round-trips
 * to the same string a browser would have produced. Anything it misreads it
 * misreads towards plain text.
 */
import { linesFromTree, linesToHtml, type TReadNode, type TReadStyle, type TLineListStyle } from '@/utils/widgets/richText'
import { decodeEntities } from '@/utils/mergeFieldsCore'

const TEXT_NODE = 3
const ELEMENT_NODE = 1

/**
 * How deep the elements may nest before the tree stops getting deeper.
 *
 * The reader walks the tree by recursion, so a document nesting twenty thousand
 * `<b>` — which is eight characters each to write and which the planner would
 * hand straight to this function — is a stack overflow rather than a slow
 * answer. Past the cap an element still contributes its words; it just does not
 * open a level of its own, so nothing is dropped and the formatting somebody
 * meant is long since applied. The canonical writer nests six deep, and markup
 * pasted from a word processor rarely passes twenty, so sixty-four is well
 * clear of anything real.
 */
const MAX_DEPTH = 64

/** Elements with no closing tag. A `</br>` in the wild is one of these too. */
const VOID = new Set(['AREA', 'BASE', 'BR', 'COL', 'EMBED', 'HR', 'IMG', 'INPUT', 'LINK', 'META', 'PARAM', 'SOURCE', 'TRACK', 'WBR'])

/**
 * Elements whose content is text, not markup.
 *
 * They have to be tokenised as such or `<script>if (a<b) …</script>` is read as
 * an element called `b`, and the tags after it nest wrongly. Their content is
 * dropped either way — `richText.ts` lists them as undrawn — but a tokeniser
 * that loses its place is a tokeniser that can be steered.
 */
const RAW_TEXT = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'TITLE', 'XMP', 'IFRAME', 'NOEMBED', 'NOFRAMES'])

/**
 * Which open element a start tag closes on its own. A browser does this and the
 * markup in the wild relies on it: `<li>one<li>two` is two items, not a nest.
 */
const CLOSES: Record<string, RegExp> = {
  LI: /^LI$/,
  P: /^P$/,
  DD: /^(DD|DT)$/,
  DT: /^(DD|DT)$/,
  TD: /^(TD|TH)$/,
  TH: /^(TD|TH)$/,
  TR: /^(TD|TH|TR)$/,
}

type Node = TReadNode & { childNodes: Node[]; nextSibling: Node | null; parentNode: Node | null }

function textNode(data: string): Node {
  return { nodeType: TEXT_NODE, data, childNodes: [], nextSibling: null, parentNode: null }
}

/** `style="color: red; font-weight: 700"` as the handful of properties read. */
function parseStyle(value: string | undefined): TReadStyle | null {
  if (!value) return null
  const style: TReadStyle = {}
  let count = 0
  for (const rule of value.split(';')) {
    const at = rule.indexOf(':')
    if (at < 0) continue
    const name = rule.slice(0, at).trim().toLowerCase()
    const setting = rule.slice(at + 1).trim()
    if (!setting) continue
    count++
    if (name === 'color') style.color = setting
    else if (name === 'font-weight') style.fontWeight = setting
    else if (name === 'font-style') style.fontStyle = setting
    else if (name === 'text-decoration-line') style.textDecorationLine = setting
    else if (name === 'text-decoration') style.textDecoration = setting
  }
  style.length = count
  return style
}

const ATTRIBUTE = /([^\s/=>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'`=<>]+)))?/g

function parseAttributes(source: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  for (const match of source.matchAll(ATTRIBUTE)) {
    const name = match[1].toLowerCase()
    // Only the three the reader ever asks for are kept. Nothing else can reach
    // the output, so holding on to it would only be a way to be wrong later.
    if (name !== 'href' && name !== 'color' && name !== 'style') continue
    attributes[name] = decodeEntities(match[2] ?? match[3] ?? match[4] ?? '')
  }
  return attributes
}

function elementNode(tagName: string, attributes: Record<string, string>): Node {
  return {
    nodeType: ELEMENT_NODE,
    tagName,
    childNodes: [],
    nextSibling: null,
    parentNode: null,
    getAttribute: (name: string) => attributes[name.toLowerCase()] ?? null,
    style: parseStyle(attributes.style),
  }
}

/**
 * Reads the tag starting at `<`, without backtracking.
 *
 * A regex was the obvious thing and was quietly quadratic. `<(\/)?([a-zA-Z…])(…*?)>` has
 * to scan to the end of the input before it can decide there is no closing `>`,
 * and the caller then advances one character and asks again — so `"<a".repeat(100000)`,
 * which a model will produce eventually and which the planner would hand
 * straight to this function, took fifty-two seconds of a server's time.
 *
 * This scans each character once and tracks whether it is inside a quote, which
 * is all the state a tag has. The important case is `eof`: if there is no
 * unquoted `>` between here and the end, there is none after any later `<`
 * either, so the rest of the input is text and the walk is over. That is what
 * makes the whole thing linear rather than merely faster.
 */
type Tag =
  | { kind: 'tag'; close: boolean; name: string; attrs: string; selfClosing: boolean; end: number }
  /** A `<` that begins no element — `5 < 6`, or `<-`. One character of text. */
  | { kind: 'text' }
  /** No unquoted `>` remains anywhere. Everything from here is text. */
  | { kind: 'eof' }

const NAME_START = /[a-zA-Z]/
const NAME_CHAR = /[a-zA-Z0-9:-]/

function readTag(source: string, start: number): Tag {
  let at = start + 1
  const close = source[at] === '/'
  if (close) at++
  if (!NAME_START.test(source[at] ?? '')) return { kind: 'text' }
  const nameAt = at
  while (at < source.length && NAME_CHAR.test(source[at])) at++
  const name = source.slice(nameAt, at).toUpperCase()

  const attrsAt = at
  let quote = ''
  for (; at < source.length; at++) {
    const character = source[at]
    if (quote) {
      if (character === quote) quote = ''
      continue
    }
    if (character === '"' || character === "'") quote = character
    else if (character === '>') break
  }
  if (at >= source.length) return { kind: 'eof' }

  const attrs = source.slice(attrsAt, at)
  return { kind: 'tag', close, name, attrs, selfClosing: attrs.trimEnd().endsWith('/'), end: at + 1 }
}

/**
 * The markup as a tree `richText.ts` can read.
 *
 * Text between tags is decoded; a `<` that starts nothing recognisable is text,
 * which is what makes `5 < 6` survive. Comments, doctypes and processing
 * instructions are skipped whole, so an `<!--` cannot be used to hide the start
 * of an element from the tokeniser and show it to a browser.
 */
export function parseMarkup(html: string): TReadNode {
  const root: Node = { nodeType: ELEMENT_NODE, tagName: 'BODY', childNodes: [], nextSibling: null, parentNode: null }
  const stack: Node[] = [root]
  const top = () => stack[stack.length - 1]

  const append = (node: Node) => {
    const parent = top()
    const last = parent.childNodes[parent.childNodes.length - 1]
    if (last) last.nextSibling = node
    node.parentNode = parent
    parent.childNodes.push(node)
  }
  const addText = (raw: string) => {
    if (raw) append(textNode(decodeEntities(raw)))
  }

  const source = String(html ?? '')
  let at = 0

  while (at < source.length) {
    const next = source.indexOf('<', at)
    if (next < 0) {
      addText(source.slice(at))
      break
    }
    addText(source.slice(at, next))

    // A comment, a doctype or anything else beginning `<!` or `<?` is skipped
    // to its end. Left in, `<!--><img onerror=…>` would be markup to a browser
    // and a comment to this tokeniser, which is the whole trick.
    if (source.startsWith('<!--', next)) {
      // `<!-->` and `<!--->` are a comment that closes as soon as it opens —
      // HTML calls it an abrupt closing, and a browser reads what follows as
      // markup. Reading it as text instead would leave this tokeniser and a
      // browser disagreeing about where the comment ends, and a disagreement
      // about that is how markup gets smuggled past a sanitiser.
      const abrupt = source.startsWith('>', next + 4) ? next + 5 : source.startsWith('->', next + 4) ? next + 6 : 0
      if (abrupt) {
        at = abrupt
        continue
      }
      const end = source.indexOf('-->', next + 4)
      at = end < 0 ? source.length : end + 3
      continue
    }
    if (source.startsWith('<!', next) || source.startsWith('<?', next)) {
      const end = source.indexOf('>', next)
      at = end < 0 ? source.length : end + 1
      continue
    }

    const tag = readTag(source, next)
    if (tag.kind === 'text') {
      // A `<` that is not a tag. It is a character, and it is escaped on the
      // way out, so it can never become one.
      addText('<')
      at = next + 1
      continue
    }
    if (tag.kind === 'eof') {
      addText(source.slice(next))
      break
    }
    at = tag.end

    const name = tag.name
    if (tag.close) {
      // A close tag: unwind to it, if it is open at all. One that is not open
      // closes nothing, which is what a browser does with a stray `</div>`.
      const depth = stack.findIndex((node) => node.tagName === name)
      if (depth > 0) stack.length = depth
      continue
    }

    const closes = CLOSES[name]
    if (closes && stack.length > 1 && closes.test(top().tagName ?? '')) stack.pop()

    const element = elementNode(name, parseAttributes(tag.attrs))
    append(element)

    if (RAW_TEXT.has(name)) {
      // Consumed whole, tags and all, and thrown away: the reader drops these
      // elements, and what matters here is only that the tokeniser comes out
      // the other side in the right place.
      const close = source.toUpperCase().indexOf(`</${name}`, at)
      at = close < 0 ? source.length : source.indexOf('>', close) + 1 || source.length
      continue
    }
    if (!VOID.has(name) && !tag.selfClosing && stack.length < MAX_DEPTH) stack.push(element)
  }

  return root
}

/**
 * Markup pared back to what a design may hold, and written in the editor's own
 * canonical form.
 *
 * Safe by construction rather than by inspection. Nothing from the input is
 * copied into the output except the words, a colour that parsed as a colour,
 * and a link whose scheme is on the list. There is no branch on which an
 * attribute, an element or a URL scheme that was not expected reaches the
 * result, so there is nothing here to keep up to date as new attacks are
 * invented.
 */
export function sanitizeMarkup(html: string, listStyle: TLineListStyle = 'none'): string {
  return linesToHtml(linesFromTree(parseMarkup(String(html ?? ''))), listStyle)
}

/** The words of some markup, with all of the formatting taken off. */
export function markupToText(html: string): string {
  return linesFromTree(parseMarkup(String(html ?? '')))
    .map((line) => line.map((run) => run.text).join(''))
    .join('\n')
}
