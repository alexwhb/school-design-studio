import { useCallback, useRef, useState } from 'react'
import api from '@/api'
import type { TGetImageListResult } from '@/api/material'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import Image from '@/components/ui/Image'
import { updatePageData } from '@/store/canvas'
import { selectWidget, setSelectItem } from '@/store/widget'
import ImageTip from './components/ImageTip'
import { PHOTO_NOTICES } from './components/photoNotices'
import SearchHeader from './components/SearchHeader'
import './bgImgListWrap.less'

type TProps = {
  model: 'widgetPanel' | 'stylePanel'
  style?: React.CSSProperties
}

const models = {
  widgetPanel: {
    color: { padding: '1.2rem 1rem' },
    list: { gridTemplateColumns: 'auto auto auto', padding: '0 1rem' },
  },
  stylePanel: {
    color: { padding: '1.2rem 0' },
    list: { gridTemplateColumns: 'repeat(3, 76px)' },
  },
} as const

const COLORS = ['#000000ff', '#999999ff', '#CCCCCCff', '#FFFFFFff', '#E65353ff', '#FFD835ff', '#70BC59ff', '#607AF4ff', '#976BEEff']

/** The stored search behind the browse list: textures and abstract backgrounds. */
const BACKGROUND_CATE = 2
const PAGE_SIZE = 20

export default function BgImgListWrap({ model, style }: TProps) {
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [notice, setNotice] = useState('')
  const [keyword, setKeyword] = useState('')
  const [bgList, setBgList] = useState<TGetImageListResult[]>([])
  const listRef = useRef<HTMLUListElement | null>(null)
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const keywordRef = useRef('')
  const page = useRef(0)
  // Bumped whenever the list starts over, so a page that arrives late for a
  // search the user has already moved on from is dropped instead of appended.
  const runId = useRef(0)

  const modelStyle = models[model]

  const load = useCallback(async () => {
    if (doneRef.current || loadingRef.current) {
      return
    }
    loadingRef.current = true
    setLoading(true)
    page.current += 1
    const run = runId.current
    const asked = keywordRef.current

    const { list = [], error } = await api.material.getImagesList({
      cate: BACKGROUND_CATE,
      keyword: asked || undefined,
      page: page.current,
      pageSize: PAGE_SIZE,
    })

    if (run !== runId.current) {
      return
    }

    if (error) {
      setNotice(PHOTO_NOTICES[error])
      doneRef.current = true
      setLoadDone(true)
    } else if (list.length > 0) {
      setBgList((prev) => prev.concat(list))
    } else {
      doneRef.current = true
      setLoadDone(true)
      if (page.current === 1) {
        setNotice(asked ? `No backgrounds match “${asked}”. Try a broader word.` : 'No backgrounds here yet.')
      }
    }

    setLoading(false)
    // Held briefly so the scroll that triggered this load cannot immediately
    // ask for the next page before the one just added has been laid out.
    setTimeout(() => {
      if (run === runId.current) loadingRef.current = false
    }, 100)
  }, [])

  const loadData = useCallback(() => {
    if (loadingRef.current) {
      return
    }
    load()
  }, [load])

  useInfiniteScroll(listRef, loadData)

  const search = useCallback(
    (next: string) => {
      const trimmed = next.trim()
      if (trimmed === keywordRef.current) {
        return
      }
      runId.current += 1
      keywordRef.current = trimmed
      page.current = 0
      doneRef.current = false
      loadingRef.current = false
      setKeyword(trimmed)
      setBgList([])
      setLoadDone(false)
      setNotice('')
      setLoading(false)
      listRef.current?.scrollTo({ top: 0 })
      load()
    },
    [load],
  )

  // Effects run twice in development, and this one spends a request, so it is
  // started from the first render instead and guarded by a ref that survives.
  const started = useRef(false)
  if (!started.current) {
    started.current = true
    load()
  }

  function setBGcolor(color: string) {
    updatePageData({ key: 'backgroundImage', value: '' })
    updatePageData({ key: 'backgroundColor', value: color })
    selectWidget({ uuid: '-1' })
  }

  async function selectItem(item: TGetImageListResult) {
    // A new picture starts centred, uncropped-as-far-as-it-can-be. Its shape is
    // kept so the position control can zoom past the size that covers the page.
    updatePageData({ key: 'backgroundTransform', value: item.width && item.height ? { ratio: item.width / item.height } : {} })
    updatePageData({ key: 'backgroundImage', value: item.url })
    selectWidget({ uuid: '-1' })
    api.material.trackImageUse(item.downloadLocation)
  }

  function dragStart() {
    setSelectItem({ data: {}, type: 'bg' })
  }

  return (
    <div className="wrap bg-img-list-wrap" style={style}>
      <SearchHeader type="none" placeholder="Search backgrounds" onSearch={search} />
      {!keyword ? (
        <div className="color__box" style={modelStyle.color}>
          {COLORS.map((c) => (
            <div key={c} style={{ background: c }} className="color__item" onClick={() => setBGcolor(c)} />
          ))}
        </div>
      ) : (
        <div className="search__summary">Backgrounds for “{keyword}”</div>
      )}
      <ul ref={listRef} className="infinite-list" style={{ overflow: 'auto' }}>
        {notice ? <p className="notice">{notice}</p> : null}
        <div className="list" style={modelStyle.list}>
          {bgList.map((item, i) => (
            <ImageTip key={i + 'i'} detail={item as any}>
              <Image
                className="list__img"
                src={item.thumb}
                fit="cover"
                lazy
                onClick={(e) => {
                  e.stopPropagation()
                  selectItem(item)
                }}
              />
            </ImageTip>
          ))}
        </div>
        {loading ? (
          <div className="loading">
            <i className="el-icon-loading" /> Loading
          </div>
        ) : null}
        {loadDone && bgList.length > 0 ? <div className="loading">That is everything</div> : null}
      </ul>
    </div>
  )
}
