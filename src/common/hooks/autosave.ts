/**
 * Keeps the design being worked on, and offers it back after a reload.
 *
 * The editor used to hold everything in memory only. File → Save was a no-op
 * without a ?tempid in the URL, there was no autosave, and the sole protection
 * was the browser's "leave site?" prompt — switched off in dev. Refreshing the
 * tab lost the lot.
 *
 * Saving is debounced rather than immediate: every keystroke in a text box
 * would otherwise be a write, and a design carrying pasted photographs runs to
 * megabytes. Two seconds of quiet is long enough to coalesce typing and short
 * enough that little is ever at risk.
 *
 * It also saves a page at a time. This file's job in that is to work out which
 * pages moved — it holds each page's JSON from the last write and compares —
 * so that editing page one of a fifty-page deck writes page one. Where the
 * bytes then go is localDesigns.ts's business, not this file's.
 */
import { useEffect, useMemo, useRef } from 'react'
import { subscribe } from 'valtio'
import { widgetState } from '@/store/state'
import { setDPage, getDPage } from '@/store/canvas'
import { getWidgets, setDLayouts, setDWidgets } from '@/store/widget/widget'
import { selectWidget } from '@/store/widget/select'
import { clearDraft, describeAge, readDraft, saveDraft } from '@/common/methods/localDesigns'
import { confirmChoice } from '@/common/methods/confirm'
import message from '@/components/ui/message'
import type { TdLayout } from '@/store/types'

/** Quiet time before a save, in ms. */
const DEBOUNCE = 2000

type TOptions = {
  /** Reads the design's name, which lives in the toolbar's own state. */
  getTitle: () => string
  /** Puts a restored name back into the toolbar. */
  setTitle: (title: string) => void
}

export type Autosave = {
  restoreThenWatch: (isBlankEditor: boolean) => Promise<void>
  saveNow: () => Promise<void>
  isDirty: () => boolean
  /** Call when something outside the widget store changes, such as the title. */
  schedule: () => void
}

export default function useAutosave({ getTitle, setTitle }: TOptions): Autosave {
  const options = useRef({ getTitle, setTitle })
  options.current = { getTitle, setTitle }

  const autosave = useMemo<Autosave & { dispose: () => void }>(() => {
    let timer: ReturnType<typeof setTimeout> | undefined
    /** The design as of the last write, or as first seen — what "unsaved" measures against. */
    let baseline = ''
    /**
     * Each page as JSON as it now stands in the database, or null when the
     * database holds some other design — the draft the last session left, or
     * one the editor was opened past by id. The first write of a session is
     * therefore a whole one; after that only the pages that moved are written.
     */
    let stored: string[] | null = null
    let watching = false
    let unsubscribe: (() => void) | undefined

    function pageJson(): string[] {
      return widgetState.dLayouts.map((layout) => JSON.stringify(layout))
    }

    function snapshot(pages: string[]): string {
      return JSON.stringify([options.current.getTitle(), ...pages])
    }

    /** True when the canvas has moved on from the last write. */
    function isDirty(): boolean {
      return watching && snapshot(pageJson()) !== baseline
    }

    async function write(): Promise<boolean> {
      const title = options.current.getTitle()
      const pages = pageJson()
      if (!pages.length) return false
      // Only the pages that actually moved are handed over. JSON.parse gives a
      // plain deep copy of each, which is exactly what IndexedDB needs — the
      // valtio proxies underneath dLayouts are not structured-cloneable.
      const changed = pages
        .map((json, index) => ({ json, index }))
        .filter(({ json, index }) => !stored || stored[index] !== json)
        .map(({ json, index }) => ({ index, layout: JSON.parse(json) as TdLayout }))
      if (!(await saveDraft(title, changed, pages.length))) return false
      baseline = snapshot(pages)
      stored = pages
      return true
    }

    function schedule() {
      if (!watching) return
      clearTimeout(timer)
      timer = setTimeout(() => {
        void write()
      }, DEBOUNCE)
    }

    /** Writes immediately: File → Save, and Ctrl/Cmd-S. */
    async function saveNow() {
      clearTimeout(timer)
      const ok = await write()
      message({
        message: ok ? 'Saved on this computer.' : 'This design could not be saved. It may be too large for the browser to store.',
        type: ok ? 'success' : 'error',
      })
    }

    function start() {
      baseline = snapshot(pageJson())
      watching = true
      unsubscribe = subscribe(widgetState, schedule)
    }

    /**
     * Asks whether to pick up the last design, then starts watching.
     *
     * Only for a blank editor. Opening a template or a saved work by id is an
     * explicit request for that design, and interrupting it with a question
     * about a different one would be wrong.
     */
    async function restoreThenWatch(isBlankEditor: boolean) {
      const draft = isBlankEditor ? await readDraft() : null
      if (!draft) {
        start()
        return
      }
      const answer = await confirmChoice(
        'Pick up where you left off?',
        `You were working on “${draft.title || 'Untitled design'}” ${describeAge(draft.savedAt)}.`,
        'info',
        { confirmButtonText: 'Restore it', cancelButtonText: 'Start fresh' },
      )
      if (answer === 'confirm') {
        setDLayouts(draft.layouts)
        setDWidgets(getWidgets())
        setDPage(getDPage())
        options.current.setTitle(draft.title)
        selectWidget({ uuid: '-1' })
        message({ message: 'Restored.', type: 'success' })
      } else if (answer === 'cancel') {
        // Start fresh is an answer, so the old draft goes. Escape and the X
        // decide nothing: leave the draft where it is.
        await clearDraft()
      }
      start()
    }

    // A tab being hidden is the last reliable moment to write: on mobile it is
    // often the only warning before the browser discards the page, and unlike
    // beforeunload it fires on every platform.
    const onHide = () => {
      if (document.visibilityState === 'hidden' && isDirty()) void write()
    }
    document.addEventListener('visibilitychange', onHide)

    return {
      restoreThenWatch,
      saveNow,
      isDirty,
      schedule,
      dispose() {
        document.removeEventListener('visibilitychange', onHide)
        unsubscribe?.()
        clearTimeout(timer)
      },
    }
  }, [])

  useEffect(() => autosave.dispose, [autosave])

  return autosave
}
