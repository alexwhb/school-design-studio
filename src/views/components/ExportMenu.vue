<!--
  The Export button in the toolbar.

  One obvious default (a PNG image, which is what most people want) sitting in
  the button itself, with the other formats behind the arrow next to it. The
  wording avoids file-format jargon: people pick what they want to *do* with
  the file, not a container format.
-->
<template>
  <div class="export-menu">
    <el-button ref="mainBtn" class="export-btn" type="primary" :loading="busy" @click="emitDownload">
      <i v-if="!busy" class="iconfont icon-download export-btn__icon" />
      Export
    </el-button>
    <el-dropdown trigger="click" placement="bottom-end" :disabled="busy" @command="run">
      <el-button class="export-caret" type="primary" :disabled="busy">
        <i class="iconfont icon-down" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="export-menu__list">
          <el-dropdown-item command="png">
            <div class="opt">
              <span class="opt__name">Image</span>
              <span class="opt__hint">A PNG picture of this page</span>
            </div>
          </el-dropdown-item>
          <el-dropdown-item command="pptx-editable" divided>
            <div class="opt">
              <span class="opt__name">PowerPoint</span>
              <span class="opt__hint">One slide per page, text stays editable</span>
            </div>
          </el-dropdown-item>
          <el-dropdown-item command="pptx-picture">
            <div class="opt">
              <span class="opt__name">PowerPoint (exact copy)</span>
              <span class="opt__hint">Each page as a picture, nothing editable</span>
            </div>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
// Dropdown is not in the app's global Element Plus registration (see
// utils/widgets/elementConfig.ts), so pull it in the same way the File and
// Help menus do.
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useWidgetStore } from '@/store'
import exportPptx, { type PptxMode } from '@/common/methods/export/exportPptx'
import { withPageRenderer } from '@/common/methods/export/renderPage'

type TProps = {
  /** Reads the design's current name at the moment of export. */
  getTitle?: () => string
}
const props = defineProps<TProps>()

const emit = defineEmits<{
  (event: 'select', name: string): void
  (event: 'progress', data: { downloadPercent: number; downloadText: string; downloadMsg?: string }): void
}>()

const widgetStore = useWidgetStore()
const { dLayouts } = storeToRefs(widgetStore)
const busy = ref(false)
const mainBtn = ref()

/** The image export already exists on HeaderOptions; let it keep owning that. */
function emitDownload() {
  emit('select', 'download')
}

function run(command: string) {
  if (command === 'png') return emitDownload()
  if (command === 'pptx-editable') return toPowerPoint('editable')
  if (command === 'pptx-picture') return toPowerPoint('picture')
}

async function toPowerPoint(mode: PptxMode) {
  if (busy.value) return
  const pages = dLayouts.value || []
  if (pages.length === 0) {
    ElMessage.warning('There is nothing to export yet.')
    return
  }

  busy.value = true
  const title = props.getTitle?.() || 'Untitled design'
  emit('progress', { downloadPercent: 1, downloadText: 'Preparing your slides' })

  try {
    await withPageRenderer(async (renderer) => {
      await exportPptx(pages, {
        title,
        mode,
        renderPage: renderer.renderPage,
        renderWidget: renderer.renderWidget,
        onProgress: (percent, message) => emit('progress', { downloadPercent: percent, downloadText: message }),
      })
    })
    emit('progress', { downloadPercent: 100, downloadText: 'Your PowerPoint file has been downloaded', downloadMsg: '' })
    ElMessage.success(`Exported ${pages.length} slide${pages.length === 1 ? '' : 's'}.`)
  } catch (e: any) {
    console.error('[export] PowerPoint export failed', e)
    emit('progress', { downloadPercent: 0, downloadText: '' })
    ElMessage.error(e?.message || 'Sorry, that export did not work. Please try again.')
  } finally {
    busy.value = false
  }
}

defineExpose({ $el: mainBtn })
</script>

<style lang="less" scoped>
.export-menu {
  display: flex;
  align-items: center;
  margin-left: 8px;

  // The button and its arrow read as one control.
  .export-btn {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
    padding-left: 14px;
    padding-right: 12px;
    font-weight: 600;

    &__icon {
      font-size: 13px;
      margin-right: 6px;
    }
  }

  .export-caret {
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
    margin-left: 1px;
    padding-left: 8px;
    padding-right: 8px;
    min-width: 0;

    .iconfont {
      font-size: 11px;
    }
  }
}

.export-menu__list {
  .opt {
    display: flex;
    flex-direction: column;
    gap: 1px;
    padding: 3px 2px;
    min-width: 210px;

    &__name {
      color: @ink;
      font-size: @text-base;
      font-weight: 500;
      line-height: 1.3;
    }
    &__hint {
      color: @ink-3;
      font-size: @text-sm;
      line-height: 1.3;
    }
  }
}
</style>
