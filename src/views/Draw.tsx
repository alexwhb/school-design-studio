import { useEffect, useRef } from 'react'
import FontFaceObserver from 'fontfaceobserver'
import api from '@/api'
import Preload from '@/utils/plugins/preload'
import { font2style, fontMinWithDraw } from '@/utils/widgets/loadFontRule'
import { readQuery } from '@/common/hooks/useRouteQuery'
import DesignBoard from '@/components/modules/layout/designBoard/DesignBoard'
import ZoomControl from '@/components/modules/layout/zoomControl/ZoomControl'
import { canvasState } from '@/store/state'
import { setDPage } from '@/store/canvas'
import { addGroup, setDWidgets, setTemplate } from '@/store/widget'
import './draw.less'

export default function Draw() {
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    load()
  }, [])

  async function load() {
    let backgroundImage = ''
    let loadFlag = false
    const { id, tempid, tempType: type = '0', index = '0' } = readQuery()
    if (id || tempid) {
      const postData = { id: (id || tempid) as any, type: Number(type) }
      const { data, width, height } = await api.home[id ? 'getWorks' : 'getTempDetail'](postData)
      let content = JSON.parse(data)
      const isGroupTemplate = Number(type) == 1

      if (Array.isArray(content) && !isGroupTemplate) {
        const { global, layers } = content[Number(index)]
        content = { page: global, widgets: layers }
      }
      const widgets = isGroupTemplate ? content : content.widgets

      if (isGroupTemplate) {
        canvasState.dPage.width = width
        canvasState.dPage.height = height
        canvasState.dPage.backgroundColor = '#ffffff00'
        addGroup(content)
      } else {
        setDPage(content.page)
        backgroundImage = content.page?.backgroundImage
        backgroundImage && delete content.page.backgroundImage
        setDPage(content.page)
        if (id) {
          setDWidgets(widgets)
        } else {
          setTemplate(widgets)
        }
      }

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
        setDPage({ ...content.page, ...{ backgroundImage } })
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
    setTimeout(() => {
      !loadFlag && window.loadFinishToInject?.('done')
    }, 60000)
  }

  return (
    <div className="ds-draw-view">
      <div className="page-design-index-wrap">
        <DesignBoard className="page-design-wrap fixed-canvas" pageDesignCanvasId="page-design-canvas" />
      </div>
      <ZoomControl />
    </div>
  )
}

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}
