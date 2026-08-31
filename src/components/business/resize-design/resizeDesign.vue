<!--
  Resize an existing design.

  The reuse people ask for: the flyer that worked becomes a slide, or a display
  board, without rebuilding it. Three decisions, in the order someone makes
  them — how big, what happens to the artwork, and how much of the design it
  applies to — with the outcome stated in words underneath rather than left to
  be discovered after pressing the button.

  The choice of what happens to the artwork is not hardcoded here: it renders
  whatever is in common/methods/resize/strategies.ts.
-->
<template>
  <el-dialog v-model="visible" title="Resize design" width="420" align-center draggable>
    <section class="block">
      <h4 class="block__title">New size</h4>
      <sizeEditor :params="size" class="size-row" />
      <p class="from-to">
        {{ Math.round(current.width) }} × {{ Math.round(current.height) }} px
        <i class="iconfont icon-right arrow" />
        {{ Math.round(size.width) }} × {{ Math.round(size.height) }} px
      </p>
      <sizePresets :width="size.width" :height="size.height" @pick="applyPreset" />
    </section>

    <section class="block">
      <h4 class="block__title">What happens to the artwork</h4>
      <button v-for="option in strategies" :key="option.id" type="button" :class="['choice', { 'is-on': strategy === option.id }]" @click="strategy = option.id">
        <span class="choice__name">{{ option.name }}</span>
        <span class="choice__hint">{{ option.description }}</span>
      </button>
    </section>

    <section v-if="pageCount > 1" class="block">
      <h4 class="block__title">Apply to</h4>
      <div class="scopes">
        <button type="button" :class="['scope', { 'is-on': scope === 'page' }]" @click="scope = 'page'">This page</button>
        <button type="button" :class="['scope', { 'is-on': scope === 'all' }]" @click="scope = 'all'">All {{ pageCount }} pages</button>
      </div>
    </section>

    <template #footer>
      <el-button @click="visible = false">Cancel</el-button>
      <el-button type="primary" :disabled="!changed" @click="apply">Resize</el-button>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import sizeEditor from '@/components/business/create-design/sizeEditor.vue'
import sizePresets from '@/components/business/create-design/sizePresets.vue'
import { useCanvasStore, useWidgetStore } from '@/store'
import { DEFAULT_RESIZE_STRATEGY, RESIZE_STRATEGIES } from '@/common/methods/resize/strategies'
import type { TResizeScope } from '@/store/design/widget/actions/resizePages'

const widgetStore = useWidgetStore()
const canvasStore = useCanvasStore()
const { dPage } = storeToRefs(canvasStore)
const { dLayouts } = storeToRefs(widgetStore)

const visible = ref(false)
const strategies = RESIZE_STRATEGIES
const strategy = ref(DEFAULT_RESIZE_STRATEGY)
const scope = ref<TResizeScope>('page')
/** Bound to sizeEditor, which mutates it in place. */
const size = reactive({ width: 0, height: 0 })

const current = computed(() => ({ width: dPage.value?.width || 0, height: dPage.value?.height || 0 }))
const pageCount = computed(() => dLayouts.value?.length || 1)
const changed = computed(() => Math.round(size.width) !== Math.round(current.value.width) || Math.round(size.height) !== Math.round(current.value.height))

function applyPreset({ width, height }: { width: number; height: number }) {
  size.width = width
  size.height = height
}

const open = () => {
  size.width = current.value.width
  size.height = current.value.height
  strategy.value = DEFAULT_RESIZE_STRATEGY
  // A single-page design has nothing to choose between, and someone who adds a
  // page later should not inherit a decision they were never shown.
  scope.value = pageCount.value > 1 ? 'all' : 'page'
  visible.value = true
}

defineExpose({ open })

function apply() {
  const pages = scope.value === 'all' ? pageCount.value : 1
  widgetStore.resizePages({ width: size.width, height: size.height, strategy: strategy.value, scope: scope.value })
  visible.value = false
  ElMessage.success(`Resized ${pages === 1 ? 'the page' : `all ${pages} pages`} to ${Math.round(size.width)} × ${Math.round(size.height)} px.`)
}
</script>

<style lang="less" scoped>
.block {
  & + .block {
    margin-top: 18px;
  }
  &__title {
    margin: 0 0 8px;
    color: @ink-3;
    font-size: @text-sm;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
}

.size-row {
  margin-bottom: 6px;
}

.from-to {
  margin: 0;
  color: @ink-3;
  font-size: @text-sm;
  .arrow {
    font-size: 10px;
    margin: 0 4px;
  }
}

// The strategy list and the scope buttons are the same control at two widths,
// so they share the selected treatment: a hairline that becomes the accent.
.choice {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  border: 1px solid @line;
  border-radius: @radius;
  background: transparent;
  font-family: inherit;
  cursor: pointer;
  & + .choice {
    margin-top: 6px;
  }
  &:hover {
    border-color: @accent;
  }
  &.is-on {
    border-color: @accent;
    background: @accent-a25;
  }
  &__name {
    color: @ink;
    font-size: @text-base;
    font-weight: 500;
  }
  &__hint {
    color: @ink-3;
    font-size: @text-sm;
    line-height: 1.35;
  }
}

.scopes {
  display: flex;
  gap: 6px;
}
.scope {
  flex: 1;
  padding: 7px 10px;
  border: 1px solid @line;
  border-radius: @radius;
  background: transparent;
  color: @ink-2;
  font-family: inherit;
  font-size: @text-base;
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
</style>
