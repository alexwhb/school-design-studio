import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import Sortable from 'sortablejs'
import { canvasState, widgetState } from '@/store/state'
import { setBottomHeight } from '@/store/canvas'
import { setZoomScreenChange } from '@/store/force'
import { MAX_PAGES, addPage, duplicatePage, movePage, removePage, renamePage, showPage } from '@/store/widget/pages'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import Tooltip from '@/components/ui/Tooltip'
import message from '@/components/ui/message'
import confirm, { promptText } from '@/common/methods/confirm'
import { pageBackgroundStyle } from '@/common/methods/pageBackground'
import { staticWidgetComponents } from '../../widgets/registry'
import { NOTES_DRAWER_HEIGHT, notesState } from '@/store/notes'
import NotesToggle from '@/components/business/notes/NotesToggle'
import PageTransitionGlyph from './PageTransitionGlyph'
import { cx } from '@/utils/dom'
import type { TdLayout, TdWidgetData, TPageState } from '@/store/types'
import './multipleBoards.less'

function getTransform(global: TPageState) {
  const { width, height } = global
  const isVertical = height > width
  const edge = isVertical ? Math.max(width, height) : Math.min(width, height)
  const s = 72 / edge
  const left = isVertical ? ((72 - width * s) / 2 - 1) / s : 0
  return `scale(${s}) translateX(${left}px)`
}

function getPW(global: TPageState) {
  const { width, height } = global
  const isVertical = height > width
  const s = 72 / Math.min(width, height)
  return isVertical ? 72 : width * s
}

/**
 * A stable key per page, for React and for the drag list.
 *
 * Pages have no id of their own — `global.uuid` is '-1' on every one of them,
 * because that is how the rest of the editor spells "the page itself" — and
 * keying by array index remounts every thumbnail after a reorder. Keys are held
 * against the store's own page object, which outlives any number of edits to
 * what is on it, so a page keeps its key while it moves and a deleted one takes
 * its key with it.
 */
const keys = new WeakMap<object, string>()
let nextKey = 0
function pageKey(position: number): string {
  const page = widgetState.dLayouts[position] as unknown as object
  if (!page) return `page-missing-${position}`
  let key = keys.get(page)
  if (!key) {
    key = `page-${++nextKey}`
    keys.set(page, key)
  }
  return key
}

function pageLabel(page: TdLayout | undefined, position: number) {
  const name = page?.global?.name
  return name && name !== 'New page' ? name : `Page ${position + 1}`
}

function StaticLayers({ layers, global }: { layers: readonly TdWidgetData[]; global: TPageState }) {
  const top = useMemo(() => layers.filter((item) => item.parent === global.uuid && !item.hidden), [layers, global.uuid])
  return (
    <>
      {top.map((layer) => {
        const Comp = staticWidgetComponents[layer.type]
        if (!Comp) return null
        return (
          <Comp key={layer.uuid} params={layer as TdWidgetData} parent={global}>
            {layer.isContainer
              ? layers
                  .filter((item) => item.parent === layer.uuid && !item.hidden)
                  .map((widget) => {
                    const ChildComp = staticWidgetComponents[widget.type]
                    if (!ChildComp) return null
                    return <ChildComp key={widget.uuid} params={widget as TdWidgetData} parent={layer as TdWidgetData} />
                  })
              : null}
          </Comp>
        )
      })}
    </>
  )
}

type PageProps = {
  layout: TdLayout
  index: number
  isCurrent: boolean
  isFirst: boolean
  isLast: boolean
  onCommand: (command: string, index: number) => void
}

