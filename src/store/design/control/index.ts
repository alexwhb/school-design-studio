
/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-18 21:00:00
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 09:27:45
 */

import { useHistoryStore } from "@/store";
import { Store, defineStore } from "pinia";

type TControlState = {
  /** Whether an element is being moved */
  dMoving: boolean 
  /** Whether an element is being grabbed */
  dDraging: boolean
  /** Whether an element is being resized */
  dResizeing: boolean
  /** Whether guides are shown */
  dShowRefLine: boolean
  /** Global toggle for the selection box */
  showMoveable: boolean
  /** 是否显示moveablerotation handle */
  showRotatable: boolean
  /** Track whether thealt键 / 或ctrl */
  dAltDown: boolean
  // 是否按下空格键
  dSpaceDown: boolean
  /** 正在编辑or裁剪的组件id */
  dCropUuid: string
}

type TControlAction = {
  setdMoving: (isMoving: boolean) => void
  setDraging: (isDraging: boolean) => void
  setdResizeing: (isResizing: boolean) => void
  showRefLine: (isRefLine: boolean) => void
  setShowMoveable: (isShowMoveable: boolean) => void
  setShowRotatable: (isShowRotatable: boolean) => void
  updateAltDown: (isPressAltDown: boolean) => void
  /** 组件调整结束 */
  stopDResize: () => void
  /** 组件移动结束 */
  stopDMove: () => void
  /** 设置正在裁剪or编辑的组件 */
  setCropUuid: (uuid: string) => void
  setSpaceDown: (uuid: boolean) => void // Track whether space is held
}

/** 全局控制配置 */
const ControlStore =  defineStore<"controlStore", TControlState, {}, TControlAction>("controlStore", {
  state: () => ({
    dMoving: false, // Whether an element is being moved
    dDraging: false, // Whether an element is being grabbed
    dResizeing: false, // Whether an element is being resized
    dShowRefLine: true, // Whether guides are shown
    showMoveable: false, // Global toggle for the selection box
    showRotatable: true, // 是否显示moveablerotation handle
    dAltDown: false, // Track whether thealt键 / 或ctrl
    dCropUuid: '-1', // 正在编辑or裁剪的组件id
    dSpaceDown: false, // Track whether space is held
  }),
  getters: {},
  actions: {
    setdMoving(bool: boolean) {
      this.dMoving = bool
    },
    setDraging(drag: boolean) {
      this.dDraging = drag
    },
    setdResizeing(bool: boolean) {
      this.dResizeing = bool
    },
    showRefLine(show: boolean) {
      this.dShowRefLine = show
    },
    setShowMoveable(show: boolean) {
      this.showMoveable = show
      // if (!show) {
      //   // TODO: 失焦时设置面板也失去关联，但会导致某些失焦状态出错(如裁剪)
      //   state.dActiveElement = state.dPage
      // }
    },
    setShowRotatable(e: boolean) {
      this.showRotatable = e
    },
    /** TODO 组合操作 */
    updateAltDown(e: boolean) {
      this.dAltDown = e
      console.log('modifier key handling, group action: realCombined')
    },
    /** 组件调整结束 */
    stopDResize() {
      // if (this.dResizeing) {
      //   // store.dispatch('pushHistory', 'stopDResize')
      // }
      this.dResizeing = false
    },
    /** 组件移动结束 */
    stopDMove() {
      // if (this.dMoving) {
      //   const historyStore = useHistoryStore()
      //   historyStore.pushHistory("stopDMove")
      //   // store.dispatch('pushHistory', 'stopDMove')
      // }
      this.dMoving = false
    },
    setCropUuid(uuid: string) {
      // 设置正在裁剪or编辑的组件
      this.dCropUuid = uuid
    },
    setSpaceDown(val: boolean) {
      this.dSpaceDown = val
    }
  }
})

export type TControlStore = Store<"controlStore", TControlState, {}, TControlAction>

export default ControlStore
