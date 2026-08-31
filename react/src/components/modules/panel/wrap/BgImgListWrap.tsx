import { useCallback, useRef, useState } from 'react'
import api from '@/api'
import type { TGetImageListResult } from '@/api/material'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import Image from '@/components/ui/Image'
import { updatePageData } from '@/store/canvas'
import { selectWidget, setSelectItem } from '@/store/widget'
import ImageTip from './components/ImageTip'
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

export default function BgImgListWrap({ model, style }: TProps) {
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [bgList, setBgList] = useState<TGetImageListResult[]>([])
  const listRef = useRef<HTMLUListElement | null>(null)
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const pageOptions = useRef({ page: 0, pageSize: 20 })

  const modelStyle = models[model]

  const load = useCallback(async (init: boolean = false) => {
    if (doneRef.current) {
      return
    }
    loadingRef.current = true
    setLoading(true)
    pageOptions.current.page += 1

    if (init) {
      setBgList([])
      pageOptions.current.page = 1
    }

    await api.material.getImagesList({ cate: 3, page: pageOptions.current.page }).then(({ list }) => {
      if (list.length > 0) {
        setBgList((prev) => prev.concat(list))
      } else {
        doneRef.current = true
        setLoadDone(true)
      }
    })

    setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
    }, 100)
  }, [])

  const loadData = useCallback(() => {
    if (loadingRef.current) {
      return
    }
    load()
  }, [load])

  useInfiniteScroll(listRef, loadData)

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
    updatePageData({ key: 'backgroundTransform', value: {} })
    updatePageData({ key: 'backgroundImage', value: item.url })
    selectWidget({ uuid: '-1' })
  }

  function dragStart() {
    setSelectItem({ data: {}, type: 'bg' })
  }

  return (
    <div className="wrap bg-img-list-wrap" style={style}>
      <div className="color__box" style={modelStyle.color}>
        {COLORS.map((c) => (
          <div key={c} style={{ background: c }} className="color__item" onClick={() => setBGcolor(c)} />
        ))}
      </div>
      <ul ref={listRef} className="infinite-list" style={{ overflow: 'auto' }}>
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
        {loadDone ? <div className="loading">That is everything</div> : null}
      </ul>
    </div>
  )
}