const Page = memo(function Page({ layout, index, isCurrent, isFirst, isLast, onCommand }: PageProps) {
  const global = layout.global as TPageState
  return (
    <div className={cx('page', { 'is-current': isCurrent })} onClick={() => showPage(index)}>
      <div style={{ width: getPW(global) + 'px' }} className={cx('item-box', isCurrent ? 'item-select' : 'item-default')}>
        <div
          className="mini-poster"
          style={{
            transform: getTransform(global),
            width: global.width + 'px',
            height: global.height + 'px',
            ...pageBackgroundStyle(global),
          }}
        >
          <StaticLayers layers={layout.layers} global={global} />
        </div>
        <div className="item-idx">{index + 1}</div>
        <PageTransitionGlyph page={global} />
        <Dropdown
          placement="top-end"
          menu={
            <>
              <DropdownItem onSelect={() => onCommand('duplicate', index)}>Duplicate</DropdownItem>
              <DropdownItem onSelect={() => onCommand('rename', index)}>Rename…</DropdownItem>
              <DropdownItem divided disabled={isFirst} onSelect={() => onCommand('left', index)}>
                Move left
              </DropdownItem>
              <DropdownItem disabled={isLast} onSelect={() => onCommand('right', index)}>
                Move right
              </DropdownItem>
              <DropdownItem divided onSelect={() => onCommand('delete', index)}>
                {isFirst && isLast ? 'Empty this page' : 'Delete'}
              </DropdownItem>
            </>
          }
        >
          <i className="iconfont icon-more page-menu" title="Page options" onClick={(e) => e.stopPropagation()} />
        </Dropdown>
      </div>
      <span className="page__name" title={pageLabel(layout, index)}>
        {pageLabel(layout, index)}
      </span>
    </div>
  )
})

