/**
 * Just enough XML to read a PowerPoint file, and nothing more.
 *
 * OOXML is machine-written, so this does not have to cope with the things a
 * hand-authored document does: there are no DTDs, no entity declarations, no
 * processing instructions past the header. What it does have to be is *linear*.
 * The obvious implementation — a regex per tag, run repeatedly over the
 * remainder — is quadratic on input an attacker chooses, and this parser is fed
 * a file somebody uploaded. `markup.ts` learned that the hard way and was
 * rewritten as a scanner; this is the same scanner shape, over angle brackets
 * instead of HTML.
 *
 * The scanner walks the source once, left to right, and every branch either
 * consumes a character or ends the loop. There is no backtracking anywhere.
 *
 * Namespace prefixes are kept exactly as they appear (`a:off`, `p:spPr`).
 * PowerPoint always writes the same prefixes for the same namespaces, and the
 * lookups below take either the prefixed name or the bare local name, so
 * neither a strict nor a sloppy caller can miss an element that is there.
 */

/** One element. Text content is gathered into `text`; children keep their order. */
export type XNode = {
  name: string
  /** The part after the colon, or the whole name when there is no prefix. */
  local: string
  attrs: Record<string, string>
  children: XNode[]
  /** Character data directly inside this element, entities already resolved. */
  text: string
}

/**
 * How deep the tree may go.
 *
 * Grouped shapes nest, and a deck built by dragging groups into groups can be
 * genuinely deep, but not this deep. The limit is here so that a file crafted
 * with fifty thousand open tags cannot turn into fifty thousand stack frames or
 * fifty thousand arrays.
 */
const MAX_DEPTH = 100

/** Named entities XML defines. Everything else has to be numeric. */
const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
}

/**
 * Entity references into the characters they stand for.
 *
 * An unknown or malformed reference is left standing rather than dropped: it is
 * a slide's words, and `&notanentity;` on the page is better than a hole in a
 * sentence. Numeric references outside the Unicode range, and the surrogate
 * block, are left alone for the same reason `String.fromCodePoint` would throw
 * on them.
 */
export function decodeEntities(value: string): string {
  if (!value.includes('&')) return value
  let out = ''
  let at = 0
  while (at < value.length) {
    const amp = value.indexOf('&', at)
    if (amp === -1) {
      out += value.slice(at)
      break
    }
    out += value.slice(at, amp)
    const semi = value.indexOf(';', amp + 1)
    // A bare ampersand, or one so far from its semicolon that it cannot be a
    // reference. Emit it and carry on from the next character.
    if (semi === -1 || semi - amp > 12) {
      out += '&'
      at = amp + 1
      continue
    }
    const body = value.slice(amp + 1, semi)
    if (body.startsWith('#')) {
      const hex = body[1] === 'x' || body[1] === 'X'
      const digits = hex ? body.slice(2) : body.slice(1)
      const valid = hex ? /^[0-9a-fA-F]+$/.test(digits) : /^[0-9]+$/.test(digits)
      const code = valid ? parseInt(digits, hex ? 16 : 10) : NaN
      if (Number.isFinite(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)) {
        out += String.fromCodePoint(code)
        at = semi + 1
        continue
      }
      out += '&'
      at = amp + 1
      continue
    }
    const named = ENTITIES[body]
    if (named !== undefined) {
      out += named
      at = semi + 1
      continue
    }
    out += '&'
    at = amp + 1
  }
  return out
}

const NAME_CHAR = /[A-Za-z0-9_:.\-]/
const SPACE = /\s/

/** Reads a tag or attribute name at `at`, returning it and where it ended. */
function readName(source: string, at: number): { name: string; end: number } {
  let end = at
  while (end < source.length && NAME_CHAR.test(source[end]!)) end++
  return { name: source.slice(at, end), end }
}

function skipSpace(source: string, at: number): number {
  let end = at
  while (end < source.length && SPACE.test(source[end]!)) end++
  return end
}

/**
 * Attributes up to the end of the open tag.
 *
 * Values may be single- or double-quoted. An unquoted value is not legal XML
 * and PowerPoint never writes one, so it is read to the next space or bracket
 * rather than rejected — being lenient here costs nothing and refusing would
 * throw away a whole slide over a detail nothing reads.
 */
function readAttributes(source: string, at: number): { attrs: Record<string, string>; end: number } {
  const attrs: Record<string, string> = {}
  let cursor = at
  while (cursor < source.length) {
    cursor = skipSpace(source, cursor)
    const char = source[cursor]
    if (char === undefined || char === '>' || char === '/') break
    const { name, end } = readName(source, cursor)
    // Not a name and not an ending: step over it so the loop always advances.
    if (!name) {
      cursor++
      continue
    }
    cursor = skipSpace(source, end)
    if (source[cursor] !== '=') {
      attrs[name] = ''
      continue
    }
    cursor = skipSpace(source, cursor + 1)
    const quote = source[cursor]
    if (quote === '"' || quote === "'") {
      const close = source.indexOf(quote, cursor + 1)
      if (close === -1) {
        attrs[name] = decodeEntities(source.slice(cursor + 1))
        cursor = source.length
        break
      }
      attrs[name] = decodeEntities(source.slice(cursor + 1, close))
      cursor = close + 1
      continue
    }
    let end2 = cursor
    while (end2 < source.length && !SPACE.test(source[end2]!) && source[end2] !== '>' && source[end2] !== '/') end2++
    attrs[name] = decodeEntities(source.slice(cursor, end2))
    cursor = end2
  }
  return { attrs, end: cursor }
}

