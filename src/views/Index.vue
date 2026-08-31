<!--
 * @Author: ShawnPhang
 * @Date: 2023-09-18 17:34:44
 * @Description: 
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastUpdateContent: Support typescript
 * @LastEditTime: 2024-08-12 15:53:20
-->
<template>
  <div id="page-design-index" ref="pageDesignIndex" class="page-design-bg-color">
    <div :style="state.style" class="top-nav">
      <div class="top-nav-wrap">
        <div class="top-left">
          <div class="name" @click="jump2home">{{ state.APP_NAME }}</div>
          <Folder @select="dealWith" ref="ref1"> <div class="operation-item"><i class="icon sd-wenjian" /> <span class="text">File</span></div> </Folder>
          <Helper @select="dealWith"> <div class="operation-item"><i class="icon sd-bangzhu" /> <span class="text">Help</span></div> </Helper>
          <div class="top-nav-divider" />
          <div class="operation">
            <el-tooltip :show-after="400" :hide-after="0" effect="dark" content="Undo" placement="bottom">
              <div :class="['operation-item', { disable: !undoable }]" @click="undoable ? handleHistory('undo') : ''"><i class="iconfont icon-undo" /></div>
            </el-tooltip>
            <el-tooltip :show-after="400" :hide-after="0" effect="dark" content="Redo" placement="bottom">
              <div :class="['operation-item', { disable: !redoable }]" @click="redoable ? handleHistory('redo') : ''"><i class="iconfont icon-redo" /></div>
            </el-tooltip>
          </div>
        </div>
        <HeaderOptions ref="optionsRef" v-model="state.isContinue" @change="optionsChange">
          <ExportMenu ref="ref4" :get-title="getDesignTitle" @select="dealWith" @progress="optionsChange" />
        </HeaderOptions>
      </div>
    </div>
    <div class="page-design-index-wrap">
      <widget-panel ref="ref2"></widget-panel>
      <design-board class="page-design-wrap" pageDesignCanvasId="page-design-canvas">
        <!-- 用于挡住画布溢出部分，因为使用overflow有bug -->
        <div class="shelter" :style="{ width: Math.floor((dPage.width * dZoom) / 100) + 'px', height: Math.floor((dPage.height * dZoom) / 100) + 'px' }"></div>
        <!-- 提供一个背景图层 -->
        <div class="shelter-bg transparent-bg" :style="{ width: Math.floor((dPage.width * dZoom) / 100) + 'px', height: Math.floor((dPage.height * dZoom) / 100) + 'px' }"></div>
        <!-- 多画板操作组件 -->
        <template #bottom> <multipleBoards /> </template>
      </design-board>
      <style-panel ref="ref3"></style-panel>
    </div>
    <!-- 标尺 -->
    <line-guides :show="state.showLineGuides" />
    <!-- 缩放控制 -->
    <zoom-control ref="zoomControlRef" />
    <!-- 右键菜单 -->
    <right-click-menu />
    <!-- 旋转缩放组件 -->
    <Moveable />
    <!-- 遮罩百分比进度条 -->
    <ProgressLoading
      :percent="state.downloadPercent"
      :text="state.downloadText"
      :msg="state.downloadMsg"
      cancelText="Cancel"
      @cancel="downloadCancel"
      @done="state.downloadPercent = 0"
    />
    <!-- 漫游导航 -->
    <Tour ref="tourRef" :steps="[ref1, ref2, ref3, ref4]" />
    <!-- New design -->
    <createDesign ref="createDesignRef" />
  </div>
</template>

<script lang="ts" setup>
import _config from '../config'
import {
  CSSProperties, computed, nextTick,
  onBeforeUnmount, onMounted, reactive, ref, Ref
} from 'vue'
import RightClickMenu from '@/components/business/right-click-menu/RcMenu.vue'
import Moveable from '@/components/business/moveable/Moveable.vue'
import designBoard from '@/components/modules/layout/designBoard/index.vue'
import zoomControl from '@/components/modules/layout/zoomControl/index.vue'
import lineGuides from '@/components/modules/layout/lineGuides.vue'
import shortcuts from '@/mixins/shortcuts'
import HeaderOptions from './components/HeaderOptions.vue'
import Folder from './components/Folder.vue'
import Helper from './components/Helper.vue'
import ProgressLoading from '@/components/common/ProgressLoading/download.vue'
import { wGroupSetting } from '@/components/modules/widgets/wGroup/groupSetting'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useControlStore, useHistoryStore, useWidgetStore, useGroupStore } from '@/store'
import type { ButtonInstance } from 'element-plus'
import Tour from './components/Tour.vue'
import createDesign from '@/components/business/create-design'
import ExportMenu from './components/ExportMenu.vue'
import multipleBoards from '@/components/modules/layout/multipleBoards'
import useHistory from '@/common/hooks/history'
import useAutosave from '@/common/hooks/autosave'
import { useRoute } from 'vue-router'
useHistory()

const ref1 = ref<ButtonInstance>()
const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()
const ref4 = ref<ButtonInstance>()

type TState = {
  style: CSSProperties
  downloadPercent: number // Download progress
  downloadText: string
  downloadMsg: string | undefined
  isContinue: boolean
  APP_NAME: string
  showLineGuides: boolean
}

// const {
//   dActiveElement, dCopyElement
// } = useSetupMapGetters(['dActiveElement', 'dCopyElement'])
const widgetStore = useWidgetStore()
const historyStore = useHistoryStore()
const groupStore = useGroupStore()
const { dPage } = storeToRefs(useCanvasStore())
const { dZoom } = storeToRefs(useCanvasStore())
const { dHistoryParams, dHistoryStack } = storeToRefs(useHistoryStore())

