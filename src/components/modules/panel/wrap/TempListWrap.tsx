import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/api'
import type { IGetTempListData, TGetCategoriesData } from '@/api/home'
import useConfirm from '@/common/methods/confirm'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import Button from '@/components/ui/Button'
import { setShowMoveable } from '@/store/control'
import { setZoomScreenChange } from '@/store/force'
import { managerEdit } from '@/store/base'
import { setDPage } from '@/store/canvas'
import { historyState } from '@/store/state'
import { selectWidget, setDWidgets, setTemplate } from '@/store/widget'
import SearchHeader from './components/SearchHeader'
import ImgWaterFall from './components/ImgWaterFall'
import { cx } from '@/utils/dom'
import './tempListWrap.less'

type TPageOptions = {
  page: number
  pageSize: number
  cate: number | string
  state?: string
}

/** Always first, and not content — the server only knows about real categories. */
const ALL: TGetCategoriesData = { id: '', name: 'All' }

export default function TempListWrap() {
  const listRef = useRef<HTMLUListElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [list, setList] = useState<IGetTempListData[]>([])
  const [cates, setCates] = useState<TGetCategoriesData[]>([ALL])
  /** The selected chip's slug; '' is "All". */
  const [cate, setCate] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')

  const keywordRef = useRef('')
  keywordRef.current = searchKeyword
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const pageOptions = useRef<TPageOptions>({ page: 0, pageSize: 20, cate: '' })
  const initialised = useRef(false)

  if (!initialised.current) {
    initialised.current = true
    const { cate: fromQuery, edit } = readQuery()
    if (fromQuery) {
      pageOptions.current.cate = fromQuery
      setCate(String(fromQuery))
    }
    edit && managerEdit(true)
  }

  const load = useCallback(async (init: boolean = false, stat?: string) => {
    stat && (pageOptions.current.state = stat)

    if (init && listRef.current) {
      listRef.current.scrollTop = 0
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

    const res = await api.home.getTempList({ search: keywordRef.current, ...pageOptions.current })
    if (res.list.length <= 0) {
      doneRef.current = true
      setLoadDone(true)
    }
    setList((prev) => (init ? res.list : prev.concat(res.list)))
    setTimeout(() => {
      loadingRef.current = false
      setLoading(false)
      checkHeight()
    }, 100)
  }, [])

  useInfiniteScroll(listRef, load)

  const started = useRef(false)
  if (!started.current) {
    started.current = true
    load()
  }

  function checkHeight() {
    if (!listRef.current) return
    const isLess = listRef.current.offsetHeight > (listRef.current.firstElementChild as HTMLElement)?.offsetHeight
    isLess && load()
  }

  function searchChange() {
    load(true, pageOptions.current.state)
  }

  const cateChange = useCallback(
    (type: TGetCategoriesData) => {
      const init = pageOptions.current.cate !== type.id
      setCate(type.id)
      pageOptions.current.cate = type.id
      load(init, pageOptions.current.state)
    },
    [load],
  )

  useEffect(() => {
    api.home.getCategories().then((found: TGetCategoriesData[]) => {
      const all = [ALL, ...(found || [])]
      setCates(all)
      // A ?cate= naming something the gallery no longer has would otherwise
      // leave every chip unselected over an empty list.
      setCate((current) => {
        if (current && !all.some((item) => item.id === current)) {
          cateChange(ALL)
          return ''
        }
        return current
      })
    })
  }, [cateChange])

  /**
   * Why the list came back empty. A search inside a category is the one case
   * where the fix is not obvious, so name the category rather than leaving
   * someone to wonder why a template they can see the name of is missing.
   */
  function emptyMessage() {
    if (!searchKeyword) return 'Nothing here yet'
    const found = cates.find((item) => item.id === cate)
    return cate ? `No ${found?.name.toLowerCase()} match \u201C${searchKeyword}\u201D` : `Nothing matches \u201C${searchKeyword}\u201D`
  }

  let hideReplacePrompt: any = localStorage.getItem('hide_replace_prompt')
  async function selectItem(item: IGetTempListData) {
    setShowMoveable(false)
    if (!hideReplacePrompt && historyState.dHistoryParams.length > 0) {
      const doNotPrompt = await useConfirm(
        'Add to my designs',
        'This template will replace everything on the page.',
        'warning',
        { confirmButtonText: 'Got it', cancelButtonText: 'Do not show again' },
      )
      if (!doNotPrompt) {
        localStorage.setItem('hide_replace_prompt', '1')
        hideReplacePrompt = true
      }
    }
    managerEdit(false)
    setDWidgets([])
    setTempId(item.id)

    let result = null
    if (!item.data) {
      const res = await api.home.getTempDetail({ id: item.id })
      result = JSON.parse(res.data)
    } else {
      result = JSON.parse(item.data)
    }
    if (Array.isArray(result)) {
      const { global, layers } = result[0]
      setDPage(global)
      setTemplate(layers)
    } else {
      const { page, widgets } = result
      setDPage(page)
      setTemplate(widgets)
    }
    setTimeout(() => {
      setZoomScreenChange()
    }, 300)
    selectWidget({ uuid: '-1' })
  }

  function setTempId(tempId: number | string) {
    const { id } = readQuery()
    replaceQuery({ tempid: String(tempId), id })
  }

  const openPSD = () => {
    window.open('/psd', '_blank')
  }

  return (
    <div className="wrap temp-list-wrap">
      <SearchHeader type="none" value={searchKeyword} placeholder="Search templates" onChange={setSearchKeyword} onSearch={searchChange} />

      <Button className="upload-psd" plain type="primary" onClick={openPSD}>
        Import a PSD file
      </Button>

      {/* Chips rather than the header's dropdown: five categories over a gallery
          this size are worth showing outright, and the row doubles as a reminder
          of what the search is currently scoped to. They sit directly above the
          list because they filter it — the PSD button used to be in between,
          which read as a divider between the two. */}
      {cates.length > 1 ? (
        <div className="cates">
          {cates.map((item) => (
            <button
              key={item.id}
              className={cx('cates__chip', { 'cates__chip--on': cate === item.id })}
              type="button"
              onClick={() => cateChange(item)}
            >
              {item.name}
            </button>
          ))}
        </div>
      ) : null}

      <ul ref={listRef} className="infinite-list" style={{ overflow: 'auto' }}>
        <ImgWaterFall listData={list} onSelect={selectItem} />
        {loading ? (
          <div className="loading">
            <i className="el-icon-loading" /> Loading
          </div>
        ) : null}
        {loadDone && list.length ? <div className="loading">That is everything</div> : null}
        {loadDone && !list.length ? <div className="loading">{emptyMessage()}</div> : null}
      </ul>
    </div>
  )
}
