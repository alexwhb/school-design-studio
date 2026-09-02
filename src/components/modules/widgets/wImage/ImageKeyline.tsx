/**
 * The keyline drawn round a photograph, inside its own edge.
 *
 * A plain rectangular picture is easy: a ring laid over it, sharing the corner
 * radius so the two curve together. A picture poured into a shape — the
 * container masks — is not, because a rectangular keyline round a circular
 * photograph reads as a mistake rather than a setting.
 *
 * So a masked picture gets its keyline from the mask itself: the same shape
 * twice, the inner copy shrunk by the thickness, the two subtracted from one
 * another to leave a ring in the silhouette of whatever the photograph was
 * poured into. Shrinking is not the same as insetting, so the ring narrows a
 * little where a silhouette comes to a point; near enough on the container
 * shapes the library offers, and the alternative is offsetting an arbitrary
 * alpha mask, which CSS cannot do. That subtraction is `mask-composite`, and a
 * browser without it would paint the *filled* silhouette over the photograph
 * instead — a solid blob, far worse than no keyline — so the mask case is only
 * drawn where the browser says it can do it.
 *
 * Both are laid over the picture rather than around it, which keeps the widget
 * the size the user set it to: a keyline never grows a photograph, and it is
 * never cropped away at the edge of the page.
 *
 * A keyline can be a gradient. The masked case takes one for nothing, since it
 * is a ring of background and background paints gradients. A plain rectangular
 * one cannot, because `border` only takes a colour, so it is cut out of a
 * rounded rectangle the same way — `gradientRingStyle`, which the outline round
 * a drawn box uses too.
 */
import type { CSSProperties } from 'react'
import { isGradient } from '@/packages/color-picker/utils/gradient'
import { gradientRingStyle, supportsMaskRing, widgetBorder } from '../widgetBorder'

function ringStyle(mask: string, width: number, color: string): CSSProperties {
  const inner = `calc(100% - ${width * 2}px)`
  const layers = `url('${mask}'), url('${mask}')`
  return {
    background: color,
    WebkitMaskImage: layers,
    WebkitMaskSize: `100% 100%, ${inner} ${inner}`,
    WebkitMaskPosition: 'center, center',
    WebkitMaskRepeat: 'no-repeat, no-repeat',
    WebkitMaskComposite: 'xor',
    maskImage: layers,
    maskSize: `100% 100%, ${inner} ${inner}`,
    maskPosition: 'center, center',
    maskRepeat: 'no-repeat, no-repeat',
    maskComposite: 'exclude',
  }
}

export default function ImageKeyline({ params }: { params: Record<string, any> }) {
  const border = widgetBorder(params)
  if (!border) return null

  const mask = params.mask as string | undefined
  if (mask) {
    if (!supportsMaskRing()) return null
    // A ring cut out of a shape has no run of line to break into dashes, so a
    // masked picture is outlined solid whichever style it was given.
    return <div className="img__keyline" style={ringStyle(mask, border.width, border.color)} />
  }

  const radius = (Number(params.radius) || 0) + 'px'

  if (isGradient(border.color)) {
    if (!supportsMaskRing()) return null
    return <div className="img__keyline" style={gradientRingStyle(border.width, border.color, radius)} />
  }

  return (
    <div
      className="img__keyline"
      style={{
        border: `${border.width}px ${border.style} ${border.color}`,
        borderRadius: radius,
      }}
    />
  )
}
