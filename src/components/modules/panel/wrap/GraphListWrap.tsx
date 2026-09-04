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
import FilterChips, { NO_CHIP } from './components/FilterChips'
import PanelEyebrow from './components/PanelEyebrow'
import Card, { CardGrid, CardRows } from './components/Card'
import useCompPresets from './components/compPresets'
import { PanelBody, PanelHead, PanelSectionBlock, PanelWrap } from './components/PanelShell'
import { cx } from '@/utils/dom'
import './graphListWrap.less'

/** The library's own three shelves, plus the "everything" chip in front. */
const ALL = { id: '', name: 'All' }
const TYPES = [
  { id: 'png', name: 'Stickers' },
  { id: 'svg', name: 'Shapes' },
  { id: 'mask', name: 'Masks' },
]
const CHIPS = [ALL, ...TYPES]

/** How many of a shelf are shown before you have to ask for all of it. */
const PREVIEW = 6

const dragHelper = new DragHelper()

export default function GraphListWrap() {
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [list, setList] = useState<TGetListData[]>([])
  /** The chip in force; '' is the overview of every shelf. */
  const [cate, setCate] = useState('')
  const [showList, setShowList] = useState<TGetListData[][]>([])
  const [searchKeyword, setSearchKeyword] = useState('')
  const listRef = useRef<HTMLDivElement | null>(null)
  const { list: groups, itemProps: groupProps } = useCompPresets('comp')

  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const cateRef = useRef('')
  const keywordRef = useRef('')
  const pageOptions = useRef({ page: 0, pageSize: 20 })

  const isBrowsing = Boolean(cate) || Boolean(searchKeyword)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      const collected: TGetListData[][] = []
      for (const type of TYPES) {
        const { list: items } = await api.material.getList({ cate: type.id })
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
      if (listRef.current) listRef.current.scrollTop = 0
    }
    if (doneRef.current || loadingRef.current) {
      return
    }
    loadingRef.current = true
    setLoading(true)
    pageOptions.current.page += 1
    const res = await api.material.getList({
      cate: cateRef.current || undefined,
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

  useInfiniteScroll(listRef, load, 150, isBrowsing)

  const searchChange = (keyword: string) => {
    setSearchKeyword(keyword)
    keywordRef.current = keyword
    // Clearing the box with no chip selected goes back to the shelves, which
    // are already loaded and need no fetch of their own.
    if (!keyword && !cateRef.current) return
    load(true)
  }

  const cateChange = (item: { id: string | number; name: string }) => {
    setSearchKeyword('')
    keywordRef.current = ''
    setCate(String(item.id))
    cateRef.current = String(item.id)
    item.id && load(true)
  }

  const heading = useMemo(() => {
    if (searchKeyword) return `Results for “${searchKeyword}”`
    return TYPES.find((type) => type.id === cate)?.name ?? 'All graphics'
  }, [cate, searchKeyword])

  const emptyText = useMemo(() => {
    return searchKeyword ? `Nothing matches “${searchKeyword}”` : 'Nothing here yet'
  }, [searchKeyword])

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

  /** One piece of artwork, wherever it is drawn — a shelf or the full list. */
  const artCard = (item: TGetListData, key: string) => (
    <Card
      key={key}
      ratio="1"
      meta={item.title}
      className={cx('list__item', `art--${item.type}`)}
      thumbClassName="panel-card__thumb--art"
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
    </Card>
  )

  return (
    <PanelWrap className="graph-list-wrap">
      <PanelHead>
        <SearchHeader value={searchKeyword} live placeholder="Search graphics" onChange={setSearchKeyword} onSearch={searchChange} />
        <FilterChips items={CHIPS} value={searchKeyword ? NO_CHIP : cate} onChange={cateChange} />
      </PanelHead>

      <PanelBody ref={listRef}>
        {!isBrowsing ? (
          <>
            {/* Before the library's own shelves: the arrows are built in, not
                fetched. */}
            <ArrowPresets />

            {TYPES.map((type, index) => (
              <PanelSectionBlock key={type.id}>
                <PanelEyebrow label={type.name} onAction={() => cateChange(type)} />
                <CardGrid columns={3}>{(showList[index] || []).slice(0, PREVIEW).map((item, i) => artCard(item, type.id + i))}</CardGrid>
              </PanelSectionBlock>
            ))}

            {groups.length > 0 ? (
              <PanelSectionBlock>
                <PanelEyebrow label="Ready-made groups" />
                <CardRows>
                  {groups.map((item) => (
                    <Card key={item.id} className="panel-card--row group-card" ratio="74 / 38" name={item.title} meta={`${item.width} × ${item.height}`} thumbClassName="panel-card__thumb--art" {...groupProps(item)}>
                      <Image className="list__img" src={item.cover} fit="contain" lazy />
                    </Card>
                  ))}
                </CardRows>
              </PanelSectionBlock>
            ) : null}
          </>
        ) : (
          <PanelSectionBlock>
            <PanelEyebrow label={heading} onAction={() => cateChange(ALL)} actionLabel="Back" />
            <CardGrid columns={3}>{list.map((item, i) => artCard(item, i + 'i'))}</CardGrid>
            {loading ? <div className="panel-wrap__status">Loading</div> : null}
            {loadDone ? <div className="panel-wrap__status">{list.length ? 'That is everything' : emptyText}</div> : null}
          </PanelSectionBlock>
        )}
      </PanelBody>
    </PanelWrap>
  )
}
