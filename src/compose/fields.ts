/**
 * Fields that are interpolated somewhere, checked before they can be.
 *
 * A design is JSON, and most of what is in it only ever reaches a style
 * property or a text node, where the browser does the escaping. Two kinds do
 * not: the URLs (`URL_FIELDS`), which the host checks against its own origin,
 * and the ones listed in `SANITISED_FIELDS`, which the editor writes into
 * something that parses.
 *
 * Today that is one field. `fontClass.value` is put into a `<style>` element as
 * `@font-face { font-family: "…" }`, and that element's markup is appended to
 * the document's head — so a family called `"; } body { … ` would be writing
 * CSS into the host's page. Nothing reaches that code at the moment: it is
 * behind `supportSubFont`, which is off. But the value comes out of a stored
 * document, and a field whose safety rests on a flag staying off is a field
 * that is unsafe. It is checked on the way in instead, where the answer does
 * not depend on which code path happens to run.
 *
 * Dropped rather than escaped. A font family is a name from a short list; one
 * that is not on the list is not a font, and the text falls back to the
 * editor's default, which is visible and obvious rather than silently wrong.
 */
import { PAGE_TYPE, PAINT_FIELDS, PAINT_NUMBER_FIELDS, SAFE_FONT_FAMILY, SANITISED_FIELDS } from '@/components/modules/widgets/widgetTypes'
import type { DesignDocument } from './types'
import { isSafePaint } from './paint'
import { stripTransient } from '@/store/transient'
import type { TdWidgetData } from '@/store/types'

export { PAINT_FIELDS, PAINT_NUMBER_FIELDS, SAFE_FONT_FAMILY, SANITISED_FIELDS }

/** What was taken out, so a caller can say so rather than wonder. */
export type FieldReport = { dropped: { type: string; path: string; value: string }[] }

function ok(path: string, value: unknown): boolean {
  if (typeof value !== 'string') return false
  // One rule today, and the path names it. A second field would name its own
  // rather than share this one — "the pattern for interpolated fields" is not a
  // thing, only "the pattern for a font family" is.
  if (path === 'fontClass.value') return SAFE_FONT_FAMILY.test(value)
  return true
}

/** Walks a dotted path and hands back the object holding the last key. */
function holderOf(layer: TdWidgetData, path: string): { holder: Record<string, unknown>; key: string } | null {
  const parts = path.split('.')
  let node: unknown = layer
  for (const part of parts.slice(0, -1)) {
    if (!node || typeof node !== 'object') return null
    node = (node as Record<string, unknown>)[part]
  }
  if (!node || typeof node !== 'object') return null
  return { holder: node as Record<string, unknown>, key: parts[parts.length - 1] }
}

/**
 * Every place a dotted path reaches, `[]` standing for each element of an
 * array: the object or array holding the value, and the key or index in it.
 * A path that runs into something that is not there reaches nowhere.
 */
function targetsOf(root: unknown, path: string): { holder: Record<string, unknown> | unknown[]; key: string | number }[] {
  let frontier: { holder: Record<string, unknown> | unknown[]; key: string | number }[] = [{ holder: { root } as Record<string, unknown>, key: 'root' }]
  for (const part of path.split('.')) {
    const each = part.endsWith('[]')
    const name = each ? part.slice(0, -2) : part
    const next: typeof frontier = []
    for (const { holder, key } of frontier) {
      const node = (holder as Record<string | number, unknown>)[key]
      if (!node || typeof node !== 'object') continue
      if (!each) {
        next.push({ holder: node as Record<string, unknown>, key: name })
        continue
      }
      const list = (node as Record<string, unknown>)[name]
      if (!Array.isArray(list)) continue
      list.forEach((_, index) => next.push({ holder: list, key: index }))
    }
    frontier = next
  }
  return frontier
}

