declare namespace Type {
  type Object = Record<string, any>
}

type TCommResResult<T> = {
  code: number
  msg: string
  result: T
}

type TItem2DataParam = Record<string, any>

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

type TPageRequestResult<T> = {
  list: T
  total: number
}

interface HTMLElementEventMap {
  mousewheel: MouseEvent
}

interface Window {
  loadFinishToInject?: (msg: string) => void
}

declare namespace StyleProperty {
  type TextAlign = 'center' | 'end' | 'left' | 'right' | 'start' | 'justify'
  type WritingMode = 'horizontal-tb' | 'sideways-lr' | 'sideways-rl' | 'vertical-lr' | 'vertical-rl'
}
