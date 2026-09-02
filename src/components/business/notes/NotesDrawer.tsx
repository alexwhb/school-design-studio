/**
 * Speaker notes for the page on the canvas: a drawer along the bottom of the
 * board with one textarea in it.
 *
 * The notes belong to the page and travel with the design, so they are written
 * to the page's `global` as they are typed — which is what the autosave and the
 * presenter read — and the undo entry is made at the end of the edit rather
 * than per keystroke. The history stack diffs the store at either end of an
 * entry, so on blur the text is set back to what it was when the caret went
 * in, and the whole edit recorded as one change; Ctrl+Z then takes back the
 * paragraph, not the last letter.
 *
 * It scrolls with the board the same way the page strip does, by counting the
 * board's scroll back out, so it stays pinned to the bottom of the well.
 */
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { recordHistory } from '@/common/hooks/history'
import { setZoomScreenChange } from '@/store/force'
import { NOTES_DRAWER_HEIGHT, notesState, setNotesOpen } from '@/store/notes'
import { canvasState, widgetState } from '@/store/state'
import { setPageNotes } from '@/store/widget/pageMeta'
import { CloseIcon } from '@/components/ui/icons'
import './notesDrawer.less'

export default function NotesDrawer() {
  const { open } = useSnapshot(notesState)
  const canvas = useSnapshot(canvasState)
  const total = useSnapshot(widgetState).dLayouts.length
  const notes = (canvas.dPage.notes as string | undefined) ?? ''
  const [st, setSt] = useState(0)
  const [sl, setSl] = useState(0)
  const before = useRef<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)

  useEffect(() => {
    const mainEl = document.getElementById('main')
    if (!mainEl) return
    const onScroll = () => {
      setSt(mainEl.scrollTop)
      setSl(mainEl.scrollLeft)
    }
    mainEl.addEventListener('scroll', onScroll)
    return () => mainEl.removeEventListener('scroll', onScroll)
  }, [])

  // The page has less room once the drawer is open, so it is fitted again —
  // after the drawer has finished arriving, as the page strip does.
  const lastOpen = useRef(open)
  useEffect(() => {
    if (lastOpen.current === open) return
    lastOpen.current = open
    const timer = setTimeout(() => setZoomScreenChange(), 300)
    if (open) textareaRef.current?.focus()
    return () => clearTimeout(timer)
  }, [open])

  if (!open) return null

  function onFocus() {
    before.current = notes
  }

  function onBlur() {
    const was = before.current
    before.current = null
    if (was === null || was === notes) return
    const now = notes
    setPageNotes(was)
    recordHistory(() => setPageNotes(now))
  }

  return (
    <div className="notes-drawer" style={{ bottom: -1 * st + 'px', left: sl + 'px', height: NOTES_DRAWER_HEIGHT + 'px' }}>
      <div className="notes-drawer__head">
        <span className="notes-drawer__title">
          Speaker notes <span className="notes-drawer__page">· page {canvas.dCurrentPage + 1} of {total}</span>
        </span>
        <span className="notes-drawer__hint">Shown to you in the presenter and in PowerPoint's notes pane, never on the page.</span>
        <button type="button" className="notes-drawer__close" title="Hide notes" onClick={() => setNotesOpen(false)}>
          <CloseIcon />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        id="page-notes"
        className="notes-drawer__text"
        placeholder="What to say while this page is on screen…"
        value={notes}
        spellCheck
        onChange={(e) => setPageNotes(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  )
}
