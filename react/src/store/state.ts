import { proxy } from 'valtio'
import pageDefault from './page-default'
import type {
  TBaseState,
  TCanvasState,
  TControlState,
  TForceState,
  TGroupState,
  THistoryState,
  TUserState,
  TWidgetState,
} from './types'

export const canvasState = proxy<TCanvasState>({
  dZoom: 0,
  dPresetPadding: 25,
  dBottomHeight: 0,
  dPaddingTop: 0,
  dScreen: {
    width: 0,
    height: 0,
  },
  guidelines: {
    verticalGuidelines: [],
    horizontalGuidelines: [],
  },
  dCurrentPage: 0,
  dPage: pageDefault,
})

export const widgetState = proxy<TWidgetState>({
  dActiveWidgetXY: { x: 0, y: 0 },
  dMouseXY: { x: 0, y: 0 },
  dResizeWH: { width: 0, height: 0 },
  dActiveElement: null,
  dHoverUuid: '-1',
  dDropOverUuid: '',
  dWidgets: [],
  dLayouts: [{ global: pageDefault, layers: [] }],
  dSelectWidgets: [],
  selectItem: { data: null },
  activeMouseEvent: null,
  dCopyElement: [],
})

export const controlState = proxy<TControlState>({
  dMoving: false,
  dDraging: false,
  dResizeing: false,
  dShowRefLine: true,
  showMoveable: false,
  showRotatable: true,
  dAltDown: false,
  dCropUuid: '-1',
  dSpaceDown: false,
})

export const forceState = proxy<TForceState>({
  zoomScreenChange: null,
  updateRect: null,
  updateSelect: null,
})

export const historyState = proxy<THistoryState>({
  dHistory: [],
  dHistoryParams: {
    index: -1,
    length: 0,
    maxLength: 20,
    stackPointer: -1,
  },
  dHistoryStack: {
    changes: [],
    inverseChanges: [],
  },
  dColorHistory: [],
  dPageHistory: [],
})

export const baseState = proxy<TBaseState>({
  loading: null,
  watermark: '',
  fonts: [],
})

export const userState = proxy<TUserState>({
  online: true,
  user: { name: typeof localStorage === 'undefined' ? null : localStorage.getItem('username') },
  manager: '',
  tempEditing: false,
})

export const groupState = proxy<TGroupState>({
  dGroupJson: '',
})
