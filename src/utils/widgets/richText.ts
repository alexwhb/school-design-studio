/*
 * Formatting inside one text box.
 *
 * A text widget's `text` is a single HTML string, and until now every setting
 * on it — weight, colour, underline — applied to the whole box. Bold on one
 * word is markup inside that string: <b>, <i>, <u>, <s>, a <span> carrying a
 * colour, an <a> carrying a link. This module is the one description of what
 * that markup may be and what it means, so the editor, the list markup, the
 * curved-text layout and the PowerPoint export all read it the same way.
 *
 * The reading is a list of lines, each a list of runs; a run is a piece of text
 * with a fixed set of on-or-off styles. Nothing downstream has to know how the
 * markup nests. The writing goes the other way and is canonical: the same
 * lines always come out as the same string, in a fixed order of tags, with no
 * element, attribute or style that is not on the list below. Every write from
 * the editor goes through it, which is how a paste from a web page or a Word
 * document leaves its fonts, sizes and classes at the door.
 *
 * Allowed: b/strong, i/em, u, s/strike/del, span and font for a colour, a for
 * a link, br, and div/p/ul/ol/li as line structure. Everything else is read
 * for its text and dropped.
 */

export type TTextRun = {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  strike?: boolean
  /** The run's own colour as #rrggbb or #rrggbbaa. Absent means the box's colour. */
  color?: string
  /** An absolute URL. Absent means no link. */
  href?: string
}

/** One visual line of the box: what a <br> or the edge of a block separates. */
export type TTextLine = TTextRun[]

export type TLineListStyle = 'none' | 'bullet' | 'number'

type TFormat = Omit<TTextRun, 'text'>

const FORMAT_KEYS: (keyof TFormat)[] = ['href', 'color', 'bold', 'italic', 'underline', 'strike']

/** Elements whose edges are a line break in the rendered text. */
const BLOCK = /^(ADDRESS|ARTICLE|BLOCKQUOTE|DIV|DL|DD|DT|FOOTER|H[1-6]|HEADER|LI|OL|P|PRE|SECTION|TABLE|TD|TH|TR|UL)$/

/**
 * Elements that draw none of their contents. A paste from a web page brings a
 * <style> block or a <script> along often enough, and reading them the way
 * every other element is read would put a stylesheet into the poster.
 */
const UNDRAWN = /^(HEAD|LINK|META|NOSCRIPT|SCRIPT|STYLE|TEMPLATE|TITLE)$/

/**
 * The little of a DOM node the reader below actually touches.
 *
 * Named so that the reader can be run over a tree that is not the browser's.
 * `design-studio/compose` sanitises stored markup on a server, where there is
 * no DOM at all, and a second reader written to match this one would be a
 * second opinion about what the markup may be — which is exactly what this
 * module exists to stop there being. So the parser is swappable and the
 * reader is not. See `src/compose/markup.ts`.
 */
export type TReadStyle = {
  length?: number
  color?: string
  fontWeight?: string
  fontStyle?: string
  textDecorationLine?: string
  textDecoration?: string
}

export type TReadNode = {
  nodeType: number
  data?: string
  tagName?: string
  childNodes: ArrayLike<TReadNode>
  nextSibling: TReadNode | null
  parentNode: TReadNode | null
  getAttribute?: (name: string) => string | null
  style?: TReadStyle | null
}

// Spelled out rather than read off `Node`, which does not exist on a server.
const TEXT_NODE = 3
const ELEMENT_NODE = 1

/**
 * How deep the elements may nest before the reader stops going down.
 *
 * The walk below is recursive, so markup nesting twenty thousand `<b>` — eight
 * characters each to write — is a stack overflow rather than a slow answer.
 * That is reachable from a paste as well as from a server, so the guard is here
 * rather than in either parser. Past the cap an element still contributes its
 * words; it just adds no formatting of its own, and by sixty-four levels
 * whatever formatting was meant has long since been applied. The canonical
 * writer nests six deep and a word-processor paste rarely passes twenty.
 */
export const MAX_MARKUP_DEPTH = 64

/**
 * Markup parsed where it cannot do anything: a document with no browsing
 * context, so an <img> in a pasted design fetches nothing and a <script> is
 * inert markup rather than code. Setting innerHTML on a detached div does not
 * run scripts either, but it does start loading images.
 */
const parser = typeof DOMParser === 'undefined' ? null : new DOMParser()

