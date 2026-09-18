/**
 * What a drawn path paints: the curve itself, filled and outlined, whatever is
 * on its ends, and the shadow the lot of them cast.
 *
 * A rectangle and an ellipse are a `<div>` with a corner radius; a path is not
 * a shape CSS has a name for, so this is the one drawn shape that has to be an
 * `<svg>`. Everything else about it is the same setting read the same way — the
 * fill and the outline come off the widget through `widgetBorder`, so a path
 * outlined 3px thick and a box outlined 3px thick agree.
 *
 * The outline is a stroke on the path and is inset by half its own thickness
 * rather than clipped to the shape, which is what the shapes parsed out of
 * markup do. A stroke straddles the line it follows, and clipping to that line
 * would work for a closed path and cut an open one in half lengthways: an open
 * path's fill region is the implicit close, so half of every stroke along it
 * falls outside. Insetting keeps the whole outline within the widget's edge for
 * both, which is what `widgetBorder` promises.
 *
 * The joins and caps are round for the same reason. A mitred join at a sharp
 * corner runs a long way past the point it joins — far enough to hang outside
 * the frame whatever the inset — and a path drawn by hand is all sharp corners
 * until its points are smoothed.
 *
 * An open path may carry a head on either end. Each is drawn from the stroke's
 * paint and sized from its thickness, and the line itself is drawn back to
 * where the head begins, so a dashed line does not run on through a solid
 * arrowhead. See lineEnds.ts for why they are geometry rather than markers.
 *
 * A fill or an outline may be a gradient, which an SVG attribute cannot hold:
 * `usePaint` gives back the paint server to put in `<defs>` alongside it.
 */
import { shadowFilter } from '@/common/methods/shadow'
import { dashesFor, widgetBorder } from '../widgetBorder'
import { usePaint } from '../widgetPaint'
import { barLine, endsPad, headPath, headSize, lineWithEnds, readLineEnds } from './lineEnds'
import { isClosed, paintBox, readPoints } from './pathGeometry'

type Props = {
  params: Record<string, any>
}

export default function PathPaint({ params }: Props) {
  const width = Math.max(Number(params.width) || 0, 0)
  const height = Math.max(Number(params.height) || 0, 0)
  const border = widgetBorder(params)
  const strokeWidth = border?.width || 0
  const box = paintBox(width, height, strokeWidth, endsPad(params))
  const { d, heads } = lineWithEnds(readPoints(params), isClosed(params), box, strokeWidth, readLineEnds(params))

  // The gradient runs across the whole widget, not across the curve's own
  // bounding box, so a fill and an outline given the same gradient line up.
  const area = { x: 0, y: 0, width, height }
  const fill = usePaint(params.color || 'transparent', area, 'path-fill')
  const stroke = usePaint(border?.color || 'transparent', area, 'path-stroke')

  if (!d) return null

  // A head is part of the line, so a line with no outline has none to show.
  const paint = border ? stroke.paint : 'none'

  return (
    <svg className="shape__paint path__paint" width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg" style={{ filter: shadowFilter(params.shadow) }} aria-hidden="true">
      {fill.defs || stroke.defs ? (
        <defs>
          {fill.defs}
          {stroke.defs}
        </defs>
      ) : null}
      <path d={d} fill={fill.paint} stroke={paint} strokeWidth={strokeWidth} strokeDasharray={border ? dashesFor(border) || undefined : undefined} strokeLinejoin="round" strokeLinecap="round" />
      {border
        ? heads.map((head, index) => {
            const key = `${head.kind}-${index}`
            if (head.kind === 'circle') {
              return <circle key={key} className="path__end" data-end={head.kind} cx={head.x} cy={head.y} r={headSize(strokeWidth).halfWidth} fill={paint} />
            }
            if (head.kind === 'bar') {
              return <line key={key} className="path__end" data-end={head.kind} {...barLine(head, strokeWidth)} stroke={paint} strokeWidth={strokeWidth} strokeLinecap="round" />
            }
            return (
              <path
                key={key}
                className="path__end"
                data-end={head.kind}
                d={headPath(head, strokeWidth)}
                // The triangle is filled and also stroked, so its corners are
                // rounded off like every other join on the line and its base
                // covers the end of the stroke it sits on.
                fill={head.kind === 'triangle' ? paint : 'none'}
                stroke={paint}
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })
        : null}
    </svg>
  )
}
