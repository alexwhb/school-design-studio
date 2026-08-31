<template>
  <div id="widget-panel">
    <div class="widget-classify">
      <ul class="classify-wrap">
        <li
          v-for="(item, index) in state.widgetClassifyList"
          :key="index"
          :class="['classify-item', { 'active-classify-item': state.activeWidgetClassify === index && state.active }]"
          @click="clickClassify(index)"
        >
          <div class="icon-box"><i :class="['iconfont', 'rail-icon', item.icon]" :style="item.style" /></div>
          <p>{{ item.name }}</p>
        </li>
      </ul>
    </div>
    <div v-show="state.active" class="widget-wrap">
      <keep-alive>
        <component :is="state.widgetClassifyList[state.activeWidgetClassify].component" />
      </keep-alive>
    </div>
    <div v-show="state.active" class="side-wrap">
      <el-tooltip :show-after="300" :hide-after="0" effect="dark" content="Hide panel" placement="right">
        <div class="pack__up" @click="state.active = false"><i class="iconfont icon-right" /></div>
      </el-tooltip>
    </div>
  </div>
</template>

<script lang="ts" setup>
// The icon rail on the far left, plus the panel it opens.
import widgetClassifyListData from '@/assets/data/WidgetClassifyList'
import { reactive, onMounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const state = reactive({
  widgetClassifyList: widgetClassifyListData,
  activeWidgetClassify: 0,
  active: true,
})
const clickClassify = (index: number) => {
  // Clicking the tab you are already on closes the panel, which gives you the
  // whole window for the design.
  if (state.activeWidgetClassify === index && state.active) {
    state.active = false
    return
  }
  state.activeWidgetClassify = index
  state.active = true
}

onMounted(async () => {
  await nextTick()
  const { koutu } = route.query
  koutu && (state.activeWidgetClassify = 4)
})

watch(
  () => state.activeWidgetClassify,
  (index) => {
    if (index >= 0 && index < state.widgetClassifyList.length) {
      state.widgetClassifyList[index].show = true
    }
  },
)

defineExpose({
  clickClassify,
})
</script>

<style lang="less" scoped>
#widget-panel {
  display: flex;
  flex-direction: row;
  height: 100%;
  position: relative;
  color: @ink-2;

  .widget-classify {
    position: relative;
    border-right: 1px solid @line;
    background-color: @surface;
    height: 100%;
    text-align: center;
    width: @rail-width;
    flex-shrink: 0;

    .classify-wrap {
      padding: 8px 8px 0;
      user-select: none;
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 2px;

      .classify-item {
        position: relative;
        align-items: center;
        cursor: pointer;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 4px;
        padding: 9px 2px;
        border-radius: @radius;
        transition: background-color 0.12s ease, color 0.12s ease;

        p {
          color: @ink-3;
          font-size: @text-xs;
          font-weight: 500;
          line-height: 1.2;
          white-space: nowrap;
        }

        .icon-box {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 22px;
        }
        // Named rail-icon, not icon: `.icon` is the base class of the second
        // iconfont project and sets font-family with !important, so an element
        // carrying both it and `.iconfont` renders these glyphs from the wrong
        // font — as boxes.
        .rail-icon {
          font-size: 20px;
          color: @ink-2;
          transition: color 0.12s ease;
        }

        &:hover {
          background: @surface-2;
          p {
            color: @ink-2;
          }
        }
      }

      // Selected tab: accent colour only, no bar and no heavy fill.
      .active-classify-item,
      .active-classify-item:hover {
        background: @accent-soft;
        .rail-icon,
        p {
          color: @accent;
        }
        p {
          font-weight: 600;
        }
      }
    }
  }

  .widget-wrap {
    width: @panel-width;
    background-color: @surface;
    border-right: 1px solid @line;
    flex: 1;
    height: 100%;
  }

  // The little tab that collapses the panel.
  .side-wrap {
    position: absolute;
    left: @rail-width + @panel-width;
    pointer-events: none;
    z-index: 99;
    height: 100%;
    display: flex;
    align-items: center;

    .pack__up {
      pointer-events: all;
      cursor: pointer;
      width: 18px;
      height: 44px;
      margin-left: -1px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: @surface;
      border: 1px solid @line;
      border-left: none;
      border-radius: 0 @radius @radius 0;
      color: @ink-4;
      transition: color 0.12s ease, background-color 0.12s ease;

      .iconfont {
        font-size: 12px;
        transform: rotate(180deg);
      }
      &:hover {
        color: @ink;
        background: @surface-2;
      }
    }
  }
}
</style>
