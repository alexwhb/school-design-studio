/**
 * The two things the dock puts on the page outright, rather than by arming a
 * tool and waiting for a gesture.
 *
 * They were the bottom half of the Tools panel before the dock replaced it.
 * Each one is bracketed by hand: the dock floats over the board, and a control
 * that stops a press from reaching the document takes its own undo entry with
 * it — see `beginHistory`. The dock does not stop presses today, and an empty
 * diff is not an entry, so recording here costs nothing when the document has
 * already bracketed the click and saves the entry when it has not.
 */
import { recordHistory } from '@/common/hooks/history'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget'
import { wQrcodeSetting } from '@/components/modules/widgets/wQrcode/wQrcodeSetting'
import { wTableSetting } from '@/components/modules/widgets/wTable/wTableSetting'

export function addQrcode() {
  setShowMoveable(false)
  const setting = JSON.parse(JSON.stringify(wQrcodeSetting))
  const { width: pW, height: pH } = canvasState.dPage
  setting.left = pW / 2 - setting.width / 2
  setting.top = pH / 2 - setting.height / 2
  recordHistory(() => addWidget(setting))
}

export function addTable() {
  setShowMoveable(false)
  const setting = JSON.parse(JSON.stringify(wTableSetting))
  const { width: pW, height: pH } = canvasState.dPage
  // Most of the page's width, which is what a table on a slide wants, and
  // never wider than the page it is dropped on.
  setting.width = Math.min(setting.width, Math.round(pW * 0.8))
  setting.left = Math.round(pW / 2 - setting.width / 2)
  setting.top = Math.round(pH / 2 - setting.height / 2)
  recordHistory(() => addWidget(setting))
}
