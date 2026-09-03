import type { TWidgetAnimation } from '@/common/animations/presets'
import type { TPageTransition } from '@/common/animations/transitions'
import type { TBackgroundTransform } from '@/common/methods/pageBackground'
import type { TWidgetShadow } from '@/common/methods/shadow'
import type { TImageFilters } from '@/common/methods/imageFilters'

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
  /**
   * How the presenter arrives at this page. Absent means it simply appears,
   * so a design saved before transitions existed presents as it always did.
   * See animations/transitions.ts, which is the only thing that should read it.
   */
  transition?: TPageTransition
  /**
   * Speaker notes: what to say while this page is on screen. Plain text, shown
   * in the presenter and in PowerPoint's notes pane, never on the page itself.
   */
  notes?: string
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
    /**
     * Taken off the canvas, and out of every export, until it is shown again.
     * Absent rather than `false` when visible, so a design that never hid
     * anything saves exactly as it always did.
     */
    hidden?: boolean
    imgUrl?: string
    rotate?: string
    transform?: string
    sliceData?: Record<string, any>
    flip?: string | null
    cropEdit?: boolean
    fontClass?: Record<string, any>
    /** Text only: how far a curved run sweeps, in degrees. 0 is straight. */
    curve?: number
    writingMode?: string
    /** Text widgets: 'bullet', 'number' or 'none'. See wText/listMarkup.ts. */
    listStyle?: string
    /**
     * Shapes and images: an outline drawn wholly inside the element's own
     * edge, in design pixels. 0 is the default and means no outline, and a
     * design saved before outlines existed has none of these keys at all — so
     * every reader has to treat absent and 0 the same. `widgetBorder` does.
     */
    borderWidth?: number
    borderColor?: string
    /** 'solid', 'dashed' or 'dotted'. Absent reads as solid. */
    borderStyle?: string
    /**
     * How round the corners are, in design pixels: photographs have had this
     * all along, drawn boxes take it too. `radii` holds the four apart —
     * top-left, top-right, bottom-right, bottom-left — and is absent whenever
     * they are all the same, which is nearly always. See wRect/rectRadius.ts,
     * which is the only thing that should be reading either of them.
     */
    radius?: number
    radii?: number[]
    /**
     * A drawn polygon: how many corners it has, three to a hundred. See
     * wPolygon/polygonShape.ts, which is the only thing that should be reading
     * it — a shape carrying nothing, or something out of range, still has to
     * draw.
     */
    sides?: number
    /**
     * Paths drawn with the pen: the points the curve runs through, as fractions
     * of the box it is painted in, and whether the last runs back to the first.
     * See wPath/pathGeometry.ts, which is the only thing that should read them.
     */
    points?: { x: number; y: number; in?: { x: number; y: number }; out?: { x: number; y: number } }[]
    closed?: boolean
    /**
     * Open paths only: what is drawn on each end of the line — 'arrow',
     * 'triangle', 'circle' or 'bar'. Absent means a bare end, so a line drawn
     * before ends existed saves exactly as it did. See wPath/lineEnds.ts.
     */
    lineStart?: string
    lineEnd?: string
    /**
     * Tables: the words in each cell, row by row, as the same contentEditable
     * markup a text widget holds; how wide each column is, as fractions of the
     * table that sum to one; and whether the first row is a heading. `rows` and
     * `cols` are kept alongside for convenience but `cells` is the truth. See
     * wTable/tableModel.ts, which is the only thing that should read them.
     */
    rows?: number
    cols?: number
    cells?: string[][]
    colWidths?: number[]
    headerRow?: boolean
    record?: TWidgetRecord
    /**
     * Images and shapes: the shadow the artwork casts. Absent means none, the
     * same way `hidden` is absent rather than false, so a design that never
     * asked for one saves exactly as it always did. Text carries its shadows
     * inside `textEffects` instead, one per layer of the stack.
     */
    shadow?: TWidgetShadow
    /** Entrance animation, played in the presenter. Absent means the element is simply there. */
    animation?: TWidgetAnimation
    /**
     * Images: the adjustments made to the picture — brightness, contrast and
     * so on. Absent means untouched, and only the keys that were moved are
     * held. See `imageFilters`, which is the only thing that should read it.
     */
    filters?: TImageFilters
    /**
     * Images: the picture as it was before its background was cut out, so it
     * can be put back. Absent when it never was, and again once it has been.
     */
    originalImgUrl?: string
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

/**
 * A shape that can be drawn by hand rather than fetched from a library. The
 * name is the widget's own type with the `w-` taken off, so the tool, the
 * shortcut and the widget it makes are all one word.
 *
 * The two are split because they are two gestures. A drag tool is pulled out of
 * the page in one press and comes out at the size it was pulled to; the pen is
 * a point at a time and is not finished until it is told it is. They share one
 * setting so that arming either puts the other away.
 */
export type TDragTool = 'rect' | 'ellipse' | 'polygon'

export type TDrawTool = TDragTool | 'pen' | 'line' | 'text'

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
  /**
   * The path whose points are being edited, or '-1'. A mode rather than a flag
   * on the widget, the same way cropping is, because only one path can be in it.
   */
  dPathEditUuid: string
  /** Snap moves and resizes to other objects, the page and the guides */
  dSnapEnabled: boolean
  /** Draw a grid over the page, and let things line up on it */
  dShowGrid: boolean
  /** How far apart the grid's lines are, in design pixels. See GRID_SIZES. */
  dGridSize: number
  /**
   * The shape tool waiting for a drag on the page, or null when the pointer is
   * an ordinary pointer. The name of the shape it draws rather than a flag, so
   * one armed tool disarms the other for free.
   */
  dDrawTool: TDrawTool | null
  /**
   * The Arrows preset the armed line tool is carrying, by name, or null when
   * the line was armed from the dock and comes out bare. Held here rather than
   * on the tool because it is the same tool either way — the preset only says
   * what the line arrives wearing. See linePresets.ts.
   */
  dLinePreset: string | null
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
