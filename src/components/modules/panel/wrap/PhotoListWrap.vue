<!--
 * @Author: ShawnPhang
 * @Date: 2022-02-11 18:48:23
 * @Description: Photo library — Unsplash stock photos, browsed or searched
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-14 18:50:09
-->
<template>
  <div class="wrap">
    <search-header type="none" placeholder="Search photos" @search="searchChange" />
    <div style="height: 0.5rem" />

    <template v-if="!isViewingList">
      <p v-if="state.notice" class="notice notice--inset">{{ state.notice }}</p>
      <classHeader :types="state.types" @select="selectTypes">
        <template v-slot="{ index }">
          <photo-list :isShort="true" :listData="state.showList[index]" @load="getDataList" @drag="dragStart($event, state.showList[index])" @select="selectImg($event, state.showList[index])" />
        </template>
      </classHeader>
    </template>

    <div v-else>
      <classHeader :is-back="true" @back="back">{{ listTitle }}</classHeader>
      <br /><br /><br />
      <div style="margin: 0 1rem; height: 100vh">
        <p v-if="state.notice" class="notice">{{ state.notice }}</p>
        <photo-list v-else :isDone="state.loadDone" :listData="state.recommendImgList" @load="getDataList" @drag="dragStart" @select="selectImg" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 图片列表
// const NAME = 'img-list-wrap'
import { reactive, computed, onMounted } from 'vue'
// import wImage from '../../widgets/wImage/wImage.vue'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import api from '@/api'

import setImageData from '@/common/methods/DesignFeatures/setImage'
import { storeToRefs } from 'pinia'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
import { TGetImageListResult, TImageListError } from '@/api/material'

type TProps = {
  active?: boolean
}

type TState = {
  recommendImgList: TGetImageListResult[]
  loadDone: boolean
  page: number
  keyword: string
  currentCategory: TCurrentCategory | null
  types: TCurrentCategory[]
  showList: TGetImageListResult[][]
  /** Shown in place of the grid when there is nothing to show and a reason why. */
  notice: string
}

type TCurrentCategory = {
  name: string
  id?: number
}

/**
 * The browse rows. The ids match the stored searches in
 * server/content-library.mjs; the names live here because the panel draws them
 * before any request goes out.
 */
const BROWSE_CATEGORIES: TCurrentCategory[] = [
  { id: 1, name: 'School life' },
  { id: 2, name: 'Backgrounds' },
  { id: 3, name: 'Sports' },
]

/** Every way the photo library can come back empty, in plain language. */
const NOTICES: Record<TImageListError, string> = {
  unsplash_key_missing: 'Photo search needs an Unsplash access key. Add UNSPLASH_ACCESS_KEY to .env.local and restart the server — see README.md.',
  unsplash_key_invalid: 'Unsplash rejected the access key. Check UNSPLASH_ACCESS_KEY in .env.local.',
  unsplash_rate_limited: 'Unsplash’s hourly request limit is used up. Try again in a little while.',
  unsplash_unavailable: 'Could not reach Unsplash just now. Check the connection and try again.',
}

const props = defineProps<TProps>()

const controlStore = useControlStore()
const widgetStore = useWidgetStore()

const { dPage } = storeToRefs(useCanvasStore())
const state = reactive<TState>({
  recommendImgList: [],
  loadDone: false,
  page: 0,
  keyword: '',
  currentCategory: null,
  types: [],
  showList: [],
  notice: '',
})
let loading = false

/** A search term and a category both open the same full-width results view. */
const isViewingList = computed(() => Boolean(state.keyword) || Boolean(state.currentCategory))
const listTitle = computed(() => (state.keyword ? `“${state.keyword}”` : state.currentCategory?.name ?? ''))

onMounted(async () => {
  if (state.types.length <= 0) {
    state.types = BROWSE_CATEGORIES
    for (const iterator of state.types) {
      const { list = [], error } = await api.material.getImagesList({ cate: iterator.id, pageSize: 2 })
      // One reason covers every row, so the first is enough to report.
      if (error && !state.notice) state.notice = NOTICES[error]
      state.showList.push(list)
    }
  }
})

const selectImg = async (index: number, list: TGetImageListResult[]) => {
  const item = list ? list[index] : state.recommendImgList[index]

  // store.commit('setShowMoveable', false) // Clear the previous selection
  controlStore.setShowMoveable(false) // Clear the previous selection

  let setting = JSON.parse(JSON.stringify(wImageSetting))
  const img = await setImageData(item) // await getImage(item.url)
  setting.width = img.width
  setting.height = img.height // parseInt(100 / item.value.ratio, 10)
  setting.imgUrl = item.url
  const { width: pW, height: pH } = dPage.value
  setting.left = pW / 2 - img.width / 2
  setting.top = pH / 2 - img.height / 2

  widgetStore.addWidget(setting)
  api.material.trackImageUse(item.downloadLocation)
  // store.dispatch('addWidget', setting)
}

const getDataList = async () => {
  // The browse rows share this handler but hold two images each and never
  // page; only the results view loads more.
  if (!isViewingList.value || state.loadDone || loading) {
    return
  }
  loading = true
  state.page += 1
  const { list = [], error } = await api.material.getImagesList({
    cate: state.currentCategory?.id,
    keyword: state.keyword || undefined,
    page: state.page,
    pageSize: 30,
  })
  if (error) {
    state.notice = NOTICES[error]
    state.loadDone = true
  } else if (list.length <= 0) {
    state.loadDone = true
    if (state.recommendImgList.length <= 0) {
      state.notice = state.keyword ? `No photos match “${state.keyword}”. Try a broader word.` : 'No photos here yet.'
    }
  } else {
    state.recommendImgList = state.recommendImgList.concat(list)
  }
  setTimeout(() => {
    loading = false
  }, 100)
}

const dragStart = (index: number, list: TGetImageListResult[]) => {
  const item = list ? list[index] : state.recommendImgList[index]

  widgetStore.setSelectItem({ data: { value: item }, type: 'image' })
  // Counted here rather than on drop: the drop handler is generic across every
  // panel, and picking a photo up is the intent Unsplash asks apps to report.
  api.material.trackImageUse(item.downloadLocation)
  // store.commit('selectItem', { data: { value: item }, type: 'image' })
}

const searchChange = (keyword: string) => {
  const next = keyword.trim()
  if (next === state.keyword) {
    return
  }
  state.keyword = next
  state.currentCategory = null
  resetList()
  next && getDataList()
}

const selectTypes = (item: TCurrentCategory) => {
  state.keyword = ''
  state.currentCategory = item
  resetList()
  getDataList()
}

const back = () => {
  state.keyword = ''
  state.currentCategory = null
  resetList()
}

/**
 * Clears the grid before the next page-1 request. photoList appends whatever
 * arrives and only empties itself when handed an empty list, so this has to
 * happen as its own step or the new results land under the old ones.
 */
const resetList = () => {
  state.page = 0
  state.loadDone = false
  state.recommendImgList = []
  state.notice = ''
}

defineExpose({
  selectImg,
  getDataList,
  dragStart,
  searchChange,
  selectTypes,
  back,
})
</script>

<style lang="less" scoped>
.wrap {
  width: 100%;
  height: 100%;
}

// Stands in for the grid when a search finds nothing, or when the photo
// library cannot answer at all.
.notice {
  color: @ink-3;
  font-size: @text-base;
  line-height: 1.5;
  padding: 1.5rem 0.25rem;
  margin: 0;

  &--inset {
    padding: 0.75rem 14px;
  }
}
</style>
