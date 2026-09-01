import { memo, useEffect, useRef } from 'react'
import { shadowFilter } from '@/common/methods/shadow'
import type { WidgetProps } from '../types'
import { widgetBorder } from '../widgetBorder'
import { collectShapePaint, paintShape } from './shapePaint'
import applySvgBorder from './svgBorder'

/**
 * Read-only twin of wSvg.
 *
 * Shapes are stored as SVG markup rather than a URL, and their colours as
 * `{{colors[n]}}` placeholders, so drawing one means parsing the markup and
 * painting it. That goes through the same `shapePaint` the canvas uses — or a
 * shape shows up as an empty box in the page thumbnails and in presentation
 * mode, and a gradient that is on the canvas is missing from every export.
 */
function WSvgStatic({ params, parent, className, ...rest }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const loaded = useRef(false)
  const svgRoot = useRef<SVGSVGElement | null>(null)

  useEffect(() => {
    // Keep any rotation the shape was given on the canvas.
    if (widgetRef.current) {
      p.transform && (widgetRef.current.style.transform = p.transform)
      p.rotate && (widgetRef.current.style.transform += `rotate(${p.rotate})`)
    }
    if (loaded.current) return
    loaded.current = true

    const Snap = (window as any).Snap
    if (!Snap || !p.svgUrl || !widgetRef.current) return

    // Snap.parse only hands back the <svg> element itself when the source
    // *starts* with `<svg`; a licence comment in front of it makes it wrap the
    // lot in a DocumentFragment instead. Dig the element out either way.
    const parsed = Snap.parse(p.svgUrl)
    const svgNode: SVGSVGElement | null = parsed.node.nodeType === Node.ELEMENT_NODE ? parsed.node : parsed.node.querySelector('svg')
    if (!svgNode) return

    svgNode.removeAttribute('width')
    svgNode.removeAttribute('height')
    svgNode.setAttribute('style', 'height: inherit;width: inherit;')

    paintShape(collectShapePaint(svgNode), p.uuid, p.colors || [])
    svgRoot.current = svgNode

    widgetRef.current.appendChild(svgNode)
  }, [p.svgUrl, p.colors, p.rotate, p.transform])

  // As on the canvas — see wSvg — an outline is written onto the parsed markup
  // rather than rendered. It needs an effect of its own because the parse above
  // is deliberately guarded against running a second time.
  useEffect(() => {
    if (svgRoot.current) applySvgBorder(svgRoot.current, widgetBorder(p))
  }, [p.svgUrl, p.borderWidth, p.borderColor, p.borderStyle])

  return (
    <div
      {...rest}
      ref={widgetRef}
      className={className}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
        filter: shadowFilter(p.shadow),
      }}
    />
  )
}

export default memo(WSvgStatic)
