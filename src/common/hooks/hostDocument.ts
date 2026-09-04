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
import { subscribe } from 'valtio'
import { widgetState } from '@/store/state'
import { autosaveState } from './autosave'
import type { DesignDocument } from '@/compose/types'
import type { TdLayout } from '@/store/types'

/** Quiet time before the host is told, in ms. */
const DEBOUNCE = 1000

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
}

type Options = {
  getTitle: () => string
  onChange: ((doc: DesignDocument, meta: { dirty: boolean }) => void) | null
  onSave: ((doc: DesignDocument) => Promise<void>) | null
}

/** A plain copy of what is on the canvas, free of the store's proxies. */
export function readDocument(title: string): DesignDocument {
  return {
    format: 'design-studio/v1',
    title,
    layouts: JSON.parse(JSON.stringify(widgetState.dLayouts)) as TdLayout[],
  }
}

export default function useHostDocument({ getTitle, onChange, onSave }: Options): HostDocument {
  const options = useRef({ getTitle, onChange, onSave })
  options.current = { getTitle, onChange, onSave }

  const host = useMemo<HostDocument & { dispose: () => void }>(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    /** The design as of the last save — what "unsaved" measures against. */
    let baseline = ''
    let watching = false
    let unsubscribe: (() => void) | undefined

    const snapshot = () => JSON.stringify([options.current.getTitle(), widgetState.dLayouts])

    function isDirty(): boolean {
      return watching && snapshot() !== baseline
    }

    function report() {
      const change = options.current.onChange
      if (!change) return
      change(readDocument(options.current.getTitle()), { dirty: isDirty() })
    }

    function schedule() {
      if (!watching) return
      // A change of selection reaches the store as readily as a change of
      // artwork, and a selection is not a change to the design.
      if (!isDirty()) return
      if (autosaveState.status !== 'saving') autosaveState.status = 'unsaved'
      clearTimeout(timer)
      timer = setTimeout(() => {
        if (isDirty()) report()
      }, DEBOUNCE)
    }

    async function saveNow() {
      const save = options.current.onSave
      if (!save) return
      clearTimeout(timer)
      const title = options.current.getTitle()
      const doc = readDocument(title)
      const attempt = JSON.stringify([title, widgetState.dLayouts])
      autosaveState.status = 'saving'
      try {
        await save(doc)
        // The baseline is what was sent, not what is on the canvas now: an edit
        // made while the request was in flight is still unsaved, and saying
        // "Saved" over it would be a lie the next reload would expose.
        baseline = attempt
        autosaveState.status = isDirty() ? 'unsaved' : 'saved'
      } catch (error) {
        console.error('[design] the host could not save this design', error)
        autosaveState.status = 'error'
      }
    }

    function rebase() {
      baseline = snapshot()
      autosaveState.status = 'saved'
    }

    function start() {
      if (watching) return
      rebase()
      watching = true
      unsubscribe = subscribe(widgetState, schedule)
    }

    // The last reliable moment to tell the host: on mobile a hidden tab is
    // often the only warning before the browser discards the page.
    const onHide = () => {
      if (document.visibilityState === 'hidden' && isDirty()) report()
    }
    document.addEventListener('visibilitychange', onHide)

    return {
      isDirty,
      saveNow,
      schedule,
      start,
      rebase,
      dispose() {
        document.removeEventListener('visibilitychange', onHide)
        unsubscribe?.()
        clearTimeout(timer)
      },
    }
  }, [])

  useEffect(() => host.dispose, [host])

  return host
}
