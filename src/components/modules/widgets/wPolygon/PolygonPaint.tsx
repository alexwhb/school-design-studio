/**
 * What a drawn polygon actually paints: one path, filled, and stroked inside
 * its own edge.
 *
 * The canvas widget and its read-only twin both draw from here, so a page
 * thumbnail, a slide and an export come out with the same number of corners as
 * the artboard does.
 *
 * The path is the polygon's outline in the widget's own pixels, and the viewBox
 * is the widget's own size, so one unit is one design pixel and nothing here
 * has to correct for a scale. While a resize handle is being dragged Moveable
 * writes the new size straight onto the element and the viewBox is a frame
 * behind, which stretches the shape live — which is what a stretch of the frame
 * should look like, and it lands exactly once the store catches up.
 *
 * The outline is a stroke on the same path, drawn at twice the asked-for width
 * and clipped to the path, which leaves exactly the width that was asked for
 * lying wholly inside the edge. That is what a shape's outline already does —
 * see svgBorder — so the two read as one setting, and it is the only way to
 * keep a thick outline on a sharp corner inside the frame the shape was drawn
 * in: a stroke straddles the line it follows, and a mitre on a triangle's apex
 * runs a long way past it.
 *
 * The shadow goes on the drawing rather than on the widget, so it traces the
 * outline — and so it is not also cast by the corner-count grip, which is the
 * widget's other child.
 */
import { shadowFilter } from '@/common/methods/shadow'
import { useGradientId, usePaint } from '../widgetPaint'
import { widgetBorder, type TWidgetBorder } from '../widgetBorder'
import { polygonPath, readSides } from './polygonShape'

/** The gap pattern for a dashed or dotted outline, at the doubled width. */
function dashesFor(border: TWidgetBorder): string | undefined {
  if (border.style === 'dashed') return `${border.width * 3} ${border.width * 2}`
  if (border.style === 'dotted') return `0 ${border.width * 2}`
  return undefined
}

export default function PolygonPaint({ params }: { params: Record<string, any> }) {
  const width = Math.max(1, Number(params.width) || 0)
  const height = Math.max(1, Number(params.height) || 0)
  const sides = readSides(params)
  const border = widgetBorder(params)
  const path = polygonPath(width, height, sides)
  const box = { x: 0, y: 0, width, height }

  // Both are asked for on every render whether or not there is a gradient to
  // build, so the ids they each hold stay in step with the render they belong
  // to; a hook behind an `if` would renumber itself the first time an outline
  // was switched on.
  const fill = usePaint(params.color || 'transparent', box, 'fill')
  const stroke = usePaint(border?.color || 'transparent', box, 'stroke')
  const clipId = useGradientId('clip')

  return (
    <svg
      className="polygon__paint"
      width="100%"
      height="100%"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      style={{ filter: shadowFilter(params.shadow) }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {fill.defs}
        {border ? stroke.defs : null}
        {border ? (
          <clipPath id={clipId}>
            <path d={path} />
          </clipPath>
        ) : null}
      </defs>
      <path d={path} fill={fill.paint} />
      {border ? (
        <path
          d={path}
          fill="none"
          stroke={stroke.paint}
          strokeWidth={border.width * 2}
          strokeDasharray={dashesFor(border)}
          strokeLinecap={border.style === 'dotted' ? 'round' : undefined}
          clipPath={`url(#${clipId})`}
        />
      ) : null}
    </svg>
  )
}
