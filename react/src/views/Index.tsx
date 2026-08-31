import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import _config from '@/config'
import Moveable from '@/components/business/moveable/Moveable'
import RcMenu from '@/components/business/right-click-menu/RcMenu'
import DesignBoard from '@/components/modules/layout/designBoard/DesignBoard'
import ZoomControl, { type ZoomControlHandle } from '@/components/modules/layout/zoomControl/ZoomControl'
import LineGuides from '@/components/modules/layout/LineGuides'
import MultipleBoards from '@/components/modules/layout/multipleBoards/MultipleBoards'
import WidgetPanel, { type WidgetPanelHandle } from '@/components/modules/panel/WidgetPanel'
import StylePanel from '@/components/modules/panel/StylePanel'
import DownloadProgress from '@/components/common/ProgressLoading/DownloadProgress'
import CreateDesign, { type CreateDesignHandle } from '@/components/business/create-design/CreateDesign'
import Tour, { type TourHandle } from './components/Tour'
import HeaderOptions, { type HeaderOptionsHandle } from './components/HeaderOptions'
import ExportMenu from './components/ExportMenu'
import Folder from './components/Folder'
import Helper from './components/Helper'
import Tooltip from '@/components/ui/Tooltip'
import useHistory from '@/common/hooks/history'
import { handleKeydowm, handleKeyup } from '@/mixins/shortcuts'
import { wGroupSetting } from '@/components/modules/widgets/wGroup/groupSetting'
import { canvasState, historyState } from '@/store/state'
import { initGroupJson } from '@/store/group'
import { handleHistory } from '@/store/history'
import { selectWidget } from '@/store/widget/select'
import { cx } from '@/utils/dom'
import './design.less'

export default function Index() {
  useHistory()

  const canvas = useSnapshot(canvasState)
  const history = useSnapshot(historyState)

  const [navStyle, setNavStyle] = useState<{ left: string }>({ left: '0px' })
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [downloadText, setDownloadText] = useState('')
  const [downloadMsg, setDownloadMsg] = useState<string | undefined>('')
  const [isContinue, setIsContinue] = useState(true)
  const [showLineGuides, setShowLineGuides] = useState(false)

  const optionsRef = useRef<HeaderOptionsHandle | null>(null)
  const zoomControlRef = useRef<ZoomControlHandle | null>(null)
  const widgetPanelRef = useRef<WidgetPanelHandle | null>(null)
  const createDesignRef = useRef<CreateDesignHandle | null>(null)
  const tourRef = useRef<TourHandle | null>(null)
  const step1Ref = useRef<HTMLDivElement | null>(null)
  const step2Ref = useRef<HTMLDivElement | null>(null)
  const step3Ref = useRef<HTMLDivElement | null>(null)
  const step4Ref = useRef<HTMLDivElement | null>(null)

  const undoable = history.dHistoryParams.stackPointer >= 0
  const redoable = !(history.dHistoryParams.stackPointer === history.dHistoryStack.changes.length - 1)

  useEffect(() => {
    const beforeUnload = function (e: BeforeUnloadEvent): any {
      if (historyState.dHistoryStack.changes.length > 0) {
        const confirmationMessage = 'Your changes are not saved automatically.'
        e.returnValue = confirmationMessage
        return confirmationMessage
      }
      return false
    }
    if (!_config.isDev) window.addEventListener('beforeunload', beforeUnload)
    return () => {
      if (!_config.isDev) window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [])

  useEffect(() => {
    initGroupJson(JSON.stringify(wGroupSetting))

    const fixTopBarScroll = () => {
      const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
      setNavStyle({ left: `-${scrollLeft}px` })
    }
    window.addEventListener('scroll', fixTopBarScroll)

    const instanceFn = {
      save: () => optionsRef.current?.save(),
      zoomAdd: () => zoomControlRef.current?.add(),
      zoomSub: () => zoomControlRef.current?.sub(),
    }
    const onKeyDown = handleKeydowm(instanceFn)
    const onKeyUp = handleKeyup()
    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)

    optionsRef.current?.load(() => {
      selectWidget({ uuid: '-1' })
    })

    return () => {
      window.removeEventListener('scroll', fixTopBarScroll)
      document.removeEventListener('keydown', onKeyDown, false)
      document.removeEventListener('keyup', onKeyUp, false)
      document.oncontextmenu = null
    }
  }, [])

  function jump2home() {
    window.location.href = _config.HOME_URL
  }

  function downloadCancel() {
    setDownloadPercent(0)
    setIsContinue(false)
  }

  function optionsChange({
    downloadPercent: percent,
    downloadText: text,
    downloadMsg: msg,
  }: {
    downloadPercent: number
    downloadText: string
    downloadMsg?: string
  }) {
    setDownloadPercent(percent)
    setDownloadText(text)
    setDownloadMsg(msg)
  }

  function getDesignTitle(): string {
    return optionsRef.current?.getTitle() || 'Untitled design'
  }

  const fns: Record<string, (params?: any) => void> = {
    openTour: () => tourRef.current?.open(),
    save: () => optionsRef.current?.save(),
    download: () => optionsRef.current?.download(),
    changeLineGuides: () => setShowLineGuides((prev) => !prev),
    newDesign: () => createDesignRef.current?.open(),
  }

  const dealWith = (fnName: string, params?: any) => {
    fns[fnName]?.(params)
  }

  const shelterWidth = Math.floor((canvas.dPage.width * canvas.dZoom) / 100) + 'px'
  const shelterHeight = Math.floor((canvas.dPage.height * canvas.dZoom) / 100) + 'px'

  return (
    <div id="page-design-index" className="page-design-bg-color">
      <div style={navStyle} className="top-nav">
        <div className="top-nav-wrap">
          <div className="top-left">
            <div className="name" onClick={jump2home}>
              {_config.APP_NAME}
            </div>
            <Folder onSelect={dealWith}>
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
                <div className={cx('operation-item', { disable: !undoable })} onClick={() => (undoable ? handleHistory('undo') : undefined)}>
                  <i className="iconfont icon-undo" />
                </div>
              </Tooltip>
              <Tooltip content="Redo" placement="bottom" showAfter={400}>
                <div className={cx('operation-item', { disable: !redoable })} onClick={() => (redoable ? handleHistory('redo') : undefined)}>
                  <i className="iconfont icon-redo" />
                </div>
              </Tooltip>
            </div>
          </div>
          <HeaderOptions ref={optionsRef} isContinue={isContinue} onContinueChange={setIsContinue} onChange={optionsChange}>
            <div ref={step4Ref}>
              <ExportMenu getTitle={getDesignTitle} onSelect={dealWith} onProgress={optionsChange} />
            </div>
          </HeaderOptions>
        </div>
      </div>
      <div className="page-design-index-wrap">
        <div ref={step2Ref} style={{ display: 'contents' }}>
          <WidgetPanel ref={widgetPanelRef} />
        </div>
        <DesignBoard
          className="page-design-wrap"
          pageDesignCanvasId="page-design-canvas"
          bottom={<MultipleBoards />}
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
      <DownloadProgress
        percent={downloadPercent}
        text={downloadText}
        msg={downloadMsg}
        cancelText="Cancel"
        onCancel={downloadCancel}
      />
      <Tour ref={tourRef} steps={[step1Ref, step2Ref, step3Ref, step4Ref]} />
      <CreateDesign ref={createDesignRef} />
    </div>
  )
}
