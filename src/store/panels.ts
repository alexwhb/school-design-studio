/**
 * Which side panels are open, and which tab the left one is showing.
 *
 * This used to be local state inside WidgetPanel, which was fine while the rail
 * was the only thing that could open a panel. It is not any more: the canvas
 * dock asks for a tab by name, the board has to re-measure when a panel comes
 * or goes, and both sides remember whether you had them hidden. All of that
 * wants one place to read from.
 *
 * Whether a panel is open belongs to the person rather than to the design, so
 * it is kept in localStorage and never travels with a saved file.
 */
import { proxy } from 'valtio'
import widgetClassifyListData from '@/assets/data/WidgetClassifyList'
import eventBus from '@/utils/plugins/eventBus'

export const LEFT_PANEL_STORAGE_KEY = 'ds_left_panel'
export const RIGHT_PANEL_STORAGE_KEY = 'ds_right_panel'

function readStoredOpen(key: string): boolean {
  try {
    // Stored as a word rather than a boolean, like the snapping toggle, so an
    // older build that knows nothing of this key still gets the default.
    return localStorage.getItem(key) !== 'hidden'
  } catch {
    // Private browsing, or storage disabled by policy. Not a reason to fail.
    return true
  }
}

function storeOpen(key: string, open: boolean) {
  try {
    localStorage.setItem(key, open ? 'shown' : 'hidden')
  } catch {
    /* see readStoredOpen */
  }
}

export const panelState = proxy({
  leftOpen: readStoredOpen(LEFT_PANEL_STORAGE_KEY),
  rightOpen: readStoredOpen(RIGHT_PANEL_STORAGE_KEY),
  /** The `component` id of the left tab on show — Templates when nothing says otherwise. */
  activePanel: widgetClassifyListData[0]?.component ?? '',
})

export function setLeftOpen(open: boolean) {
  panelState.leftOpen = open
  storeOpen(LEFT_PANEL_STORAGE_KEY, open)
}

export function setRightOpen(open: boolean) {
  panelState.rightOpen = open
  storeOpen(RIGHT_PANEL_STORAGE_KEY, open)
}

export function toggleLeft() {
  setLeftOpen(!panelState.leftOpen)
}

export function toggleRight() {
  setRightOpen(!panelState.rightOpen)
}

/** Shows a left tab by its `component` id, opening the panel if it was hidden. */
export function openPanel(component: string) {
  panelState.activePanel = component
  setLeftOpen(true)
}

/**
 * Clicking the rail tab that is already showing puts the panel away, which is
 * how you get the canvas to yourself without reaching for the chevron.
 */
export function clickPanelTab(component: string) {
  if (panelState.activePanel === component && panelState.leftOpen) {
    setLeftOpen(false)
    return
  }
  openPanel(component)
}

// Anything outside the panel can ask for a tab by name — the canvas dock's
// "Browse photos" does. Listening here rather than in WidgetPanel means the
// request works whether or not the panel is on screen at the time.
eventBus.on('open-panel', (component: string) => {
  if (component) openPanel(component)
})
