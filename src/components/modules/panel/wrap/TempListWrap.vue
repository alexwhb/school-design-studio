<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-27 15:16:07
 * @Description: 模板列表
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-06 21:16:00
-->
<template>
  <div class="wrap">
    <search-header v-model="state.searchKeyword" type="none" placeholder="Search templates" @search="searchChange" />

    <el-button class="upload-psd" plain type="primary" @click="openPSD">Import a PSD file</el-button>

    <!-- Chips rather than the header's dropdown: five categories over a gallery
         this size are worth showing outright, and the row doubles as a reminder
         of what the search is currently scoped to. They sit directly above the
         list because they filter it — the PSD button used to be in between,
         which read as a divider between the two. -->
    <div v-if="state.cates.length > 1" class="cates">
      <button v-for="cate in state.cates" :key="cate.id" :class="['cates__chip', { 'cates__chip--on': state.cate === cate.id }]" type="button" @click="cateChange(cate)">
        {{ cate.name }}
      </button>
    </div>

    <ul ref="listRef" v-infinite-scroll="load" class="infinite-list" :infinite-scroll-distance="150" style="overflow: auto">
      <img-water-fall :listData="state.list" @select="selectItem" />
      <div v-show="state.loading" class="loading"><i class="el-icon-loading"></i> Loading</div>
      <div v-show="state.loadDone && state.list.length" class="loading">That is everything</div>
      <div v-show="state.loadDone && !state.list.length" class="loading">{{ emptyMessage() }}</div>
    </ul>
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import api from '@/api'

import { LocationQueryValue, useRoute, useRouter } from 'vue-router'
// import chooseType from './components/chooseType.vue'
// import editModel from './components/editModel.vue'
import searchHeader from './components/searchHeader.vue'
import useConfirm from '@/common/methods/confirm'
// import { useSetupMapGetters } from '@/common/hooks/mapGetters'
import imgWaterFall from './components/imgWaterFall.vue'
import { IGetTempListData, TGetCategoriesData } from '@/api/home'
import { useControlStore, useCanvasStore, useUserStore, useHistoryStore, useWidgetStore, useForceStore } from '@/store'
import { storeToRefs } from 'pinia'

type TState = {
  loading: boolean
  loadDone: boolean
  list: IGetTempListData[]
  cates: TGetCategoriesData[]
  /** The selected chip's slug; '' is "All". */
  cate: string
  searchKeyword: string
}

type TPageOptions = {
  page: number
  pageSize: number
  cate: number | string
  state?: string
}

const listRef = ref<HTMLElement | null>(null)
const route = useRoute()
const router = useRouter()

const controlStore = useControlStore()

const userStore = useUserStore()
const pageStore = useCanvasStore()
const widgetStore = useWidgetStore()
const forceStore = useForceStore()
/** Always first, and not content — the server only knows about real categories. */
const ALL: TGetCategoriesData = { id: '', name: 'All' }

const state = reactive<TState>({
  loading: false,
  loadDone: false,
  list: [],
  cates: [ALL],
  cate: '',
  searchKeyword: '',
})

// const { tempEditing } = useSetupMapGetters(['tempEditing'])
const { dHistoryParams } = storeToRefs(useHistoryStore())

const pageOptions: TPageOptions = { page: 0, pageSize: 20, cate: '' }
const { cate, edit } = route.query
cate && (pageOptions.cate = state.cate = (cate as LocationQueryValue) ?? '')
// edit && store.commit('managerEdit', true)
edit && userStore.managerEdit(true)

api.home.getCategories().then((list) => {
  state.cates = [ALL, ...(list || [])]
  // A ?cate= naming something the gallery no longer has would otherwise leave
  // every chip unselected over an empty list.
  if (state.cate && !state.cates.some((item) => item.id === state.cate)) {
    cateChange(ALL)
  }
})

const load = async (init: boolean = false, stat?: string) => {
  stat && (pageOptions.state = stat)

  if (init && listRef.value) {
    listRef.value.scrollTop = 0
    state.list = []
    pageOptions.page = 0
    state.loadDone = false
  }
  if (state.loadDone || state.loading) {
    return
  }

  state.loading = true
  pageOptions.page += 1

  const res = await api.home.getTempList({ search: state.searchKeyword, ...pageOptions })
  res.list.length <= 0 && (state.loadDone = true)
  state.list = state.list.concat(res.list)
  setTimeout(() => {
    state.loading = false
    checkHeight()
  }, 100)
}

