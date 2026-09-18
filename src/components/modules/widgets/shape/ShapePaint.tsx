/**
 * What a drawn shape actually paints: a fill, an outline inside its own edge,
 * and the shadow the pair of them cast.
 *
 * A rectangle and an ellipse differ by their corner radius and nothing else —
 * four lengths against a flat 50% — so the radius is handed in and everything
 * downstream of it is shared. The canvas widget and its read-only twin both
 * draw from here, so a page thumbnail, a slide and an export take the same
 * shape as the artboard does.
 *
 * The outline is a `border` on the fill rather than a ring laid over it, which
 * is what a photograph needs — a shape has nothing underneath for a border to
 * cover, `box-sizing: border-box` already keeps it inside the width the user
 * set, and CSS narrows the inner curve by the thickness for free, so a thick
 * outline on a rounded shape looks drawn rather than pasted on. `padding-box`
 * clipping is what keeps the fill from showing through the gaps in a dashed
 * one. A gradient outline is the exception, for the reason `gradientRingStyle`
 * gives: it is a masked band laid over the top, and the border underneath is
 * kept as transparent space for it to sit in.
 *
 * The shadow goes here rather than on the widget, so it traces the rounded
 * silhouette — and so it is not also cast by the corner grips, which are the
 * widget's other children.
 */
import type { CSSProperties } from 'react'
import { shadowFilter } from '@/common/methods/shadow'
import { isGradient } from '@/packages/color-picker/utils/gradient'
import { gradientRingStyle, supportsMaskRing, widgetBorder } from '../widgetBorder'

type Props = {
  params: Record<string, any>
  /** Any CSS `border-radius`: four lengths for a box, `50%` for an ellipse. */
  radius: string
}

export default function ShapePaint({ params, radius }: Props) {
  const border = widgetBorder(params)
  const gradientOutline = !!border && isGradient(border.color)
  const ring = gradientOutline && supportsMaskRing()

  const style: CSSProperties = {
    background: params.color || 'transparent',
    borderRadius: radius,
    filter: shadowFilter(params.shadow),
  }
  if (border) {
    style.borderWidth = `${border.width}px`
    // A gradient outline is painted over the border, so what is underneath has
    // to be space rather than a second line in some arbitrary colour. A browser
    // that cannot mask the band gets no outline at all, the same way a masked
    // keyline does, rather than a black one nobody asked for.
    style.borderStyle = gradientOutline ? 'solid' : border.style
    style.borderColor = gradientOutline ? 'transparent' : border.color
    style.backgroundClip = 'padding-box'
  }

  return (
    <div className="shape__paint" style={style}>
      {/*
        Pulled back out over the border box: an absolutely positioned child is
        laid out against its parent's *padding* box, so the band would otherwise
        sit inside the transparent border that was made for it and come out one
        thickness too small on every side.
      */}
      {ring ? <div className="shape__outline" style={{ ...gradientRingStyle(border!.width, border!.color, radius), inset: `-${border!.width}px` }} /> : null}
    </div>
  )
}
