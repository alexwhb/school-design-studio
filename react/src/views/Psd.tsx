import { useEffect, useRef, useState } from 'react'
import RcMenu from '@/components/business/right-click-menu/RcMenu'
import Moveable from '@/components/business/moveable/Moveable'
import DesignBoard from '@/components/modules/layout/designBoard/DesignBoard'
import ZoomControl, { type ZoomControlHandle } from '@/components/modules/layout/zoomControl/ZoomControl'
import StylePanel from '@/components/modules/panel/StylePanel'
import ProgressLoading from '@/components/common/ProgressLoading/ProgressLoading'
import Uploader from '@/components/common/Uploader/Uploader'
import Button from '@/components/ui/Button'
import useLoading from '@/common/methods/loading'
import { readQuery } from '@/common/hooks/useRouteQuery'
import { handleKeydowm, handleKeyup } from '@/mixins/shortcuts'
import WebWorker from '@/utils/plugins/webWorker'
import psdWorker from '../utils/plugins/worker/loadPSD.worker?worker'
import { createBase64 } from '@/utils/plugins/psd'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import { wGroupSetting } from '@/components/modules/widgets/wGroup/groupSetting'
import { canvasState, widgetState } from '@/store/state'
import { setDPage } from '@/store/canvas'
import { setShowMoveable } from '@/store/control'
import { initGroupJson } from '@/store/group'
import { addWidget, selectWidget, setDWidgets } from '@/store/widget'
import { useSnapshot } from 'valtio'
import UploadTemplate, { type TEmitChangeData } from './components/UploadTemplate'
import './psd.less'

const types: Record<string, any> = {
  text: wTextSetting,
  image: wImageSetting,
}

export default function Psd() {
  const canvas = useSnapshot(canvasState)
  // Starts true so the zoom control mounts once and sizes the page, exactly as
  // the original does, then drops to false to show the drop zone.
  const [isDone, setIsDone] = useState(true)
  const [downloadPercent, setDownloadPercent] = useState(0)
  const [downloadText, setDownloadText] = useState('')
  const [downloadMsg, setDownloadMsg] = useState('')
  const [cancelText, setCancelText] = useState('')
  const zoomControlRef = useRef<ZoomControlHandle | null>(null)
  const worker = useRef<WebWorker | null>(null)
  const loading = useRef<ReturnType<typeof useLoading> | null>(null)

  useEffect(() => {
    initGroupJson(JSON.stringify(wGroupSetting))
    worker.current = new WebWorker(psdWorker)
    zoomControlRef.current?.screenChange()
    setIsDone(false)

    const instanceFn = { save: () => {}, zoomAdd: () => zoomControlRef.current?.add(), zoomSub: () => zoomControlRef.current?.sub() }
    const onKeyDown = handleKeydowm(instanceFn)
    const onKeyUp = handleKeyup()
    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)
    return () => {
      document.removeEventListener('keydown', onKeyDown, false)
      document.removeEventListener('keyup', onKeyUp, false)
      document.oncontextmenu = null
    }
  }, [])

  async function selectFile(file: File) {
    loading.current = useLoading()
    await loadPSD(file)
    loading.current.close()
    setIsDone(true)
  }

  async function loadPSD(file: File) {
    const { data }: any = await worker.current!.start(file)

    for (let i = 0; i < data.clouds.length; i++) {
      const x: any = data.clouds[i]
      const rawData = JSON.parse(JSON.stringify(types[x.type])) || {}
      delete x.type
      x.src && (x.imgUrl = createBase64(x.src, { width: x.width, height: x.height })) && delete x.src
      addWidget(Object.assign(rawData, x))
    }

    const { width, height, background: bg } = data
    setDPage(
      Object.assign(canvasState.dPage, {
        width,
        height,
        backgroundColor: bg.color,
        backgroundImage: createBase64(bg.image, { width, height }),
      }),
    )
    await loadDone()
  }

  async function loadDone() {
    await nextPaint()
    zoomControlRef.current?.screenChange()
    setTimeout(() => {
      selectWidget({ uuid: '-1' })
    }, 100)
  }

  async function clear() {
    setDWidgets([])
    setDPage(Object.assign(canvasState.dPage, { width: 1920, height: 1080, backgroundColor: '#ffffff', backgroundImage: '' }))
    setShowMoveable(false)
    await nextPaint()
    setIsDone(false)
  }

  function optionsChange({ downloadPercent: percent, downloadText: text, downloadMsg: msg = '', cancelText: cancel = '' }: TEmitChangeData) {
    typeof percent === 'number' && setDownloadPercent(percent)
    setDownloadText(text)
    setDownloadMsg(msg)
    setCancelText(cancel)
  }

  function cancel() {
    setDownloadPercent(100)
    const { id } = readQuery()
    window.open(`${window.location.protocol + '//' + window.location.host}/home?id=${id}`)
  }

  function jump2word() {
    window.open('https://kdocs.cn/l/clmBsIkhve8d')
  }

  const shelterWidth = (canvas.dPage.width * canvas.dZoom) / 100 + 'px'
  const shelterHeight = (canvas.dPage.height * canvas.dZoom) / 100 + 'px'

  return (
    <div id="page-design-index" className="ds-psd-view">
      <div className="top-nav">
        <div className="top-nav-wrap">
          <div className="top-left">
            <div className="name" style={{ fontSize: 15 }}>
              PSD import
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <Button plain type="primary" onClick={jump2word}>
              PSD guidelines
            </Button>
          </div>
          {isDone ? <Button onClick={clear}>Clear template</Button> : null}
          <div className="v-tips">
            <UploadTemplate isDone={isDone} onChange={optionsChange} />
          </div>
        </div>
      </div>

      <div className="page-design-index-wrap">
        <DesignBoard className="page-design-wrap" pageDesignCanvasId="page-design-canvas">
          {isDone ? (
            <div className="shelter" style={{ width: shelterWidth, height: shelterHeight }} />
          ) : (
            <Uploader hold drag accept=".psd" className="uploader" onLoad={selectFile}>
              <div className="uploader__box">
                <img
                  style={{ marginRight: '1rem' }}
                  src="https://cdn.dancf.com/design/svg/icon_psdimport.37e6f23e.svg"
                  alt="upload"
                />{' '}
                Drop a file here or choose one PSD 文件
              </div>
            </Uploader>
          )}
        </DesignBoard>
        <div style={{ display: isDone ? 'contents' : 'none' }}>
          <StylePanel />
        </div>
      </div>
      {isDone ? <ZoomControl ref={zoomControlRef} /> : null}
      <RcMenu />
      <Moveable />
      <ProgressLoading
        percent={downloadPercent}
        text={downloadText}
        cancelText={cancelText}
        msg={downloadMsg}
        onCancel={cancel}
        onDone={() => setDownloadPercent(0)}
      />
    </div>
  )
}

function nextPaint() {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}
