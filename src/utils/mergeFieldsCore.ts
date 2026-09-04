/*
 * The merge-field grammar, and a reader for markup that works without a DOM.
 *
 * `mergeFields.ts` is the browser's answer: it parses a widget's HTML, walks
 * its text nodes and splices a value into the exact ones that matched, so that
 * `{{<b>school.name</b>}}` keeps its bold and nothing else in the markup is
 * touched. That needs `document`, and the compose entry runs on a server where
 * there is none — so the grammar lives here, shared by both, and this file adds
 * a plain-string reader and filler for the callers that have no DOM.
 *
 * The two differ in exactly one place, and it is worth knowing which you have:
 * a field split across tags is filled here by replacing the whole run, tags and
 * all, with the value. The DOM path keeps the formatting the field was wearing.
 * Nothing composed here is ever split, and a stored design almost never is.
 */

/** `{{ name }}` — braces around anything that is not a brace or a line break. */
export const FIELD_PATTERN = /\{\{\s*([^{}\n]+?)\s*\}\}/g

/** Given a field's name, its value — or `undefined` to leave the field standing. */
export type TFieldResolver = (name: string) => string | undefined

/**
 * How two spellings of a field are compared: `{{Pupil}}`, `{{ pupil }}` and
 * `{{PUPIL}}` are the same column of the same list.
 */
export function fieldKey(name: string): string {
  return name.trim().toLowerCase()
}

/** A resolver over a plain map, matched by `fieldKey`. */
export function valuesResolver(values: Record<string, string | undefined>): TFieldResolver {
  const byKey = new Map<string, string>()
  for (const [name, value] of Object.entries(values)) {
    if (value !== undefined) byKey.set(fieldKey(name), value)
  }
  return (name) => byKey.get(fieldKey(name))
}

/** Elements whose edges read as a line break. Same list `textMatch.ts` uses. */
const BLOCK = /^(address|blockquote|div|dl|dd|dt|h[1-6]|li|ol|p|pre|table|td|th|tr|ul)$/

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
}

/** `&#37;` and `&amp;` back into the characters a reader sees. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const code = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10)
      return Number.isFinite(code) && code > 0 ? String.fromCodePoint(code) : whole
    }
    const named = ENTITIES[body.toLowerCase()]
    return named ?? whole
  })
}

/**
 * What a text widget's markup reads as, as plain text.
 *
 * Tags go, `<br>` and the edges of a block become one newline, entities are
 * decoded. This is what an LLM is shown of a page and what a field name is
 * matched in, so it has to be the words and nothing else.
 */
export function plainFromMarkup(html: string | undefined): string {
  if (!html) return ''
  const out = html.replace(/<br\s*\/?>/gi, '\n').replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (_whole, tag: string) => (BLOCK.test(String(tag).toLowerCase()) ? '\n' : ''))
  return decodeEntities(out)
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\n+|\n+$/g, '')
}

/** Whether a text box carries any field at all. */
export function hasFields(html: string | undefined): boolean {
  if (!html || !html.includes('{{')) return false
  // `search` rather than `test`: a global regex remembers where its last match
  // ended, so a `test` left un-reset would make the next call skip a field.
  return plainFromMarkup(html).search(FIELD_PATTERN) !== -1
}

/**
 * The fields a text box asks for, in reading order, each named once with the
 * spelling it was first written in.
 */
export function fieldsInText(html: string | undefined): string[] {
  if (!html || !html.includes('{{')) return []
  const names: string[] = []
  const seen = new Set<string>()
  for (const match of plainFromMarkup(html).matchAll(FIELD_PATTERN)) {
    const name = match[1].trim()
    const key = fieldKey(name)
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
}

/**
 * The markup with every resolvable field replaced by its value, without a DOM.
 *
 * The braces are matched in the markup itself, allowing tags between them, so a
 * field somebody bolded half of is still found. Fields nothing resolves are
 * left exactly as they were, which is how an author sees what is missing.
 */
export function fillMarkup(html: string | undefined, resolve: TFieldResolver): string {
  if (!html || !html.includes('{{')) return html ?? ''
  return html.replace(/\{\{([^{}]*?)\}\}/g, (whole, body: string) => {
    const name = decodeEntities(String(body).replace(/<[^>]*>/g, '')).trim()
    if (!name || /\n/.test(name)) return whole
    const value = resolve(name)
    return value === undefined ? whole : escapeMarkup(value)
  })
}

/** A value going into markup. Field values are words, not HTML. */
export function escapeMarkup(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
