<!--
  Animation is one section of the settings panel, not a card sitting on top of
  it: the same left edge, the same uppercase heading and the same
  label-above-control rhythm as Size and position or Text effects. An el-card
  here put a bordered box inside a bordered panel, and the three start options
  put a third box inside that.

  It sits at the top of the panel because at the bottom it fell below the fold
  on a full text element — an element's entrance is no more buried a property
  than its colour, and nobody scrolls looking for something they do not know is
  there. Unset it costs one line.
-->
<template>
  <div class="animate">
    <div class="animate__head">
      <span class="animate__title">Animation</span>
      <div class="animate__head-right">
        <span class="animate__current">{{ current ? current.name : 'None' }}</span>
        <el-popover :visible="pickerOpen" placement="left-start" :width="332" trigger="click" popper-class="animate-popper">
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
            <el-button class="animate__choose" link @click="togglePicker">{{ pickerOpen ? 'Cancel' : 'Choose' }}</el-button>
          </template>
        </el-popover>
      </div>
    </div>

    <div v-if="current" class="animate__body">
      <p class="animate__hint">{{ current.hint }}</p>

      <div class="animate__sliders">
        <number-slider v-model="speed" label="Speed" :step="0.05" :minValue="0.15" :maxValue="3" @finish="commitSpeed" />
        <number-slider v-model="wait" label="Delay" :step="0.05" :minValue="0" :maxValue="5" @finish="commitWait" />
      </div>

      <value-select
        v-model="startLabel"
        label="Starts"
        :data="START_LABELS"
        :readonly="true"
        inputWidth="100%"
        @finish="commitStart"
      />
      <p class="animate__note">{{ startHint }}</p>

      <div class="animate__actions">
        <el-button class="animate__action" link @click="previewOnCanvas">Play on canvas</el-button>
        <el-button class="animate__action" link @click="choose(null)">Remove</el-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { ElPopover } from 'element-plus'
import numberSlider from '../numberSlider.vue'
import valueSelect from '../valueSelect.vue'
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

/**
 * The running order, in the panel's own vocabulary. A dropdown rather than three
 * stacked buttons: it is one choice out of three, which is what every other
 * choice in this panel looks like, and the reading of it goes on the line below.
 */
const STARTS: { value: TWidgetAnimation['start']; label: string; hint: string }[] = [
  { value: 'after', label: 'After the one before', hint: 'Waits its turn, giving a cascade' },
  { value: 'with', label: 'At the same time', hint: 'Moves in with the element before it' },
  { value: 'click', label: 'On click', hint: 'Holds until you advance the slide' },
]
const START_LABELS = STARTS.map((option) => option.label)

const pickerOpen = ref(false)
const animation = computed<TWidgetAnimation | undefined>(() => props.widget?.animation)
const current = computed(() => getPreset(animation.value?.preset))

const startOption = computed(() => STARTS.find((option) => option.value === animation.value?.start) || STARTS[0])
const startLabel = computed(() => startOption.value.label)
const startHint = computed(() => startOption.value.hint)

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
let introTimers: number[] = []
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
  write(existing ? { ...existing, preset: preset.id } : defaultAnimationFor(preset))
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

function commitStart(label: Record<string, any> | string | number) {
  if (!animation.value) return
  const option = STARTS.find((item) => item.label === label)
  if (!option) return
  write({ ...animation.value, start: option.value })
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
.animate {
  width: 100%;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
  }

  &__title {
    .section-label();
  }

  &__head-right {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  &__current {
    font-size: @text-sm;
    color: @ink-3;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  &__choose {
    font-size: @text-base;
    height: auto;
    padding: 0;
    flex: none;
    color: @ink-2;

    &:hover {
      color: @accent;
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 10px;
  }

  &__hint,
  &__note {
    margin: 0;
    font-size: @text-xs;
    color: @ink-3;
    line-height: 1.4;
  }

  // The reading of the running order belongs to the control above it, so it
  // sits tight under the select rather than floating between two controls.
  &__note {
    margin-top: -8px;
  }

  &__sliders {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__action {
    font-size: @text-sm;
    height: auto;
    padding: 4px 0;
    color: @ink-2;

    &:hover {
      color: @accent;
    }
  }
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