function parse(html: string): TReadNode {
  const root = parser ? parser.parseFromString(`<body>${html}`, 'text/html').body : Object.assign(document.createElement('div'), { innerHTML: html })
  return root as unknown as TReadNode
}

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  // A non-breaking space, spelled out because it is invisible in a file.
  // Written the way the browser serialises it, so the stored string matches
  // what innerHTML reads back and the editor is not rewritten for nothing.
  '\u00a0': '&nbsp;',
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"\u00a0]/g, (char) => ESCAPES[char])
}

/* ------------------------------------------------------------------ colour */

const HEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
const RGB = /^rgba?\(\s*([^)]+)\)$/i

const channel = (n: number) =>
  Math.max(0, Math.min(255, Math.round(n)))
    .toString(16)
    .padStart(2, '0')

/**
 * A colour as the editor stores one: #rrggbb, or #rrggbbaa when it is not
 * fully opaque. The browser reports colours as rgb()/rgba() and the picker
 * writes eight-digit hex, so both are read. A colour that is neither — a name,
 * a gradient, a variable — is not one this markup can carry, and is dropped.
 */
export function normaliseColor(value: string | null | undefined): string | undefined {
  if (!value) return undefined
  const raw = value.trim()
  const hex = raw.match(HEX)
  if (hex) {
    let digits = hex[1].toLowerCase()
    if (digits.length <= 4)
      digits = digits
        .split('')
        .map((c) => c + c)
        .join('')
    return '#' + (digits.length === 8 && digits.endsWith('ff') ? digits.slice(0, 6) : digits)
  }
  const rgb = raw.match(RGB)
  if (rgb) {
    const parts = rgb[1]
      .split(/[\s,/]+/)
      .filter(Boolean)
      .map(Number)
    if (parts.length < 3 || parts.slice(0, 3).some(Number.isNaN)) return undefined
    const alpha = parts.length > 3 && !Number.isNaN(parts[3]) ? parts[3] : 1
    const out = '#' + channel(parts[0]) + channel(parts[1]) + channel(parts[2])
    return alpha >= 1 ? out : out + channel(alpha * 255)
  }
  return undefined
}

/* -------------------------------------------------------------------- link */

const SCHEME = /^([a-z][a-z0-9+.-]*):/i
const SAFE_SCHEMES = new Set(['http', 'https', 'mailto', 'tel'])

/**
 * A link as the editor stores one. A teacher types "school.org/trips" and
 * means a web address, so a bare host gets https:// put in front of it. A
 * javascript: or data: URL is not a link anybody meant to add to a poster and
 * is dropped, which is what keeps a pasted design from carrying script.
 */
export function normaliseHref(value: string | null | undefined): string | undefined {
  const raw = (value ?? '').trim()
  if (!raw) return undefined
  const scheme = raw.match(SCHEME)?.[1].toLowerCase()
  if (scheme) return SAFE_SCHEMES.has(scheme) ? raw : undefined
  if (raw.startsWith('//')) return 'https:' + raw
  if (/\s/.test(raw)) return undefined
  return 'https://' + raw
}

/* ----------------------------------------------------------------- reading */

function sameFormat(a: TFormat, b: TFormat): boolean {
  return FORMAT_KEYS.every((key) => (a[key] || undefined) === (b[key] || undefined))
}

/** The format an element adds to whatever it is inside. */
function formatOf(el: TReadNode, inherited: TFormat): TFormat {
  const next: TFormat = { ...inherited }
  switch (el.tagName) {
    case 'B':
    case 'STRONG':
      next.bold = true
      break
    case 'I':
    case 'EM':
      next.italic = true
      break
    case 'U':
      next.underline = true
      break
    case 'S':
    case 'STRIKE':
    case 'DEL':
      next.strike = true
      break
    case 'A': {
      const href = normaliseHref(el.getAttribute?.('href'))
      if (href) next.href = href
      break
    }
    case 'FONT': {
      const color = normaliseColor(el.getAttribute?.('color'))
      if (color) next.color = color
      break
    }
  }
  // Inline styles are read as well as tags, because that is how the browser
  // itself writes a colour (execCommand's foreColor is a span with a style),
  // and how a paste from most editors says bold. Only the four properties this
  // markup can carry are looked at; a font-family or a size is not.
  const style = el.style
  if (style && style.length) {
    const color = normaliseColor(style.color)
    if (color) next.color = color
    const weight = style.fontWeight
    if (weight === 'bold' || weight === 'bolder' || Number(weight) >= 600) next.bold = true
    if (style.fontStyle === 'italic' || style.fontStyle === 'oblique') next.italic = true
    const decoration = style.textDecorationLine || style.textDecoration || ''
    if (/underline/.test(decoration)) next.underline = true
    if (/line-through/.test(decoration)) next.strike = true
  }
  return next
}

