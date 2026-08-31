import { memo, useEffect, useRef } from 'react'
import type { WidgetProps } from '../types'

/**
 * Read-only twin of wSvg.
 *
 * Shapes are stored as SVG markup rather than a URL, and their colours as
 * `{{colors[n]}}` placeholders, so drawing one means parsing the markup and
 * substituting the colours. That has to happen the same way here as it does on
 * the canvas — see wSvg — or a shape shows up as an empty box in the page
 * thumbnails and in presentation mode.
 */
function WSvgStatic({ params, parent, className, ...rest }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const loaded = useRef(false)

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

    const colours: Record<string, string> = {}
    const list: string[] = p.colors || []
    list.forEach((colour, i) => {
      colours[`{{colors[${i}]}}`] = colour
    })

    // The root <svg> carries the colour placeholder as often as its children do
    // (every Lucide icon puts `stroke` there), so the walk starts at it.
    const applyColours = (el: Record<string, any>) => {
      if (el.attributes) {
        for (const attr of Array.from(el.attributes) as Record<string, any>[]) {
          if (colours[attr.value]) attr.value = colours[attr.value]
        }
      }
      el.childNodes?.forEach((child: Record<string, any>) => applyColours(child))
    }
    applyColours(svgNode)

    widgetRef.current.appendChild(svgNode)
  }, [p.svgUrl, p.colors, p.rotate, p.transform])

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
      }}
    />
  )
}

export default memo(WSvgStatic)
