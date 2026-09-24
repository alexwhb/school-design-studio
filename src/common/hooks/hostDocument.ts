/**
 * The design, when the host is the one keeping it.
 *
 * `autosave.ts` beside this is the standalone answer: write to IndexedDB after
 * two seconds of quiet, and offer the last one back on the next visit. Neither
 * of those is right inside a planner. The planner already knows which school
 * and which user this is, it has somewhere better than one browser to put a
 * design, and being asked "pick up where you left off?" about a design the host
 * did not hand in would be a question about somebody else's work.
 *
 * So when a document comes in as a prop this takes over: no database is read or
 * written, the restore offer never appears, and every change is reported out
 * after a second of quiet — one call for a typed word rather than one per
 * letter, which is the same debounce the autosave uses and for the same reason.
 *
 * Saving is the host's too. The pill above the canvas still says where the work
 * stands, because that is the only thing that does, but "Saved" now means the
 * host's promise resolved rather than that IndexedDB took it.
 */
import { useEffect, useMemo, useRef } from 'react'
import { widgetState } from '@/store/state'
import { layoutsRevision, onLayoutsChange } from '@/store/revision'
import { autosaveState } from './autosave'
import type { DesignDocument } from '@/compose/types'
import type { TdLayout } from '@/store/types'
import { plainLayouts, TRANSIENT_FIELDS } from '@/store/transient'
import { commitOpenEdit } from '@/common/methods/openEdit'
import { sanitizeFields, sanitizeFieldsInPlace } from '@/compose/fields'

/** Quiet time before the host is told, in ms. */
const DEBOUNCE = 1000
/** Quiet time before the pill is brought up to date, in ms. Part of DEBOUNCE, not added to it. */
const CHECK_DELAY = 250

export type HostDocument = {
  /** True when the canvas has moved on from the last save. */
  isDirty: () => boolean
  /** Save now: the toolbar button, and Cmd/Ctrl-S. */
  saveNow: () => Promise<void>
  /** Call when something outside the widget store changes, such as the title. */
  schedule: () => void
  /** Start watching, with what is on the canvas as the baseline. */
  start: () => void
  /** After the host replaces the document wholesale, this is the new baseline. */
  rebase: () => void
  /**
   * The host saved a design on its own account. `doc` is what it saved, or the
   * canvas when left out; either way it is now what "unsaved" measures
   * against. The canvas and the undo history are not touched.
   */
  markSaved: (doc?: DesignDocument) => void
}

type Options = {
  getTitle: () => string
  onChange: ((doc: DesignDocument, meta: { dirty: boolean }) => void) | null
  onSave: ((doc: DesignDocument) => Promise<void>) | null
}

/**
 * A plain copy of what is on the canvas, free of the store's proxies and of
 * the flags that only mean something while a box is being edited.
 *
 * Words still being typed are stored first, so what comes out is what is on
 * the screen rather than what was there when the caret went in — unless the
 * caller says not to, which only the quiet-time report does.
 */
export function readDocument(title: string, { commit = true }: { commit?: boolean } = {}): DesignDocument {
  if (commit) commitOpenEdit()
  const doc: DesignDocument = {
    format: 'design-studio/v1',
    title,
    layouts: plainLayouts(widgetState.dLayouts) as TdLayout[],
  }
  // Checked on the way out as well as on the way in. Whatever reached the
  // store by a route that skipped the way in — a template, a restored draft —
  // does not reach the host unchecked.
  const report = sanitizeFieldsInPlace(doc)
  if (report.dropped.length) console.warn('[design] dropped fields a design may not carry', report.dropped)
  return doc
}

export default function useHostDocument({ getTitle, onChange, onSave }: Options): HostDocument {
  const options = useRef({ getTitle, onChange, onSave })
  options.current = { getTitle, onChange, onSave }

  const host = useMemo(() => createHostDocument(options), [])

  useEffect(() => host.dispose, [host])

  return host
}

/**
 * The keeper itself, outside React so it can be driven on its own. The hook
 * above holds one per editor and hands it the latest options through a ref.
 */
