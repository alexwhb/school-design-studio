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
  <!-- Renders the page to an image for the cover thumbnail and the PNG export -->
  <SaveImage ref="canvasImage" />
</template>

<script lang="ts" setup>
import api from '@/api'
import { reactive, toRefs, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import _dl from '@/common/methods/download'
import useNotification from '@/common/methods/notification'
import SaveImage from '@/components/business/save-download/CreateCover.vue'
import { useFontStore } from '@/common/methods/fonts'
// import copyRight from './CopyRight.vue'
import _config from '@/config'
import downloadBlob from '@/common/methods/download/downloadBlob'
import { useControlStore, useHistoryStore, useCanvasStore, useUserStore, useWidgetStore } from '@/store/index'
import { storeToRefs } from 'pinia'
import watermarkOption from './Watermark.vue'
import themeToggle from './ThemeToggle.vue'

type TProps = {
  modelValue?: boolean
}

type TEmits = {
  (event: 'change', data: { downloadPercent: number; downloadText: string }): void
  (event: 'update:modelValue', data: boolean): void
}

type TState = {
  stateBollean: boolean
  wmBollean: boolean
  title: string
  loading: boolean
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const widgetStore = useWidgetStore()

const canvasImage = ref<typeof SaveImage | null>(null)

// const {
//   dWidgets, tempEditing
// } = useSetupMapGetters(['dWidgets', 'tempEditing'])

const pageStore = useCanvasStore()
const controlStore = useControlStore()
const historyStore = useHistoryStore()

const { dPage } = storeToRefs(pageStore)
const { tempEditing } = storeToRefs(userStore)
const { dWidgets, dLayouts } = storeToRefs(widgetStore)
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
async function download() {
  if (state.loading === true) {
    useNotification('Export in progress', 'Another export is already running. Please wait.')
    return
  }
  state.loading = true
  emit('update:modelValue', true)
  emit('change', { downloadPercent: 1, downloadText: 'Saving…' })
  const currentRecord = pageStore.dCurrentPage
  const backEndCapture: boolean = checkDownloadPoster(dLayouts.value[currentRecord])
  const fileName = `${state.title || 'Untitled design'}.png`
  if (!backEndCapture) {
    // 无特殊条件命中则直接从前端出图
    const { blob } = await canvasImage.value?.createPoster()
    downloadBlob(blob, fileName)
    emit('change', { downloadPercent: 100, downloadText: 'Your design has been downloaded' })
    state.loading = false
  }
  await save(true)
  const { id, tempid } = route.query
  if (!id && !tempid) {
    emit('change', { downloadPercent: 0, downloadText: 'Please wait…' })
    useNotification('Could not save', 'Pick a template first, then try again.', { type: 'error' })
    state.loading = false
    return
  }
  if (backEndCapture) {
    // 从服务端生成图片
    const { width, height } = dPage.value
    emit('update:modelValue', true)
    emit('change', { downloadPercent: 1, downloadText: 'Preparing your design...' })
    let timerCount = 0
    const animation = setInterval(() => {
      if (props.modelValue && timerCount < 75) {
        timerCount += RandomNumber(1, 10)
        emit('change', { downloadPercent: 1 + timerCount, downloadText: 'Building the image' })
      } else {
        clearInterval(animation)
      }
    }, 800)
    await _dl.downloadImg(
      api.home.download({ id, tempid, width, height, index: pageStore.dCurrentPage }) + '&r=' + Math.random(),
      (progress: number, xhr: any) => {
        if (props.modelValue) {
          clearInterval(animation)
          progress >= timerCount && emit('change', { downloadPercent: Number(progress.toFixed(0)), downloadText: 'Generating the image' })
        } else {
          xhr.abort()
          state.loading = false
        }
      },
      fileName,
    )
    emit('change', { downloadPercent: 100, downloadText: 'Your design has been downloaded', downloadMsg: '' })
    state.loading = false
  }
}
function RandomNumber(min: number, max: number) {
  return Math.ceil(Math.random() * (max - min)) + min
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

function draw() {
  return new Promise<string>((resolve) => {
    if (!canvasImage.value) resolve('')
    else {
      canvasImage.value.createCover(({ key }: { key: string }) => {
        resolve(_config.IMG_URL + key)
      })
    }
  })
}

function jump2Edit() {
  userStore.managerEdit(true)
}

function checkDownloadPoster({ layers }: any) {
  let backEndCapture = false
  for (let i = 0; i < layers.length; i++) {
    const { type, mask, textEffects } = layers[i]
    if ((type === 'w-image' && mask) || type === 'w-svg' || type === 'w-qrcode' || (textEffects && textEffects.length > 0)) {
      backEndCapture = true
      break
    }
  }
  return backEndCapture
}

function getTitle() {
  return state.title
}

defineExpose({
  getTitle,
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
