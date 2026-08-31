import { useEffect, useRef } from 'react'
import { subscribeKey } from 'valtio/utils'
import Guides from '@scena/guides'
import { canvasState } from '@/store/state'
import useTheme from '@/common/hooks/useTheme'
import './lineGuides.less'

const container = 'page-design'

export default function LineGuides({ show }: { show: boolean }) {
  const { resolved } = useTheme()
  const guidesTop = useRef<any>(null)
  const guidesLeft = useRef<any>(null)

  function token(name: string, fallback: string) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
  }

  function changeScroll() {
    if (guidesTop.current && guidesLeft.current) {
      const zoom = canvasState.dZoom / 100
      guidesTop.current.zoom = zoom
      guidesLeft.current.zoom = zoom
      if (zoom < 0.9) {
        guidesTop.current.unit = Math.floor(1 / zoom) * 50
        guidesLeft.current.unit = Math.floor(1 / zoom) * 50
      }
      setTimeout(() => {
        if (guidesTop.current && guidesLeft.current) {
          const el = document.getElementById('out-page')
          const left = 60 + (el?.offsetLeft ?? 0)
          const top = 30 + (el?.offsetTop ?? 0)
          guidesTop.current.scroll(-left / zoom)
          guidesTop.current.scrollGuides(-top / zoom)
          guidesLeft.current.scroll(-top / zoom)
          guidesLeft.current.scrollGuides(-(left - 30) / zoom)
        }
      }, 300)
    }
  }

  function destroy() {
    guidesTop.current?.destroy()
    guidesLeft.current?.destroy()
    guidesTop.current = null
    guidesLeft.current = null
  }

  function render() {
    const sameParams = {
      backgroundColor: token('--ds-ruler-bg', '#f3f8fa'),
      lineColor: token('--ds-ruler-line', '#acbac1'),
      textColor: token('--ds-ruler-text', '#75838a'),
      displayDragPos: true,
      dragPosFormat: (v: string | number) => v + 'px',
    }

    const containerEl = document.getElementById(container)
    if (!containerEl) return

    guidesTop.current = new Guides(containerEl, {
      ...sameParams,
      type: 'horizontal',
      className: 'my-horizontal',
    } as any)

    guidesLeft.current = new Guides(containerEl, {
      ...sameParams,
      type: 'vertical',
      className: 'my-vertical',
    } as any)

    changeScroll()
  }

  useEffect(() => {
    show ? render() : destroy()
    return destroy
  }, [show, resolved])

  useEffect(() => subscribeKey(canvasState, 'dZoom', () => changeScroll()), [])

  return <div />
}
