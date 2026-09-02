/*
 * Merge fields: `{{name}}` written into a text box, filled in from somewhere
 * else. The brand kit fills `{{school.name}}` from the school's own details,
 * and bulk documents fill `{{Pupil}}` from a column of a pasted list; both go
 * through here so that a field means the same thing wherever it is typed.
 *
 * A text widget's `text` is HTML, and a field can be split across tags the
 * moment somebody bolds half of it — `{{<b>name</b>}}` is what contentEditable
 * writes. So fields are found in the rendered text and spliced back through
 * the same machinery find-and-replace uses, which never touches markup. A
 * field that nothing resolves is left exactly as it was, so the author can see
 * what is still waiting to be filled.
 */
import { findInMarkup, renderedText, replaceInMarkup } from './widgets/textMatch'
import type { TdLayout, TdWidgetData } from '@/store/types'

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

/** Whether a text box carries any field at all. Cheap enough to run on every widget. */
export function hasFields(html: string | undefined): boolean {
  if (!html || !html.includes('{{')) return false
  FIELD_PATTERN.lastIndex = 0
  return FIELD_PATTERN.test(renderedText(html))
}

/**
 * The fields a text box asks for, in reading order, each named once with the
 * spelling it was first written in.
 */
export function fieldsInText(html: string | undefined): string[] {
  if (!html || !html.includes('{{')) return []
  const names: string[] = []
  const seen = new Set<string>()
  for (const match of renderedText(html).matchAll(FIELD_PATTERN)) {
    const name = match[1].trim()
    const key = fieldKey(name)
    if (seen.has(key)) continue
    seen.add(key)
    names.push(name)
  }
  return names
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

/**
 * The markup with every resolvable field replaced by its value. Fields the
 * resolver declines are left in place.
 *
 * Worked back to front, one hit at a time, so each splice happens at offsets
 * that are still true: replacing a later field cannot move an earlier one.
 */
export function fillText(html: string | undefined, resolve: TFieldResolver): string {
  if (!html || !html.includes('{{')) return html ?? ''
  const plain = renderedText(html)
  const hits: { start: number; length: number; value: string }[] = []
  for (const match of plain.matchAll(FIELD_PATTERN)) {
    const value = resolve(match[1].trim())
    if (value === undefined) continue
    hits.push({ start: match.index ?? 0, length: match[0].length, value })
  }
  if (hits.length === 0) return html

  let out = html
  for (const hit of hits.sort((a, b) => b.start - a.start)) {
    out = replaceInMarkup(out, [{ start: hit.start, length: hit.length }], hit.value)
  }
  return out
}

/**
 * A copy of the widget with its fields filled, or the same widget if nothing
 * changed — so callers can tell the two apart by identity.
 */
export function fillWidget(widget: TdWidgetData, resolve: TFieldResolver): TdWidgetData {
  if (!carriesText(widget) || !hasFields(widget.text)) return widget
  const text = fillText(widget.text, resolve)
  return text === widget.text ? widget : { ...widget, text }
}

/** Every text box on a page filled. Reports how many boxes changed. */
export function fillLayers(layers: TdWidgetData[], resolve: TFieldResolver): { layers: TdWidgetData[]; filled: number } {
  let filled = 0
  const out = layers.map((layer) => {
    const next = fillWidget(layer, resolve)
    if (next !== layer) filled++
    return next
  })
  return { layers: out, filled }
}

/** A page with its text boxes filled. The page's own settings are untouched. */
export function fillLayout(layout: TdLayout, resolve: TFieldResolver): { layout: TdLayout; filled: number } {
  const { layers, filled } = fillLayers(layout.layers, resolve)
  return { layout: filled ? { ...layout, layers } : layout, filled }
}

/**
 * Whether `query` reads as a field name this text box would accept — used by
 * dialogs to tell "you typed {{Grade}} but the list has no Grade column" apart
 * from a typo in the braces.
 */
export function mentionsField(html: string | undefined, name: string): boolean {
  return findInMarkup(html, `{{${name}}}`, false).length > 0 || fieldsInText(html).some((n) => fieldKey(n) === fieldKey(name))
}
