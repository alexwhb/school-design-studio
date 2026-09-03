import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/api'
import type { IGetTempListData, TGetCategoriesData } from '@/api/home'
import useConfirm from '@/common/methods/confirm'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import Image from '@/components/ui/Image'
import { setShowMoveable } from '@/store/control'
import { setZoomScreenChange } from '@/store/force'
import { managerEdit } from '@/store/base'
import { setDPage } from '@/store/canvas'
import { historyState } from '@/store/state'
import { selectWidget, setDWidgets, setTemplate } from '@/store/widget'
import SearchHeader from './components/SearchHeader'
import FilterChips from './components/FilterChips'
import PanelEyebrow from './components/PanelEyebrow'
import Card, { CardGrid } from './components/Card'
import EditModel from './components/EditModel'
import { PanelBody, PanelHead, PanelSectionBlock, PanelWrap } from './components/PanelShell'
import './tempListWrap.less'

type TPageOptions = {
  page: number
  pageSize: number
  cate: number | string
  state?: string
}

/** Always first, and not content — the server only knows about real categories. */
const ALL: TGetCategoriesData = { id: '', name: 'All' }

/** The mono line under a template's name; a design with no size gets nothing. */
const sizeOf = (item: IGetTempListData) => (item.width && item.height ? `${item.width} × ${item.height}` : '')

export default function TempListWrap() {
  const listRef = useRef<HTMLDivElement | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadDone, setLoadDone] = useState(false)
  const [list, setList] = useState<IGetTempListData[]>([])
  const [designList, setDesignList] = useState<IGetTempListData[]>([])
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

  /** A short first page leaves the scroller with nothing to scroll, and so no
      way to ask for the second. Fetch until it overflows. */
  function checkHeight() {
    const el = listRef.current
    if (!el) return
    el.scrollHeight <= el.clientHeight && load()
  }

  /**
   * Designs this browser has saved. There is no account system in this fork, so
   * the endpoint answers with nothing and the section simply does not appear;
   * where there is one, it is the first thing you want on opening Templates.
   */
  const loadDesigns = useCallback(() => {
    api.home.getMyDesign({ page: 1, pageSize: 10 }).then(({ list: found }) => {
      setDesignList((found || []).map((item) => ({ ...item, cover: item.cover + '?r=' + Math.random() })))
    })
  }, [])

  useEffect(() => {
    loadDesigns()
  }, [loadDesigns])

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
    return cate ? `No ${found?.name.toLowerCase()} match “${searchKeyword}”` : `Nothing matches “${searchKeyword}”`
  }

  /** What the gallery section is showing: the chip, the search, or everything. */
  function sectionLabel() {
    if (searchKeyword) return `Results for “${searchKeyword}”`
    const found = cates.find((item) => item.id === cate)
    return cate && found ? found.name : 'All templates'
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
    window.dispatchEvent(new CustomEvent('design-title', { detail: item.title || '' }))
    selectWidget({ uuid: '-1' })
  }

  function setTempId(tempId: number | string) {
    const { id } = readQuery()
    replaceQuery({ tempid: String(tempId), id })
  }

  const openDesign = (item: IGetTempListData) => {
    window.open(`${window.location.protocol + '//' + window.location.host}/home?id=${item.id}`)
  }

  const deleteDesign = async ({ item }: { i: number; item: IGetTempListData }) => {
    const isPass = await useConfirm('Warning', 'This cannot be undone. Are you sure?', 'warning')
    if (!isPass) return
    await api.material.deleteMyWorks({ id: item.id })
    setTimeout(() => {
      replaceQuery({})
      loadDesigns()
    }, 300)
  }

  const openPSD = () => {
    window.open('/psd', '_blank')
  }

  return (
    <PanelWrap className="temp-list-wrap">
      <PanelHead>
        <SearchHeader value={searchKeyword} placeholder="Search templates" onChange={setSearchKeyword} onSearch={searchChange} />
        {/* Chips rather than a dropdown: five categories over a gallery this
            size are worth showing outright, and the row doubles as a reminder
            of what the search is currently scoped to. */}
        <FilterChips items={cates} value={cate} onChange={cateChange} />
      </PanelHead>

      <PanelBody ref={listRef}>
        {designList.length > 0 ? (
          <PanelSectionBlock className="temp-list-wrap__designs">
            <PanelEyebrow label="Your designs" note="only you" />
            <CardGrid columns={2}>
              {designList.map((item) => (
                <Card key={item.id} name={item.title} meta={sizeOf(item)} onClick={() => openDesign(item)}>
                  <EditModel options={[{ name: 'Delete', fn: deleteDesign }] as any} data={{ item, i: 0 }}>
                    <Image className="img" src={item.cover} fit="cover" lazy />
                  </EditModel>
                </Card>
              ))}
            </CardGrid>
          </PanelSectionBlock>
        ) : null}

        <PanelSectionBlock>
          {/* The PSD importer opens a page of its own rather than adding
              anything here, so it rides on the heading instead of taking a
              button's worth of the panel. */}
          <PanelEyebrow label={sectionLabel()} onAction={openPSD} actionLabel="Import a PSD" />
          <CardGrid columns={2}>
            {list.map((item) => (
              <Card key={item.id} name={item.title} meta={sizeOf(item)} onClick={() => selectItem(item)}>
                <Image className="img" src={item.cover} fit="cover" lazy />
              </Card>
            ))}
          </CardGrid>
          {loading ? <div className="panel-wrap__status">Loading</div> : null}
          {loadDone && list.length ? <div className="panel-wrap__status">That is everything</div> : null}
          {loadDone && !list.length ? <div className="panel-wrap__status">{emptyMessage()}</div> : null}
        </PanelSectionBlock>
      </PanelBody>
    </PanelWrap>
  )
}
