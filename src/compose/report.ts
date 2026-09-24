/**
 * Where the composer writes down what it could not do.
 *
 * Nothing a model writes is ever thrown away without a line here. A heading cut
 * to fit, a bullet with nowhere to go, a slide past the page limit: each is one
 * entry, with the words in full, so the host can say "two points did not fit"
 * rather than a person finding out in front of a room.
 */
import type { ComposeReport, DroppedText } from './types'

export type Reason = DroppedText['reason']

export type Recorder = {
  report: ComposeReport
  /** The page being composed now, and the outline item it came from. */
  page: number
  source: number
  note(field: string, text: string, reason: Reason, page?: number): void
}

export function recorder(): Recorder {
  const seen = new Set<string>()
  const rec: Recorder = {
    report: { continuedPages: 0, dropped: [] },
    page: 0,
    source: 0,
    note(field, text, reason, page) {
      const words = String(text ?? '').trim()
      if (!words) return
      // Once per thing. A continuation page carries its slide's heading again,
      // and every slide carries the school's name along the bottom; a heading
      // that was cut is one fact, not one per page it appears on.
      const key = field === 'footer' ? `footer|${reason}` : `${rec.source}|${field}|${reason}`
      if (seen.has(key)) return
      seen.add(key)
      rec.report.dropped.push({ page: page ?? rec.page, source: rec.source, field, text: words, reason })
    },
  }
  return rec
}

/** A recorder whose notes go nowhere, for callers that never asked. */
export function silent(): Recorder {
  return recorder()
}

/** `maxPages` as asked for, within what a design can hold. */
export function pageCap(asked: number | undefined, most: number): number {
  const n = Math.floor(Number(asked))
  return Number.isFinite(n) && n >= 1 ? Math.min(n, most) : most
}