export default function MultipleBoards() {
  const canvas = useSnapshot(canvasState)
  const dLayouts = useSnapshot(widgetState).dLayouts as readonly TdLayout[]
  // The notes drawer sits along the very bottom, so the strip stands on top of
  // it rather than under it.
  const notesOpen = useSnapshot(notesState).open
  const notesHeight = notesOpen ? NOTES_DRAWER_HEIGHT : 0
  const [isFold, setIsFold] = useState(true)
  const [st, setSt] = useState(0)
  const [sl, setSl] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)
  const pagesRef = useRef<HTMLDivElement | null>(null)
  const mainElRef = useRef<HTMLElement | null>(null)
  const index = canvas.dCurrentPage
  const atLimit = dLayouts.length >= MAX_PAGES

  /**
   * "Page 2/5" while pages are unnamed, and the name plus its position once one
   * has been given — "Welcome · 2/5" — because a bare "Welcome/5" reads like a
   * fraction.
   */
  const foldLabel = useMemo(() => {
    const total = dLayouts.length
    const label = pageLabel(dLayouts[index] as TdLayout, index)
    return label.startsWith('Page ') ? `${label}/${total}` : `${label} · ${index + 1}/${total}`
  }, [dLayouts, index])

  useEffect(() => {
    const mainEl = document.getElementById('main')
    mainElRef.current = mainEl
    if (!mainEl) return
    const onScroll = () => {
      setSt(mainEl.scrollTop)
      setSl(mainEl.scrollLeft)
    }
    mainEl.addEventListener('scroll', onScroll)
    return () => mainEl.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      list.scrollLeft += event.deltaY
    }
    list.addEventListener('wheel', onWheel)
    return () => list.removeEventListener('wheel', onWheel)
  }, [isFold])

  useEffect(() => {
    if (mainElRef.current) mainElRef.current.scrollTop = 0
  }, [canvas.dZoom])

  // How much of the well the strip and the drawer have taken between them, so
  // the zoom control can fit the page into what is left.
  useEffect(() => {
    setBottomHeight((isFold ? 0 : 112) + notesHeight)
  }, [isFold, notesHeight])

  const lastFold = useRef(isFold)
  useEffect(() => {
    if (lastFold.current === isFold) return
    lastFold.current = isFold
    const timer = setTimeout(() => {
      setZoomScreenChange()
    }, 300)
    return () => clearTimeout(timer)
  }, [isFold])

  /**
   * Reordering by drag. Sortable moves the DOM node itself, so the node it
   * moved is put back before the store is told — React owns that list and
   * would otherwise be reconciling against a tree it did not write.
   */
  useEffect(() => {
    const el = pagesRef.current
    if (!el) return
    const sortable = Sortable.create(el, {
      animation: 150,
      ghostClass: 'is-dragging',
      onEnd: (evt: any) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const parent = evt.from as HTMLElement
        if (oldIndex < newIndex) parent.insertBefore(evt.item, parent.children[oldIndex])
        else parent.insertBefore(evt.item, parent.children[oldIndex + 1])

        // Keep looking at the page you were looking at.
        const current = canvasState.dCurrentPage
        let next = current
        if (current === oldIndex) next = newIndex
        else if (oldIndex < current && newIndex >= current) next = current - 1
        else if (oldIndex > current && newIndex <= current) next = current + 1
        movePage(oldIndex, newIndex)
        showPage(next)
      },
    })
    return () => sortable.destroy()
  }, [isFold])

  function add() {
    if (atLimit) {
      message({ message: `A design can have up to ${MAX_PAGES} pages.`, type: 'warning' })
      return
    }
    addPage()
  }

  const runPageCommand = useCallback(async (command: string, position: number) => {
    switch (command) {
      case 'duplicate':
        if (widgetState.dLayouts.length >= MAX_PAGES) {
          message({ message: `A design can have up to ${MAX_PAGES} pages.`, type: 'warning' })
          return
        }
        duplicatePage(position)
        return
      case 'rename': {
        const page = widgetState.dLayouts[position]
        const name = await promptText('Rename page', 'What should this page be called?', {
          confirmButtonText: 'Rename',
          inputValue: page?.global?.name === 'New page' ? '' : page?.global?.name || '',
          inputPlaceholder: `Page ${position + 1}`,
        })
        if (name !== null) renamePage(position, name)
        return
      }
      case 'left':
        return movePage(position, position - 1)
      case 'right':
        return movePage(position, position + 1)
      case 'delete': {
        const onlyPage = widgetState.dLayouts.length === 1
        // Deleting is the one page action that cannot be undone by doing it
        // again, so it is the one that asks — but only when there is artwork to
        // lose.
        if (widgetState.dLayouts[position]?.layers.length) {
          const ok = await confirm(
            onlyPage ? 'Empty this page?' : 'Delete this page?',
            onlyPage
              ? 'Everything on this page will be removed.'
              : `“${pageLabel(widgetState.dLayouts[position], position)}” and everything on it will be removed.`,
            'warning',
            { confirmButtonText: onlyPage ? 'Empty it' : 'Delete', cancelButtonText: 'Keep it' },
          )
          if (!ok) return
        }
        removePage(position)
        if (onlyPage) message('The page is now empty')
      }
    }
  }, [])

  return (
    <div
      style={{ position: 'absolute', bottom: notesHeight - st + 'px', left: sl + 'px' }}
      className={cx('artboards', isFold ? 'fold' : 'unfold')}
    >
      <div ref={listRef} className="wrap">
        {isFold ? (
          <>
            <div
              className="btn"
              title={foldLabel}
              style={{ display: dLayouts.length > 0 ? undefined : 'none' }}
              onClick={() => setIsFold(!isFold)}
            >
              <span className="btn__label">{foldLabel}</span> <i className="icon sd-zhankai" />
            </div>
            <NotesToggle />
          </>
        ) : (
          <div className="list">
            <span onClick={() => setIsFold(!isFold)} className="icon-btn">
              <i className="icon sd-zhankai" />
            </span>
            <NotesToggle />
            <div ref={pagesRef} className="pages">
              {dLayouts.map((l, li) => (
                <Page
                  key={pageKey(li)}
                  layout={l as TdLayout}
                  index={li}
                  isCurrent={index === li}
                  isFirst={li === 0}
                  isLast={li === dLayouts.length - 1}
                  onCommand={runPageCommand}
                />
              ))}
            </div>
            <Tooltip content={atLimit ? `A design can have ${MAX_PAGES} pages` : 'Add a page'} placement="top" showAfter={400}>
              <div className={cx('item-add', { 'is-disabled': atLimit })} onClick={add}>
                <i className="iconfont icon-add" />
              </div>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}
