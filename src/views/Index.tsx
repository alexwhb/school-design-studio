import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import _config from '@/config'
import Moveable from '@/components/business/moveable/Moveable'
import RcMenu from '@/components/business/right-click-menu/RcMenu'
import DrawShape from '@/components/business/draw-shape/DrawShape'
import DrawLine from '@/components/business/draw-shape/DrawLine'
import DrawText from '@/components/business/draw-shape/DrawText'
import DrawPen from '@/components/business/draw-shape/DrawPen'
import { useFileDrop } from '@/components/business/file-drop/useFileDrop'
import DesignBoard from '@/components/modules/layout/designBoard/DesignBoard'
import ZoomControl, { type ZoomControlHandle } from '@/components/modules/layout/zoomControl/ZoomControl'
import LineGuides from '@/components/modules/layout/LineGuides'
import MultipleBoards from '@/components/modules/layout/multipleBoards/MultipleBoards'
import WidgetPanel from '@/components/modules/panel/WidgetPanel'
import StylePanel from '@/components/modules/panel/StylePanel'
import DownloadProgress from '@/components/common/ProgressLoading/DownloadProgress'
import CreateDesign, { type CreateDesignHandle } from '@/components/business/create-design/CreateDesign'
import ResizeDesign, { type ResizeDesignHandle } from '@/components/business/resize-design/ResizeDesign'
import FindReplace, { type FindReplaceHandle } from '@/components/business/find-replace/FindReplace'
import BulkDocuments, { type BulkDocumentsHandle } from '@/components/business/bulk-documents/BulkDocuments'
import PresentMode, { type PresentModeHandle } from '@/components/business/presentation/PresentMode'
import NotesDrawer from '@/components/business/notes/NotesDrawer'
import Tour, { type TourHandle } from './components/Tour'
import HeaderOptions, { type HeaderOptionsHandle } from './components/HeaderOptions'
import ExportMenu from './components/ExportMenu'
import Folder from './components/Folder'
import Helper from './components/Helper'
import Tooltip from '@/components/ui/Tooltip'
import Button from '@/components/ui/Button'
import { RedoIcon, UndoIcon } from '@/components/ui/icons'
import useHistory, { recordHistory } from '@/common/hooks/history'
import useAutosave from '@/common/hooks/autosave'
import useHostDocument, { readDocument } from '@/common/hooks/hostDocument'
import { useHostApi, type DesignStudioHandle } from '@/common/hooks/hostApi'
import { buildPdf } from '@/common/methods/export/exportPdf'
import { buildPptx } from '@/common/methods/export/exportPptx'
import { withPageRenderer } from '@/common/methods/export/renderPage'
import { dataUrlToBlob } from '@/common/methods/export/utils'
import { applyOps as applyDocumentOps } from '@/compose/ops'
import { exportQuality } from '@/common/methods/export/quality'
import { isPresentable } from '@/store/documentKind'
import { showPage } from '@/store/widget/pages'
import { handleKeydowm, handleKeyup } from '@/mixins/shortcuts'
import { watchOverlayEscape } from '@/mixins/overlayEscape'
import { wGroupSetting } from '@/components/modules/widgets/wGroup/groupSetting'
import { canvasState, historyState, widgetState } from '@/store/state'
import { panelState } from '@/store/panels'
import { updateScreen } from '@/store/canvas'
import { setUpdateRect, setZoomScreenChange } from '@/store/force'
import { readQuery } from '@/common/hooks/useRouteQuery'
import { initGroupJson } from '@/store/group'
import { toggleNotes } from '@/store/notes'
import { handleHistory } from '@/store/history'
import { selectWidget } from '@/store/widget/select'
import { cx } from '@/utils/dom'
import './design.less'

