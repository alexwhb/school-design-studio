/*
 * @Author: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-04-05 06:23:23
 * @Description:  
 * @LastEditors: Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-09-25 00:39:00
 */
export type TScreeData = {
  /** Editor viewport width */
  width: number
  /** Editor viewport height */
  height: number
}

export type TGuidelinesData = {
  verticalGuidelines: number[]
  horizontalGuidelines: number[]
}

export type TCanvasState = {
  /** Zoom percentage */
  dZoom: number
  /** Default page padding */
  dPresetPadding: number,
  /** Height of the bottom bar */
  dBottomHeight: number,
  /** 画布Centre vertically修正值 */
  dPaddingTop: number
  /** 编辑界面 */
  dScreen: TScreeData
  /** 标尺辅助线 */
  guidelines: TGuidelinesData
  /** 页面数据 */
  dPage: TPageState
  /** Current page下标 */
  dCurrentPage: number
}

export type TStoreAction = {
  /** 更新Zoom percentage */
  updateZoom: (zoom: number) => void
  /** 更新画布Centre vertically修正值 */
  updatePaddingTop: (num: number) => void
  /** 更新编辑界面的宽高 */
  updateScreen: (data: TScreeData) => void
  /** 修改标尺线 */
  updateGuidelines: (lines: TGuidelinesData) => void
  /** 强制重绘画布 */
  reChangeCanvas: () => void
  /** 更新Page数据 */
  updatePageData<T extends keyof TPageState>(data: {
    key: T
    value: TPageState[T]
    // pushHistory?: boolean
  }): void
  getDPage(data: TPageState): TPageState
  /** 设置dPage */
  setDPage(data: TPageState): void
  /** 更新 Page（从layouts获取）*/
  updateDPage(): void
  /** 设置底部工具栏高度 */
  setBottomHeight(h: number): void
  /** 更新Current page下标 */
  setDCurrentPage(n: number): void
}

export type TPageState = {
  name: string
  type: string
  uuid: string
  left: number
  top: number
  /** Page width */
  width: number
  /** Page height */
  height: number
  /** Page background colour */
  backgroundColor: string
  /** Page background colour(兼容渐变色) */
  backgroundGradient: string,
  /** Page background image */
  backgroundImage: string
  backgroundTransform: {
    x?: number
    y?: number
  }
  /** 透明度 */
  opacity: number
  /** Used to force a redraw */
  tag: number
}

