<!--
 * @Author: ShawnPhang <https://m.palxp.cn>
 * @Date: 2021-08-27 15:16:07
 * @Description: 素材列表
 * @LastEditors: Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-09-25 00:39:00
-->
<template>
  <div class="wrap">
    <search-header v-model="state.searchKeyword" type="none" live placeholder="Search elements" @search="searchChange" />
    <div style="height: 0.5rem" />
    <!-- <div class="types">
      <div v-for="(t, ti) in types" :key="ti + 't'" :style="{ backgroundColor: colors[ti] }" :class="['types__item', { 'types--select': currentType === t.id }]" @click="selectType(t)"></div>
    </div> -->
    <!-- <div class="tags">
      <el-check-tag v-for="(t2, t2i) in sub" :key="t2i + 't2'" :checked="t2.id === currentCheck" class="tags__item" @click="tagsChange(t2.id)">{{ t2.name }}</el-check-tag>
    </div> -->
    <classHeader v-show="!state.currentCategory" :types="state.types" @select="selectTypes">
      <template v-slot="{ index }">
        <div class="list-wrap">
          <div v-for="(item, i) in state.showList[index]" :key="i + 'sl'" draggable="false" @mousedown="dragStart($event, item)" @mousemove="mousemove" @mouseup="mouseup" @click.stop="selectItem(item)" @dragstart.prevent>
            <el-image :class="['list__img-thumb', `art--${item.type}`]" :src="item.thumb" fit="contain" lazy loading="lazy" />
          </div>
        </div>
      </template>
    </classHeader>

    <ul v-if="state.currentCategory" v-infinite-scroll="load" class="infinite-list" :infinite-scroll-distance="150" style="overflow: auto">
      <classHeader :is-back="true" @back="back">{{ state.currentCategory.name }}</classHeader>
      <div class="list">
        <div v-for="(item, i) in state.list" :key="i + 'i'" :class="['list__item', `art--${item.type}`]" draggable="false" @mousedown="dragStart($event, item)" @mousemove="mousemove" @mouseup="mouseup" @click.stop="selectItem(item)" @dragstart.prevent>
          <el-image :class="['list__img', `art--${item.type}`]" :src="item.thumb" fit="contain" lazy loading="lazy" />
        </div>
      </div>
      <div v-show="state.loading" class="loading"><i class="el-icon-loading" /> Loading</div>
      <div v-show="state.loadDone" :style="state.list.length <= 0 ? 'padding-top: 4rem' : ''" class="loading">{{ emptyText }}</div>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed, onMounted } from 'vue'
import api from '@/api'
// import wImage from '../../widgets/wImage/wImage.vue'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import { wSvgSetting } from '../../widgets/wSvg/wSvgSetting'
// import wSvg from '../../widgets/wSvg/wSvg.vue'

import setImageData from '@/common/methods/DesignFeatures/setImage'
import DragHelper from '@/common/hooks/dragHelper'
import { TGetListData } from '@/api/material'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import { storeToRefs } from 'pinia'

type TProps = {
  active?: boolean
}

type TState = {
  loading: boolean
  loadDone: boolean
  sub: []
  list: TGetListData[]
  currentType: Number
  currentCheck: number
  colors: string[]
  currentCategory: TCurrentCategory | null
  types: { cate: string; name: string }[]
  showList: TGetListData[][]
  searchKeyword: string
}

type TCurrentCategory = {
  name: string
  cate?: string | number
  id?: number
}

let isDrag = false
let startPoint = { x: 99999, y: 99999 }
const dragHelper = new DragHelper()

const props = defineProps<TProps>()

const colors = ['#f8704b', '#5b89ff', '#2cc4cc', '#a8ba73', '#f8704b']

const controlStore = useControlStore()
const widgetStore = useWidgetStore()

const { dPage } = storeToRefs(useCanvasStore())
const state = reactive<TState>({
  loading: false,
  loadDone: false,
  sub: [],
  list: [],
  currentType: 2, // 2
  currentCheck: 0,
  colors,
  currentCategory: null,
  types: [],
  showList: [],
  searchKeyword: '',
})
const pageOptions = { page: 0, pageSize: 20 }

