/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-18 21:00:00
 * @Description: Store方法export
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-18 17:11:51
 */

import { Store, defineStore } from "pinia";
import { useCanvasStore } from '@/store'
import { TInidDMovePayload, TMovePayload, dMove, initDMove, setDropOver, setMouseEvent, setdActiveElement, updateGroupSize, updateHoverUuid } from "./actions";
import { TPageState } from "@/store/design/canvas/d";
import { TInitResize, TSize, TdResizePayload, dResize, initDResize, resize } from "./actions/resize";
import { TResizePagesPayload, resizePages } from "./actions/resizePages";
import { addPage, duplicatePage, movePage, removePage, renamePage, showPage } from "./actions/pages";
import { TUpdateWidgetMultiplePayload, TUpdateWidgetPayload, TsetWidgetStyleData, addWidget, deleteWidget, setDWidgets, updateDWidgets, setWidgetStyle, updateWidgetData, updateWidgetMultiple, lockWidgets, setDLayouts } from "./actions/widget";
import { addGroup } from "./actions/group";
import { setTemplate } from "./actions/template";
import { copyWidget, pasteWidget } from "./actions/clone";
import { TSelectWidgetData, TselectItem, selectItem, selectWidget, selectWidgetsInOut } from "./actions/select";
import { TUpdateAlignData, updateAlign } from "./actions/align";
// import { TWidgetJsonData, widgetJsonData } from "./getter";
import { TupdateLayerIndexData, ungroup, updateLayerIndex } from "./actions/layer";
import pageDefault from "../canvas/page-default";
import { TCanvasStore } from "../canvas";

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

export type TdWidgetData = TPageState & Partial<TCommonItemData> & {
  record?: TWidgetRecord
  parent?: string
  isContainer?: boolean
  text?: string
  editable?: boolean
  lock?: boolean
  imgUrl?: string
  rotate?: string
  transform?: string
  sliceData?: Record<string, any>
  flip?: boolean
  cropEdit?: boolean
  fontClass?: Record<string, any>
  writingMode?: string
}

export type TdLayout = {
  global: TPageState
  layers: TdWidgetData[]
}

export type TWidgetState = {
  dActiveWidgetXY: {
    /** Starting x of the selected element */
    x: number,
    /** Starting y of the selected element */
    y: number
  }
  dMouseXY: {
    /** Mouse x on press */
    x: number
    /** Mouse y on press */
    y: number
  },
  /** 初始化调整大小时组件的宽高 */
  dResizeWH: {
    width: number
    height: number
  },
  /** Selected element or page */
  dActiveElement: TdWidgetData | null
  /** Mouse is over this layer */
  dHoverUuid: string
  /** Layer the drag is hovering over */
  dDropOverUuid: string
  /** Elements in use */
  dWidgets: TdWidgetData[]
  /** 所有图层数据与页面数据 */
  dLayouts: TdLayout[]
  /** Multi-selected elements */
  dSelectWidgets: TdWidgetData[]
  /** Copied elements (one or many) */
  dCopyElement: TdWidgetData[]
  /** The currently selected element, data */
  selectItem: { data?: Record<string, any> | null, type?: string }
  /** Active mouse event */
  activeMouseEvent: MouseEvent | null
}

type TGetter = {
  // getWidgets(state: TWidgetState): TWidgetJsonData
}

type TAction = {
  /** 设置 mousemove 操作的初始值 */
  initDMove: (payload: TInidDMovePayload) => void
  /** 移动组件 */
  dMove: (payload: TMovePayload) => void
  updateGroupSize: (uuid: string) => void
  /** 设置 resize 操作的初始值 */
  initDResize: (payload: TInitResize) => void
  dResize: (payload: TdResizePayload) => void
  updateHoverUuid: (uuid: string) => void
  /** 更新组件数据 */
  updateWidgetData: (payload: TUpdateWidgetPayload) => void
  /** 一次更新多个widget */
  updateWidgetMultiple: (payload: TUpdateWidgetMultiplePayload) => void
  /** addWidget */
  addWidget: (setting: TdWidgetData) => void
  /** addGroup */
  addGroup: (group: TdWidgetData[]) => void
  /** setTemplate */
  setTemplate: (template: TdWidgetData[]) => void
  /** 删除组件 */
  deleteWidget: () => void
  /** 拷贝组件 */
  copyWidget: () => void
  /** 粘贴组件 */
  pasteWidget: () => void
  selectWidget: (data: TSelectWidgetData) => void
  /** 多选元素 */
  selectWidgetsInOut: (data: TSelectWidgetData) => void
  /** updateAlign */
  updateAlign: (data: TUpdateAlignData) => void
  /** updateLayerIndex */
  updateLayerIndex: (data: TupdateLayerIndexData) => void
  /** ungroup */
  ungroup: (uuid: string) => void
  /** 设置拖拽时在哪个图层 */
  setDropOver: (uuid: string) => void
  setSelectItem: (data: TselectItem) => void
  resize: (data: TSize) => void
  setWidgetStyle: (data: TsetWidgetStyleData) => void
  setDWidgets: (data: TdWidgetData[]) => void
  setDLayouts: (data: TdLayout[]) => void
  updateDWidgets: () => void
  lockWidgets: () => void
  setMouseEvent: (e: MouseEvent | null) => void
  setdActiveElement: (data: TdWidgetData) => void
  /** Changes the size of the design, reflowing the artwork onto it. */
  resizePages: (payload: TResizePagesPayload) => void
  /** Shows a page on the canvas. */
  showPage: (index: number) => void
  /** Adds an empty page after the current one. */
  addPage: () => void
  /** Copies a page, artwork and all. */
  duplicatePage: (index: number) => void
  /** Removes a page, or empties it when it is the only one. */
  removePage: (index: number) => void
  /** Reorders the pages. */
  movePage: (from: number, to: number) => void
  /** Names a page. */
  renamePage: (index: number, name: string) => void
  getWidgets: () => TdWidgetData[]
}

