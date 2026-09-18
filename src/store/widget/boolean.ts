/**
 * Combining the selected shapes into one, the way Adobe XD's four boolean
 * buttons do: add, subtract, intersect and exclude.
 *
 * The geometry is in widgets/shape/booleanShapes.ts, which also explains why
 * the answer is a flattened `w-svg` rather than a boolean group that can be
 * taken apart later. What this file owns is the swap: the operands come off the
 * page and the shape they make goes on in their place, once, so that one press
 * of a button is one press of Ctrl+Z.
 *
 * Two orderings matter, and both are the stacking order rather than the order
 * things were clicked in. Subtract is bottom minus top — click the top one
 * first and you still get what you see, which is what XD does. And the result
 * is stacked where the **top-most** operand was, because that is the one whose
 * artwork was covering everything between them; leaving it at the bottom
 * operand's depth would push the new shape underneath layers it used to cover.
 * The paint, meanwhile, comes off the bottom-most operand. Fill from the
 * bottom, depth from the top: that pair is XD's, and it is the pair that leaves
 * the page looking most like it did a moment ago.
 */
import { customAlphabet } from 'nanoid/non-secure'
import message from '@/components/ui/message'
import { canCombine, type TBooleanOp } from '@/components/modules/widgets/shape/combinable'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { refuseLocked } from './lock'
import { selectWidget } from './select'

const nanoid = customAlphabet('1234567890abcdef', 12)

let geometry: typeof import('@/components/modules/widgets/shape/booleanShapes') | null = null

/**
 * Fetches the geometry, and paper.js along with it.
 *
 * paper is ninety kilobytes of bezier arithmetic, and the overwhelming majority
 * of sessions never combine anything, so it is not in the bundle a design page
 * loads — it arrives on the first press of one of the four buttons and is held
 * for the rest of the session.
 *
 * It has to be awaited *before* `combineShapes`, not inside it, because
 * `recordHistory` is synchronous: it snapshots the page, calls, and snapshots
 * again. An await in the middle would close the undo step before the shapes had
 * moved, and the operation would not be undoable.
 */
export async function loadCombine(): Promise<void> {
  geometry ??= await import('@/components/modules/widgets/shape/booleanShapes')
}

/**
 * Replaces the selected shapes with the one they make under `op`.
 *
 * Nothing happens, and nothing is written to the undo stack, when the selection
 * cannot be combined or when the operation leaves no shape behind — two circles
 * that do not touch have no intersection, and a shape subtracted from itself
 * has nothing left. Both say so rather than emptying the page.
 */
export function combineShapes(op: TBooleanOp): void {
  // Nothing to combine with yet: loadCombine() has to be awaited first, which
  // is what every caller does. Returning quietly rather than throwing keeps a
  // mis-wired caller from taking the editor down with it.
  if (!geometry) return

  const widgets = widgetState.dWidgets
  const chosen = widgetState.dSelectWidgets
  if (chosen.length < 2) return
  if (!chosen.every((widget) => canCombine(widget))) return
  if (refuseLocked(chosen, 'combined')) return

  // The stacking order, not the order they were clicked in: a widget's place in
  // dWidgets is its depth on the page, last on top.
  const uuids = new Set(chosen.map((widget) => widget.uuid))
  const depths: number[] = []
  widgets.forEach((widget, index) => {
    if (uuids.has(widget.uuid)) depths.push(index)
  })
  if (depths.length < 2) return

  // Out of the valtio proxy before the geometry sees it: booleanShapes reads
  // these several times over and has no business subscribing to the store.
  const operands = depths.map((index) => JSON.parse(JSON.stringify(widgets[index])) as Record<string, any>)
  const result = geometry.combinedShape(op, operands)
  if (!result) {
    message({ message: 'There would be nothing left to draw. Move the shapes so they overlap and try again.', type: 'info', duration: 2600 })
    return
  }

  result.uuid = nanoid()
  // Taken off from the top down, so the indexes below the one being removed are
  // still the indexes that were measured.
  for (let index = depths.length - 1; index >= 0; index -= 1) widgets.splice(depths[index], 1)
  // Where the top-most operand was, less however many of the others were under
  // it and have just been taken away.
  widgets.splice(depths[depths.length - 1] - (depths.length - 1), 0, result as TdWidgetData)

  widgetState.dSelectWidgets = []
  selectWidget({ uuid: result.uuid })
}