export function createHostDocument(options: { current: Options }): HostDocument & { dispose: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined
  let checkTimer: ReturnType<typeof setTimeout> | undefined
  /** The design as of the last save — what "unsaved" measures against. */
  let baseline = ''
  let watching = false
  let unsubscribe: (() => void) | undefined

  /**
   * What "the design changed" is measured against.
   *
   * Two keys, and the editing flags, are left out of it. `record` is a widget's measured box, written
   * back by the widget itself the first time it draws — so a design that has
   * merely been *shown* differs from the one that was handed in, and the pill
   * read "Unsaved changes" over an untouched page. `tag` is the counter that
   * forces a redraw. Neither is anything a person changed, and neither is
   * worth telling the host about. The editing flags go for the same reason:
   * double-clicking into a box and out again changes nothing.
   */
  const IGNORED = new Set(['record', 'tag', ...TRANSIENT_FIELDS])
  const snapshotOf = (title: string, layouts: unknown) => JSON.stringify([title, layouts], (key, value) => (IGNORED.has(key) ? undefined : value))
  const snapshot = () => snapshotOf(options.current.getTitle(), widgetState.dLayouts)

  /**
   * The last answer, and what it was an answer about.
   *
   * The comparison itself writes the whole design out as JSON, and it used
   * to run on every change to the widget store — a selection, the widget
   * under the pointer. Now it runs only when asked, and only when the
   * design, its name or the baseline has moved since the last time; asking
   * twice about the same design is free.
   */
  let checked = { revision: -1, title: '', base: -1, dirty: false }
  /** Moves whenever `baseline` does, so the cache can tell without comparing strings. */
  let baseVersion = 0

  function isDirty(): boolean {
    if (!watching) return false
    const revision = layoutsRevision()
    const title = options.current.getTitle()
    if (checked.revision === revision && checked.title === title && checked.base === baseVersion) return checked.dirty
    const dirty = snapshot() !== baseline
    checked = { revision, title, base: baseVersion, dirty }
    return dirty
  }

  function setBaseline(next: string) {
    baseline = next
    baseVersion++
  }

  /** Whether the host has last been told the design is dirty. */
  let reportedDirty = false

  function report() {
    const change = options.current.onChange
    if (!change) return
    const dirty = isDirty()
    reportedDirty = dirty
    // Not committed first. This runs on its own after a second of quiet, and
    // a pause in the middle of a sentence is not the end of an edit: storing
    // the words here would make an undo step of every pause. The host hears
    // about them when the edit ends, which is itself a change.
    change(readDocument(options.current.getTitle(), { commit: false }), { dirty })
  }

  /**
   * Brings the pill up to date and, after a quiet second, tells the host.
   *
   * Once per burst rather than once per change: a drag writes on every
   * pointer move, and the answer is only wanted once it stops. The host hears
   * about a design that has changed, and also about one that has gone back
   * to what was saved — an undo all the way back is a design that no longer
   * needs saving, and a host keeping a draft wants to know that too.
   */
  function check() {
    if (!watching) return
    const dirty = isDirty()
    if (autosaveState.status !== 'saving') {
      if (dirty) autosaveState.status = 'unsaved'
      else if (autosaveState.status === 'unsaved') autosaveState.status = 'saved'
    }
    if (!dirty && !reportedDirty) return
    clearTimeout(timer)
    timer = setTimeout(report, DEBOUNCE - CHECK_DELAY)
  }

  function schedule() {
    if (!watching) return
    clearTimeout(checkTimer)
    checkTimer = setTimeout(check, CHECK_DELAY)
  }

  async function saveNow() {
    const save = options.current.onSave
    if (!save) return
    clearTimeout(timer)
    // Before the snapshot as well as the document, so the baseline this
    // save sets includes the words it sent.
    commitOpenEdit()
    const title = options.current.getTitle()
    const doc = readDocument(title)
    // Taken the same way the dirty check takes it, or the two never agree and
    // a save that worked still reads as unsaved.
    const attempt = snapshot()
    autosaveState.status = 'saving'
    try {
      await save(doc)
      // The baseline is what was sent, not what is on the canvas now: an edit
      // made while the request was in flight is still unsaved, and saying
      // "Saved" over it would be a lie the next reload would expose.
      setBaseline(attempt)
      reportedDirty = false
      autosaveState.status = isDirty() ? 'unsaved' : 'saved'
    } catch (error) {
      console.error('[design] the host could not save this design', error)
      autosaveState.status = 'error'
    }
  }

  function rebase() {
    setBaseline(snapshot())
    reportedDirty = false
    clearTimeout(timer)
    autosaveState.status = 'saved'
  }

  /**
   * A save the host made itself — filling a blank, turning motion on, saving
   * before an AI refine, putting back an older version. The pill should say
   * Saved and `isDirty()` should be false, without the canvas being redrawn or
   * the undo history being lost, which is what `setDocument` would do.
   *
   * With a document, the baseline is that document, passed through the same
   * checks the canvas's own copy went through on its way in, so that the two
   * are compared like for like. If the canvas has moved on from it since, the
   * design is still unsaved, which is the truth.
   */
  function markSaved(doc?: DesignDocument) {
    clearTimeout(timer)
    if (doc && Array.isArray(doc.layouts)) {
      const { doc: safe } = sanitizeFields(doc)
      setBaseline(snapshotOf(typeof safe.title === 'string' ? safe.title : options.current.getTitle(), safe.layouts))
    } else {
      commitOpenEdit()
      setBaseline(snapshot())
    }
    const dirty = isDirty()
    reportedDirty = dirty
    if (autosaveState.status !== 'saving' || !dirty) autosaveState.status = dirty ? 'unsaved' : 'saved'
  }

  function start() {
    if (watching) return
    rebase()
    watching = true
    // The design only, not the whole widget store: a selection or a hover
    // is not a change to the design and should cost nothing.
    unsubscribe = onLayoutsChange(schedule)
  }

  // The last reliable moment to tell the host: on mobile a hidden tab is
  // often the only warning before the browser discards the page.
  const onHide = () => {
    if (document.visibilityState === 'hidden' && isDirty()) report()
  }
  if (typeof document !== 'undefined') document.addEventListener('visibilitychange', onHide)

  return {
    isDirty,
    saveNow,
    schedule,
    start,
    rebase,
    markSaved,
    dispose() {
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onHide)
      unsubscribe?.()
      clearTimeout(timer)
      clearTimeout(checkTimer)
    },
  }
}
