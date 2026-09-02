/**
 * Draws one arc's worth of characters, as worked out by arcLayout.ts.
 *
 * The canvas widget, the static copy the page strip and the embed render, and
 * every layer of a text effect all draw the same arc, so they all draw it
 * through this.
 */
import { memo, type CSSProperties } from 'react'
import { cx } from '@/utils/dom'
import type { TCurvedGlyph, TCurvedLayout } from './arcLayout'

type Props = {
  layout: TCurvedLayout
  className?: string
  style?: CSSProperties
  /**
   * Draw every character in the layer's own colour. An effect layer is painted
   * in the colour of its fill or made transparent for its outline, and a word
   * coloured by hand must not punch through that — the straight-text layers
   * get the same treatment from a stylesheet rule.
   */
  plain?: boolean
}

/** A character's own formatting, as the style of the box it is drawn in. */
function glyphStyle(glyph: TCurvedGlyph, plain: boolean | undefined): CSSProperties {
  const decoration = [glyph.underline ? 'underline' : '', glyph.strike ? 'line-through' : ''].filter(Boolean).join(' ')
  return {
    fontWeight: glyph.bold ? 'bold' : undefined,
    fontStyle: glyph.italic ? 'italic' : undefined,
    // An underline is drawn under each character's own box, so along an arc it
    // is a run of short strokes rather than one curved line.
    textDecoration: decoration || undefined,
    color: plain ? undefined : glyph.color,
  }
}

function CurvedText({ layout, className, style, plain }: Props) {
  return (
    <div
      className={cx('curved-text', className)}
      style={{
        ...style,
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        // The layout has already put the spacing into where each character
        // goes, so the widget's own letter spacing must not be applied again
        // inside each character's box, where it would push the glyph off centre.
        letterSpacing: 'normal',
        // The arc is worked out in horizontal lines; a vertical writing mode
        // would turn every character a second time, on top of its own turn.
        writingMode: 'horizontal-tb',
      }}
    >
      {layout.glyphs.map((glyph, index) => (
        <span
          key={index}
          className="curved-text__glyph"
          style={{
            ...glyphStyle(glyph, plain),
            left: `${glyph.x}px`,
            top: `${glyph.y}px`,
            width: `${glyph.width}px`,
            height: `${layout.boxHeight}px`,
            lineHeight: `${layout.boxHeight}px`,
            transform: `translate(-50%, -50%) rotate(${glyph.angle}deg)`,
          }}
        >
          {glyph.char}
        </span>
      ))}
    </div>
  )
}

export default memo(CurvedText)
