<!--
 * @Author: ShawnPhang
 * @Date: 2024-06-20 15:01:39
 * @Description: 缩放画板
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2025-03-24 14:47:12
-->
<template>
  <div id="zoom-control">
    <ul v-show="show" class="zoom-selecter">
      <li v-for="(item, index) in zoomList" :key="index" :class="['zoom-item', { 'zoom-item-active': activezoomIndex === index }]" @click.stop="selectItem(index)">
        <!-- <i v-if="item.icon" :class="['iconfont', item.icon]"></i> -->
        <span>{{ item.text }}</span>
        <i v-if="activezoomIndex === index" class="iconfont icon-selected"></i>
      </li>
    </ul>
    <div v-if="!hideControl" class="zoom-control-wrap">
      <div :class="['zoom-icon radius-left', { disable: activezoomIndex === 0 }]" @click.stop="activezoomIndex > 0 ? sub() : ''">
        <i class="iconfont icon-sub"></i>
      </div>
      <div :class="['zoom-text', { 'zoom-text-active': show }]" @click.stop="show = !show">{{ zoom.text }}</div>
      <div :class="['zoom-icon radius-right', { disable: otherIndex === otherList.length - 1 }]" @click.stop="otherIndex < otherList.length - 1 ? add() : ''">
        <i class="iconfont icon-add"></i>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import addMouseWheel from '@/common/methods/addMouseWheel'
import { OtherList, TZoomData, ZoomList } from './data';
// import { useSetupMapGetters } from '@/common/hooks/mapGetters';
import { useRoute } from 'vue-router';
import { storeToRefs } from 'pinia';
import { useCanvasStore, useForceStore } from '@/store';
import { findClosestNumber } from '@/utils/utils';

const route = useRoute()

// 组件大小控制器
let holder: number | undefined

const hideControl = ref(false)
const activezoomIndex = ref(0)
const zoomList = ref<TZoomData[]>(ZoomList)
const show = ref(false)
const zoom = ref<TZoomData>({
  value: 0,
  text: '',
})
const otherList = ref<TZoomData[]>(OtherList)
const otherIndex = ref(-1)
const bestZoom = ref(0)
const curAction = ref('')

// const { zoomScreenChange } = useSetupMapGetters(['zoomScreenChange'])
const canvasStore = useCanvasStore()
const { dPage } = storeToRefs(useCanvasStore())
const { zoomScreenChange } = storeToRefs(useForceStore())
const { dZoom, dScreen } = storeToRefs(canvasStore)
const presetPadding = canvasStore.dPresetPadding

watch(
  activezoomIndex,
  (data) => {
    if (data < 0 || data > zoomList.value.length - 1) {
      return
    }
    zoom.value = JSON.parse(JSON.stringify(zoomList.value[data]))
  }
)

watch(
  otherIndex,
  (data) => {
    if (data < 0 || data > otherList.value.length - 1) {
      return
    }
    zoom.value = JSON.parse(JSON.stringify(otherList.value[data]))
  }
)

watch(
  zoom,
  (data) => {
    let realValue = data.value
    if (realValue === -1) {
      realValue = calcZoom()
    }
    canvasStore.updateZoom(realValue)
    autoFixTop()
  }
)

watch(
  dScreen,
  () => {
    screenChange()
  },
  { deep: true, }
)

watch(
  zoomScreenChange,
  () => {
    activezoomIndex.value = zoomList.value.length - 1
    screenChange()
  }
)

watch(
  dPage,
  () => {
    screenChange()
  },
  { deep: true }
)

