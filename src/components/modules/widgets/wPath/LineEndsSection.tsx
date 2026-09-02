/**
 * The panel section for what is on the ends of a line: a picker for the start
 * and one for the end, and a button to swap them, which is quicker than two
 * picks when an arrow turns out to point the wrong way.
 *
 * Only an open path has ends, so the section is only ever mounted for one. A
 * head has width where a line has none, so putting one on grows the frame — the
 * points are refitted round the new padding here, the same way they are after
 * a point is dragged, so the line stays where it was and the head fits inside
 * the selection box. Taking the heads off shrinks it back.
 *
 * Every change here comes from a click in a dropdown or on a button, none of
 * which the undo stack's document listeners are guaranteed to see, so each is
 * recorded by hand.
 */
import { useState } from 'react'
import { recordHistory } from '@/common/hooks/history'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import { updateWidgetData } from '@/store/widget'
import type { TdWidgetData } from '@/store/types'
import ValueSelect from '../../settings/ValueSelect'
import { widgetBorder } from '../widgetBorder'
import { LINE_ENDS, endsPad, readLineEnds, type TLineEnd } from './lineEnds'
import { absolutePoints, fitFrame, innerBox, readPoints } from './pathGeometry'
import './lineEndsSection.less'

const NONE = 'None'
const OPTIONS = [NONE, ...LINE_ENDS.map((end) => end.label)]

function labelOf(kind: TLineEnd | null) {
  return LINE_ENDS.find((end) => end.value === kind)?.label || NONE
}

function kindOf(label: unknown): TLineEnd | null {
  return LINE_ENDS.find((end) => end.label === label)?.value || null
}

type TEndsChange = { closed?: boolean; lineStart?: TLineEnd | null; lineEnd?: TLineEnd | null }

/**
 * Changes what is on a path's ends, or whether it has any, and refits its
 * frame round the result.
 *
 * Closing a path takes its heads off and opening it puts them back, so the
 * panel's Closed switch comes through here too: either way the padding the
 * frame keeps for the heads changes, and the frame has to change with it or
 * the line moves inside it.
 */
export function applyLineEnds(active: TdWidgetData, change: TEndsChange) {
  const uuid = active.uuid
  const points = readPoints(active)
  const stroke = widgetBorder(active)?.width || 0
  const frame = { left: active.left, top: active.top, width: active.width, height: active.height }
  const next = { ...active, ...change }
  // Where the path is on the page, measured out of the old frame with the old
  // padding, and then wrapped in a new frame with the new. A turned path is
  // drawn about its own centre, so moving its frame would move the artwork:
  // left alone rather than left wrong, as it is after a point is dragged.
  const placed = absolutePoints(points, innerBox(frame, stroke, endsPad(active)))
  const refit = points.length >= 2 && !active.rotate && endsPad(active) !== endsPad(next)
  const fitted = refit ? fitFrame(placed, !!next.closed, stroke / 2 + endsPad(next)) : null

  recordHistory(() => {
    if ('closed' in change) updateWidgetData({ uuid, key: 'closed', value: !!change.closed })
    if ('lineStart' in change) updateWidgetData({ uuid, key: 'lineStart', value: change.lineStart ?? null })
    if ('lineEnd' in change) updateWidgetData({ uuid, key: 'lineEnd', value: change.lineEnd ?? null })
    if (!fitted) return
    updateWidgetData({ uuid, key: 'points', value: fitted.points })
    updateWidgetData({ uuid, key: 'left', value: fitted.box.left })
    updateWidgetData({ uuid, key: 'top', value: fitted.box.top })
    updateWidgetData({ uuid, key: 'width', value: fitted.box.width })
    updateWidgetData({ uuid, key: 'height', value: fitted.box.height })
  })
}

export default function LineEnds({ active }: { active: TdWidgetData }) {
  const [open, setOpen] = useState(true)
  const ends = readLineEnds(active)

  return (
    <PanelSection name="ends" title="Line ends" open={open} onToggle={() => setOpen(!open)} className="line-ends">
      <div className="line-ends__row">
        <ValueSelect label="Start" readonly inputWidth="100%" value={labelOf(ends.start)} data={OPTIONS} onFinish={(value) => applyLineEnds(active, { lineStart: kindOf(value) })} />
        <ValueSelect label="End" readonly inputWidth="100%" value={labelOf(ends.end)} data={OPTIONS} onFinish={(value) => applyLineEnds(active, { lineEnd: kindOf(value) })} />
      </div>
      <Button
        className="line-ends__swap"
        plain
        size="small"
        disabled={ends.start === ends.end}
        onClick={() => applyLineEnds(active, { lineStart: ends.end, lineEnd: ends.start })}
      >
        Swap ends
      </Button>
    </PanelSection>
  )
}
