<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-01 11:12:17
 * @Description: 前端出图 - 用于封面
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-04 18:50:00
-->
<template>
  <div id="cover-wrap"></div>
</template>

<script lang="ts" setup>
import html2canvas from 'html2canvas'
// import { useSetupMapGetters } from '@/common/hooks/mapGetters'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useWidgetStore } from '@/store'
import FontFaceObserver from 'fontfaceobserver'

// const { dZoom } = useSetupMapGetters(['dZoom'])

const canvasStore = useCanvasStore()
const widgetStore = useWidgetStore()
const { dZoom } = storeToRefs(canvasStore)

// props: ['modelValue'],
// emits: ['update:modelValue'],

async function createPoster() {
  await checkFonts() // Wait for the fonts to finish loading
  const fonts = document.fonts
  const opts = {
    backgroundColor: null, // No background, so transparent PNGs work
    useCORS: true,
    scale: 100 / dZoom.value, // * window.devicePixelRatio
    onclone: (document: any) => fonts.forEach((font) => document.fonts.add(font)),
  }
  // const style = document.createElement('style')
  // document.head.appendChild(style)
  // style.sheet?.insertRule('body > img { display: initial; }')
  return new Promise((resolve) => {
    const clonePage = document.getElementById('page-design-canvas')?.cloneNode(true) as HTMLElement
    if (!clonePage) return
    clonePage.setAttribute('id', 'clone-page')
    document.body.appendChild(clonePage)
    html2canvas(clonePage, opts).then((canvas) => {
      canvas.toBlob(async (blob) => resolve({ blob }), `image/png`)
      clonePage.remove()
    })
  })
}

// 检查字体是否加载完成
async function checkFonts() {
  const widgets = widgetStore.getWidgets()
  const fontLoaders: Promise<void>[] = []
  widgets.forEach((item: any) => {
    if (item.fontClass && item.fontClass.value) {
      const loader = new FontFaceObserver(item.fontClass.value)
      fontLoaders.push(loader.load(null, 120000)) // A long timeout so slow fonts still get picked up
    }
  })
  await Promise.all(fontLoaders)
}

defineExpose({
  createPoster,
})
</script>

<style lang="less">
#clone-page {
  position: absolute;
  z-index: 99999;
  left: -99999px;
}
</style>
