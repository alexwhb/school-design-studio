import { useCallback, useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import _dl from '@/common/methods/download'
import { widgetState } from '@/store/state'
import { updatePageData } from '@/store/canvas'
import { selectWidget } from '@/store/widget/select'
import Button from '@/components/ui/Button'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
import Tooltip from '@/components/ui/Tooltip'
import { DeleteIcon, DownloadIcon } from '@/components/ui/icons'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import Segmented from '@/components/ui/Segmented'
import ColorSelect, { type colorChangeData } from '@/components/modules/settings/ColorSelect'
import ResizeDesign, { type ResizeDesignHandle } from '@/components/business/resize-design/ResizeDesign'
import BgImgListWrap from '@/components/modules/panel/wrap/BgImgListWrap'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import type { TBackgroundTransform } from '@/common/methods/pageBackground'
import type { TPageState } from '@/store/types'
import BackgroundCrop from './comps/BackgroundCrop'
import './pageStyle.less'

const MODES = ['Colour', 'Image']

export default function PageStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as TPageState | null

  const [activeNames, setActiveNames] = useState<string[]>(['1', '2', '3', '4'])
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
    <div id="page-style">
      {showBgLib ? (
        <div className="bg-library">
          <span className="header-back" onClick={() => setShowBgLib(false)}>
            <i className="iconfont icon-right" /> Choose a background
          </span>
          <BgImgListWrap model="stylePanel" />
        </div>
      ) : (
        <PanelSections value={activeNames} onChange={setActiveNames}>
          <PanelSection name="1" title="Page size">
            <div className="page-size">
              <span className="page-size__value">
                {Math.round(active.width)} × {Math.round(active.height)} px
              </span>
              <Button plain size="small" onClick={openSizeEdit}>
                Resize…
              </Button>
            </div>
          </PanelSection>
          <PanelSection name="2" title="Background">
            <Button className="bg-library-open" plain onClick={() => setShowBgLib(true)}>
              <i className="iconfont icon-gallery" />
              Browse the background library
            </Button>
            <Segmented aria-label="Background" value={mode} options={MODES} onChange={onChangeMode} />
            <div style={{ display: mode === 'Colour' ? undefined : 'none' }}>
              <ColorSelect
                value={active.backgroundColor}
                modes={['Solid', 'Gradient']}
                onValueChange={(value) => finish('backgroundColor', value)}
                onChange={colorChange}
              />
            </div>
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
            <Uploader
              className="btn-wrap"
              style={{ display: mode === 'Image' && !backgroundImage ? undefined : 'none' }}
              onDone={uploadImgDone}
            >
              <Button className="block-btn" plain>
                Upload background
              </Button>
            </Uploader>
            <Button
              className="btn-wrap"
              style={{ display: mode === 'Image' && backgroundImage ? undefined : 'none' }}
              onClick={shiftOut}
            >
              Move background to a layer
            </Button>
          </PanelSection>
        </PanelSections>
      )}
      <ResizeDesign ref={sizeEditRef} />
    </div>
  )
}
