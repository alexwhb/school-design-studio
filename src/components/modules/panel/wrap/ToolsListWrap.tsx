import { useSnapshot } from 'valtio'
import { canvasState, controlState } from '@/store/state'
import { setShowMoveable, toggleDrawTool } from '@/store/control'
import { addWidget } from '@/store/widget'
import { drawToolOrder, drawTools } from '@/components/business/draw-shape/drawTools'
import { cx } from '@/utils/dom'
import { wQrcodeSetting } from '../../widgets/wQrcode/wQrcodeSetting'
import './toolsListWrap.less'

export default function ToolsListWrap() {
  const armed = useSnapshot(controlState).dDrawTool

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
        Tools rather than buttons: these arm the pointer and wait for a drag on
        the page, so one stays lit until the shape has been drawn.
      */}
      {drawToolOrder.map((tool) => {
        const { Icon, label, desc, shortcut } = drawTools[tool]
        const drawing = armed === tool
        return (
          <button
            key={tool}
            type="button"
            className={cx('item', { 'item--armed': drawing })}
            aria-pressed={drawing}
            title={`${label} (${shortcut})`}
            onClick={() => toggleDrawTool(tool)}
          >
            <Icon className="icon" />
            <div className="text">
              <span>
                {label} {drawing ? '· drawing' : ''}
              </span>
              <span className="desc">{desc}</span>
            </div>
          </button>
        )
      })}
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