/**
 * What a paint that is not one becomes.
 *
 * Not deleted: a colour nearly always has a reader that expects one to be
 * there. A page's gradient goes back to none and its colour to white, which is
 * what a new page has; anything else becomes transparent, so the part that
 * was trying to draw something else draws nothing — obvious rather than a
 * guess at what was meant.
 */
function safePaintFor(type: string, path: string): string {
  if (type === PAGE_TYPE && path === 'backgroundGradient') return ''
  if (type === PAGE_TYPE && path === 'backgroundColor') return '#ffffffff'
  return 'transparent'
}

/**
 * Checks every paint and paint number on one object — a layer, or a page — and
 * resets the ones that fail, saying so in `report`.
 */
function checkPaints(target: Record<string, unknown>, type: string, report: FieldReport) {
  for (const path of PAINT_FIELDS[type] || []) {
    for (const { holder, key } of targetsOf(target, path)) {
      const value = (holder as Record<string | number, unknown>)[key]
      // Absent and empty are how a design says "none", and are not paints.
      if (value === undefined || value === null || value === '') continue
      if (typeof value === 'string' && isSafePaint(value)) continue
      report.dropped.push({ type, path, value: String(value).slice(0, 80) })
      ;(holder as Record<string | number, unknown>)[key] = safePaintFor(type, path)
    }
  }
  for (const path of PAINT_NUMBER_FIELDS[type] || []) {
    for (const { holder, key } of targetsOf(target, path)) {
      const value = (holder as Record<string | number, unknown>)[key]
      if (value === undefined || value === null) continue
      if (typeof value === 'number' && Number.isFinite(value)) continue
      report.dropped.push({ type, path, value: String(value).slice(0, 80) })
      // A gradient's default direction is straight down; a stop with no
      // offset of its own goes at the start.
      ;(holder as Record<string | number, unknown>)[key] = path.endsWith('.angle') ? 180 : 0
    }
  }
}

/**
 * The document with every interpolated field that does not pass taken out.
 *
 * Works on a copy, so a host can hand in a document it is still holding. Every
 * way a document enters the editor goes through this — the `document` prop,
 * `setDocument`, and `applyOps` — so there is no route in that skips it.
 */
export function sanitizeFields(doc: DesignDocument): { doc: DesignDocument; report: FieldReport } {
  const next = JSON.parse(JSON.stringify(doc)) as DesignDocument
  return { doc: next, report: sanitizeFieldsInPlace(next) }
}

/**
 * The same checks, made on a copy the caller already owns. For the editor's
 * own read-out, which has just made one and should not pay for a second.
 * Not part of the compose entry: a host always wants the copy.
 */
export function sanitizeFieldsInPlace(next: DesignDocument): FieldReport {
  const report: FieldReport = { dropped: [] }
  // The editing flags are not fields anybody could misuse, but they are not
  // part of a design either, and a document that arrives still carrying one
  // opens with a box that believes it has the caret. See store/transient.ts.
  stripTransient(next.layouts)

  for (const layout of next.layouts || []) {
    if (layout?.global && typeof layout.global === 'object') checkPaints(layout.global as unknown as Record<string, unknown>, PAGE_TYPE, report)
    for (const layer of layout.layers || []) {
      if (!layer || typeof layer !== 'object') continue
      checkPaints(layer as unknown as Record<string, unknown>, String(layer.type), report)
      for (const path of SANITISED_FIELDS[String(layer.type)] || []) {
        const found = holderOf(layer, path)
        if (!found) continue
        const value = found.holder[found.key]
        if (value === undefined || ok(path, value)) continue
        report.dropped.push({ type: String(layer.type), path, value: String(value).slice(0, 80) })
        // The family and the name the widget draws in are one setting written
        // twice, so dropping one without the other would leave the text in a
        // font the editor no longer believes it is using.
        if (path === 'fontClass.value') {
          delete (layer as Record<string, unknown>).fontClass
          delete (layer as Record<string, unknown>).fontFamily
        } else {
          delete found.holder[found.key]
        }
      }
    }
  }

  return report
}
