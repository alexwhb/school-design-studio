export type TScreeData = {
  width: number
  height: number
}

export type TGuidelinesData = {
  verticalGuidelines: number[]
  horizontalGuidelines: number[]
}

export type TPageState = {
  name: string
  type: string
  uuid: string
  left: number
  top: number
  width: number
  height: number
  backgroundColor: string
  backgroundGradient: string
  backgroundImage: string
  backgroundTransform: {
    x?: number
    y?: number
  }
  opacity: number
  tag: number
  record: Record<string, any>
  [key: string]: any
}

export type TCanvasState = {
  dZoom: number
  dPresetPadding: number
  dBottomHeight: number
  dPaddingTop: number
  dScreen: TScreeData
  guidelines: TGuidelinesData
  dPage: TPageState
  dCurrentPage: number
}

export type TdWidgetData = TPageState &
  Partial<TCommonItemData> & {
    parent?: string
    isContainer?: boolean
    text?: string
    editable?: boolean
    lock?: boolean
    imgUrl?: string
    rotate?: string
    transform?: string
    sliceData?: Record<string, any>
    flip?: string | null
    cropEdit?: boolean
    fontClass?: Record<string, any>
    writingMode?: string
    record: Record<string, any>
  }

export type TdLayout = {
  global: TPageState
  layers: TdWidgetData[]
}

export type TWidgetState = {
  dActiveWidgetXY: { x: number; y: number }
  dMouseXY: { x: number; y: number }
  dResizeWH: { width: number; height: number }
  dActiveElement: TdWidgetData | null
  dHoverUuid: string
  dDropOverUuid: string
  dWidgets: TdWidgetData[]
  dLayouts: TdLayout[]
  dSelectWidgets: TdWidgetData[]
  dCopyElement: TdWidgetData[]
  selectItem: { data?: Record<string, any> | null; type?: string }
  activeMouseEvent: MouseEvent | null
}

export type TControlState = {
  dMoving: boolean
  dDraging: boolean
  dResizeing: boolean
  dShowRefLine: boolean
  showMoveable: boolean
  showRotatable: boolean
  dAltDown: boolean
  dSpaceDown: boolean
  dCropUuid: string
}

export type TForceState = {
  zoomScreenChange: number | null
  updateRect: number | null
  updateSelect: number | null
}

export type THistoryParamData = {
  index: number
  length: number
  maxLength: number
  stackPointer: number
}

export type THistoryStack = {
  changes: any[]
  inverseChanges: any[]
}

export type THistoryState = {
  dHistory: string[]
  dPageHistory: string[]
  dHistoryStack: THistoryStack
  dHistoryParams: THistoryParamData
  dColorHistory: string[]
}

export type TBaseState = {
  loading: boolean | null
  watermark: string | string[]
  fonts: string[]
}

export type TUserState = {
  online: boolean
  user: { name: string | null }
  manager: string
  tempEditing: boolean
}

export type TGroupState = {
  dGroupJson: string
}