const WidgetStore = defineStore<"widgetStore", TWidgetState, TGetter, TAction>("widgetStore", {
  state: () => ({
    dActiveWidgetXY: {
      x: 0, // Starting x of the selected element
      y: 0, // Starting y of the selected element
    },
    dMouseXY: {
      x: 0, // Mouse x on press
      y: 0, // Mouse y on press
    },
    dResizeWH: {
      // 初始化调整大小时组件的宽高
      width: 0,
      height: 0,
    },
    dActiveElement: null, // Selected element or page
    dHoverUuid: '-1', // Mouse is over this layer
    dDropOverUuid: '', // Layer the drag is hovering over
    dWidgets: [], // Elements in use
    dLayouts: [{
      global: pageDefault,
      layers: []
    }], // Page and layer data
    dSelectWidgets: [], // Multi-selected elements
    selectItem: { data: null }, // The currently selected element, data
    activeMouseEvent: null, // Active mouse event
    dCopyElement: [], // Copied elements (one or many)
  }),

  // getters: {
  //   getWidgets(store) {
  //     return widgetJsonData(store)
  //   }
  // },

  actions: {
    initDMove(payload) { initDMove(this, payload) },
    dMove(payload) { dMove(this, payload) },
    updateGroupSize(uuid) { updateGroupSize(this, uuid) },
    initDResize(payload) { initDResize(this, payload) },
    dResize(payload) { dResize(this, payload) },
    updateHoverUuid(uuid) { updateHoverUuid(this, uuid) },
    updateWidgetData(payload) { updateWidgetData(this, payload) },
    updateWidgetMultiple(payload) { updateWidgetMultiple(this, payload) },
    addWidget(setting) { addWidget(this, setting) },
    addGroup(group) { addGroup(this, group) },
    setTemplate(template) { setTemplate(this, template) },
    deleteWidget() { deleteWidget(this) },
    copyWidget() { copyWidget(this) },
    pasteWidget() { pasteWidget(this) },
    selectWidget(data) { selectWidget(this, data) },
    selectWidgetsInOut(data) { selectWidgetsInOut(this, data) },
    updateAlign(data) { updateAlign(this, data) },
    updateLayerIndex(data) { updateLayerIndex(this, data) },
    ungroup(uuid) { ungroup(this, uuid) },
    setDropOver(uuid) { setDropOver(this, uuid) },
    setSelectItem(data: TselectItem) { selectItem(this, data) },
    resize(data) { resize(this, data) },
    setWidgetStyle(data) { setWidgetStyle(this, data) },
    setDWidgets(data) { setDWidgets(this, data) },
    updateDWidgets() { updateDWidgets(this) },
    lockWidgets() { lockWidgets(this) },
    setMouseEvent(event) { setMouseEvent(this, event) },
    setdActiveElement(data) { setdActiveElement(this, data) },
    resizePages(payload) { resizePages(this, payload) },
    showPage(index) { showPage(this, index) },
    addPage() { addPage(this) },
    duplicatePage(index) { duplicatePage(this, index) },
    removePage(index) { removePage(this, index) },
    movePage(from, to) { movePage(this, from, to) },
    renamePage(index, name) { renamePage(this, index, name) },
    setDLayouts(data) { setDLayouts(this, data) },
    getWidgets() {
      const pageStore = useCanvasStore() as TCanvasStore
      !this.dLayouts[pageStore.dCurrentPage] && pageStore.setDCurrentPage(pageStore.dCurrentPage - 1)
      // !this.dLayouts[pageStore.dCurrentPage] && pageStore.dCurrentPage--

      return this.dLayouts[pageStore.dCurrentPage].layers
    }
  }
})

export type TWidgetStore = Store<"widgetStore", TWidgetState, TGetter, TAction>

export default WidgetStore
