<!--
  The "Animation" card in the settings panel.

  Mounted once in stylePanel.vue rather than per widget type, so every kind of
  element — text, photo, shape, QR code, group — can be animated without each
  style component having to opt in.

  Picking a preset writes an `animation` object onto the widget; picking "None"
  clears the field entirely rather than leaving an empty one behind. Nothing here
  changes how the element looks on the canvas at rest, which is what keeps the
  PNG and PowerPoint exports untouched by any of this.
-->
<template>
  <el-card class="animate-card" shadow="hover" :body-style="{ padding: current ? '14px 16px 16px' : 0 }">
    <template #header>
      <div class="card-header">
        <span class="title">Animation</span>
        <span class="current">{{ current ? current.name : 'None' }}</span>
        <el-popover :visible="pickerOpen" placement="bottom-end" :width="332" trigger="click" popper-class="animate-popper">
          <div class="picker">
            <p class="picker__intro">Hover a style to watch it play.</p>
            <button type="button" :class="['picker__none', { 'picker__none--on': !current }]" @click="choose(null)">No animation</button>
            <template v-for="group in ANIMATION_GROUPS" :key="group">
              <p class="picker__group">{{ group }}</p>
              <div class="picker__grid">
                <preset-tile
                  v-for="preset in presetsInGroup(group)"
                  :key="preset.id"
                  :ref="(el: any) => registerTile(preset.id, el)"
                  :preset="preset"
                  :selected="preset.id === current?.id"
                  @choose="choose"
                />
              </div>
            </template>
          </div>
          <template #reference>
            <el-button class="button" link @click="togglePicker">{{ pickerOpen ? 'Cancel' : 'Choose' }}</el-button>
          </template>
        </el-popover>
      </div>
    </template>

    <div v-if="current" class="body">
      <p class="body__hint">{{ current.hint }}</p>

      <number-slider v-model="speed" label="Speed (seconds)" :step="0.05" :minValue="0.15" :maxValue="3" @finish="commitSpeed" />
      <number-slider v-model="wait" label="Wait first (seconds)" :step="0.05" :minValue="0" :maxValue="5" @finish="commitWait" />

      <p class="body__label">Starts</p>
      <div class="starts">
        <button
          v-for="option in START_OPTIONS"
          :key="option.value"
          type="button"
          :class="['starts__item', { 'starts__item--on': animation?.start === option.value }]"
          @click="commitStart(option.value)"
        >
          <span class="starts__name">{{ option.name }}</span>
          <span class="starts__hint">{{ option.hint }}</span>
        </button>
      </div>

      <div class="body__actions">
        <el-button class="body__play" plain type="primary" @click="previewOnCanvas">Play on canvas</el-button>
        <el-button class="body__clear" link @click="choose(null)">Remove</el-button>
      </div>
    </div>
  </el-card>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { ElCard, ElPopover } from 'element-plus'
import numberSlider from '../numberSlider.vue'
import presetTile from './PresetTile.vue'
import { useWidgetStore } from '@/store'
import type { TdWidgetData } from '@/store/design/widget'
import type { TUpdateWidgetPayload } from '@/store/design/widget/actions/widget'
import { ANIMATION_GROUPS, defaultAnimationFor, getPreset, presetsInGroup, type TWidgetAnimation } from '@/common/animations/presets'
import { cancelAll, playWidgetAnimation } from '@/common/animations/play'

type TProps = {
  widget: TdWidgetData
}

const props = defineProps<TProps>()
const widgetStore = useWidgetStore()

const START_OPTIONS: { value: TWidgetAnimation['start']; name: string; hint: string }[] = [
  { value: 'after', name: 'After the one before', hint: 'Waits its turn, giving a cascade' },
  { value: 'with', name: 'At the same time', hint: 'Moves together with the element before it' },
  { value: 'click', name: 'On click', hint: 'Holds until you advance the slide' },
]

const pickerOpen = ref(false)
const animation = computed<TWidgetAnimation | undefined>(() => props.widget?.animation)
const current = computed(() => getPreset(animation.value?.preset))

// The sliders work in seconds because that is how anyone talks about the pace of
// a slide; the stored value stays in milliseconds, which is what plays it.
const speed = ref(0.5)
const wait = ref(0)

watch(
  animation,
  (value) => {
    speed.value = value ? Math.round(value.duration) / 1000 : 0.5
    wait.value = value ? Math.round(value.delay) / 1000 : 0
  },
  { immediate: true },
)

const tiles = new Map<string, any>()
function registerTile(id: string, el: any) {
  if (el) tiles.set(id, el)
  else tiles.delete(id)
}

function togglePicker() {
  pickerOpen.value = !pickerOpen.value
  if (pickerOpen.value) introduceTiles()
}

