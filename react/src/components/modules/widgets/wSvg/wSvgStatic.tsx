import { memo, useEffect, useRef } from 'react'
import type { WidgetProps } from '../types'

function WSvgStatic({ params, parent }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const loaded = useRef(false)

  useEffect(() => {
    if (loaded.current) return
    loaded.current = true
    const Snap = (window as any).Snap
    if (!Snap || !p.svgUrl) return
    const parsed = Snap.parse(p.svgUrl)
    const svgNode: SVGSVGElement | null = parsed.node.nodeType === Node.ELEMENT_NODE ? parsed.node : parsed.node.querySelector('svg')
    if (!svgNode) return
    svgNode.removeAttribute('width')
    svgNode.removeAttribute('height')
    svgNode.setAttribute('style', 'height: inherit;width: inherit;')

    const colorsObj: Record<string, any> = {}
    const colors: string[] = p.colors || []
    for (let i = 0; i < colors.length; i++) {
      colorsObj[`{{colors[${i}]}}`] = colors[i]
    }

    const walk = (element: Record<string, any>) => {
      if (element.attributes) {
        for (const attr of Array.from(element.attributes) as Record<string, any>[]) {
          if (colorsObj[attr.value]) attr.value = colorsObj[attr.value]
        }
      }
      element.childNodes?.forEach((child: Record<string, any>) => walk(child))
    }
    walk(svgNode)

    widgetRef.current?.appendChild(svgNode)
  }, [p.svgUrl, p.colors])

  return (
    <div
      ref={widgetRef}
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
