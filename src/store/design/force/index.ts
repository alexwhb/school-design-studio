import { Store, defineStore } from "pinia";



type TForceState = {
  /** Force the page to refit */
  zoomScreenChange: number | null
  /** Force the transform box to redraw */
  updateRect: number | null
  /** Force the selected element */
  updateSelect: number | null
}

type TForceAction = {
  setZoomScreenChange: () => void
  setUpdateRect: () => void
  setUpdateSelect: () => void
}

const ForceStore = defineStore<"forceStore", TForceState, {}, TForceAction>("forceStore", {
  state: () => ({
    zoomScreenChange: null, // Force the page to refit
    updateRect: null, // Force the transform box to redraw
    updateSelect: null, // Force the selected element
  }),

  actions: {
    setZoomScreenChange() {
      // Page size适应度强制刷新
      this.zoomScreenChange = Math.random()
    },
    setUpdateRect() {
      // Force the transform box to redraw
      this.updateRect = Math.random()
    },
    setUpdateSelect() {
      // 强制触发元素选择
      this.updateSelect = Math.random()
    },
  }
})

export type TForceStore = Store<"forceStore", TForceState, {}, TForceAction>

export default ForceStore