onMounted(async () => {
  await nextTick()
  window.addEventListener('click', close)
  if (route.path === '/draw') {
    activezoomIndex.value = 3
    hideControl.value = true
  } else {
    activezoomIndex.value = zoomList.value.length - 1
  }
  // 添加滚轮监听
  addMouseWheel('page-design', (isDown: boolean) => {
    mousewheelZoom(isDown)
  })
  // 添加窗口大小监听
  window.addEventListener('resize', (event) => {
    changeScreen()
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('click', close)
})

    // ...mapActions(['updateZoom', 'updateScreen']),
function changeScreen() {
  clearTimeout(holder)
  holder = setTimeout(() => {
    const screen = document.getElementById('page-design')
    if (!screen) return
    canvasStore.updateScreen({
      width: screen.offsetWidth,
      height: screen.offsetHeight,
    })
  }, 300)
}

function screenChange() {
  // 弹性尺寸即时修改
  if (activezoomIndex.value === zoomList.value.length - 1) {
    canvasStore.updateZoom(calcZoom())
    autoFixTop()
  }
}

function selectItem(index: number) {
  activezoomIndex.value = index
  otherIndex.value = -1
  show.value = false
}

function close(_: MouseEvent) {
  show.value = false
}

function add() {
  curAction.value = 'add'
  show.value = false
  if (
    activezoomIndex.value === zoomList.value.length - 2 ||
    activezoomIndex.value === zoomList.value.length - 1
  ) {
    activezoomIndex.value = zoomList.value.length
    // this.otherIndex += 1
    if (bestZoom.value) {
      nearZoom(true)
    } else {
      otherIndex.value += 1
    }
    return
  }
  if (activezoomIndex.value != zoomList.value.length) {
    activezoomIndex.value++
    return
  }
  if (otherIndex.value < otherList.value.length - 1) {
    otherIndex.value++
  }
}

function sub() {
  curAction.value = ''
  show.value = false
  if (otherIndex.value === 0) {
    otherIndex.value = -1
    activezoomIndex.value = zoomList.value.length - 2
    return
  }
  if (otherIndex.value != -1) {
    otherIndex.value--
    return
  }
  if (activezoomIndex.value === zoomList.value.length - 1) {
    if (bestZoom) {
      nearZoom()
    } else {
      activezoomIndex.value = zoomList.value.length - 2
    }
    return
  }
  if (activezoomIndex.value != 0) {
    activezoomIndex.value--
  }
}

function mousewheelZoom(down: boolean) {
  const value = Number(dZoom.value.toFixed(0))
  if (down && value <= 1) return
  canvasStore.updateZoom(down ? value - 2 : value + 2)
  zoom.value.text = (value + '%') as any
  zoom.value.value = value
  autoFixTop()
  const closest = findClosestNumber(value, zoomList.value.map(x => x.value))
  activezoomIndex.value = zoomList.value.findIndex(x => x.value === closest)
}

function nearZoom(add?: boolean) {
  for (let i = 0; i < zoomList.value.length; i++) {
    activezoomIndex.value = i
    if (zoomList.value[i].value > bestZoom.value) {
      if (add) break
    } else if (zoomList.value[i].value < bestZoom.value) {
      if (!add) break
    }
  }
  bestZoom.value = 0
}

function calcZoom() {
  // let widthZoom = ((dScreen.value.width - 142) * 100) / dPage.value.width
  // let heightZoom = ((dScreen.value.height - 122) * 100) / dPage.value.height
  const diffHeight = presetPadding * 2 + 2 + canvasStore.dBottomHeight
  const diffWidth = presetPadding * 2 + 22
  let widthZoom = ((dScreen.value.width - diffWidth) * 100) / dPage.value.width
  let heightZoom = ((dScreen.value.height - diffHeight) * 100) / dPage.value.height
  bestZoom.value = Math.min(widthZoom, heightZoom)
  return bestZoom.value
}

async function autoFixTop() {
  await nextTick()
  const el = document.getElementById('out-page')
  if (!el) return
  const headerBarHeight = 54
  const clientHeight = window.innerHeight - headerBarHeight - canvasStore.dBottomHeight
  // const parentHeight = (el.offsetParent as HTMLElement).offsetHeight - 54
  let padding = (clientHeight - el.offsetHeight) / 2
  if (typeof curAction.value === 'undefined') {
    padding += presetPadding / 2
  }
  curAction.value === 'add' && (padding -= presetPadding)
  canvasStore.updatePaddingTop(padding > 0 ? padding : 0)
}

defineExpose({
  screenChange,
  add,
  sub
})

</script>

<style lang="less" scoped>
// Floating zoom control, bottom-right of the page well.
#zoom-control {
  bottom: 12px;
  position: absolute;
  right: @style-panel-width + 12px;
  z-index: 1000;

  .zoom-control-wrap {
    display: flex;
    flex-direction: row;
    align-items: center;
    height: 34px;
    background: @surface;
    border: 1px solid @line;
    border-radius: @radius;
    overflow: hidden;

    .zoom-icon {
      align-items: center;
      color: @ink-2;
      cursor: pointer;
      display: flex;
      justify-content: center;
      width: 32px;
      height: 100%;
      font-size: 13px;
      &:hover {
        background-color: @surface-2;
        color: @ink;
      }
    }

    .disable {
      color: @ink-4;
      &:hover {
        background-color: transparent;
        color: @ink-4;
        cursor: not-allowed;
      }
    }

    // Wide enough for "Fit to screen" to stay on one line.
    .zoom-text {
      user-select: none;
      align-items: center;
      color: @ink-2;
      cursor: pointer;
      display: flex;
      justify-content: center;
      min-width: 104px;
      padding: 0 10px;
      height: 100%;
      font-size: @text-base;
      font-weight: 500;
      white-space: nowrap;
      border-left: 1px solid @line;
      border-right: 1px solid @line;
      &:hover {
        background-color: @surface-2;
        color: @ink;
      }
    }
    .zoom-text-active {
      background-color: @surface-2;
      color: @ink;
    }
  }

  .zoom-selecter {
    background-color: @surface;
    border: 1px solid @line;
    border-radius: @radius;
    box-shadow: @shadow-pop;
    color: @ink-2;
    position: absolute;
    top: -8px;
    transform: translateY(-100%);
    width: 100%;
    padding: 4px;
    z-index: 1000;

    .zoom-item {
      align-items: center;
      border-radius: @radius-sm;
      cursor: pointer;
      display: flex;
      font-size: @text-base;
      height: 30px;
      padding: 0 8px;
      width: 100%;
      white-space: nowrap;

      span {
        flex: 1;
      }
      i {
        font-size: 12px;
        color: @accent;
      }
      &:hover {
        background-color: @surface-2;
        color: @ink;
      }
    }
    .zoom-item-active {
      color: @accent;
      font-weight: 500;
    }
  }
}
</style>