onMounted(async () => {
  if (state.types.length <= 0) {
    // const types = await api.material.getKinds({ type: 2 })
    state.types = [
      { cate: 'png', name: 'Stickers' },
      { cate: 'svg', name: 'Shapes' },
      { cate: 'mask', name: 'Masks' },
    ]
    for (const iterator of state.types) {
      const { list } = await api.material.getList({
        cate: iterator.cate,
      })
      state.showList.push(list)
    }
  }
})

// const dragHelper = new DragHelper()
// let isDrag = false
// let startPoint = { x: 99999, y: 99999 }
const mouseup = (e: MouseEvent) => {
  e.preventDefault()
  setTimeout(() => {
    isDrag = false
    startPoint = { x: 99999, y: 99999 }
  }, 10)
}

const mousemove = (e: MouseEvent) => {
  e.preventDefault()
  // startPoint only holds a real position between mousedown and mouseup. Without
  // this the move that carries the pointer onto a thumbnail is measured against
  // the sentinel, reads as a drag of ninety-nine thousand pixels, and the click
  // that follows is thrown away as the end of one.
  if (startPoint.x === 99999) return
  if (Math.abs(e.x - startPoint.x) > 2 || Math.abs(e.y - startPoint.y) > 2) {
    isDrag = true
  }
}

const load = async (init: boolean = false) => {
  if (init) {
    state.list = []
    pageOptions.page = 0
    state.loadDone = false
  }
  if (state.loadDone || state.loading) {
    return
  }
  state.loading = true
  pageOptions.page += 1
  const list = await api.material.getList({
    ...{ cate: state.currentCategory?.id || state.currentCategory?.cate, search: state.searchKeyword, ...pageOptions },
  })
  if (init) {
    state.list = list?.list
  } else {
    state.list = state.list.concat(list?.list)
  }
  list?.list.length <= 0 && (state.loadDone = true)
  setTimeout(() => {
    state.loading = false
  }, 100)
}

/**
 * Results are drawn as their own pseudo-category rather than by filtering the
 * three browse rows: a search runs across the whole library, so "star" has to
 * be able to answer with the sticker, the icon and the mask in one list.
 */
const searchChange = (keyword: string) => {
  state.searchKeyword = keyword
  if (!keyword) {
    // Emptying the box puts you back where you started rather than leaving an
    // empty "Search results" you have to press Back out of.
    state.currentCategory = null
    return
  }
  state.currentCategory = { name: `Results for "${keyword}"` }
  load(true)
}

const selectTypes = (item: TCurrentCategory) => {
  state.searchKeyword = ''
  state.currentCategory = item
  load(true)
}
const back = () => {
  state.searchKeyword = ''
  state.currentCategory = null
}

const emptyText = computed(() => {
  if (state.list.length > 0) return 'That is everything'
  return state.searchKeyword ? `Nothing matches "${state.searchKeyword}"` : 'Nothing here yet'
})

defineExpose({
  load,
  searchChange,
  selectTypes,
  back,
  mouseup,
  mousemove,
})

// computed: {
//   ...mapGetters(['dPage']),
// }
// ...mapActions(['addWidget']),
async function selectItem(item: TGetListData) {
  if (isDrag) {
    return
  }
  // store.commit('setShowMoveable', false) // Clear the previous selection
  controlStore.setShowMoveable(false) // Clear the previous selection

  let setting = item.type === 'svg' ? JSON.parse(JSON.stringify(wSvgSetting)) : JSON.parse(JSON.stringify(wImageSetting))
  const img = await setImageData(item)

  setting.width = img.width
  setting.height = img.height // parseInt(100 / item.value.ratio, 10)
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - img.width / 2
  setting.top = pH / 2 - img.height / 2
  setting.imgUrl = item.url
  if (item.type === 'svg') {
    setting.svgUrl = item.url
    const models = JSON.parse(item.model)
    for (const key in models) {
      if (Object.hasOwnProperty.call(models, key)) {
        setting[key] = models[key]
      }
    }
  }
  if (item.type === 'mask') {
    setting.mask = item.url
  }
  widgetStore.addWidget(setting)
  // store.dispatch('addWidget', setting)
}
async function dragStart(e: MouseEvent, item: TGetListData) {
  // Stop the browser starting its own image drag on the thumbnail: while a
  // native drag is running it swallows mousemove and mouseup, so the piece
  // being dragged sits frozen until the button is released.
  e.preventDefault()
  startPoint = { x: e.x, y: e.y }
  const { width, height, thumb, url } = item
  const img = await setImageData({ width, height, url: thumb || url })
  dragHelper.start(e, img.canvasWidth)

  widgetStore.setSelectItem({ data: { value: item }, type: item.type })
  // store.commit('selectItem', { data: { value: item }, type: item.type })
}
</script>

