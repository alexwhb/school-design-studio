<!--
 * @Author: ShawnPhang
 * @Date: 2021-12-16 16:20:16
 * @Description: 瀑布流组件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-06 21:16:00
-->
<template>
  <div ref="imgWaterFall" :style="{ height: state.countHeight + 'px' }" class="img-water-fall">
    <!-- backgroundImage: `url(${item.cover})` -->
    <div
      v-for="(item, i) in state.list" :key="i + 'iwf'"
      :style="{ top: item.top + 'px', left: item.left + 'px', width: state.width + 'px', height: item.height + 'px' }"
      class="img-box" @click.stop="selectItem(item, i)"
    >
      <edit-model v-if="edit" :options="props.edit" :data="{ item, i }">
        {{ item.isDelect }}
        <div v-if="item.isDelect" class="list__mask">Deleted</div>
        <el-image v-if="!item.fail" class="img" :src="item.cover" lazy loading="lazy" @error="loadError(item)" />
        <div v-else class="fail_img">{{ item.title }}</div>
      </edit-model>
      <el-image v-else class="img" :src="item.cover" lazy loading="lazy" @error="loadError(item)" />
    </div>
  </div>
</template>

<script lang="ts" setup>
// const NAME = 'img-water-fall'
import { IGetTempListData } from '@/api/home';
import { reactive, ref, watch } from 'vue'

type TProps = {
  listData: IGetTempListData[]
  edit?: Record<string, any>
}

type TState = {
  width: number
  countHeight: number
  list: IGetTempListData[]
}

type TEmits = {
  (event: 'select', data: IGetTempListData): void
  (event: 'load'): void
}

const props = defineProps<TProps>()
const emit = defineEmits<TEmits>()

const imgWaterFall = ref<HTMLElement | null>(null)

const state = reactive<TState>({
  width: 146, // Image width, remeasured against the container below
  list: [],
  countHeight: 0,
})

const columnHeights: number[] = [] // Column height
const columnNums = 2 // How many columns
const gap = 7 // Gap between images

/**
 * Column width, from the container rather than a constant.
 *
 * Two 146px columns and a 7px gap need 299px, but this element is inset by
 * 14px from a 299px panel, so the right-hand column was hanging 14px past the
 * edge and being clipped. Measuring means the columns fit whatever width the
 * panel happens to be.
 */
function measure() {
  const available = imgWaterFall.value?.clientWidth
  if (!available) return
  state.width = Math.floor((available - gap * (columnNums - 1)) / columnNums)
}

watch(
  () => props.listData,
  () => {
    measure()
    columnHeights.length = 0
    const widthLimit = state.width * columnNums //  + gap * (columnNums - 1) // Row width
    const cloneList = JSON.parse(JSON.stringify(props.listData))
    for (let i = 0; i < cloneList.length; i++) {
      let index = i % columnNums
      const item = cloneList[i]
      item.height = (item.height / item.width) * state.width // Image height
      item.left = index * (widthLimit / columnNums + gap) // Position
      item.top = columnHeights[index] + gap || 0 // Position
      // columnHeights[index] = isNaN(columnHeights[index]) ? item.height : item.height + columnHeights[index] + gap // 记录列高度
      // 找出最短边
      if (isNaN(columnHeights[index])) {
        columnHeights[index] = item.height
      } else {
        index = columnHeights.indexOf(Math.min(...columnHeights))
        item.left = index * (widthLimit / columnNums + gap)
        item.top = columnHeights[index] + gap || 0
        columnHeights[index] = item.height + columnHeights[index] + gap
      }
    }
    // Math.max() of nothing is -Infinity, which is not a length, so the browser
    // keeps whatever height was set last — a search that matches nothing leaves
    // a column of empty space where the results were, and pushes the message
    // saying so off the bottom of the panel.
    state.countHeight = columnHeights.length ? Math.max(...columnHeights) : 0
    state.list = cloneList
  },
)

const load = () => {
  emit('load')
}
const selectItem = (value: IGetTempListData, index: number) => {
  emit('select', value)
}
const loadError = (item: IGetTempListData) => {
  item.fail = true
}

defineExpose({
  load,
  selectItem,
  loadError,
})
</script>

<style lang="less" scoped>
.fail_img {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: @ink-3;
}
.img-water-fall {
  position: relative;
  margin-left: 14px;
  .img-box {
    position: absolute !important;
    cursor: pointer;
    position: relative;
    background-size: cover;
    border-radius: 5px;
    border: 1px solid @line;
    overflow: hidden;
    .img {
      display: block;
      width: 100%;
      height: 100%;
    }
  }
  .img-box:hover::before {
    content: ' ';
    background: rgba(0, 0, 0, 0.15);
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    pointer-events: none;
  }
}
.list {
  &__mask {
    position: absolute;
    z-index: 2;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    color: #ffffff;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
