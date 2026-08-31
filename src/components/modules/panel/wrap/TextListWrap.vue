<template>
  <div id="text-list-wrap" style="margin-top: 0.5rem">
    <ul class="basic-text-wrap">
      <div
        v-for="(item, index) in basicTextList"
        :key="index"
        class="basic-text-item"
        :style="{
          fontSize: previewSize(item.fontSize) + 'px',
          fontWeight: item.fontWeight,
        }"
        draggable="true"
        @click="selectBasicText(item)"
      >
        {{ item.text }}
      </div>
    </ul>
    <el-button class="upload-psd" plain type="primary" @click="openPSD">Import a PSD file</el-button>
    <div class="other-text-wrap">
      <comp-list-wrap />
    </div>
  </div>
</template>

<script lang="ts" setup>
// const NAME = 'text-list-wrap'

import { storeToRefs } from 'pinia';
// import wText from '../../widgets/wText/wText.vue'
import { wTextSetting } from '../../widgets/wText/wTextSetting'
import { useRouter } from 'vue-router';
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store';

type TBasicTextData = {
  /** Label on the button in the panel */
  text: string
  /** What actually lands on the page */
  placeholder: string
  fontSize: number
  fontWeight: string
}


const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const router = useRouter()

const { dPage } = storeToRefs(useCanvasStore())

/** How many text boxes this panel has added, used to cascade their positions. */
let insertedCount = 0

const selectBasicText = (item: TBasicTextData) => {

  // store.commit('setShowMoveable', false) // Clear the previous selection
  controlStore.setShowMoveable(false) // Clear the previous selection

  let setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = item.placeholder
  setting.fontSize = item.fontSize
  setting.fontWeight = item.fontWeight

  // Roughly how wide the text will actually be. The old estimate multiplied the
  // font size by the character count, which for a 72px heading came out several
  // times wider than the page. Height is deliberately left unset so the box
  // grows on its own when the text wraps.
  const { width: pW, height: pH } = dPage.value
  // Bold faces run wider than regular, so give them more room; otherwise a
  // heading wraps the moment you type anything the length of its placeholder.
  const widthPerChar = item.fontWeight === 'bold' ? 0.64 : 0.55
  const estimated = item.fontSize * widthPerChar * setting.text.length
  setting.width = Math.round(Math.min(estimated, pW * 0.8))

  // Start centred, then step each subsequent box down so repeated inserts
  // cascade instead of landing on top of one another. The vertical step is a
  // whole line of the text being added, which is enough to clear the previous
  // box even when it wrapped.
  const lineHeight = item.fontSize * setting.lineHeight
  const step = insertedCount % 6
  insertedCount += 1
  setting.left = Math.round((pW - setting.width) / 2)
  setting.top = Math.round((pH - lineHeight) / 2 + step * lineHeight * 1.4)

  widgetStore.addWidget(setting)
  // store.dispatch('addWidget', setting)
}

// const dragStart = (_: MouseEvent, item: any) => {
//   store.commit('setDraging', true)
//   store.commit('selectItem', { data: { value: item }, type: 'text' })
// }

const basicTextList: TBasicTextData[] = [
  {
    text: 'Heading',
    placeholder: 'Add a heading',
    fontSize: 72,
    fontWeight: 'bold',
  },
  {
    text: 'Subheading',
    placeholder: 'Add a subheading',
    fontSize: 40,
    fontWeight: 'bold',
  },
  {
    text: 'Body text',
    placeholder: 'Add a little bit of body text',
    fontSize: 24,
    fontWeight: 'normal',
  },
]

/** Scales a preset's real size down to something that fits the panel. */
const previewSize = (fontSize: number) => Math.round(Math.min(Math.max(fontSize / 3, 13), 22))

const openPSD = () => {
  window.open(router.resolve('/psd?type=1').href, '_blank')
}

defineExpose({
  selectBasicText,
})

// ...mapActions(['addWidget'])
</script>

<style lang="less" scoped>
// @color0: #3b74f1;

#text-list-wrap {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  .basic-text-wrap {
    padding: 12px 14px 4px;
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;

    // Each preset is shown at something close to the size it will insert at,
    // so the choice is obvious without reading a label.
    .basic-text-item {
      color: @ink;
      background-color: @surface;
      border: 1px solid @line;
      border-radius: @radius;
      cursor: pointer;
      user-select: none;
      padding: 12px 14px;
      width: 100%;
      transition: border-color 0.12s ease, background-color 0.12s ease;

      &:hover {
        border-color: @accent-border;
        background-color: @accent-soft;
      }
    }
  }
  .other-text-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
  }
}
.upload-psd {
  margin: 0 1rem;
  width: calc(100% - 2rem);
}
</style>
