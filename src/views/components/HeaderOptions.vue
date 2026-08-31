<!--
 * @Author: ShawnPhang
 * @Date: 2022-01-12 11:26:53
 * @Description: 顶部操作按钮组
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-17 09:49:01
-->
<template>
  <div class="top-title">
    <el-input v-model="state.title" placeholder="Untitled design" class="input-wrap" />
  </div>
  <div class="top-icon-wrap">
    <template v-if="tempEditing">
      <el-button plain type="primary" @click="saveTemp">Save template</el-button>
      <el-button @click="userStore.managerEdit(false)">Cancel</el-button>
      <div class="top-nav-divider" />
    </template>
    <el-button v-else text @click="jump2Edit">Edit template</el-button>
    <watermark-option />
    <theme-toggle />
    <div class="top-nav-divider" />
    <slot />
  </div>
</template>

<script lang="ts" setup>
import api from '@/api'
import { reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import useNotification from '@/common/methods/notification'
import { useFontStore } from '@/common/methods/fonts'
// import copyRight from './CopyRight.vue'
import downloadBlob from '@/common/methods/download/downloadBlob'
import { withPageRenderer } from '@/common/methods/export/renderPage'
import { dataUrlToBlob, safeFileName } from '@/common/methods/export/utils'
import { useControlStore, useHistoryStore, useCanvasStore, useUserStore, useWidgetStore } from '@/store/index'
import { storeToRefs } from 'pinia'
import watermarkOption from './Watermark.vue'
import themeToggle from './ThemeToggle.vue'

type TProps = {
  modelValue?: boolean
}

type TEmits = {
  (event: 'change', data: { downloadPercent: number; downloadText: string; downloadMsg?: string }): void
  (event: 'update:modelValue', data: boolean): void
}

type TState = {
  stateBollean: boolean
  wmBollean: boolean
  title: string
  loading: boolean
}

defineProps<TProps>()
const emit = defineEmits<TEmits>()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const widgetStore = useWidgetStore()

// const {
//   dWidgets, tempEditing
// } = useSetupMapGetters(['dWidgets', 'tempEditing'])

const pageStore = useCanvasStore()
const controlStore = useControlStore()
const historyStore = useHistoryStore()

const { dPage } = storeToRefs(pageStore)
const { tempEditing } = storeToRefs(userStore)
const { dWidgets } = storeToRefs(widgetStore)
const { dHistoryStack } = storeToRefs(useHistoryStore())

const state = reactive<TState>({
  stateBollean: false,
  wmBollean: false,
  title: '',
  loading: false,
})

// 保存作品
async function save(hasCover: boolean = false) {
  // 保存用户作品的原理和Save template是相通的，所以这里反过来用模板示例
  await saveTemp()
  // // 没有任何修改记录则不保存
  // if (dHistoryStack.value.changes.length <= 0) {
  //   return
  // }
  // controlStore.setShowMoveable(false) // Clear the previous selection box
  // const { id, tempid } = route.query
  // const data = widgetStore.dLayouts
  // const { id: newId, stat, msg } = await api.home.saveWorks({ id: id as string, title: state.title || 'Untitled design', data: JSON.stringify(data), temp_id: tempid as string, width: dPage.value.width, height: dPage.value.height })
  // stat !== 0 ? useNotification('Saved', '可在"My designs"中查看') : useNotification('Could not save', msg, { type: 'error' })
  // !id && router.push({ path: '/home', query: { id: newId }, replace: true })
  // controlStore.setShowMoveable(true)
}

// Save template
async function saveTemp() {
  const { tempid, tempType: type } = route.query
  if (!tempid) return
  let res = null
  const data = widgetStore.dLayouts
  if (Number(type) == 1) {
    // 保存组件，组合元素要保证在最后一位，才能默认选中
    if (dWidgets.value[0].type === 'w-group') {
      const group = dWidgets.value.shift()
      if (!group) return
      // A page carries no `record`, so the type allows it to be missing.
      if (!group.record) return
      group.record.width = 0
      group.record.height = 0
      dWidgets.value.push(group)
    }
    // TODO：如果保存组件不存在组合，则添加组合。该功能待优化
    if (!dWidgets.value.some((x: Record<string, any>) => x.type === 'w-group')) {
      alert('An element must be grouped before you can save it.')
      return
      // proxy.dWidgets.push(wGroup.setting)
    }
    res = await api.home.saveTemp({ id: tempid, type, title: state.title || 'Untitled element', data: JSON.stringify(dWidgets.value), width: dPage.value.width, height: dPage.value.height })
  } else res = await api.home.saveTemp({ id: tempid, title: state.title || 'Untitled template', data: JSON.stringify(data), width: dPage.value.width, height: dPage.value.height })
  res.stat != 0 && useNotification('Saved', 'Your template has been updated')
  !tempid && router.push({ path: '/home', query: { tempid: res.id }, replace: true })
}

// 停用启用
async function stateChange(e: string | number | boolean) {
  const { tempid, tempType: type } = route.query
  const { stat } = await api.home.saveTemp({ id: tempid, type, state: e ? 1 : 0 })
  stat != 0 && useNotification('Saved', 'Your template has been updated')
}
/**
 * Exports the current page as a PNG.
 *
 * Everything is drawn in the browser, by the same renderer the PowerPoint
 * export uses. Upstream sent designs containing an SVG shape, a masked image, a
 * QR code or text effects to a Puppeteer screenshot service instead — a backend
 * this fork does not run, so those exports came back as whatever the web server
 * answered `/api/screenshots` with: a 1KB HTML page saved under a .png name.
 */
async function download(scale = 1) {
  if (state.loading === true) {
    useNotification('Export in progress', 'Another export is already running. Please wait.')
    return
  }
  state.loading = true
  emit('update:modelValue', true)
  emit('change', { downloadPercent: 5, downloadText: 'Preparing your design…' })

  try {
    const dataUrl = await withPageRenderer((renderer) => {
      emit('change', { downloadPercent: 35, downloadText: 'Drawing the page' })
      return renderer.renderPage(pageStore.dCurrentPage, scale)
    })
    if (!dataUrl) throw new Error('The page could not be drawn.')

    emit('change', { downloadPercent: 90, downloadText: 'Saving the image' })
    downloadBlob(dataUrlToBlob(dataUrl), safeFileName(state.title, 'png'))
    emit('change', { downloadPercent: 100, downloadText: 'Your design has been downloaded', downloadMsg: '' })
  } catch (e: any) {
    console.error('[export] image export failed', e)
    emit('change', { downloadPercent: 0, downloadText: '' })
    useNotification('Could not export', e?.message || 'Sorry, that export did not work. Please try again.', { type: 'error' })
    return
  } finally {
    state.loading = false
  }

  // The file is already on disk, so a failure to save the template must not
  // read as a failed export.
  try {
    await save(true)
  } catch (e) {
    console.warn('[export] could not save the design after exporting', e)
  }
}

async function load(cb: () => void) {
  const { id, tempid: tempId, tempType: type, w_h } = route.query
  if (route.name !== 'Draw') {
    await useFontStore.init() // Load the fonts
  }
  const apiName = tempId && !id ? 'getTempDetail' : 'getWorks'
  if (w_h && !id && !tempId) {
    // 用于Set the starting page size for a blank design
    const wh: any = w_h.toString().split('*')
    wh[0] && (dPage.value.width = wh[0])
    wh[1] && (dPage.value.height = wh[1])
  }
  if (!id && !tempId) {
    initBoard()
    cb()
    return
  }
  // Everything out of route.query is a string or an array of them; the API
  // takes numbers.
  const { data: content, title, state: _state, width, height } = await api.home[apiName]({ id: Number(id || tempId), type: type == null ? undefined : Number(type) })
  if (!content) return
  const data = JSON.parse(content)
  state.stateBollean = !!_state
  state.title = title
  controlStore.setShowMoveable(false) // Clear the previous selection box
  if (Number(type) === 1) {
    // A saved element. Grouped ones arrive as an array with a w-group
    // container; a single styled text box arrives as one bare widget. The
    // panel already handles both, but this path always called addGroup, so
    // opening a single-widget element by URL threw and rendered nothing.
    dPage.value.width = width
    dPage.value.height = height
    if (Array.isArray(data)) {
      widgetStore.addGroup(data)
    } else {
      data.text && (data.text = decodeURIComponent(data.text))
      widgetStore.addWidget(data)
    }
  } else {
    if (Array.isArray(data)) {
      widgetStore.dLayouts = data
      widgetStore.setDWidgets(widgetStore.getWidgets())
    } else {
      widgetStore.dLayouts = [{ global: data.page, layers: data.widgets }]
      id ? widgetStore.setDWidgets(widgetStore.getWidgets()) : widgetStore.setTemplate(widgetStore.getWidgets())
    }
    pageStore.setDPage(pageStore.getDPage())
    // id ? widgetStore.setDWidgets(data.widgets) : widgetStore.setTemplate(data.widgets)
  }
  cb()
}

function initBoard() {
  widgetStore.setDWidgets(widgetStore.getWidgets())
  pageStore.setDPage(pageStore.getDPage())
}

function jump2Edit() {
  userStore.managerEdit(true)
}

function getTitle() {
  return state.title
}

/** Puts a name back in the box — used when a saved design is restored. */
function setTitle(title: string) {
  state.title = title || ''
}

defineExpose({
  getTitle,
  setTitle,
  download,
  save,
  saveTemp,
  stateChange,
  load,
})
</script>

<style lang="less" scoped>
// The design's name sits between the menus and the actions. It reads as plain
// text until you reach for it, so it does not compete with the toolbar.
.top-title {
  flex: 1;
  min-width: 0;
  padding-left: 10px;

  .input-wrap {
    width: 100%;
    max-width: 320px;

    :deep(.el-input__wrapper) {
      background: transparent;
      box-shadow: none;
      padding-left: 8px;
      padding-right: 8px;
    }
    :deep(input) {
      color: @ink;
      font-size: @text-md;
      font-weight: 500;
      &::placeholder {
        color: @ink-4;
        font-weight: 400;
      }
    }
    &:hover :deep(.el-input__wrapper) {
      background: @surface-2;
    }
    :deep(.el-input__wrapper.is-focus) {
      background: @surface;
      box-shadow: 0 0 0 1px @accent inset;
    }
  }
}

.top-icon-wrap {
  display: flex;
  align-items: center;
  gap: 4px;
  height: @topbar-height;
  flex-shrink: 0;
}
</style>
