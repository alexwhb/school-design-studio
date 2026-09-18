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
import { SAFE_FONT_FAMILY, SANITISED_FIELDS } from '@/components/modules/widgets/widgetTypes'
import type { DesignDocument } from './types'
import type { TdWidgetData } from '@/store/types'

export { SAFE_FONT_FAMILY, SANITISED_FIELDS }

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
 * The document with every interpolated field that does not pass taken out.
 *
 * Works on a copy, so a host can hand in a document it is still holding. Every
 * way a document enters the editor goes through this — the `document` prop,
 * `setDocument`, and `applyOps` — so there is no route in that skips it.
 */
export function sanitizeFields(doc: DesignDocument): { doc: DesignDocument; report: FieldReport } {
  const next = JSON.parse(JSON.stringify(doc)) as DesignDocument
  const report: FieldReport = { dropped: [] }

  for (const layout of next.layouts || []) {
    for (const layer of layout.layers || []) {
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

  return { doc: next, report }
}