/**
 * The lines of a text box, each as the runs it is made of.
 *
 * Line breaks come from three places, because three generations of the editor
 * wrote them three ways: a newline character (the old plaintext-only field),
 * a <br>, and the edge of a block (what the browser writes for Enter, and how
 * a list item ends). A <br> that is the last thing in its block is the browser
 * holding an empty row open rather than a line of its own, so it is not
 * counted twice — unless it is the only thing there, in which case it is the
 * row.
 */
export function htmlToLines(html: string | undefined): TTextLine[] {
  return linesFromTree(parse(html ?? ''))
}

/**
 * The same reading, over a tree somebody else parsed. See `TReadNode`.
 */
export function linesFromTree(root: TReadNode): TTextLine[] {
  const lines: TTextLine[] = []
  let line: TTextLine = []
  // Whether the current line exists yet — true once anything has been written
  // to it, or an empty row has been explicitly opened.
  let open = false

  const endLine = () => {
    lines.push(line)
    line = []
    open = false
  }
  /** Whether nothing with any text follows `node` before its line ends. */
  const isTrailing = (node: TReadNode): boolean => {
    let current: TReadNode = node
    for (;;) {
      for (let next = current.nextSibling; next; next = next.nextSibling) {
        if (next.nodeType === TEXT_NODE && next.data) return false
        if (next.nodeType === ELEMENT_NODE && !UNDRAWN.test(next.tagName ?? '')) return false
      }
      const parent = current.parentNode
      if (!parent || parent === root || BLOCK.test(parent.tagName ?? '')) return true
      current = parent
    }
  }
  const write = (text: string, format: TFormat) => {
    if (!text) return
    const last = line[line.length - 1]
    if (last && sameFormat(last, format)) last.text += text
    else line.push({ text, ...format })
    open = true
  }

  const walk = (parent: TReadNode, format: TFormat, depth = 0) => {
    if (depth > MAX_MARKUP_DEPTH) return
    for (const child of Array.from(parent.childNodes)) {
      if (child.nodeType === TEXT_NODE) {
        const data = child.data
        if (!data) continue
        // Text straight inside a list is not in any item; the browser draws
        // nothing for the whitespace a template leaves between the tags.
        if (/^(UL|OL)$/.test(parent.tagName ?? '') && !data.trim()) continue
        const pieces = data.split('\n')
        pieces.forEach((piece, index) => {
          if (index > 0) endLine()
          write(piece, format)
          if (index > 0 && !piece) open = true
        })
        continue
      }
      if (child.nodeType !== ELEMENT_NODE) continue
      const el = child
      if (UNDRAWN.test(el.tagName ?? '')) continue
      if (el.tagName === 'BR') {
        // The last <br> of a line holds an empty row open when there is nothing
        // else on it, and is the browser's own filler when there is.
        if (isTrailing(el)) {
          open = true
          continue
        }
        endLine()
        continue
      }
      if (BLOCK.test(el.tagName ?? '')) {
        if (open) endLine()
        walk(el, format, depth + 1)
        if (open) endLine()
        continue
      }
      walk(el, formatOf(el, format), depth + 1)
    }
  }

  walk(root, {})
  if (open || lines.length === 0) lines.push(line)
  return lines
}

/** The plain text of a line, formatting taken off. */
export function lineText(line: TTextLine): string {
  return line.map((run) => run.text).join('')
}

/* ----------------------------------------------------------------- writing */

function wrap(key: keyof TFormat, value: unknown, inner: string): string {
  switch (key) {
    case 'href':
      return `<a href="${escapeHtml(String(value))}">${inner}</a>`
    case 'color':
      return `<span style="color:${escapeHtml(String(value))}">${inner}</span>`
    case 'bold':
      return `<b>${inner}</b>`
    case 'italic':
      return `<i>${inner}</i>`
    case 'underline':
      return `<u>${inner}</u>`
    case 'strike':
      return `<s>${inner}</s>`
  }
}

/**
 * Runs as markup, nested as little as the fixed tag order allows: two bold
 * runs that share a link come out inside one <a>, not one each.
 */
function serialise(runs: TTextRun[], keys: (keyof TFormat)[]): string {
  if (keys.length === 0) return runs.map((run) => escapeHtml(run.text)).join('')
  const [key, ...rest] = keys
  let out = ''
  let i = 0
  while (i < runs.length) {
    const value = runs[i][key] || undefined
    let j = i
    while (j < runs.length && (runs[j][key] || undefined) === value) j++
    const inner = serialise(runs.slice(i, j), rest)
    out += value ? wrap(key, value, inner) : inner
    i = j
  }
  return out
}

