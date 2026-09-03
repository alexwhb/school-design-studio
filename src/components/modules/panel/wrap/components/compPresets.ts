/**
 * The ready-made pieces: a text preset with an effect on it, or a small group
 * of widgets like a ribbon banner.
 *
 * Both are the same record in the library and both are placed the same way —
 * the thumbnail is a cover image, the real thing is a saved widget tree fetched
 * on demand — so the fetching, the drag and the placement live here and the
 * Text and Graphics panels only decide how to draw them.
 */
import { useCallback, useEffect, useRef, useState, type MouseEvent as ReactMouseEvent } from 'react'
import api from '@/api'
import type { TGetCompListResult, TGetTempDetail, TTempDetail } from '@/api/home'
import DragHelper from '@/common/hooks/dragHelper'
import getComponentsData from '@/common/methods/DesignFeatures/setComponents'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import { brandResolver } from '@/common/methods/brandKit'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addGroup, addWidget, setSelectItem } from '@/store/widget'
import { decodeText } from '@/store/widget/template'
import { fillWidget } from '@/utils/mergeFields'

const dragHelper = new DragHelper()
/** A preset's widget tree never changes under us, so it is fetched once. */
const compsCache: Record<string | number, TTempDetail> = {}

function getCompDetail(params: TGetTempDetail): Promise<TTempDetail> {
  if (compsCache[params.id]) return Promise.resolve(compsCache[params.id])
  return api.home.getTempDetail(params).then((res: TTempDetail) => {
    compsCache[params.id] = res
    return res
  })
}

export type TCompItemProps = {
  draggable: false
  onMouseDown: (e: ReactMouseEvent<HTMLElement>) => void
  onMouseMove: (e: ReactMouseEvent<HTMLElement>) => void
  onMouseUp: (e: ReactMouseEvent<HTMLElement>) => void
  onClick: (e: ReactMouseEvent<HTMLElement>) => void
  onDragStart: (e: ReactMouseEvent<HTMLElement>) => void
}

export default function useCompPresets(cate: 'text' | 'comp') {
  const [list, setList] = useState<TGetCompListResult[]>([])
  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })
  const tempDetail = useRef<TTempDetail | null>(null)

  useEffect(() => {
    let cancelled = false
    api.home.getCompList({ type: 1, cate }).then(({ list: found }) => {
      if (!cancelled) setList(found || [])
    })
    return () => {
      cancelled = true
    }
  }, [cate])

  const place = useCallback(async (item: TGetCompListResult) => {
    setShowMoveable(false)
    tempDetail.current = tempDetail.current || (await getCompDetail({ id: item.id, type: 1 }))
    const group: any = await getComponentsData(tempDetail.current.data)
    let parent: Record<string, any> = { x: 0, y: 0 }
    const { width: pW, height: pH } = canvasState.dPage

    Array.isArray(group) &&
      group.forEach((element: any) => {
        element.type === 'w-group' && (parent = element)
      })
    if (parent.isContainer) {
      group.forEach((element: any) => {
        element.left += (pW - parent.width) / 2
        element.top += (pH - parent.height) / 2
      })
      addGroup(group)
    } else {
      // A group is filled on its way through addGroup; a lone text preset is
      // filled here, after the decode that turns its %7B%7B back into braces.
      group.text && (group.text = decodeText(group.text))
      const widget: any = fillWidget(group, brandResolver())
      widget.left = pW / 2 - widget.fontSize * (widget.text.length / 2)
      widget.top = pH / 2 - widget.fontSize / 2
      addWidget(widget)
    }
  }, [])

  const itemProps = useCallback(
    (item: TGetCompListResult): TCompItemProps => ({
      draggable: false,
      onMouseDown: async (e: ReactMouseEvent<HTMLElement>) => {
        // Stop the browser starting its own image drag on the thumbnail: while
        // a native drag is running it swallows mousemove and mouseup, so the
        // piece being dragged sits frozen until the button is released.
        e.preventDefault()
        startPoint.current = { x: e.clientX, y: e.clientY }
        const img = await setItem2Data({ width: item.width, height: item.height, url: item.cover })
        dragHelper.start(e.nativeEvent, img.canvasWidth)
        tempDetail.current = await getCompDetail({ id: item.id, type: 1 })
        const data = JSON.parse(tempDetail.current.data)
        setSelectItem({ data, type: Array.isArray(data) ? 'group' : 'text' })
      },
      onMouseMove: (e: ReactMouseEvent<HTMLElement>) => {
        e.preventDefault()
        // startPoint only holds a real position between mousedown and mouseup.
        // Without this the move that carries the pointer onto a thumbnail is
        // measured against the sentinel, reads as a drag of ninety-nine
        // thousand pixels, and the click that follows is thrown away as the
        // end of one.
        if (startPoint.current.x === 99999) return
        if (Math.abs(e.clientX - startPoint.current.x) > 2 || Math.abs(e.clientY - startPoint.current.y) > 2) {
          isDrag.current = true
        }
      },
      onMouseUp: (e: ReactMouseEvent<HTMLElement>) => {
        e.preventDefault()
        tempDetail.current = null
        // After the click that follows it, so a drag that ends back over the
        // thumbnail is not also read as a click on it.
        setTimeout(() => {
          isDrag.current = false
          startPoint.current = { x: 99999, y: 99999 }
        }, 10)
      },
      onClick: (e: ReactMouseEvent<HTMLElement>) => {
        e.stopPropagation()
        !isDrag.current && place(item)
      },
      onDragStart: (e: ReactMouseEvent<HTMLElement>) => e.preventDefault(),
    }),
    [place],
  )

  return { list, itemProps }
}
