import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import api from '@/api'
import type { IGetTempListData, TGetCategoriesData } from '@/api/home'
import useConfirm from '@/common/methods/confirm'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import { isEmbedded } from '@/common/hooks/appRoot'
import message from '@/components/ui/message'
import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import Image from '@/components/ui/Image'
import { setShowMoveable } from '@/store/control'
import { setZoomScreenChange } from '@/store/force'
import { managerEdit } from '@/store/base'
import { widgetState } from '@/store/state'
import { selectWidget } from '@/store/widget'
import { applyTemplate, pageHasContent, roomFor, templatePages, type LoadedTemplate, type TemplateMode } from '@/store/widget/applyTemplate'
import { MAX_PAGES } from '@/compose/types'
import { KIND_CATEGORIES, documentKindState } from '@/store/documentKind'
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

/**
 * A thumbnail keeps the page's own shape rather than being cropped to a fixed
 * one. Most of the gallery is portrait and the headline is at the top, which is
 * exactly what a landscape crop cuts off.
 */
const ratioOf = (item: IGetTempListData) => (item.width && item.height ? `${item.width} / ${item.height}` : '4 / 3')

export default function TempListWrap() {
  const listRef = useRef<HTMLDivElement | null>(null)
  // A host that said what it is making sees only what it can make: somebody
  // asked for a presentation two screens ago, and offering them a certificate
  // here is offering to throw that away.
  const kind = useSnapshot(documentKindState).kind
  const allowed = useMemo(() => (kind ? KIND_CATEGORIES[kind] : null), [kind])
  const keep = useCallback((item: IGetTempListData) => !allowed || allowed.includes(String(item.cate || '')), [allowed])
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
    // Embedded, this is the editor's own query, which starts empty: the host's
    // `?edit=` or `?cate=` are about the host's page. See useRouteQuery.ts.
    const { cate: fromQuery, edit } = readQuery()
    if (fromQuery) {
      pageOptions.current.cate = fromQuery
      setCate(String(fromQuery))
    }
    edit && managerEdit(true)
  }

  const load = useCallback(
    async (init: boolean = false, stat?: string) => {
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
      // The end of the gallery is still the server's empty page, not an empty
      // page after filtering — a run of slides in the middle of a poster gallery
      // would otherwise stop the scroll before the posters underneath it.
      if (res.list.length <= 0) {
        doneRef.current = true
        setLoadDone(true)
      }
      const page = res.list.filter(keep)
      setList((prev) => (init ? page : prev.concat(page)))
      setTimeout(() => {
        loadingRef.current = false
        setLoading(false)
        checkHeight()
      }, 100)
    },
    [keep],
  )

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
      const offered = (found || []).filter((item) => !allowed || allowed.includes(String(item.id)))
      const all = [ALL, ...offered]
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
  }, [cateChange, allowed])

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

  /** A template picked over a page that has something on it, waiting for an answer. */
  const [asking, setAsking] = useState<{ item: IGetTempListData; loading: Promise<LoadedTemplate | null> } | null>(null)

  /**
   * The template's file, or null when it could not be had. Fetched before the
   * page is touched: see applyTemplate.ts for what used to go wrong.
   */
  async function loadTemplate(item: IGetTempListData): Promise<LoadedTemplate | null> {
    try {
      // Which of the template's colours is the school's primary, if it says.
      // It travels beside the data on both ways a template arrives here.
      const detail = item.data ? { data: item.data, brand: item.brand } : await api.home.getTempDetail({ id: item.id })
      const pages = templatePages(JSON.parse(detail.data))
      return pages.length ? { pages, brand: detail.brand, title: item.title || '' } : null
    } catch (error) {
      console.warn('[design] a template could not be read', error)
      return null
    }
  }

  async function selectItem(item: IGetTempListData) {
    setShowMoveable(false)
    const loading = loadTemplate(item)
    // Somebody who once said never to ask is not asked. An empty page has
    // nothing to lose, so it just takes the template.
    if (pageHasContent() && !localStorage.getItem('hide_replace_prompt')) {
      setAsking({ item, loading })
      return
    }
    await finish(item, loading, 'replace')
  }

  async function finish(item: IGetTempListData, loading: Promise<LoadedTemplate | null>, mode: TemplateMode) {
    const template = await loading
    if (!template) {
      message({ message: 'That template could not be opened. Try again.', type: 'error' })
      return
    }
    if (mode === 'add' && !roomFor(template.pages.length)) {
      message({ message: `A design can have up to ${MAX_PAGES} pages.`, type: 'warning' })
      return
    }
    // A design of one page that is being replaced is, in effect, a new design,
    // so it takes the template's name. Replacing one page of a deck, or adding
    // one, leaves the deck's name alone.
    const renames = mode === 'replace' && widgetState.dLayouts.length === 1
    managerEdit(false)
    if (!applyTemplate(template, mode)) return
    setTempId(item.id)
    setTimeout(() => {
      setZoomScreenChange()
    }, 300)
    if (renames) window.dispatchEvent(new CustomEvent('design-title', { detail: item.title || '' }))
    selectWidget({ uuid: '-1' })
  }

  function answer(mode: TemplateMode | null) {
    const pending = asking
    setAsking(null)
    if (pending && mode) void finish(pending.item, pending.loading, mode)
  }

  function setTempId(tempId: number | string) {
    const { id } = readQuery()
    replaceQuery({ tempid: String(tempId), id })
  }

  const openDesign = (item: IGetTempListData) => {
    // Standalone only: this is the editor's own page, and embedded there is
    // no such page to open.
    if (isEmbedded()) return
    window.open(`${window.location.protocol + '//' + window.location.host}/home?id=${item.id}`)
  }

  const deleteDesign = async ({ item }: { item: IGetTempListData }) => {
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
                <Card key={item.id} ratio={ratioOf(item)} name={item.title} meta={sizeOf(item)} onClick={() => openDesign(item)}>
                  <EditModel options={[{ name: 'Delete', fn: deleteDesign }] as any} data={{ item }}>
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
              <Card key={item.id} ratio={ratioOf(item)} name={item.title} meta={sizeOf(item)} onClick={() => selectItem(item)}>
                <Image className="img" src={item.cover} fit="cover" lazy />
              </Card>
            ))}
          </CardGrid>
          {loading ? <div className="panel-wrap__status">Loading</div> : null}
          {loadDone && list.length ? <div className="panel-wrap__status">That is everything</div> : null}
          {loadDone && !list.length ? <div className="panel-wrap__status">{emptyMessage()}</div> : null}
        </PanelSectionBlock>
      </PanelBody>
      <Dialog
        open={!!asking}
        onOpenChange={(open) => !open && answer(null)}
        title="Use this template?"
        width={420}
        className="temp-list-wrap__ask"
        footer={
          <>
            <Button onClick={() => answer(null)}>Cancel</Button>
            <Button onClick={() => answer('add')}>Add as new page</Button>
            <Button type="primary" onClick={() => answer('replace')}>
              Replace this page
            </Button>
          </>
        }
      >
        <p>This page already has things on it. Replacing it swaps them for the template. You can undo either choice.</p>
      </Dialog>
    </PanelWrap>
  )
}
