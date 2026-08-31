/**
 * Keeps the design being worked on, and offers it back after a reload.
 *
 * The editor used to hold everything in memory only. File → Save was a no-op
 * without a ?tempid in the URL, there was no autosave, and the sole protection
 * was the browser's "leave site?" prompt — switched off in dev. Refreshing the
 * tab lost the lot.
 *
 * Saving is debounced rather than immediate because a design is saved whole:
 * every keystroke in a text box would otherwise rewrite every page, and a
 * design carrying pasted photographs runs to megabytes. Two seconds of quiet is
 * long enough to coalesce typing and short enough that little is ever at risk.
 *
 * Where the bytes go is localDesigns.ts's business, not this file's.
 */
import { onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useCanvasStore, useWidgetStore } from '@/store'
import { clearDraft, describeAge, readDraft, saveDraft } from '@/common/methods/localDesigns'
import type { TdLayout } from '@/store/design/widget'

/** Quiet time before a save, in ms. */
const DEBOUNCE = 2000

type TOptions = {
  /** Reads the design's name, which lives in the toolbar's own state. */
  getTitle: () => string
  /** Puts a restored name back into the toolbar. */
  setTitle: (title: string) => void
}

export default function useAutosave({ getTitle, setTitle }: TOptions) {
  const widgetStore = useWidgetStore()
  const pageStore = useCanvasStore()

  let timer: ReturnType<typeof setTimeout> | undefined
  /** The last thing written, as JSON, so an idle canvas writes nothing. */
  let saved = ''
  let watching = false

  function snapshot(): string {
    return JSON.stringify({ title: getTitle(), layouts: widgetStore.dLayouts })
  }

  /** True when the canvas has moved on from the last write. */
  function isDirty(): boolean {
    return watching && snapshot() !== saved
  }

  async function write(): Promise<boolean> {
    const current = snapshot()
    const { title, layouts } = JSON.parse(current) as { title: string; layouts: TdLayout[] }
    if (!layouts?.length) return false
    // `layouts` here is already a plain deep copy, straight out of JSON.parse,
    // which is exactly what IndexedDB needs and saves cloning it twice.
    const record = await saveDraft(title, layouts)
    if (!record) return false
    saved = current
    return true
  }

  function schedule() {
    clearTimeout(timer)
    timer = setTimeout(() => {
      void write()
    }, DEBOUNCE)
  }

  /** Writes immediately: File → Save, and Ctrl/Cmd-S. */
  async function saveNow() {
    clearTimeout(timer)
    const ok = await write()
    ok
      ? ElMessage.success('Saved on this computer.')
      : ElMessage.error('This design could not be saved. It may be too large for the browser to store.')
  }

  function start() {
    saved = snapshot()
    watching = true
    watch(() => [widgetStore.dLayouts, getTitle()], schedule, { deep: true })
  }

  /**
   * Asks whether to pick up the last design, then starts watching.
   *
   * Only for a blank editor. Opening a template or a saved work by id is an
   * explicit request for that design, and interrupting it with a question about
   * a different one would be wrong.
   */
  async function restoreThenWatch(isBlankEditor: boolean) {
    const draft = isBlankEditor ? await readDraft() : null
    if (!draft) {
      start()
      return
    }
    try {
      await ElMessageBox.confirm(`You were working on “${draft.title || 'Untitled design'}” ${describeAge(draft.savedAt)}.`, 'Pick up where you left off?', {
        confirmButtonText: 'Restore it',
        cancelButtonText: 'Start fresh',
        type: 'info',
        // Dismissing with Escape or the X is neither answer, and quietly
        // throwing the design away because someone hit Escape would be the
        // exact failure this whole file exists to prevent.
        distinguishCancelAndClose: true,
      })
      widgetStore.setDLayouts(draft.layouts)
      widgetStore.setDWidgets(widgetStore.getWidgets())
      pageStore.setDPage(pageStore.getDPage())
      setTitle(draft.title)
      widgetStore.selectWidget({ uuid: '-1' })
      ElMessage.success('Restored.')
    } catch (action) {
      // 'cancel' is Start fresh — an answer, so the old draft goes. 'close' is
      // Escape or the X, which decides nothing: leave the draft where it is.
      if (action === 'cancel') await clearDraft()
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

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onHide)
    clearTimeout(timer)
  })

  return { restoreThenWatch, saveNow, isDirty }
}
