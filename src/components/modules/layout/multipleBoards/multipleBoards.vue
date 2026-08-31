<!--
 * @Author: ShawnPhang
 * @Date: 2024-04-11 17:27:58
 * @Description: 多画板操作界面
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-18 17:12:34
-->
<template>
  <div :style="{ position, bottom: -1 * st + 'px', left: sl + 'px' }" :class="['artboards', isFold ? 'fold' : 'unfold']">
    <div ref="listRef" class="wrap">
      <div v-if="isFold" v-show="dLayouts.length > 0" class="btn" @click="isFold = !isFold">Page {{ index + 1 }}/{{ dLayouts.length }} <i class="icon sd-zhankai" /></div>
      <div class="list" v-else>
        <span @click="isFold = !isFold" class="icon-btn"><i class="icon sd-zhankai" /></span>
        <div v-for="(l, li) in dLayouts" :key="'l' + li" :style="{ width: getPW(l.global) + 'px' }" @click="selectPoster(li)" :class="['item-box', index == li ? 'item-select' : 'item-default']">
          <div
            class="mini-poster"
            :style="{
              transform: getTransform(l.global),
              width: l.global.width + 'px',
              height: l.global.height + 'px',
              backgroundColor: l.global.backgroundGradient ? undefined : l.global.backgroundColor,
              backgroundImage: l.global.backgroundImage ? `url(${l.global?.backgroundImage})` : l.global.backgroundGradient || undefined,
              backgroundSize: l.global.backgroundTransform?.x ? 'auto' : 'cover',
              backgroundPositionX: (l.global.backgroundTransform?.x || 0) + 'px',
              backgroundPositionY: (l.global.backgroundTransform?.y || 0) + 'px',
            }"
          >
            <component :is="layer.type + '-static'" v-for="layer in getlayers(l.layers)" :key="layer.uuid" :params="layer" :parent="l.global">
              <template v-if="layer.isContainer">
                <component :is="widget.type + '-static'" v-for="widget in getChilds(l.layers, layer.uuid)" :key="widget.uuid" :params="widget" :parent="layer" />
              </template>
            </component>
          </div>
          <div class="item-idx">{{ li + 1 }}</div>
          <i @click.stop="removePoster(li)" class="icon sd-quxiao" />
        </div>
        <div v-show="dLayouts.length < 9" @click="addLayer" class="item-add"><i class="iconfont icon-add" /></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, onMounted, nextTick, watch, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useWidgetStore, useForceStore, useControlStore } from '@/store'
import { ElMessage } from 'element-plus'
const forceStore = useForceStore()
const canvasStore = useCanvasStore()
const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const position: Ref = ref('absolute') // sticky
const isFold = ref(true)
const st = ref(0)
const sl = ref(0)
const listRef: Ref<HTMLElement | null> = ref(null)
const index = computed(() => canvasStore.dCurrentPage)
const { dZoom, dPage } = storeToRefs(canvasStore)
const { dWidgets, dLayouts } = storeToRefs(widgetStore)

watch(
  () => dZoom.value,
  (val) => {
    // 在画布缩放时bottom复位
    mainEl.scrollTop = 0
  },
)

watch(
  () => isFold.value,
  (isFold) => {
    canvasStore.setBottomHeight(isFold ? 0 : 90)
    setTimeout(() => {
      forceStore.setZoomScreenChange()
    }, 300)
  },
)

let mainEl: any = null

onMounted(async () => {
  await nextTick()
  mainEl = document.getElementById('main')
  mainEl.addEventListener('scroll', function (e: any) {
    st.value = mainEl.scrollTop
    sl.value = mainEl.scrollLeft
  })

  listRef.value?.addEventListener('wheel', (event) => {
    event.preventDefault()
    // 使用滚轮横向滚动
    listRef.value.scrollLeft += event.deltaY
  })
})

/** 计算变换量 */
function getTransform(global: any) {
  const { width, height } = global
  const isVertical = height > width
  const edge = isVertical ? Math.max(width, height) : Math.min(width, height)
  const s = 72 / edge
  const left = isVertical ? ((72 - width * s) / 2 - 1) / s : 0
  return `scale(${s}) translateX(${left}px)`
}
/** 计算实际宽度 */
function getPW(global: any) {
  const { width, height } = global
  const isVertical = height > width
  const s = 72 / Math.min(width, height)
  return isVertical ? 72 : width * s
}

function getlayers(widgets: any) {
  return widgets.filter((item: any) => item.parent === dPage.value.uuid)
}

function getChilds(widgets: any, uuid: string) {
  return widgets.filter((item: any) => item.parent === uuid)
}

