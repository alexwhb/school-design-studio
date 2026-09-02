import { useSnapshot } from 'valtio'
import { notesState, toggleNotes } from '@/store/notes'
import { canvasState } from '@/store/state'
import { cx } from '@/utils/dom'
import './notesToggle.less'

/**
 * The button that opens and closes the notes drawer. It sits by the page pill,
 * because notes belong to the page you are on, and carries a dot when the page
 * has some so a deck can be read for them from the strip.
 */
export default function NotesToggle() {
  const { open } = useSnapshot(notesState)
  const hasNotes = !!(useSnapshot(canvasState).dPage.notes as string | undefined)?.trim()
  return (
    <button
      type="button"
      className={cx('notes-toggle', { 'is-on': open, 'has-notes': hasNotes })}
      title={open ? 'Hide speaker notes' : 'Speaker notes for this page'}
      aria-pressed={open}
      onClick={(e) => {
        // The pill it sits in opens the page strip on a click.
        e.stopPropagation()
        toggleNotes()
      }}
    >
      Notes
    </button>
  )
}
