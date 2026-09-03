import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import _dl from '@/common/methods/download'
import { widgetState } from '@/store/state'
import { updatePageData } from '@/store/canvas'
import { selectWidget } from '@/store/widget/select'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import Tooltip from '@/components/ui/Tooltip'
import { DeleteIcon, DownloadIcon, PhotoIcon } from '@/components/ui/icons'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import ColorSelect, { type colorChangeData } from '@/components/modules/settings/ColorSelect'
import ToggleRow from '@/components/modules/settings/ToggleRow'
import ResizeDesign, { type ResizeDesignHandle } from '@/components/business/resize-design/ResizeDesign'
import BgImgListWrap from '@/components/modules/panel/wrap/BgImgListWrap'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { realSize } from '@/common/methods/pageSize'
import { DESIGN_DPI } from '@/common/methods/export/exportPdf'
import type { TBackgroundTransform } from '@/common/methods/pageBackground'
import type { TPageState } from '@/store/types'
import BackgroundCrop from './comps/BackgroundCrop'
import CanvasSection from './comps/CanvasSection'
import PageSizeFields from './comps/PageSizeFields'
import TransitionSection from './comps/TransitionSection'
import './pageStyle.less'

const MODES = ['Colour', 'Image']

export default function PageStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as TPageState | null

  const [mode, setMode] = useState('Colour')
  const [showBgLib, setShowBgLib] = useState(false)
  const sizeEditRef = useRef<ResizeDesignHandle | null>(null)
  const localTempBG = useRef<string | null>(null)

  useEffect(() => {
    setMode(active?.backgroundImage ? MODES[1] : MODES[0])
  }, [active?.uuid])

  // The Vue original watched the active element deeply, so the tab followed the
  // background however it was set. Keying only on the page missed the library,
  // which sets the background from its own panel: you came back to the Colour
  // tab, with nothing to show that the picture you had just chosen had been
  // applied — and no way to reach the buttons that work on it.
  useEffect(() => {
    if (active?.backgroundImage) setMode(MODES[1])
  }, [active?.backgroundImage])

  const changeTransform = useCallback((transform: TBackgroundTransform) => {
    updatePageData({ key: 'backgroundTransform', value: transform })
  }, [])

  if (!active) return null

  function colorChange(e: colorChangeData) {
    if (e.mode === 'Gradient') {
      finish('backgroundGradient', e.color)
    } else finish('backgroundGradient', '')
  }

  function onChangeMode(value: string) {
    setMode(value)
    if (value === 'Colour') {
      localTempBG.current = (active as TPageState).backgroundImage
      finish('backgroundImage', '')
    } else {
      localTempBG.current && finish('backgroundImage', localTempBG.current)
    }
  }

  function finish(key: keyof TPageState, value: string | number | Record<string, any>) {
    updatePageData({ key, value })
  }

  async function uploadImgDone(img: TUploadDoneData) {
    // The picture's shape is what lets the crop control zoom past the size that
    // just covers the page, and an upload is the one place it arrives for free.
    updatePageData({ key: 'backgroundTransform', value: img.width && img.height ? { ratio: img.width / img.height } : {} })
    finish('backgroundImage', img.url)
  }

  async function deleteBg() {
    localTempBG.current = null
    updatePageData({ key: 'backgroundImage', value: '' })
    updatePageData({ key: 'backgroundTransform', value: {} })
    setMode(MODES[1])
  }

  async function downloadBG() {
    await _dl.downloadImg((active as TPageState).backgroundImage, () => {})
  }

  async function shiftOut() {
    const setting = JSON.parse(JSON.stringify(wImageSetting))
    setting.width = (active as TPageState).width
    setting.height = (active as TPageState).height
    setting.imgUrl = (active as TPageState).backgroundImage
    setting.uuid = `bg-${new Date().getTime()}`
    widgetState.dWidgets.unshift(setting)
    selectWidget({ uuid: widgetState.dWidgets[0].uuid })
    deleteBg()
  }

  function openSizeEdit() {
    sizeEditRef.current?.open()
  }

  const backgroundImage = active.backgroundImage

  return (
    <div id="page-style" className={showBgLib ? 'is-library' : undefined}>
      {showBgLib ? (
        <div className="bg-library">
          <span className="header-back" onClick={() => setShowBgLib(false)}>
            <i className="iconfont icon-right" /> Choose a background
          </span>
          <BgImgListWrap model="stylePanel" />
        </div>
      ) : (
        <>
          <PanelSection title="Page">
            <PageSizeFields width={active.width} height={active.height} onOpenResize={openSizeEdit} />
          </PanelSection>
          <PanelSection title="Background">
            <div className="bg-modes">
              <ColorSelect variant="row" label="Colour" value={active.backgroundColor} enabled={mode === 'Colour'} onEnabledChange={() => onChangeMode('Colour')} modes={['Solid', 'Gradient']} onValueChange={(value) => finish('backgroundColor', value)} onChange={colorChange} />
              <ToggleRow label="Image" checked={mode === 'Image'} onCheckedChange={() => onChangeMode('Image')} swatch={backgroundImage ? <img className="bg-thumb" src={backgroundImage} alt="" /> : <PhotoIcon />} checker={!backgroundImage} />
            </div>
            <Button className="bg-library-open" plain onClick={() => setShowBgLib(true)}>
              <i className="iconfont icon-gallery" />
              Browse the background library
            </Button>
            {mode === 'Image' && backgroundImage ? (
              <>
                <div className="backgroud-wrap">
                  <BackgroundCrop page={active} onChange={changeTransform} />
                  <div className="bg-options">
                    <Tooltip content="Download image" placement="top" showAfter={300}>
                      <div onClick={downloadBG} className="btn-item">
                        <DownloadIcon width={16} height={16} />
                      </div>
                    </Tooltip>
                    <Tooltip content="Remove" placement="top" showAfter={300}>
                      <div onClick={deleteBg} className="btn-item">
                        <DeleteIcon width={16} height={16} />
                      </div>
                    </Tooltip>
                  </div>
                </div>
                <div className="bg-actions">
                  <Uploader onDone={uploadImgDone}>
                    <Button plain>Replace image</Button>
                  </Uploader>
                  <Button plain onClick={() => setShowBgLib(true)}>
                    Backgrounds
                  </Button>
                </div>
              </>
            ) : null}
            <Uploader className="btn-wrap" style={{ display: mode === 'Image' && !backgroundImage ? undefined : 'none' }} onDone={uploadImgDone}>
              <Button className="block-btn" plain>
                Upload background
              </Button>
            </Uploader>
            <Button className="btn-wrap" style={{ display: mode === 'Image' && backgroundImage ? undefined : 'none' }} onClick={shiftOut}>
              Move background to a layer
            </Button>
          </PanelSection>
          <CanvasSection />
          <TransitionSection page={active} />
          {/* What the page is on paper, at the DPI the PDF is written at. */}
          <p className="page-note">
            {DESIGN_DPI} dpi · {realSize(active.width, active.height)}
          </p>
        </>
      )}
      <ResizeDesign ref={sizeEditRef} />
    </div>
  )
}
