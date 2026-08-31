<!--
  The Export button in the toolbar.

  One obvious default (a PNG image, which is what most people want) sitting in
  the button itself, with the other formats behind the arrow next to it. The
  wording avoids file-format jargon: people pick what they want to *do* with
  the file, not a container format.

  The quality row sits above the two formats it applies to rather than in a
  settings dialog, because the number that matters — is this good enough for the
  print shop — is only meaningful next to the thing being exported, and it is
  worth showing as inches and DPI rather than a bare multiplier.
-->
<template>
  <div class="export-menu">
    <el-button ref="mainBtn" class="export-btn" type="primary" :loading="busy" @click="toImage">
      <i v-if="!busy" class="iconfont icon-download export-btn__icon" />
      Export
    </el-button>
    <el-dropdown ref="dropdown" trigger="click" placement="bottom-end" :hide-on-click="false" :disabled="busy" @command="run">
      <el-button class="export-caret" type="primary" :disabled="busy">
        <i class="iconfont icon-down" />
      </el-button>
      <template #dropdown>
        <el-dropdown-menu class="export-menu__list">
          <div class="quality" @click.stop>
            <div class="quality__label">Quality — for image and PDF</div>
            <div class="quality__choices">
              <button v-for="option in SCALES" :key="option.scale" type="button" :class="['quality__btn', { 'is-on': scale === option.scale }]" @click="scale = option.scale">
                {{ option.name }}
                <span class="quality__dpi">{{ option.scale * DESIGN_DPI }} DPI</span>
              </button>
            </div>
            <div class="quality__size">{{ sizeHint }}</div>
          </div>

          <el-dropdown-item command="png" divided>
            <div class="opt">
              <span class="opt__name">Image</span>
              <span class="opt__hint">A PNG picture of this page</span>
            </div>
          </el-dropdown-item>
          <el-dropdown-item command="pdf">
            <div class="opt">
              <span class="opt__name">PDF</span>
              <span class="opt__hint">{{ pdfHint }}</span>
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
import { computed, ref } from 'vue'
// Dropdown is not in the app's global Element Plus registration (see
// utils/widgets/elementConfig.ts), so pull it in the same way the File and
// Help menus do.
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useWidgetStore } from '@/store'
import exportPptx, { type PptxMode } from '@/common/methods/export/exportPptx'
import exportPdf, { DESIGN_DPI, type ExportScale } from '@/common/methods/export/exportPdf'
import { withPageRenderer } from '@/common/methods/export/renderPage'

type TProps = {
  /** Reads the design's current name at the moment of export. */
  getTitle?: () => string
}
const props = defineProps<TProps>()

const emit = defineEmits<{
  (event: 'select', name: string, scale: ExportScale): void
  (event: 'progress', data: { downloadPercent: number; downloadText: string; downloadMsg?: string }): void
}>()

const widgetStore = useWidgetStore()
const { dLayouts } = storeToRefs(widgetStore)
const { dPage } = storeToRefs(useCanvasStore())
const busy = ref(false)
const mainBtn = ref()
const dropdown = ref()

/**
 * Named for the job, not the multiplier.
 *
 * 150 DPI is what the page presets are drawn at, so it is what you get without
 * asking; 300 is the number a print shop will ask you for; 450 is for something
 * read from a metre away and worth the file size.
 */
const SCALES: { scale: ExportScale; name: string }[] = [
  { scale: 1, name: 'Standard' },
  { scale: 2, name: 'Print' },
  { scale: 3, name: 'Large' },
]

const scale = ref<ExportScale>(1)

/** What the export will actually produce, in both the units people think in. */
const sizeHint = computed(() => {
  const width = Math.round((dPage.value?.width || 0) * scale.value)
  const height = Math.round((dPage.value?.height || 0) * scale.value)
  const inches = (px: number) => Math.round((px / DESIGN_DPI) * 10) / 10
  return `${width} × ${height} px · ${inches(dPage.value?.width || 0)} × ${inches(dPage.value?.height || 0)} in`
})

