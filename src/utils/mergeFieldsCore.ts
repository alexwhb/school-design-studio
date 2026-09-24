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

import type { TdLayout, TdWidgetData } from '@/store/types'
import { normaliseHref } from '@/utils/widgets/richText'

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

/**
 * Whether `code` names a character a string can hold on its own.
 *
 * `String.fromCodePoint` throws a RangeError above U+10FFFF, and a number
 * reference can be as long as anybody cares to type — `&#99999999999;` parses
 * to a finite number that is nothing of the sort. A lone surrogate does not
 * throw, but it is half a character, and it is what turns a string into one
 * that JSON and every encoder downstream handle differently. So both are left
 * standing as the literal text they were, which is what a browser shows for
 * the first and near enough for the second.
 */
function isScalarValue(code: number): boolean {
  return Number.isInteger(code) && code > 0 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff)
}

/**
 * `&#37;` and `&amp;` back into the characters a reader sees.
 *
 * Never throws. Three readers sit on this — `sanitizeMarkup`, the `setMarkup`
 * op and `describeDocument` — and all three promise not to, and the planner
 * runs the first inside a validator, where an exception is a 500 for a person
 * who pasted an odd character. A reference that names no character is left as
 * it was written.
 */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (whole, body: string) => {
    if (body[0] === '#') {
      const hex = body[1] === 'x' || body[1] === 'X'
      const digits = hex ? body.slice(2) : body.slice(1)
      // Checked as digits first: `parseInt` reads `&#12ab;` as 12, and a
      // decimal reference with hex letters in it is not a reference at all.
      if (!digits || !(hex ? /^[0-9a-f]+$/i : /^[0-9]+$/).test(digits)) return whole
      const code = parseInt(digits, hex ? 16 : 10)
      return isScalarValue(code) ? String.fromCodePoint(code) : whole
    }
    // Own keys only. A plain object answers `constructor`, `toString` and the
    // rest of Object.prototype too, so `&constructor;` decoded to the source
    // text of a function.
    const name = body.toLowerCase()
    return Object.hasOwn(ENTITIES, name) ? ENTITIES[name] : whole
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
 *
 * A field inside a tag is the one place this can go wrong, because there the
 * value lands in an attribute rather than in the words. Two rules cover it.
 * A link is filled — `https://{{school.website}}` is how the link field says
 * "the school's own site" — and the finished address then has to pass the same
 * scheme check any other link does, so a value of `javascript:…` in the kit
 * takes the link off rather than arming it. Anywhere else inside a tag the
 * field is left standing: the editor never writes one there, the DOM path in
 * `mergeFields.ts` never fills one there, and a colour or a style is not a place
 * for a school's name. The value is escaped for an attribute either way, so a
 * quote in it cannot end the attribute and start another.
 */
export function fillMarkup(html: string | undefined, resolve: TFieldResolver): string {
  if (!html || !html.includes('{{')) return html ?? ''
  let linkFilled = false
  const filled = html.replace(/\{\{([^{}]*?)\}\}/g, (whole, body: string, offset: number) => {
    const name = decodeEntities(String(body).replace(/<[^>]*>/g, '')).trim()
    if (!name || /\n/.test(name)) return whole
    const value = resolve(name)
    if (value === undefined) return whole
    const place = placeOf(html, offset)
    if (place === 'attribute') return whole
    if (place === 'href') linkFilled = true
    return escapeMarkup(value)
  })
  return linkFilled ? checkLinks(filled) : filled
}

/**
 * Where in the markup `offset` is: in the words, in a link's address, or in
 * some other part of a tag.
 *
 * A tag is open when the last `<` before the offset comes after the last `>`.
 * That is not a full tokeniser, and it does not have to be: the markup this is
 * given is the editor's own canonical form, and misreading one only ever
 * makes a field be left standing or be escaped, never be let out.
 */
function placeOf(html: string, offset: number): 'text' | 'href' | 'attribute' {
  const open = html.lastIndexOf('<', offset)
  if (open < 0 || open < html.lastIndexOf('>', offset)) return 'text'
  const before = html.slice(open, offset)
  return /\shref\s*=\s*("[^"]*|'[^']*|[^\s"'>]*)$/i.test(before) ? 'href' : 'attribute'
}

const HREF_ATTRIBUTE = /(\s)href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/gi

/**
 * Every link in the markup re-checked, as it stands after filling.
 *
 * An address that no longer passes `normaliseHref` loses its `href`, which
 * leaves the words and takes away the link — the same answer the allowlist
 * gives a pasted `javascript:` link.
 */
function checkLinks(html: string): string {
  return html.replace(/<a\b[^>]*>/gi, (tag) =>
    tag.replace(HREF_ATTRIBUTE, (_whole, space: string, double?: string, single?: string, bare?: string) => {
      const href = normaliseHref(decodeEntities(double ?? single ?? bare ?? ''))
      return href ? `${space}href="${escapeMarkup(href)}"` : ''
    }),
  )
}

/**
 * A value going into markup. Field values are words, not HTML.
 *
 * Quotes as well as angle brackets, because a value can land inside an
 * attribute — a link's address — and there a `"` would close the attribute and
 * let the rest of the value write new ones.
 */
export function escapeMarkup(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

/**
 * Words going into the text of an element, where a quote is just a quote.
 *
 * `escapeMarkup` is the one to reach for when there is any doubt; this is for
 * a caller that builds the markup itself and knows the value is never put in
 * an attribute, so a composed "it's" is stored as it was typed.
 */
export function escapeText(value: string): string {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function carriesText(widget: TdWidgetData): widget is TdWidgetData & { text: string } {
  return widget.type === 'w-text' && typeof widget.text === 'string'
}

/** Every field on a page, deduplicated across its text boxes. */
export function fieldsInLayers(layers: TdWidgetData[]): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  for (const layer of layers) {
    if (!carriesText(layer)) continue
    for (const name of fieldsInText(layer.text)) {
      const key = fieldKey(name)
      if (seen.has(key)) continue
      seen.add(key)
      names.push(name)
    }
  }
  return names
}

/** Every field in a design, deduplicated across all of its pages. */
export function fieldsInLayouts(layouts: TdLayout[]): string[] {
  return fieldsInLayers(layouts.flatMap((layout) => layout.layers))
}
