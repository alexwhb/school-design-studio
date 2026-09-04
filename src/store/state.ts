import { proxy } from 'valtio'
import pageDefault from './page-default'
import type { TBaseState, TCanvasState, TControlState, TForceState, TGroupState, THistoryState, TUserState, TWidgetState } from './types'

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

/** Remembers the snapping toggle between sessions, like the theme does. */
export const SNAP_STORAGE_KEY = 'ds_snap'

function readStoredSnap(): boolean {
  try {
    // Absence of a choice means on, which is what every design tool does.
    return localStorage.getItem(SNAP_STORAGE_KEY) !== 'off'
  } catch {
    // Private browsing, or storage disabled by policy. Not a reason to fail.
    return true
  }
}

/** The grid, remembered the same way — both whether it is on and how fine it is. */
export const GRID_STORAGE_KEY = 'ds_grid'
export const GRID_SIZE_STORAGE_KEY = 'ds_grid_size'

/**
 * The spacings offered. Three is enough: a coarse one to lay a page out on, a
 * middling default, and a fine one for lining up small things. Anything the
 * store is handed that is not on this list is ignored, so a stored value from a
 * future build cannot leave someone with a grid they have no way to change.
 */
export const GRID_SIZES = [25, 50, 100]

const GRID_SIZE_DEFAULT = 50

function readStoredGrid(): boolean {
  try {
    // Absence of a choice means off: a grid nobody asked for is clutter over
    // artwork, which is the opposite of snapping's default.
    return localStorage.getItem(GRID_STORAGE_KEY) === 'on'
  } catch {
    return false
  }
}

function readStoredGridSize(): number {
  try {
    const stored = Number(localStorage.getItem(GRID_SIZE_STORAGE_KEY))
    return GRID_SIZES.includes(stored) ? stored : GRID_SIZE_DEFAULT
  } catch {
    return GRID_SIZE_DEFAULT
  }
}

export const controlState = proxy<TControlState>({
  dMoving: false,
  dDraging: false,
  dResizeing: false,
  dShowRefLine: true,
  showMoveable: false,
  showRotatable: true,
  dAltDown: false,
  dCropUuid: '-1',
  dPathEditUuid: '-1',
  dSpaceDown: false,
  dSnapEnabled: readStoredSnap(),
  dShowGrid: readStoredGrid(),
  dGridSize: readStoredGridSize(),
  dDrawTool: null,
  dLinePreset: null,
})

export const forceState = proxy<TForceState>({
  zoomScreenChange: null,
  updateRect: null,
  updateSelect: null,
  layoutsChange: null,
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