/** One line's runs as markup, with no line structure round them. */
export function runsToHtml(runs: TTextRun[]): string {
  return serialise(
    runs.filter((run) => run.text),
    FORMAT_KEYS,
  )
}

/**
 * The `text` a widget should hold to show these lines in this list style.
 *
 * A list is a flat <ul> or <ol> of one <li> per line; an empty item still needs
 * a <br> to hold the row open, or there is nowhere to put the caret. Plain
 * text is the lines joined with <br>, plus one more when the last line is
 * empty — a single trailing <br> draws nothing, so without it the empty last
 * line would be lost on the next read.
 */
export function linesToHtml(lines: TTextLine[], listStyle: TLineListStyle = 'none'): string {
  if (listStyle === 'bullet' || listStyle === 'number') {
    const tag = listStyle === 'number' ? 'ol' : 'ul'
    const items = lines.map((line) => `<li>${lineText(line).trim() ? runsToHtml(line) : '<br>'}</li>`)
    return `<${tag}>${items.join('')}</${tag}>`
  }
  const out = lines.map(runsToHtml).join('<br>')
  return lines.length > 1 && !lineText(lines[lines.length - 1]) ? out + '<br>' : out
}

/**
 * Markup pared back to the allowlist and written in canonical form. What every
 * write from the editor goes through: whatever contentEditable, a paste or an
 * old design produced comes out as the same few tags in the same order.
 */
export function sanitiseText(html: string | undefined, listStyle: TLineListStyle = 'none'): string {
  return linesToHtml(htmlToLines(html), listStyle)
}

/** Plain text as the markup a widget holds for it, each newline a line. */
export function plainToHtml(text: string, listStyle: TLineListStyle = 'none'): string {
  return linesToHtml(
    String(text ?? '')
      .split('\n')
      .map((line) => (line ? [{ text: line }] : [])),
    listStyle,
  )
}

/* ---------------------------------------------------------------- retyping */

type TChar = { char: string; format: TFormat }

function toChars(line: TTextLine): TChar[] {
  const chars: TChar[] = []
  for (const run of line) {
    const { text, ...format } = run
    for (const char of Array.from(text)) chars.push({ char, format })
  }
  return chars
}

function fromChars(chars: TChar[]): TTextLine {
  const line: TTextLine = []
  for (const { char, format } of chars) {
    const last = line[line.length - 1]
    if (last && sameFormat(last, format)) last.text += char
    else line.push({ text: char, ...format })
  }
  return line
}

/** A line retyped as `text`, keeping the formatting of whatever did not change. */
function retypeLine(line: TTextLine, text: string): TTextLine {
  const before = toChars(line)
  const after = Array.from(text)
  let prefix = 0
  while (prefix < before.length && prefix < after.length && before[prefix].char === after[prefix]) prefix++
  let suffix = 0
  while (suffix < before.length - prefix && suffix < after.length - prefix && before[before.length - 1 - suffix].char === after[after.length - 1 - suffix]) suffix++
  // What was typed in the middle takes the formatting of the character it
  // replaced, or of the one just before it when it was added at the end — the
  // way a caret picks up the style of the text it is in.
  const inherited = before[prefix]?.format ?? before[prefix - 1]?.format ?? {}
  return fromChars([...before.slice(0, prefix), ...after.slice(prefix, after.length - suffix).map((char) => ({ char, format: inherited })), ...before.slice(before.length - suffix)])
}

/**
 * The widget's markup retyped from plain text, as the panel's text area does
 * it. A change made there is nearly always a word or two, so rather than throw
 * every bold and every link away, the new text is matched line by line against
 * the old and only the characters that actually changed lose their formatting.
 */
export function retypeText(html: string | undefined, text: string, listStyle: TLineListStyle = 'none'): string {
  const before = htmlToLines(html)
  const after = String(text ?? '').split('\n')
  const lines: TTextLine[] = []
  if (before.length === after.length) {
    before.forEach((line, index) => lines.push(retypeLine(line, after[index])))
  } else {
    let prefix = 0
    while (prefix < before.length && prefix < after.length && lineText(before[prefix]) === after[prefix]) prefix++
    let suffix = 0
    while (suffix < before.length - prefix && suffix < after.length - prefix && lineText(before[before.length - 1 - suffix]) === after[after.length - 1 - suffix]) suffix++
    lines.push(...before.slice(0, prefix))
    for (const line of after.slice(prefix, after.length - suffix)) lines.push(line ? [{ text: line }] : [])
    lines.push(...before.slice(before.length - suffix))
  }
  return linesToHtml(lines, listStyle)
}
