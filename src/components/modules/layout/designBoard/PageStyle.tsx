import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import api from '@/api'
import _dl from '@/common/methods/download'
import { canvasState, widgetState } from '@/store/state'
import { updatePageData } from '@/store/canvas'
import { selectWidget } from '@/store/widget/select'
import Button from '@/components/ui/Button'
import Collapse, { CollapseItem } from '@/components/ui/Collapse'
import Image from '@/components/ui/Image'
import Tooltip from '@/components/ui/Tooltip'
import { DeleteIcon, DownloadIcon } from '@/components/ui/icons'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import Tabs from '@/packages/color-picker/comps/Tabs'
import ColorSelect, { type colorChangeData } from '@/components/modules/settings/ColorSelect'
import ResizeDesign, { type ResizeDesignHandle } from '@/components/business/resize-design/ResizeDesign'
import BgImgListWrap from '@/components/modules/panel/wrap/BgImgListWrap'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import type { TPageState } from '@/store/types'
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
    updatePageData({ key: 'backgroundTransform', value: {} })
    finish('backgroundImage', img.url)
  }

  async function deleteBg() {
    localTempBG.current = null
    updatePageData({ key: 'backgroundImage', value: '' })
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
        <div style={{ width: 256, height: '100%' }}>
          <span className="header-back" onClick={() => setShowBgLib(false)}>
            <i className="iconfont icon-right" /> Choose a background
          </span>
          <BgImgListWrap style={{ paddingTop: '2rem' }} model="stylePanel" />
        </div>
      ) : (
        <Collapse value={activeNames} onChange={setActiveNames}>
          <CollapseItem name="1" title="Page size">
            <div className="page-size">
              <span className="page-size__value">
                {Math.round(active.width)} × {Math.round(active.height)} px
              </span>
              <Button plain size="small" onClick={openSizeEdit}>
                Resize…
              </Button>
            </div>
          </CollapseItem>
          <CollapseItem name="2" title="Background">
            <Button style={{ width: '100%', margin: '0 0 1rem 0' }} type="primary" link onClick={() => setShowBgLib(true)}>
              Choose from the background library
            </Button>
            <Tabs value={mode} labels={MODES} onChange={onChangeMode} />
            <div style={{ display: mode === 'Colour' ? undefined : 'none' }}>
              <ColorSelect
                value={active.backgroundColor}
                modes={['Solid', 'Gradient']}
                onValueChange={(value) => finish('backgroundColor', value)}
                onChange={colorChange}
              />
            </div>
            {mode === 'Image' && backgroundImage ? (
              <div style={{ marginTop: '1.2rem' }}>
                <div className="backgroud-wrap">
                  <Image style={{ height: '100%' }} src={backgroundImage} fit="contain" />
                  <div className="bg-control">
                    <div className="btns">
                      <Uploader style={{ width: '47%' }} onDone={uploadImgDone}>
                        <Button style={{ width: '100%' }} plain>
                          Upload image
                        </Button>
                      </Uploader>
                      <Button style={{ width: '47%' }} onClick={() => setShowBgLib(true)} plain>
                        Backgrounds
                      </Button>
                    </div>
                  </div>
                  <div className="bg-options">
                    <Tooltip content="Download image" placement="top" showAfter={300}>
                      <div onClick={downloadBG} className="btn-item">
                        <DownloadIcon width={16} height={16} />
                      </div>
                    </Tooltip>
                    <Tooltip content="Delete" placement="top" showAfter={300}>
                      <div onClick={deleteBg} className="btn-item">
                        <DeleteIcon width={16} height={16} />
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ) : null}
            <Uploader
              className="btn-wrap"
              style={{ display: mode === 'Image' && !backgroundImage ? undefined : 'none' }}
              onDone={uploadImgDone}
            >
              <Button style={{ width: '100%' }} plain>
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
          </CollapseItem>
        </Collapse>
      )}
      <ResizeDesign ref={sizeEditRef} />
    </div>
  )
}
