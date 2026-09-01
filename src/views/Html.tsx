import { useEffect, useRef, useState } from 'react'
import { proxy } from 'valtio'
import FontFaceObserver from 'fontfaceobserver'
import api from '@/api'
import Preload from '@/utils/plugins/preload'
import { font2style, fontMinWithDraw } from '@/utils/widgets/loadFontRule'
import { readQuery } from '@/common/hooks/useRouteQuery'
import DesignBoard from '@/components/modules/layout/designBoard/DesignBoard'
import type { TdWidgetData, TPageState } from '@/store/types'
import './html.less'

type RenderedPage = { pageData: TPageState; dWidgets: TdWidgetData[]; zoom: number }

function controlScale(width: number) {
  const winWidth = document.documentElement.clientWidth
  const curZoom = winWidth / width
  return curZoom > 1 ? 1 : curZoom
}

export default function Html() {
  const [pageGroup, setPageGroup] = useState<RenderedPage[]>([])
  const started = useRef(false)
  const groupRef = useRef<RenderedPage[]>([])
  groupRef.current = pageGroup

  useEffect(() => {
    const handleResize = () => {
      setPageGroup((prev) => prev.map((val) => ({ ...val, zoom: controlScale(val.pageData.width) })))
    }
    window.addEventListener('resize', handleResize, false)
    if (!started.current) {
      started.current = true
      load()
    }
    return () => window.removeEventListener('resize', handleResize, false)
  }, [])

  async function load() {
    let backgroundImage = ''
    let loadFlag = false
    const { id, tempid } = readQuery()
    if (id || tempid) {
      const { data } = await api.home[id ? 'getWorks' : 'getTempDetail']({ id: (id || tempid) as any })
      let contentGroup = JSON.parse(data)
      contentGroup = Array.isArray(contentGroup) ? contentGroup : [contentGroup]

      for (let i = 0; i < contentGroup.length; i++) {
        const { global, layers } = contentGroup[i]
        const content = { page: global, widgets: layers }

        const widgets = content.widgets
        const zoom = controlScale(content.page?.width)

        backgroundImage = content.page?.backgroundImage
        backgroundImage && delete content.page.backgroundImage

        // The widget components read their params through valtio, so a page
        // rendered straight from JSON has to be handed over as a proxy.
        const rendered = proxy({ page: content.page as TPageState, widgets: widgets as TdWidgetData[] })
        setPageGroup((prev) => prev.concat({ pageData: rendered.page, dWidgets: rendered.widgets, zoom }))
        await nextPaint()

        const imgsData: HTMLImageElement[] = []
        const svgsData: HTMLImageElement[] = []
        const fontLoaders: Promise<void>[] = []
        const fontContent: Record<string, string> = {}
        const fontData: string[] = []
        widgets.forEach((item: any) => {
          if (item.fontClass && item.fontClass.value) {
            const loader = new FontFaceObserver(item.fontClass.value)
            fontData.push(item.fontClass)
            fontLoaders.push(loader.load(null, 30000))
            if (fontContent[item.fontClass.value]) {
              fontContent[item.fontClass.value] += item.text
            } else {
              fontContent[item.fontClass.value] = item.text
            }
          }
          try {
            if (item.svgUrl && item.type === 'w-svg') {
              const cNodes: any = document.getElementById(item.uuid)!.childNodes
              svgsData.push(cNodes)
            } else if (item.imgUrl && !item.isNinePatch) {
              const cNodes: any = document.getElementById(item.uuid)!.childNodes
              for (const el of cNodes) {
                if (el.className && el.className.includes('img__box')) {
                  imgsData.push(el.firstChild)
                }
              }
            }
          } catch (e) {}
        })
        if (backgroundImage) {
          const preloadBg = new Preload([backgroundImage])
          await preloadBg.imgs()
        }
        try {
          fontMinWithDraw && (await font2style(fontContent, fontData))
          const preload = new Preload(imgsData)
          await preload.doms()
          const preload2 = new Preload(svgsData)
          await preload2.svgs()
        } catch (e) {
          console.log(e)
        }
        try {
          await Promise.all(fontLoaders)
        } catch (e) {}
        loadFlag = true
        setTimeout(() => {
          try {
            window.loadFinishToInject?.('done')
          } catch (err) {}
        }, 100)
      }
    }
    setTimeout(() => {
      !loadFlag && window.loadFinishToInject?.('done')
    }, 60000)
  }

  return (
    <div>
      <div className="page-design-index-wrap" id="page-draw-html-wrap">
        {pageGroup.map((x) => (
          <DesignBoard
            key={x.pageData.uuid}
            className="page-design-wrap fixed-canvas"
            pageDesignCanvasId="page-design-canvas"
            padding={0}
            renderDWidgets={x.dWidgets}
            renderDPage={x.pageData}
            zoom={x.zoom * 100}
          />
        ))}
      </div>
    </div>
  )
}

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}