/**
 * Runs every tile once, a beat apart, when the picker opens. Fifteen tiles all
 * moving at once is noise; the same fifteen arriving in a wave is a contents
 * page for the whole set, and it costs the user nothing to watch.
 */
async function introduceTiles() {
  await nextTick()
  clearIntro()
  let index = 0
  for (const group of ANIMATION_GROUPS) {
    for (const preset of presetsInGroup(group)) {
      const id = preset.id
      introTimers.push(window.setTimeout(() => tiles.get(id)?.play?.(), 70 * index))
      index += 1
    }
  }
}

let introTimers: number[] = []
function clearIntro() {
  introTimers.forEach((timer) => window.clearTimeout(timer))
  introTimers = []
}

function write(value: TWidgetAnimation | null) {
  widgetStore.updateWidgetData({
    uuid: props.widget?.uuid || '',
    key: 'animation' as TUpdateWidgetPayload['key'],
    value,
  })
}

function choose(id: string | null) {
  pickerOpen.value = false
  clearIntro()
  if (!id) {
    write(null)
    return
  }
  const preset = getPreset(id)
  if (!preset) return
  // Keep the pace and running order the user already set; only swap the movement.
  const existing = animation.value
  write(
    existing
      ? { ...existing, preset: preset.id }
      : defaultAnimationFor(preset),
  )
  nextTick(previewOnCanvas)
}

function commitSpeed(value: number | number[]) {
  if (!animation.value) return
  write({ ...animation.value, duration: Math.round(Number(value) * 1000) })
  nextTick(previewOnCanvas)
}

function commitWait(value: number | number[]) {
  if (!animation.value) return
  write({ ...animation.value, delay: Math.round(Number(value) * 1000) })
}

function commitStart(start: TWidgetAnimation['start']) {
  if (!animation.value) return
  write({ ...animation.value, start })
}

/**
 * Plays the animation on the element itself, in place on the canvas.
 *
 * The element is found by `data-uuid`, which both top-level layers and the
 * children inside a group carry, and the lookup is scoped to the canvas so it
 * cannot match the page node or a thumbnail in the page strip.
 */
let preview: Animation[] = []
function previewOnCanvas() {
  cancelAll(preview)
  const uuid = props.widget?.uuid
  if (!uuid) return
  const el = document.querySelector<HTMLElement>(`#page-design-canvas [data-uuid="${uuid}"]`)
  if (!el) return
  preview = playWidgetAnimation(el, animation.value)
}

onBeforeUnmount(() => {
  clearIntro()
  cancelAll(preview)
})
</script>

<style lang="less" scoped>
.animate-card {
  width: 100%;

  :deep(.el-card__header) {
    padding: 12px 16px;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;

  .title {
    font-size: @text-base;
    color: @ink;
    font-weight: 500;
  }

  .current {
    flex: 1;
    font-size: @text-sm;
    color: @ink-3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .button {
    flex-shrink: 0;
  }
}

.body__hint {
  margin: 0 0 12px;
  font-size: @text-sm;
  color: @ink-3;
  line-height: 1.45;
}

.body__label {
  .section-label();
  margin: 14px 0 6px;
}

.starts {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.starts__item {
  appearance: none;
  text-align: left;
  border: 1px solid @line;
  background: @surface;
  border-radius: @radius-sm;
  padding: 6px 9px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 1px;
  transition: border-color 0.12s ease, background-color 0.12s ease;

  &:hover {
    background: @surface-2;
  }

  &.starts__item--on {
    border-color: @accent-border;
    background: @accent-soft;
  }
}

.starts__name {
  font-size: @text-sm;
  color: @ink;
}

.starts__hint {
  font-size: @text-xs;
  color: @ink-3;
  line-height: 1.35;
}

.body__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 14px;
}

.body__play {
  flex: 1;
}
</style>

<style lang="less">
// The picker lives in a popover teleported to the body, so its styles cannot be
// scoped to this component.
.animate-popper {
  max-height: 62vh;
  overflow-y: auto;

  .picker__intro {
    margin: 0 0 10px;
    font-size: @text-xs;
    color: @ink-3;
  }

  .picker__none {
    appearance: none;
    width: 100%;
    text-align: left;
    border: 1px solid @line;
    background: @surface;
    border-radius: @radius-sm;
    padding: 7px 10px;
    font-size: @text-sm;
    color: @ink-2;
    cursor: pointer;

    &:hover {
      background: @surface-2;
    }

    &.picker__none--on {
      border-color: @accent-border;
      background: @accent-soft;
      color: @ink;
    }
  }

  .picker__group {
    .section-label();
    margin: 14px 0 6px;
  }

  .picker__grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
  }
}
</style>
