import { useEffect, useRef } from 'react'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import type { LocalUpload } from '@/common/methods/localUploads'
import { readQuery } from '@/common/hooks/useRouteQuery'
import ImageCutout, { type ImageCutoutHandle } from '@/components/business/image-cutout/ImageCutout'
import { wQrcodeSetting } from '../../widgets/wQrcode/wQrcodeSetting'
import './toolsListWrap.less'

export default function ToolsListWrap() {
  const imageCutoutRef = useRef<ImageCutoutHandle | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => {
      const { koutu } = readQuery()
      koutu && openImageCutout()
    }, 300)
    return () => clearTimeout(timer)
  }, [])

  function addQrcode() {
    setShowMoveable(false)
    const setting = JSON.parse(JSON.stringify(wQrcodeSetting))
    const { width: pW, height: pH } = canvasState.dPage
    setting.left = pW / 2 - setting.width / 2
    setting.top = pH / 2 - setting.height / 2
    addWidget(setting)
  }

  function openImageCutout() {
    imageCutoutRef.current?.open()
  }

  /**
   * Puts the finished cut-out on the page.
   *
   * Opened from a picture already on the page, the dialog replaces that picture
   * and this never runs. Opened from here there is nothing to replace, and
   * downloading a file only to upload it again is not what anyone wants.
   */
  function cutOutDone(saved: LocalUpload) {
    setShowMoveable(false)
    const setting = JSON.parse(JSON.stringify(wImageSetting))
    const { width: pW, height: pH } = canvasState.dPage
    // Fit it inside the page rather than dropping a 2400px photo on an A4 poster.
    const scale = Math.min(1, (pW * 0.6) / saved.width, (pH * 0.6) / saved.height)
    setting.width = Math.round(saved.width * scale)
    setting.height = Math.round(saved.height * scale)
    setting.imgUrl = saved.url
    setting.left = pW / 2 - setting.width / 2
    setting.top = pH / 2 - setting.height / 2
    addWidget(setting)
  }

  return (
    <div className="wrap tools-list-wrap">
      <div className="header">Element</div>
      <div className="item" onClick={addQrcode}>
        <i className="icon sd-w-qrcode" />
        <div className="text">
          <span>QR code</span>
          <span className="desc">Add a styled QR code to your design</span>
        </div>
      </div>
      <div className="header">Other</div>
      <div className="item" onClick={openImageCutout}>
        <i className="icon sd-AI_zhineng" />
        <div className="text">
          <span>Remove background</span> <span className="desc">Upload a picture and remove its background</span>
        </div>
      </div>
      <ImageCutout ref={imageCutoutRef} onDone={cutOutDone} />
    </div>
  )
}
