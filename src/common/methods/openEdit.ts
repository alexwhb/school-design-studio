/**
 * Words still in the box they are being typed into.
 *
 * A text box being edited keeps what is typed in its own contentEditable
 * element and writes it to the store when the edit ends — on blur, on Escape,
 * or on a press somewhere else. That is right for the undo history, which
 * wants a word rather than a letter per step, and wrong for anything that
 * reads the design while the caret is still in the box: Cmd+S saved the
 * design without the sentence being typed, and so did an export, a
 * `getDocument()` from the host, or an `applyOps` that then replaced the page
 * the words were on.
 *
 * So a box with the caret registers how to store what it holds, and anything
 * about to read the design asks for that first. Only one edit is ever open —
 * there is only one caret — so this holds one at a time.
 */
export type TOpenEdit = {
  /** Writes what the box holds to the store, leaving the caret where it is. */
  commit: () => void
  /** Writes it and ends the edit, for when the page under the box is about to change. */
  finish: () => void
}

let open: TOpenEdit | null = null

/** Called by the widget with the caret. Returns the matching unregister. */
export function registerOpenEdit(edit: TOpenEdit): () => void {
  open = edit
  return () => {
    if (open === edit) open = null
  }
}

/**
 * Stores what is being typed, before the design is read.
 *
 * `end` also closes the edit, for a caller that is about to replace the page
 * the box is on — leaving a caret in a box that is no longer in the design
 * would write its words over whatever took its place when it finally blurred.
 */
export function commitOpenEdit({ end = false }: { end?: boolean } = {}): void {
  const edit = open
  if (!edit) return
  try {
    end ? edit.finish() : edit.commit()
  } catch (error) {
    // A box that cannot store its words must not stop a save of everything else.
    console.warn('[design] could not store the text being edited', error)
  }
}

/** Whether a box has the caret. */
export function hasOpenEdit(): boolean {
  return open !== null
}
