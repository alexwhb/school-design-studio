/**
 * Whether the speaker-notes drawer is open under the canvas.
 *
 * Editor state, not design state: it is not saved with the design and undo
 * does not touch it. It lives in the store rather than in the drawer because
 * three things need it — the drawer, the page strip that has to sit above the
 * drawer, and the zoom control that fits the page into what is left.
 */
import { proxy } from 'valtio'

/**
 * How tall the drawer is when open, in CSS pixels. The strip and the zoom
 * control both stand on top of it. Mirrored as `@notes-drawer-height` in
 * tokens.less, for the rules that cannot be given a number from here.
 */
export const NOTES_DRAWER_HEIGHT = 156

export const notesState = proxy({ open: false })

export function setNotesOpen(open: boolean) {
  notesState.open = open
}

export function toggleNotes() {
  notesState.open = !notesState.open
}
