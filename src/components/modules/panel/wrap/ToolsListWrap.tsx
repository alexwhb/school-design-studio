import { useSnapshot } from 'valtio'
import { canvasState, controlState } from '@/store/state'
import { setShowMoveable, toggleDrawTool } from '@/store/control'
import { addWidget } from '@/store/widget'
import { RectangleIcon } from '@/components/ui/icons'
import { cx } from '@/utils/dom'
import { wQrcodeSetting } from '../../widgets/wQrcode/wQrcodeSetting'
import './toolsListWrap.less'

export default function ToolsListWrap() {
  const drawing = useSnapshot(controlState).dDrawTool === 'rect'

  function addQrcode() {
    setShowMoveable(false)
    const setting = JSON.parse(JSON.stringify(wQrcodeSetting))
    const { width: pW, height: pH } = canvasState.dPage
    setting.left = pW / 2 - setting.width / 2
    setting.top = pH / 2 - setting.height / 2
    addWidget(setting)
  }

  return (
    <div className="wrap tools-list-wrap">
      <div className="header">Element</div>
      {/*
        A tool rather than a button: this one arms the pointer and waits for a
        drag on the page, so it stays lit until the box has been drawn.
      */}
      <button
        type="button"
        className={cx('item', { 'item--armed': drawing })}
        aria-pressed={drawing}
        onClick={() => toggleDrawTool('rect')}
      >
        <RectangleIcon className="icon" />
        <div className="text">
          <span>Rectangle {drawing ? '· drawing' : ''}</span>
          <span className="desc">Drag out a box at any size, then round its corners</span>
        </div>
      </button>
      <div className="item" onClick={addQrcode}>
        <i className="icon sd-w-qrcode" />
        <div className="text">
          <span>QR code</span>
          <span className="desc">Add a styled QR code to your design</span>
        </div>
      </div>
    </div>
  )
}
