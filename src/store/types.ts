import type { TWidgetAnimation } from '@/common/animations/presets'
import type { TBackgroundTransform } from '@/common/methods/pageBackground'

export type TScreeData = {
  width: number
  height: number
}

/** Ruler guides, in page coordinates. Vertical lines are x, horizontal are y. */
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
  /** How the background picture is cropped to the page. See `pageBackground`. */
  backgroundTransform: TBackgroundTransform
  opacity: number
  /** Used to force a redraw */
  tag: number
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

/**
 * An element's rendered box, measured from the DOM after it draws.
 *
 * Not the same as the `width`/`height` the store holds: a text box grows with
 * its content, so the store's width is what the user asked for and the record's
 * is what the browser produced. Dragging and resizing read it to keep an
 * element inside the page. A page is not an element and has no record, which is
 * why this is optional — code that reads it is holding a widget and should say
 * so, rather than crashing when it turns out to be holding the page.
 */
export type TWidgetRecord = {
  width: number
  height: number
  minWidth: number
  minHeight: number
  /** Which handles it may be resized by: 'all', 'horizontal' or 'vertical'. */
  dir: string
}

export type TdWidgetData = TPageState &
  Partial<TCommonItemData> & {
    parent?: string
    isContainer?: boolean
    text?: string
    /**
     * What the user named this layer. Absent means unnamed, and the layer list
     * falls back to the element's own text, then to the kind of thing it is —
     * so an untouched name keeps following the artwork.
     */
    label?: string
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
    record?: TWidgetRecord
    /** Entrance animation, played in the presenter. Absent means the element is simply there. */
    animation?: TWidgetAnimation
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
  /** Snap moves and resizes to other objects, the page and the guides */
  dSnapEnabled: boolean
}

export type TForceState = {
  zoomScreenChange: number | null
  updateRect: number | null
  updateSelect: number | null
  /** Bumped when dLayouts is replaced outright; see setLayoutsChange. */
  layoutsChange: number | null
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
