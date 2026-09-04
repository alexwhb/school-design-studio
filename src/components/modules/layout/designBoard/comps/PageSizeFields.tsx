/**
 * The page's own width and height, and the sheet it would print on.
 *
 * Typing a number here goes through the same resize the dialog uses rather than
 * writing the page's size straight into the store: a page that changes shape
 * with the artwork left where it was is a page with everything hanging off the
 * bottom of it. The dialog is still the way to say what should happen to the
 * artwork; this is the way to nudge a page 40px wider.
 */
import { useEffect, useState } from 'react'
import { DEFAULT_RESIZE_STRATEGY } from '@/common/methods/resize/strategies'
import { paperName } from '@/common/methods/pageSize'
import { ChevronDownIcon } from '@/components/ui/icons'
import { resizePages } from '@/store/widget/resizePages'
import NumberInput from '@/components/modules/settings/NumberInput'
import './pageSizeFields.less'

/** Small enough to be a mistake rather than a design. */
const MIN_SIDE = 40

type Props = {
  width: number
  height: number
  onOpenResize: () => void
}

export default function PageSizeFields({ width, height, onOpenResize }: Props) {
  const [draft, setDraft] = useState({ width: Math.round(width), height: Math.round(height) })

  // The page can be resized from the dialog, from another page being selected,
  // or by undo, and the fields have to follow all three.
  useEffect(() => {
    setDraft({ width: Math.round(width), height: Math.round(height) })
  }, [width, height])

  function commit(next: { width: number; height: number }) {
    if (next.width < MIN_SIDE || next.height < MIN_SIDE) return
    if (next.width === Math.round(width) && next.height === Math.round(height)) return
    resizePages({ width: next.width, height: next.height, strategy: DEFAULT_RESIZE_STRATEGY, scope: 'page' })
  }

  // Named where the page is a sheet of something; the millimetres are said
  // once, in the note at the foot of the panel, rather than twice.
  const paper = paperName(width, height)

  return (
    <div className="page-size-fields">
      <div className="page-size-fields__grid">
        <NumberInput variant="underline" label="W" value={draft.width} minValue={MIN_SIDE} onChange={(value) => setDraft((prev) => ({ ...prev, width: Number(value) }))} onFinish={(value) => commit({ width: Number(value), height: draft.height })} />
        <NumberInput variant="underline" label="H" value={draft.height} minValue={MIN_SIDE} onChange={(value) => setDraft((prev) => ({ ...prev, height: Number(value) }))} onFinish={(value) => commit({ width: draft.width, height: Number(value) })} />
      </div>
      <button type="button" className="page-size-fields__preset" onClick={onOpenResize}>
        <span className="page-size-fields__name">{paper || 'Custom size'}</span>
        <ChevronDownIcon />
      </button>
    </div>
  )
}
