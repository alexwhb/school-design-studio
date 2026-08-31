

/** 公共API返回结果 */
type TCommResResult<T> = {
  code: number
  msg: string
  result: T
}

type TCommonItemData = {
  type: string
  fontFamily?: string
  color?: string
  fontSize: number
  width: number
  height: number
  left: number
  top: number
  fontWeight: number
  value: TItem2DataParam
}

/** 分页查询公共返回 */
type TPageRequestResult<T> = {
  list: T
  total: number
}

interface HTMLElementEventMap {
  "mousewheel": MouseEvent
}

interface MouseEvent {
  layerX: number
  layerY: number
}

interface Document {
  selection?: Selection
}

interface HTMLElement {
  createTextRange(): {
    moveToElementText(el: HTMLElement): void
    select(): void
  }
}