const pdfHint = computed(() => {
  const count = dLayouts.value?.length || 0
  return count > 1 ? `All ${count} pages, ready to print or email` : 'Ready to print or email'
})

function close() {
  dropdown.value?.handleClose()
}

function run(command: string) {
  close()
  if (command === 'png') return toImage()
  if (command === 'pdf') return toPdf()
  if (command === 'pptx-editable') return toPowerPoint('editable')
  if (command === 'pptx-picture') return toPowerPoint('picture')
}

/** Everything below shares one guard, one progress bar and one error path. */
async function runExport(work: () => Promise<void>, done: string) {
  if (busy.value) return
  const pages = dLayouts.value || []
  if (pages.length === 0) {
    ElMessage.warning('There is nothing to export yet.')
    return
  }

  busy.value = true
  try {
    await work()
    emit('progress', { downloadPercent: 100, downloadText: done, downloadMsg: '' })
  } catch (e: any) {
    console.error('[export] failed', e)
    emit('progress', { downloadPercent: 0, downloadText: '' })
    ElMessage.error(e?.message || 'Sorry, that export did not work. Please try again.')
  } finally {
    busy.value = false
  }
}

/**
 * The image export lives on HeaderOptions, which the File menu shares, so the
 * chosen quality is handed to it rather than a second copy being kept here.
 */
function toImage() {
  emit('select', 'download', scale.value)
}

function toPdf() {
  const pages = dLayouts.value || []
  return runExport(async () => {
    const title = props.getTitle?.() || 'Untitled design'
    emit('progress', { downloadPercent: 1, downloadText: 'Preparing your PDF' })
    await withPageRenderer((renderer) =>
      exportPdf(pages, {
        title,
        scale: scale.value,
        renderPage: renderer.renderPage,
        onProgress: (percent, message) => emit('progress', { downloadPercent: percent, downloadText: message }),
      }),
    )
    ElMessage.success(`Exported ${pages.length} page${pages.length === 1 ? '' : 's'} as a PDF.`)
  }, 'Your PDF has been downloaded')
}

function toPowerPoint(mode: PptxMode) {
  const pages = dLayouts.value || []
  return runExport(async () => {
    const title = props.getTitle?.() || 'Untitled design'
    emit('progress', { downloadPercent: 1, downloadText: 'Preparing your slides' })
    await withPageRenderer(async (renderer) => {
      await exportPptx(pages, {
        title,
        mode,
        renderPage: renderer.renderPage,
        renderWidget: renderer.renderWidget,
        onProgress: (percent, message) => emit('progress', { downloadPercent: percent, downloadText: message }),
      })
    })
    ElMessage.success(`Exported ${pages.length} slide${pages.length === 1 ? '' : 's'}.`)
  }, 'Your PowerPoint file has been downloaded')
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

.quality {
  padding: 8px 14px 10px;
  cursor: default;

  &__label {
    color: @ink-3;
    font-size: @text-sm;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    margin-bottom: 6px;
  }

  &__choices {
    display: flex;
    gap: 4px;
  }

  &__btn {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 5px 6px;
    border: 1px solid @line;
    border-radius: @radius;
    background: transparent;
    color: @ink-2;
    font-family: inherit;
    font-size: @text-sm;
    font-weight: 500;
    line-height: 1.2;
    cursor: pointer;

    &:hover {
      border-color: @accent;
      color: @ink;
    }

    &.is-on {
      border-color: @accent;
      background: @accent-a25;
      color: @ink;
    }
  }

  &__dpi {
    color: @ink-3;
    font-size: 11px;
    font-weight: 400;
  }

  &__size {
    margin-top: 6px;
    color: @ink-3;
    font-size: @text-sm;
    text-align: center;
  }
}
</style>
