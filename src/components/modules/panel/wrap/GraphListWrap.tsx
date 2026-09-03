import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@/api'
import type { TGetListData } from '@/api/material'
import setImageData from '@/common/methods/DesignFeatures/setImage'
import DragHelper from '@/common/hooks/dragHelper'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import Image from '@/components/ui/Image'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget, setSelectItem } from '@/store/widget'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import { wSvgSetting } from '../../widgets/wSvg/wSvgSetting'
import ArrowPresets from './components/ArrowPresets'
import SearchHeader from './components/SearchHeader'
import ClassHeader from './components/ClassHeader'
import { cx } from '@/utils/dom'
import './graphListWrap.less'

type TCurrentCategory = {
  name: string
  cate?: string | number
  id?: number
}

const dragHelper = new DragHelper()

export default function GraphListWrap() {
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [list, setList] = useState<TGetListData[]>([])
  const [currentCategory, setCurrentCategory] = useState<TCurrentCategory | null>(null)
  const [types, setTypes] = useState<{ cate: string; name: string }[]>([])
  const [showList, setShowList] = useState<TGetListData[][]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const listRef = useRef<HTMLUListElement | null>(null)

  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const categoryRef = useRef<TCurrentCategory | null>(null)
  const keywordRef = useRef('')
  const pageOptions = useRef({ page: 0, pageSize: 20 })

  useEffect(() => {
    let cancelled = false
    const nextTypes = [
      { cate: 'png', name: 'Stickers' },
      { cate: 'svg', name: 'Shapes' },
      { cate: 'mask', name: 'Masks' },
    ]
    setTypes(nextTypes)
    ;(async () => {
      const collected: TGetListData[][] = []
      for (const iterator of nextTypes) {
        const { list: items } = await api.material.getList({ cate: iterator.cate })
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
    setTimeout(() => {
      isDrag.current = false
      startPoint.current = { x: 99999, y: 99999 }
    }, 10)
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
    const res = await api.material.getList({
      cate: categoryRef.current?.id || categoryRef.current?.cate,
      search: keywordRef.current,
      ...pageOptions.current,
    } as any)
    if (init) {
      setList(res?.list)
    } else {
      setList((prev) => prev.concat(res?.list))
    }
    if (res?.list.length <= 0) {
      doneRef.current = true
      setLoadDone(true)
    }
    setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
    }, 100)
  }, [])

  useInfiniteScroll(listRef, load, 150, !!currentCategory)

  const searchChange = (keyword: string) => {
    setSearchKeyword(keyword)
    keywordRef.current = keyword
    if (!keyword) {
      categoryRef.current = null
      setCurrentCategory(null)
      return
    }
    const next = { name: `Results for "${keyword}"` }
    categoryRef.current = next
    setCurrentCategory(next)
    load(true)
  }

  const selectTypes = (item: TCurrentCategory) => {
    setSearchKeyword('')
    keywordRef.current = ''
    categoryRef.current = item
    setCurrentCategory(item)
    load(true)
  }

  const back = () => {
    setSearchKeyword('')
    keywordRef.current = ''
    categoryRef.current = null
    setCurrentCategory(null)
  }

  const emptyText = useMemo(() => {
    if (list.length > 0) return 'That is everything'
    return searchKeyword ? `Nothing matches "${searchKeyword}"` : 'Nothing here yet'
  }, [list.length, searchKeyword])

  async function selectItem(item: TGetListData) {
    if (isDrag.current) {
      return
    }
    setShowMoveable(false)

    const setting = item.type === 'svg' ? JSON.parse(JSON.stringify(wSvgSetting)) : JSON.parse(JSON.stringify(wImageSetting))
    const img = await setImageData(item as any)

    setting.width = img.width
    setting.height = img.height
    const { width: pW, height: pH } = canvasState.dPage
    setting.left = pW / 2 - img.width / 2
    setting.top = pH / 2 - img.height / 2
    setting.imgUrl = item.url
    if (item.type === 'svg') {
      setting.svgUrl = item.url
      const models = JSON.parse(item.model)
      for (const key in models) {
        if (Object.hasOwnProperty.call(models, key)) {
          setting[key] = models[key]
        }
      }
    }
    if (item.type === 'mask') {
      setting.mask = item.url
    }
    addWidget(setting)
  }

  async function dragStart(e: React.MouseEvent, item: TGetListData) {
    // Stop the browser starting its own image drag on the thumbnail: while a
    // native drag is running it swallows mousemove and mouseup, so the piece
    // being dragged sits frozen until the button is released.
    e.preventDefault()
    startPoint.current = { x: e.clientX, y: e.clientY }
    const { width, height, thumb, url } = item
    const img = await setImageData({ width, height, url: thumb || url })
    dragHelper.start(e.nativeEvent, img.canvasWidth)
    setSelectItem({ data: { value: item }, type: item.type })
  }

  return (
    <div className="wrap graph-list-wrap">
      <SearchHeader value={searchKeyword} live placeholder="Search elements" onChange={setSearchKeyword} onSearch={searchChange} />
      <div style={{ height: '0.5rem' }} />
      {!currentCategory ? (
        <ClassHeader
          types={types}
          onSelect={selectTypes}
          // Before the library's own rows: the arrows are built in, not fetched.
          before={<ArrowPresets />}
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
                  <Image className={cx('list__img-thumb', `art--${item.type}`)} src={item.thumb} fit="contain" lazy />
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
          <div className="list">
            {list.map((item, i) => (
              <div
                key={i + 'i'}
                className={cx('list__item', `art--${item.type}`)}
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
                <Image className={cx('list__img', `art--${item.type}`)} src={item.thumb} fit="contain" lazy />
              </div>
            ))}
          </div>
          {loading ? (
            <div className="loading">
              <i className="el-icon-loading" /> Loading
            </div>
          ) : null}
          {loadDone ? (
            <div style={list.length <= 0 ? { paddingTop: '4rem' } : undefined} className="loading">
              {emptyText}
            </div>
          ) : null}
        </ul>
      ) : null}
    </div>
  )
}