/** Enter, or clearing the box, re-runs the list against the typed keyword. */
function searchChange() {
  load(true, pageOptions.state)
}

function cateChange(type: TGetCategoriesData) {
  const init = pageOptions.cate !== type.id
  state.cate = type.id
  pageOptions.cate = type.id
  load(init, pageOptions.state)
}

/**
 * Why the list came back empty. A search inside a category is the one case
 * where the fix is not obvious, so name the category rather than leaving
 * someone to wonder why a template they can see the name of is missing.
 */
function emptyMessage() {
  if (!state.searchKeyword) return 'Nothing here yet'
  const cate = state.cates.find((item) => item.id === state.cate)
  return state.cate ? `No ${cate?.name.toLowerCase()} match “${state.searchKeyword}”` : `Nothing matches “${state.searchKeyword}”`
}

function checkHeight() {
  if (!listRef.value) return
  // 检查高度是否占满，否则继续请求下一页
  const isLess = listRef.value.offsetHeight > (listRef.value.firstElementChild as HTMLElement)?.offsetHeight
  isLess && load()
}

let hideReplacePrompt: any = localStorage.getItem('hide_replace_prompt')
async function selectItem(item: IGetTempListData) {
  controlStore.setShowMoveable(false) // Clear the previous selection box
  if (!hideReplacePrompt && dHistoryParams.value.length > 0) {
    const doNotPrompt = await useConfirm('Add to my designs', 'This template will replace everything on the page.', 'warning', { confirmButtonText: 'Got it', cancelButtonText: 'Do not show again' })
    if (!doNotPrompt) {
      localStorage.setItem('hide_replace_prompt', '1')
      hideReplacePrompt = true
    }
  }
  userStore.managerEdit(false)
  widgetStore.setDWidgets([])
  setTempId(item.id)

  let result = null
  if (!item.data) {
    const res = await api.home.getTempDetail({ id: item.id })
    result = JSON.parse(res.data)
  } else {
    result = JSON.parse(item.data)
  }
  if (Array.isArray(result)) {
    const { global, layers } = result[0]
    pageStore.setDPage(global)
    widgetStore.setTemplate(layers)
  } else {
    const { page, widgets } = result
    pageStore.setDPage(page)
    widgetStore.setTemplate(widgets)
  }
  setTimeout(() => {
    forceStore.setZoomScreenChange()
  }, 300)
  widgetStore.selectWidget({
    uuid: '-1',
  })
}

function setTempId(tempId: number | string) {
  const { id } = route.query
  router.push({ path: '/home', query: { tempid: tempId, id }, replace: true })
}

const openPSD = () => {
  window.open(router.resolve('/psd').href, '_blank')
}

defineExpose({
  load,
  cateChange,
  searchChange,
  listRef,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
}

.cates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 14px 14px 2px;
}

.cates__chip {
  border: 1px solid @line;
  background: @surface;
  color: @ink-2;
  font-family: inherit;
  font-size: @text-base;
  line-height: 1;
  padding: 6px 11px;
  border-radius: @radius-pill;
  cursor: pointer;
  transition:
    background-color 0.12s ease,
    border-color 0.12s ease,
    color 0.12s ease;

  &:hover {
    background: @surface-2;
    color: @ink;
  }

  &--on,
  &--on:hover {
    background: @accent-soft;
    border-color: @accent-border;
    color: @accent;
    font-weight: 600;
  }
}

.infinite-list {
  height: 100%;
  margin-top: 1rem;
  padding-bottom: 150px;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}
.infinite-list::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}
// .list {
//   width: 100%;
//   padding: 4px 0 0 10px;
//   &__img {
//     cursor: pointer;
//     width: 128px;
//     height: auto;
//     position: relative;
//     &-mask {
//       opacity: 0;
//       width: 100%;
//       height: 100%;
//       background: rgba(0, 0, 0, 0.12);
//       position: absolute;
//       z-index: 1;
//       top: 0;
//       left: 0;
//     }
//   }
//   &__img:hover {
//     background: rgba(0, 0, 0, 0.04);
//   }
//   &__img:hover > &__img-mask {
//     opacity: 1;
//   }
// }

.loading {
  padding-top: 1rem;
  text-align: center;
  font-size: 14px;
  color: @ink-3;
}

.upload-psd {
  // The divider above it is gone, so the button supplies its own gap under the
  // search box rather than sitting flush against it.
  margin: 8px 1rem 0;
  width: calc(100% - 2rem);
}
</style>
