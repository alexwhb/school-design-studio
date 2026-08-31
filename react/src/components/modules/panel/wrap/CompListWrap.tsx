import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/api'
import type { TGetCompListResult, TGetTempDetail, TTempDetail } from '@/api/home'
import getComponentsData from '@/common/methods/DesignFeatures/setComponents'
import setItem2Data from '@/common/methods/DesignFeatures/setImage'
import DragHelper from '@/common/hooks/dragHelper'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import Image from '@/components/ui/Image'
import Space from '@/components/ui/Space'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addGroup, addWidget, setSelectItem } from '@/store/widget'
import ClassHeader from './components/ClassHeader'
import './compListWrap.less'

const dragHelper = new DragHelper()
const compsCache: any = {}

export default function CompListWrap() {
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [list, setList] = useState<TGetCompListResult[]>([])
  const [currentCategory, setCurrentCategory] = useState<any>(null)
  const [types, setTypes] = useState<{ cate: string; name: string }[]>([])
  const [showList, setShowList] = useState<TGetCompListResult[][]>([])
  const listRef = useRef<HTMLUListElement | null>(null)

  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })
  const tempDetail = useRef<TTempDetail | null>(null)
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const categoryRef = useRef<any>(null)
  const pageOptions = useRef({ type: 1, page: 0, pageSize: 20 })

  useEffect(() => {
    let cancelled = false
    const nextTypes = [
      { cate: 'text', name: 'Text with effects' },
      { cate: 'comp', name: 'Sample element groups' },
    ]
    setTypes(nextTypes)
    ;(async () => {
      const collected: TGetCompListResult[][] = []
      for (const iterator of nextTypes) {
        const { list: items } = await api.home.getCompList({ type: 1, cate: iterator.cate })
        collected.push(items)
      }
      if (!cancelled) setShowList(collected)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const mouseup = (e: React.MouseEvent) => {
    e.preventDefault()
    isDrag.current = false
    tempDetail.current = null
    startPoint.current = { x: 99999, y: 99999 }
  }

  const mousemove = (e: React.MouseEvent) => {
    e.preventDefault()
    // startPoint only holds a real position between mousedown and mouseup. Without
    // this the move that carries the pointer onto a thumbnail is measured against
    // the sentinel, reads as a drag of ninety-nine thousand pixels, and the click
    // that follows is thrown away as the end of one.
    if (startPoint.current.x === 99999) return
    if (Math.abs(e.clientX - startPoint.current.x) > 2 || Math.abs(e.clientY - startPoint.current.y) > 2) {
      isDrag.current = true
    }
  }

  const load = useCallback(async (init: boolean = false) => {
    if (init) {
      setList([])
      pageOptions.current.page = 0
      doneRef.current = false
      setLoadDone(false)
    }

    if (doneRef.current || loadingRef.current) {
      return
    }

    loadingRef.current = true
    setLoading(true)
    pageOptions.current.page += 1

    const res = await api.home.getCompList({
      ...pageOptions.current,
      cate: categoryRef.current?.id || categoryRef.current?.cate,
    })
    if (init) {
      setList(res?.list)
    } else {
      if (res?.list.length <= 0) {
        doneRef.current = true
        setLoadDone(true)
      }
      setList((prev) => prev.concat(res?.list))
    }
    setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
    }, 100)
  }, [])

  useInfiniteScroll(listRef, load, 150, !!currentCategory)

  const selectTypes = (item: any) => {
    categoryRef.current = item
    setCurrentCategory(item)
    load(true)
  }

  const back = () => {
    categoryRef.current = null
    setCurrentCategory(null)
  }

  const dragStart = async (e: React.MouseEvent, { id, width, height, cover }: TGetCompListResult) => {
    // Stop the browser starting its own image drag on the thumbnail: while a
    // native drag is running it swallows mousemove and mouseup, so the piece
    // being dragged sits frozen until the button is released.
    e.preventDefault()
    startPoint.current = { x: e.clientX, y: e.clientY }
    const img = await setItem2Data({ width, height, url: cover })
    dragHelper.start(e.nativeEvent, img.canvasWidth)
    tempDetail.current = await getCompDetail({ id, type: 1 })
    if (Array.isArray(JSON.parse(tempDetail.current.data))) {
      setSelectItem({ data: JSON.parse(tempDetail.current.data), type: 'group' })
    } else {
      setSelectItem({ data: JSON.parse(tempDetail.current.data), type: 'text' })
    }
  }

  const selectItem = async (item: TGetCompListResult) => {
    if (isDrag.current) {
      return
    }
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
      group.text && (group.text = decodeURIComponent(group.text))
      group.left = pW / 2 - group.fontSize * (group.text.length / 2)
      group.top = pH / 2 - group.fontSize / 2
      addWidget(group)
    }
  }

  function getCompDetail(params: TGetTempDetail): Promise<TTempDetail> {
    return new Promise((resolve) => {
      if (compsCache[params.id]) {
        resolve(compsCache[params.id])
      } else
        api.home.getTempDetail(params).then((res: any) => {
          resolve(res)
          compsCache[params.id] = res
        })
    })
  }

  return (
    <div className="wrap comp-list-wrap">
      {!currentCategory ? (
        <ClassHeader
          types={types}
          onSelect={selectTypes}
          renderSection={(index) => (
            <div className="list-wrap">
              {(showList[index] || []).map((item, i) => (
                <div
                  key={i + 'sl'}
                  draggable={false}
                  onMouseDown={(e) => dragStart(e, item)}
                  onMouseMove={mousemove}
                  onMouseUp={mouseup}
                  onClick={(e) => {
                    e.stopPropagation()
                    selectItem(item)
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <Image className="list__img-thumb" src={item.cover} fit="contain" lazy />
                </div>
              ))}
            </div>
          )}
        />
      ) : null}

      {currentCategory ? (
        <ul ref={listRef} className="infinite-list" style={{ overflow: 'auto' }}>
          <ClassHeader isBack onBack={back}>
            {currentCategory.name}
          </ClassHeader>
          <Space fill wrap fillRatio={30} direction="horizontal" className="list">
            {list.map((item, i) => (
              <div
                key={i + 'i'}
                className="list__item"
                draggable={false}
                onMouseDown={(e) => dragStart(e, item)}
                onMouseMove={mousemove}
                onMouseUp={mouseup}
                onClick={(e) => {
                  e.stopPropagation()
                  selectItem(item)
                }}
                  onDragStart={(e) => e.preventDefault()}
              >
                <Image className="list__img" src={item.cover} fit="contain" lazy />
              </div>
            ))}
          </Space>
          {loading ? (
            <div className="loading">
              <i className="el-icon-loading" /> Loading
            </div>
          ) : null}
          {loadDone ? <div className="loading">That is everything</div> : null}
        </ul>
      ) : null}
    </div>
  )
}
