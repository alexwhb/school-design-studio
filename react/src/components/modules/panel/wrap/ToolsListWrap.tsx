import { useEffect, useRef } from 'react'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget'
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
      <ImageCutout ref={imageCutoutRef} />
    </div>
  )
}