<style lang="less" scoped>
// The backing tile for panel artwork. Themed, but locally: a wall of white
// tiles is the brightest thing in a dark editor and drowns out the artwork it
// is meant to present. Held as a custom property rather than a Less literal
// because Less resolves at build time and this has to follow the runtime
// theme switch; kept in this file rather than tokens.less because no other
// panel backs artwork this way.
@art-tile: var(--art-tile);
@art-tile-hover: var(--art-tile-hover);

.wrap {
  --art-tile: #f3f8fa;
  --art-tile-hover: #e6eef2;
  width: 100%;
  height: 100%;
}
.tags {
  padding: 20px 0 0 10px;
  &__item {
    margin: 0 8px 8px 0;
  }
}

.infinite-list {
  height: 100%;
  padding-bottom: 150px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.infinite-list::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
.list {
  // Two even columns that follow the panel width, rather than fixed-width
  // tiles that leave a ragged gutter down the right-hand side.
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  // Clears the absolutely positioned back header, and lines the grid up with
  // the search field above it.
  padding: 3.1rem 14px 0;
  &__item {
    overflow: hidden;
    // The tile the artwork sits on, not @surface: stickers are full-colour
    // images drawn for paper and need a backing to read against. Monochrome
    // line art opts out of it below.
    background: @art-tile;
    border-radius: 4px;
    aspect-ratio: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  &__img {
    cursor: grab;
    width: 100%;
    height: 100%;
    padding: 8px;
    border-radius: 4px;
  }
  &__img-thumb {
    cursor: grab;
    width: 90px;
    height: 90px;
    background: @art-tile;
    padding: 4px;
    border-radius: 4px;
  }
  // A solid step darker, not a translucent black wash: a wash only reads as
  // "slightly darker" when it has the light tile underneath it, and the tile
  // is exactly what the dark-mode rules below take away.
  &__img:hover,
  &__img-thumb:hover {
    background: @art-tile-hover;
  }
}

// Shapes are line art on transparency, so on a dark panel they can simply be
// recoloured — there is no artwork to protect, and dropping the tile is what
// stops hover looking like the background switches out from under them.
//
// They are drawn with stroke="currentColor", which sounds like it could be
// themed directly, but they are loaded through <img src="data:…">, and an
// <img> is an isolated document: currentColor resolves against that
// document's default, black, with no way for our CSS to reach it. Inverting
// is what is actually available, and on black-on-transparent it gives exactly
// what is wanted — white strokes, transparency untouched.
//
// Stickers and masks are deliberately excluded from the inversion. Stickers
// are full-colour artwork, and masks are solid #4F46E5, so inverting either
// wrecks it (that indigo would come out yellow-green). What they get instead
// is a dark tile — see the --art-tile override below.
html.dark {
  .wrap {
    // A step above the panel, so a tile still reads as a card, and hover
    // still has somewhere to go. Both are dark enough that the artwork, not
    // its backing, is what the eye lands on.
    --art-tile: hsl(0 0% 15%);
    --art-tile-hover: hsl(0 0% 21%);
  }

  .list__item.art--svg {
    background: transparent;
  }

  .list__img.art--svg,
  .list__img-thumb.art--svg {
    background: transparent;
    // Slightly off-white at rest so that hover has somewhere brighter to go.
    filter: invert(1) brightness(0.82);

    // Hover lifts the artwork itself rather than repainting anything behind
    // it, so nothing appears or disappears under the cursor.
    &:hover {
      background: transparent;
      filter: invert(1) brightness(1);
    }
  }
}
.list-wrap {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.8rem;
}

.loading {
  padding-top: 1rem;
  text-align: center;
  font-size: 14px;
  color: @ink-3;
}
</style>