export default function Index() {
  useHistory()
  const host = useHostApi()
  const presentable = isPresentable()

  const canvas = useSnapshot(canvasState)
  const history = useSnapshot(historyState)
  const panels = useSnapshot(panelState)

  const [navStyle, setNavStyle] = useState<{ left: string }>({ left: '0px' })
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [downloadText, setDownloadText] = useState('')
  const [downloadMsg, setDownloadMsg] = useState<string | undefined>('')
  const [isContinue, setIsContinue] = useState(true)
  const [showLineGuides, setShowLineGuides] = useState(false)

  const optionsRef = useRef<HeaderOptionsHandle | null>(null)
  const zoomControlRef = useRef<ZoomControlHandle | null>(null)
  const createDesignRef = useRef<CreateDesignHandle | null>(null)
  const resizeDesignRef = useRef<ResizeDesignHandle | null>(null)
  const findReplaceRef = useRef<FindReplaceHandle | null>(null)
  const bulkDocumentsRef = useRef<BulkDocumentsHandle | null>(null)
  const presentRef = useRef<PresentModeHandle | null>(null)
  const loaded = useRef(false)
  const rootRef = useRef<HTMLDivElement | null>(null)
  const tourRef = useRef<TourHandle | null>(null)
  const step1Ref = useRef<HTMLDivElement | null>(null)
  const step2Ref = useRef<HTMLDivElement | null>(null)
  const step3Ref = useRef<HTMLDivElement | null>(null)
  const step4Ref = useRef<HTMLDivElement | null>(null)

  const autosave = useAutosave({
    getTitle: () => optionsRef.current?.getTitle() || '',
    setTitle: (title: string) => optionsRef.current?.setTitle(title),
  })

  // Two ways of keeping a design, and only ever one of them running. The host's
  // takes over the moment it hands a document in; without one, the browser's.
  const hostDocument = useHostDocument({
    getTitle: () => optionsRef.current?.getTitle() || '',
    onChange: host.onDocumentChange,
    onSave: host.onSave,
  })
  const keeper = host.hostsDocument ? hostDocument : autosave
  const saveNow = () => void keeper.saveNow()

  // Everything the host can ask the editor to do. Held on the ref the component
  // handed down rather than passed up through props, because the screen is
  // chosen by `mode` and the other two screens have no editor to drive.
  useImperativeHandle(
    host.handleRef,
    (): DesignStudioHandle => ({
      getDocument: () => readDocument(optionsRef.current?.getTitle() || ''),
      setDocument: (doc, opts) => {
        optionsRef.current?.showDocument(doc)
        // One undo takes the whole swap back, unless the host says this is the
        // new starting point — which is what it means to open a different
        // design rather than to change the one that is open.
        if (opts?.resetHistory !== false) hostDocument.rebase()
        setZoomScreenChange()
      },
      applyOps: (ops) => {
        const current = readDocument(optionsRef.current?.getTitle() || '')
        const { doc, rejected } = applyDocumentOps(current, ops)
        // Through recordHistory so that a run of ops from the host's own panel
        // is one press of Ctrl+Z, not one per operation.
        if (rejected.length < ops.length) recordHistory(() => optionsRef.current?.showDocument(doc))
        return { applied: ops.length - rejected.length, rejected }
      },
      exportPdf: () =>
        withPageRenderer((renderer) =>
          buildPdf(widgetState.dLayouts as any, {
            title: getDesignTitle(),
            scale: exportQuality.scale,
            renderPage: renderer.renderPage,
          }),
        ),
      exportPptx: () =>
        withPageRenderer((renderer) =>
          buildPptx(widgetState.dLayouts as any, {
            title: getDesignTitle(),
            mode: 'editable',
            renderPage: renderer.renderPage,
            renderWidget: renderer.renderWidget,
          }),
        ),
      exportPng: async (pageIndex, opts) => {
        if (!widgetState.dLayouts[pageIndex]) throw new Error(`There is no page ${pageIndex} to export.`)
        const dataUrl = await withPageRenderer((renderer) => renderer.renderPage(pageIndex, opts?.scale ?? 1))
        if (!dataUrl) throw new Error(`Page ${pageIndex + 1} could not be drawn.`)
        return dataUrlToBlob(dataUrl)
      },
      goToPage: (index) => showPage(index),
      isDirty: () => keeper.isDirty(),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [host.handleRef, keeper],
  )

  const presentShortcut = useMemo(() => (navigator.userAgent.includes('Mac') ? '\u2318 + Enter' : 'Ctrl + Enter'), [])

  const undoable = history.dHistoryParams.stackPointer >= 0
  const redoable = !(history.dHistoryParams.stackPointer === history.dHistoryStack.changes.length - 1)

  // Hiding a panel widens the workspace, and the board only knows how wide it
  // is because something measured it. Nothing does that on its own here — the
  // window has not resized — so this is the same measurement the resize
  // listener takes, which is what puts the page back in the middle and lets
  // "Fit to screen" work out the new zoom. Neither panel animates its width,
  // so by the time this runs the columns are already where they will be.
  useLayoutEffect(() => {
    // The zoom pill is pinned to the right edge of the board, which moves with
    // the panel. It follows a custom property rather than the panel's width
    // token so that it lands on the strip's edge when the panel is away.
    const root = rootRef.current
    const right = root?.querySelector('#style-panel, .style-panel-strip') as HTMLElement | null
    root?.style.setProperty('--ds-right-panel-w', `${right?.offsetWidth ?? 0}px`)

    // #main rather than #page-design, which is the board's scrolling layer and
    // carries a min-width of the page at its current zoom: measuring that gives
    // back the space the page is already taking, so the workspace could grow
    // when a panel went but never shrink when it came back.
    const board = document.getElementById('main')
    if (!board) return
    updateScreen({ width: board.offsetWidth, height: board.offsetHeight })
    // The selection box is positioned against the page, so it has to be asked
    // for its rectangle again or it stays where the widget used to be.
    setUpdateRect()
  }, [panels.leftOpen, panels.rightOpen])

  useEffect(() => {
    const beforeUnload = function (e: BeforeUnloadEvent): any {
      if (keeper.isDirty()) {
        const confirmationMessage = 'Your most recent changes have not been saved yet.'
        e.returnValue = confirmationMessage
        return confirmationMessage
      }
      return false
    }
    if (!_config.isDev) window.addEventListener('beforeunload', beforeUnload)
    return () => {
      if (!_config.isDev) window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [keeper])

  useEffect(() => {
    initGroupJson(JSON.stringify(wGroupSetting))

    const fixTopBarScroll = () => {
      const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
      setNavStyle({ left: `-${scrollLeft}px` })
    }
    window.addEventListener('scroll', fixTopBarScroll)

    const instanceFn = {
      save: saveNow,
      zoomAdd: () => zoomControlRef.current?.add(),
      zoomSub: () => zoomControlRef.current?.sub(),
      present: () => presentRef.current?.open(),
      findReplace: () => findReplaceRef.current?.open(),
    }
    const onKeyDown = handleKeydowm(instanceFn)
    const onKeyUp = handleKeyup()
    const unwatchOverlayEscape = watchOverlayEscape()
    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)

    // Loading a design mutates the store and may ask a question, so it happens
    // once — StrictMode runs effects twice in development.
    if (!loaded.current) {
      loaded.current = true
      optionsRef.current?.load(async () => {
        selectWidget({ uuid: '-1' })
        // A host that keeps the design is never asked about a draft: the draft
        // would be somebody else's work, and there is no database to read it
        // out of anyway.
        if (host.hostsDocument) {
          hostDocument.start()
          return
        }
        // Offer the last design back, but only on a blank canvas: arriving with
        // an id or a template id is a request for that design, and asking about
        // a different one would be an interruption. Watching starts either way.
        const { id, tempid } = readQuery()
        await autosave.restoreThenWatch(!id && !tempid)
      })
    }

    return () => {
      window.removeEventListener('scroll', fixTopBarScroll)
      unwatchOverlayEscape()
      document.removeEventListener('keydown', onKeyDown, false)
      document.removeEventListener('keyup', onKeyUp, false)
      document.oncontextmenu = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keeper])

  function jump2home() {
    window.location.href = _config.HOME_URL
  }

  function downloadCancel() {
    setDownloadPercent(0)
    setIsContinue(false)
  }

  function optionsChange({ downloadPercent: percent, downloadText: text, downloadMsg: msg }: { downloadPercent: number; downloadText: string; downloadMsg?: string }) {
    setDownloadPercent(percent)
    setDownloadText(text)
    setDownloadMsg(msg)
  }

  function getDesignTitle(): string {
    return optionsRef.current?.getTitle() || 'Untitled design'
  }

  const fns: Record<string, (params?: any) => void> = {
    openTour: () => tourRef.current?.open(),
    save: saveNow,
    // The export menu passes the chosen quality; the File menu has no such
    // choice and leaves it to the default.
    download: (scale?: number) => optionsRef.current?.download(scale),
    changeLineGuides: () => setShowLineGuides((prev) => !prev),
    newDesign: () => createDesignRef.current?.open(),
    resizeDesign: () => resizeDesignRef.current?.open(),
    findReplace: () => findReplaceRef.current?.open(),
    bulkDocuments: () => bulkDocumentsRef.current?.open(),
    toggleNotes: () => toggleNotes(),
  }

  const dealWith = (fnName: string, params?: any) => {
    fns[fnName]?.(params)
  }

  // A picture dragged in from the desktop. On the screen's own root, so it
  // counts anywhere in the editor rather than only over the page — and so an
  // unhandled drop can never navigate the tab away from unsaved work.
  const { dropHandlers, dropOverlay } = useFileDrop()

  const shelterWidth = Math.floor((canvas.dPage.width * canvas.dZoom) / 100) + 'px'
  const shelterHeight = Math.floor((canvas.dPage.height * canvas.dZoom) / 100) + 'px'

  return (
    <div id="page-design-index" ref={rootRef} className="page-design-bg-color" {...dropHandlers}>
      <div style={navStyle} className="top-nav">
        <div className="top-nav-wrap">
          <div className="top-left">
            {/* A host with its own Save has its own chrome above this bar, and
                a second app name under it reads as two apps. */}
            {host.onSave ? null : (
              <div className="name" onClick={jump2home}>
                {_config.APP_NAME}
              </div>
            )}
            <Folder onSelect={dealWith} showGuides={showLineGuides}>
              <div className="operation-item" ref={step1Ref}>
                <i className="icon sd-wenjian" /> <span className="text">File</span>
              </div>
            </Folder>
            <Helper onSelect={dealWith}>
              <div className="operation-item">
                <i className="icon sd-bangzhu" /> <span className="text">Help</span>
              </div>
            </Helper>
            <div className="top-nav-divider" />
            <div className="operation">
              <Tooltip content="Undo" placement="bottom" showAfter={400}>
                <div className={cx('operation-item', 'operation-item--icon', { disable: !undoable })} onClick={() => (undoable ? handleHistory('undo') : undefined)}>
                  <UndoIcon className="icon-undo" width={16} height={16} />
                </div>
              </Tooltip>
              <Tooltip content="Redo" placement="bottom" showAfter={400}>
                <div className={cx('operation-item', 'operation-item--icon', { disable: !redoable })} onClick={() => (redoable ? handleHistory('redo') : undefined)}>
                  <RedoIcon className="icon-redo" width={16} height={16} />
                </div>
              </Tooltip>
            </div>
          </div>
          <HeaderOptions ref={optionsRef} onHostSave={host.onSave ? () => hostDocument.saveNow() : undefined} isContinue={isContinue} onContinueChange={setIsContinue} onChange={optionsChange} onTitleChange={autosave.schedule}>
            {/* A poster is read, not presented, and it has nobody to say
                speaker notes to. */}
            {presentable ? (
              <Tooltip content={`Show these pages full screen (${presentShortcut})`} placement="bottom" showAfter={400}>
                <Button className="present-btn" onClick={() => presentRef.current?.open()}>
                  <svg className="present-btn__icon" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5.4v13.2L18.4 12z" />
                  </svg>
                  Present
                </Button>
              </Tooltip>
            ) : null}
            <div ref={step4Ref}>
              <ExportMenu getTitle={getDesignTitle} onSelect={dealWith} onProgress={optionsChange} />
            </div>
          </HeaderOptions>
        </div>
      </div>
      <div className="page-design-index-wrap">
        <div ref={step2Ref} style={{ display: 'contents' }}>
          <WidgetPanel />
        </div>
        <DesignBoard
          className="page-design-wrap"
          pageDesignCanvasId="page-design-canvas"
          bottom={
            <>
              <MultipleBoards />
              {presentable ? <NotesDrawer /> : null}
            </>
          }
        >
          <div className="shelter" style={{ width: shelterWidth, height: shelterHeight }} />
          <div className="shelter-bg transparent-bg" style={{ width: shelterWidth, height: shelterHeight }} />
        </DesignBoard>
        <div ref={step3Ref} style={{ display: 'contents' }}>
          <StylePanel />
        </div>
      </div>
      <LineGuides show={showLineGuides} />
      <ZoomControl ref={zoomControlRef} />
      <RcMenu />
      <Moveable />
      <DrawShape />
      <DrawPen />
      <DrawLine />
      <DrawText />
      <DownloadProgress percent={downloadPercent} text={downloadText} msg={downloadMsg} cancelText="Cancel" onCancel={downloadCancel} />
      <Tour ref={tourRef} steps={[step1Ref, step2Ref, step3Ref, step4Ref]} />
      <CreateDesign ref={createDesignRef} />
      <ResizeDesign ref={resizeDesignRef} />
      <FindReplace ref={findReplaceRef} />
      <BulkDocuments ref={bulkDocumentsRef} getTitle={getDesignTitle} />
      {presentable ? <PresentMode ref={presentRef} /> : null}
      {dropOverlay}
    </div>
  )
}