function node(name: string, attrs: Record<string, string>): XNode {
  const colon = name.indexOf(':')
  return { name, local: colon === -1 ? name : name.slice(colon + 1), attrs, children: [], text: '' }
}

/**
 * The document element of an XML part, or null if there is not one.
 *
 * Null rather than a throw: a deck with one unreadable slide should import as a
 * deck with one blank slide, not fail on the upload. Every caller here treats a
 * missing part as an empty part.
 */
export function parseXml(source: string): XNode | null {
  const root = node('#document', {})
  const stack: XNode[] = [root]
  let at = 0

  while (at < source.length) {
    const lt = source.indexOf('<', at)
    if (lt === -1) {
      stack[stack.length - 1]!.text += decodeEntities(source.slice(at))
      break
    }
    if (lt > at) stack[stack.length - 1]!.text += decodeEntities(source.slice(at, lt))

    // `<!--` comment, `<![CDATA[` literal, `<!DOCTYPE` and friends.
    if (source.startsWith('<!--', lt)) {
      const close = source.indexOf('-->', lt + 4)
      at = close === -1 ? source.length : close + 3
      continue
    }
    if (source.startsWith('<![CDATA[', lt)) {
      const close = source.indexOf(']]>', lt + 9)
      const body = close === -1 ? source.slice(lt + 9) : source.slice(lt + 9, close)
      // CDATA is literal by definition — no entity resolution.
      stack[stack.length - 1]!.text += body
      at = close === -1 ? source.length : close + 3
      continue
    }
    if (source.startsWith('<!', lt)) {
      const close = source.indexOf('>', lt + 2)
      at = close === -1 ? source.length : close + 1
      continue
    }
    // `<?xml ... ?>`
    if (source.startsWith('<?', lt)) {
      const close = source.indexOf('?>', lt + 2)
      at = close === -1 ? source.length : close + 2
      continue
    }
    // `</name>`
    if (source.startsWith('</', lt)) {
      const { name, end } = readName(source, lt + 2)
      const close = source.indexOf('>', end)
      at = close === -1 ? source.length : close + 1
      // Close the nearest matching element. A stray end tag for something that
      // was never opened is ignored rather than unwinding the whole stack.
      for (let depth = stack.length - 1; depth > 0; depth--) {
        if (stack[depth]!.name === name) {
          stack.length = depth
          break
        }
      }
      continue
    }

    const { name, end } = readName(source, lt + 1)
    if (!name) {
      // A `<` that begins nothing. It is text.
      stack[stack.length - 1]!.text += '<'
      at = lt + 1
      continue
    }
    const { attrs, end: afterAttrs } = readAttributes(source, end)
    const selfClosing = source[afterAttrs] === '/'
    const close = source.indexOf('>', afterAttrs)
    at = close === -1 ? source.length : close + 1

    const element = node(name, attrs)
    stack[stack.length - 1]!.children.push(element)
    // Past the depth limit the element is kept but not descended into, so the
    // shape of the document is preserved as far as it is legible.
    if (!selfClosing && stack.length < MAX_DEPTH) stack.push(element)
  }

  return root.children[0] ?? null
}

// ---- reading a parsed tree ---------------------------------------------------

/** Matches either the full prefixed name or the bare local name. */
function matches(child: XNode, name: string): boolean {
  return child.name === name || child.local === name
}

/** The first child called `name`, at one level down only. */
export function child(parent: XNode | null | undefined, name: string): XNode | null {
  if (!parent) return null
  for (const item of parent.children) if (matches(item, name)) return item
  return null
}

/** Every child called `name`, at one level down only, in document order. */
export function children(parent: XNode | null | undefined, name: string): XNode[] {
  if (!parent) return []
  return parent.children.filter((item) => matches(item, name))
}

/** Follows a chain of single children: `path(sp, 'spPr', 'xfrm', 'off')`. */
export function path(parent: XNode | null | undefined, ...names: string[]): XNode | null {
  let at: XNode | null = parent ?? null
  for (const name of names) {
    at = child(at, name)
    if (!at) return null
  }
  return at
}

/** An attribute, or undefined. */
export function attr(item: XNode | null | undefined, name: string): string | undefined {
  return item?.attrs[name]
}

/** An attribute as a finite number, or `fallback` when it is missing or not one. */
export function num(item: XNode | null | undefined, name: string, fallback = 0): number {
  const raw = item?.attrs[name]
  if (raw === undefined) return fallback
  const value = Number(raw)
  return Number.isFinite(value) ? value : fallback
}

/**
 * The first descendant called `name`, breadth-first.
 *
 * Breadth-first rather than depth-first because these lookups are all "the
 * nearest one" — the fill of *this* shape, not the fill of something buried in
 * its text. Depth-first would find the wrong one.
 */
export function find(parent: XNode | null | undefined, name: string): XNode | null {
  if (!parent) return null
  const queue: XNode[] = [...parent.children]
  let at = 0
  while (at < queue.length) {
    const item = queue[at++]!
    if (matches(item, name)) return item
    for (const kid of item.children) queue.push(kid)
  }
  return null
}
