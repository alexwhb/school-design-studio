import message from '@/components/ui/message'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'

/**
 * Locking, the way Canva does it.
 *
 * A locked layer can still be selected — that is how you see it is locked, and
 * how you unlock it — but it stays exactly as it is: it will not move, resize,
 * turn, nudge, delete, group or change its place in the stack. Each of those,
 * asked of a locked layer, is refused with a short notice rather than ignored,
 * so a key that does nothing is never a mystery.
 */
export function setLayerLock({ uuid, lock }: { uuid: string; lock: boolean }) {
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (!widget) return
  if (lock) widget.lock = true
  // Absent rather than false, so a design that never locked anything saves as it did
  else delete widget.lock
}

export function toggleLayerLock(uuid: string) {
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (!widget) return
  setLayerLock({ uuid, lock: !widget.lock })
}

/** The locked ones among these — a group counts as locked when it is. */
export function lockedAmong(widgets: readonly (TdWidgetData | null | undefined)[]): TdWidgetData[] {
  return widgets.filter((item): item is TdWidgetData => !!item?.lock)
}

/**
 * True, and a notice shown, when any of these layers is locked. `verb` is what
 * was about to be done to them: "moved", "deleted".
 */
export function refuseLocked(widgets: readonly (TdWidgetData | null | undefined)[], verb: string): boolean {
  const locked = lockedAmong(widgets)
  if (locked.length === 0) return false
  message({
    message: locked.length === 1 && widgets.length === 1 ? `This layer is locked, so it can’t be ${verb}. Unlock it first.` : `A locked layer can’t be ${verb}. Unlock it first.`,
    type: 'info',
    duration: 2200,
  })
  return true
}

/** What an action on the current selection would touch: the selection, or the active layer. */
export function selectionWidgets(): TdWidgetData[] {
  if (widgetState.dSelectWidgets.length > 0) return widgetState.dSelectWidgets
  const active = widgetState.dActiveElement
  return active && active.uuid !== '-1' ? [active] : []
}