const state = reactive<TState>({
  style: {
    left: '0px',
  },
  // openDraw: false,
  downloadPercent: 0, // Download progress
  downloadText: '',
  downloadMsg: '',
  isContinue: true,
  APP_NAME: _config.APP_NAME,
  showLineGuides: false,
})
const optionsRef = ref<typeof HeaderOptions | null>(null)
const route = useRoute()
// The design's name lives in the toolbar's own state, so autosave reads and
// writes it through there rather than keeping a second copy.
const autosave = useAutosave({
  getTitle: () => getDesignTitle(),
  setTitle: (title: string) => optionsRef.value?.setTitle(title),
})
const zoomControlRef = ref<typeof zoomControl | null>(null)
const controlStore = useControlStore()
const createDesignRef: Ref<typeof createDesign | null> = ref(null)

// The design is saved as it changes, so this is only about the couple of
// seconds between the last edit and the write that has not happened yet.
const beforeUnload = function (e: Event): any {
  if (autosave.isDirty()) {
    const confirmationMessage: string = 'Your most recent changes have not been saved yet.';
    (e || window.event).returnValue = (confirmationMessage as any) // Gecko and Trident
    return confirmationMessage // Gecko and WebKit
  } else return false
}

!_config.isDev && window.addEventListener('beforeunload', beforeUnload)

function jump2home() {
  // Where the app name links back to. Set HOME_URL when embedding the editor
  // in another app so this returns people to that app rather than reloading.
  window.location.href = _config.HOME_URL
}

const undoable = computed(() => {
  return dHistoryParams.value.stackPointer >= 0
  // return !(
  //   dHistoryParams.value.index === -1 || 
  //   (dHistoryParams.value.index === 0 && dHistoryParams.value.length === dHistoryParams.value.maxLength))
})

const redoable = computed(() => {
  return !(dHistoryParams.value.stackPointer === dHistoryStack.value.changes.length - 1)
})

function zoomSub() {
  if (!zoomControlRef.value) return
  zoomControlRef.value.sub()
}

function zoomAdd() {
  if (!zoomControlRef.value) return
  zoomControlRef.value.add()
}

function save() {
  void autosave.saveNow()
}

const { handleKeydowm, handleKeyup, dealCtrl } = shortcuts.methods
let checkCtrl: number | undefined
const instanceFn = { save, zoomAdd, zoomSub }

onMounted(() => {
  groupStore.initGroupJson(JSON.stringify(wGroupSetting))
  // store.dispatch('initGroupJson', JSON.stringify(wGroupSetting))
  // initGroupJson(JSON.stringify(wGroup.setting))
  window.addEventListener('scroll', fixTopBarScroll)
  // window.addEventListener('click', this.clickListener)
  document.addEventListener('keydown', handleKeydowm(controlStore, checkCtrl, instanceFn, dealCtrl), false)
  document.addEventListener('keyup', handleKeyup(controlStore, checkCtrl), false)
  loadData()
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', fixTopBarScroll)
  // window.removeEventListener('click', this.clickListener)
  document.removeEventListener('keydown', handleKeydowm(controlStore, checkCtrl, instanceFn, dealCtrl), false)
  document.removeEventListener('keyup', handleKeyup(controlStore, checkCtrl), false)
  document.oncontextmenu = null
})

function handleHistory(data: "undo" | "redo") {
  historyStore.handleHistory(data)
}

function changeLineGuides() {
  state.showLineGuides = !state.showLineGuides
}

function downloadCancel() {
  state.downloadPercent = 0
  state.isContinue = false
}

function loadData() {
  // Load the page
  if (!optionsRef.value) return
  optionsRef.value.load(async () => {
    if (!zoomControlRef.value) return
    // await nextTick()
    // zoomControlRef.value.screenChange()
    // Select the page by default:page
    widgetStore.selectWidget({ uuid: '-1' })
    // Offer the last design back, but only on a blank canvas: arriving with an
    // id or a template id is a request for that design, and asking about a
    // different one would be an interruption. Watching starts either way.
    const { id, tempid } = route.query
    await autosave.restoreThenWatch(!id && !tempid)
  })
}

function fixTopBarScroll() {
  const scrollLeft = document.documentElement.scrollLeft || document.body.scrollLeft
  state.style.left = `-${scrollLeft}px`
}

function optionsChange({ downloadPercent, downloadText, downloadMsg }: { downloadPercent: number, downloadText: string, downloadMsg?: string }) {
  state.downloadPercent = downloadPercent
  state.downloadText = downloadText
  state.downloadMsg = downloadMsg
}

/** The design's current name, read at the moment of export. */
function getDesignTitle(): string {
  return optionsRef.value?.getTitle() || 'Untitled design'
}

const tourRef = ref<any>()
const fns: any = {
  openTour: () => {
    tourRef.value.open()
  },
  save,
  // The export menu passes the chosen quality; the File menu has no such
  // choice and leaves it to the default.
  download: (scale?: number) => {
    optionsRef.value?.download(scale)
  },
  changeLineGuides,
  newDesign: () => {
    createDesignRef.value?.open()
  }
}
const dealWith = (fnName: string, params?: any) => {
  fns[fnName](params)
}

defineExpose({
  jump2home,
})
</script>

<style lang="less" scoped>
@import url('@/assets/styles/design.less');
</style>
