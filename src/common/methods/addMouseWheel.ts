/*
 * @Author: ShawnPhang
 * @Date: 2022-03-25 13:43:07
 * @LastEditors: ShawnPhang <site: book.palxp.com>, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-02 11:50:00
 */
import { controlState } from '@/store/state'
// import store from '@/store'

type TAddEventCb = (e: Event) => void
type TAddEventObj = {
  attachEvent?: HTMLElement['addEventListener']
} & HTMLElement

export default function (el: HTMLElement | string, cb: Function, altLimit: boolean = true) {
  const box = typeof el === 'string' ? document.getElementById(el) : el
  if (!box) return () => {}
  const onWheel = (e: any) => {
    const ev = e || window.event
    const down = ev.wheelDelta ? ev.wheelDelta < 0 : ev.detail > 0
    if ((altLimit && controlState.dAltDown) || !altLimit) {
      ev.preventDefault()
      cb(down)
    }
    return false
  }
  addEvent(box, 'mousewheel', onWheel)
  return () => box.removeEventListener('mousewheel' as keyof HTMLElementEventMap, onWheel, false)
}

function addEvent(obj: TAddEventObj, xEvent: keyof HTMLElementEventMap, fn: TAddEventCb) {
  if (obj.attachEvent) {
    obj.attachEvent('on' + xEvent, fn)
  } else {
    obj.addEventListener(xEvent, fn, false)
  }
}
