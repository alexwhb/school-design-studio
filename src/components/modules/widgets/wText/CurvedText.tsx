/**
 * Draws one arc's worth of characters, as worked out by arcLayout.ts.
 *
 * The canvas widget, the static copy the page strip and the embed render, and
 * every layer of a text effect all draw the same arc, so they all draw it
 * through this.
 */
import { memo, type CSSProperties } from 'react'
import { cx } from '@/utils/dom'
import type { TCurvedLayout } from './arcLayout'

type Props = {
  layout: TCurvedLayout
  className?: string
  style?: CSSProperties
}

function CurvedText({ layout, className, style }: Props) {
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