function getInitPage() {
  const clonePage = JSON.parse(JSON.stringify(dPage.value))
  clonePage.backgroundColor = '#ffffffff'
  clonePage.backgroundGradient = ''
  clonePage.backgroundImage = ''
  return clonePage
}

function addLayer() {
  controlStore.setShowMoveable(false) // Clear the previous selection box
  widgetStore.dLayouts.push({ global: getInitPage(), layers: [] })
  canvasStore.dCurrentPage = dLayouts.value.length - 1
  widgetStore.setDWidgets(widgetStore.getWidgets())
  canvasStore.setDPage(getInitPage())
  canvasStore.updateDPage()
  widgetStore.selectWidget({ uuid: '-1' })
}

function selectPoster(i: number) {
  controlStore.setShowMoveable(false) // Clear the previous selection box
  canvasStore.dCurrentPage = i
  widgetStore.setDWidgets(widgetStore.getWidgets())
  canvasStore.setDPage(dLayouts.value[i].global)
  widgetStore.selectWidget({ uuid: '-1' })
}
function removePoster(removeIndex: number) {
  if (index.value === removeIndex) {
    // 当前画布下，清空画布内容而非删除
    widgetStore.dLayouts[removeIndex].layers.length = 0
    ElMessage('The page is now empty')
    widgetStore.setDWidgets([]) // Clear all layers
    // widgetStore.updateDWidgets()
    // widgetStore.dLayouts[removeIndex].global = getInitPage()
    canvasStore.setDPage(getInitPage()) // Reset the background
    // canvasStore.updateDPage()
    // widgetStore.setDWidgets([])
  } else widgetStore.dLayouts.splice(removeIndex, 1)
}
</script>

<style lang="less" scoped>
// The page strip along the bottom. Collapsed it is a small pill showing which
// page you are on; expanded it is a row of thumbnails.
.artboards {
  left: 0;
  z-index: 99;
  padding: 0 12px;
  font-size: @text-base;
  color: @ink-2;
  font-weight: 500;
  transition: all 0.3s;

  .icon {
    transition: transform 0.2s ease;
    color: @ink-4;
  }
  .list {
    display: flex;
    align-items: center;
  }

  .item-box,
  .item-add {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: @radius;
    margin: 5px 0 0 10px;
    background: @surface;
    overflow: hidden;
    border: 1px solid @line;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }
  .item-box:hover .sd-quxiao {
    opacity: 1;
  }

  .sd-quxiao,
  .item-idx {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .item-idx {
    font-size: @text-xs;
    bottom: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    color: @ink-3;
    background: @surface;
    box-shadow: 0 0 0 1px @line;
  }
  .sd-quxiao {
    opacity: 0;
    font-size: 10px;
    width: 16px;
    height: 16px;
    border: 1px solid @line;
    cursor: pointer;
    background-color: @surface;
    color: @ink-3;
    right: 3px;
    top: 3px;
    transition: color 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
    &:hover {
      color: @danger;
      border-color: @danger;
    }
  }

  .item-add {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: @ink-4;
    background: @surface-2;
    .icon-add {
      font-size: 18px;
    }
    &:hover {
      color: @accent;
      border-color: @accent-border;
      background: @accent-soft;
    }
  }

  .item-default:hover {
    border-color: @line-strong;
  }
  // Selected page: a ring in the accent colour, not a heavy glow.
  .item-select {
    border-color: @accent;
    box-shadow: 0 0 0 2px @accent-a25;
  }
  .item-box:first-of-type,
  .item-box:first-child {
    margin-left: 0;
  }
}

.unfold {
  width: calc(100% - 155px);
  height: 90px;
  .wrap {
    padding: 8px 10px;
    height: 100%;
    background-color: @surface;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid @line;
    border-radius: @radius-lg;

    .icon-btn {
      cursor: pointer;
      width: 34px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: @ink-4;
      &:hover {
        color: @ink;
      }
    }
    .sd-zhankai {
      font-size: 14px;
    }
  }
}

.fold {
  cursor: pointer;
  width: 150px;
  text-align: center;
  height: 34px;
  margin-bottom: 12px;

  .wrap {
    display: flex;
    align-items: center;
    height: 100%;
    background-color: @surface;
    border: 1px solid @line;
    border-radius: @radius;
  }
  .icon {
    margin-left: 6px;
    font-size: 11px;
  }
  .btn {
    padding: 0 14px;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    height: 100%;
    white-space: nowrap;
    border-radius: @radius;
    &:hover {
      background: @surface-2;
    }
  }
  .btn:hover > .sd-zhankai {
    transform: rotate(180deg);
  }
}

.mini-poster {
  overflow: hidden;
  position: absolute;
  transform-origin: 0 0;
}
</style>
