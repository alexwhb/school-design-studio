import { useCallback, useRef, useState } from 'react'
import api from '@/api'
import type { IGetTempListData } from '@/api/home'
import useConfirm from '@/common/methods/confirm'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import Button from '@/components/ui/Button'
import Divider from '@/components/ui/Divider'
import { setShowMoveable } from '@/store/control'
import { setZoomScreenChange } from '@/store/force'
import { managerEdit } from '@/store/base'
import { setDPage } from '@/store/canvas'
import { historyState } from '@/store/state'
import { selectWidget, setDWidgets, setTemplate } from '@/store/widget'
import SearchHeader from './components/SearchHeader'
import ImgWaterFall from './components/ImgWaterFall'
import './tempListWrap.less'

type TPageOptions = {
  page: number
  pageSize: number
  cate: number | string
  state?: string
}

export default function TempListWrap() {
  const listRef = useRef<HTMLUListElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [list, setList] = useState<IGetTempListData[]>([])
  const [title, setTitle] = useState('Sample templates')
  const [searchKeyword, setSearchKeyword] = useState('')

  const keywordRef = useRef('')
  keywordRef.current = searchKeyword
  const loadingRef = useRef(false)
  const doneRef = useRef(false)
  const pageOptions = useRef<TPageOptions>({ page: 0, pageSize: 20, cate: 1 })
  const initialised = useRef(false)

  if (!initialised.current) {
    initialised.current = true
    const { cate, edit } = readQuery()
    cate && (pageOptions.current.cate = cate ?? 1)
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

  function cateChange(type: any) {
    setTitle(type.name)
    const init = pageOptions.current.cate != type.id
    pageOptions.current.cate = type.id
    load(init, pageOptions.current.state)
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
      <SearchHeader value={searchKeyword} onChange={setSearchKeyword} onCateChange={cateChange} onSearch={searchChange} />

      {title ? (
        <Divider style={{ marginTop: '1.7rem' }} contentPosition="left">
          <span style={{ fontWeight: 'bold' }}>{title}</span>
        </Divider>
      ) : null}

      <Button className="upload-psd" plain type="primary" onClick={openPSD}>
        Import a PSD file
      </Button>

      <ul ref={listRef} className="infinite-list" style={{ overflow: 'auto' }}>
        <ImgWaterFall listData={list} onSelect={selectItem} />
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
