<!--
  One entry in the animation picker.

  The tile is the explanation: rather than describe the movement in words and
  hope the reader pictures it, it plays the real preset on a stand-in for a slide
  element — a heading bar and two lines of body text. The same `playPreset` runs
  here as on the canvas and in the presenter, so what the tile shows is literally
  what the element will do.

  It plays on hover, and the parent also fires them in a cascade when the picker
  opens so the whole set introduces itself once without having to be pointed at.
-->
<template>
  <button type="button" :class="['tile', { 'tile--on': selected }]" @mouseenter="play" @focus="play" @click="$emit('choose', preset.id)">
    <span class="tile__stage">
      <span ref="mockRef" class="tile__mock">
        <span class="tile__bar" />
        <span class="tile__line" />
        <span class="tile__line tile__line--short" />
      </span>
    </span>
    <span class="tile__name">{{ preset.name }}</span>
  </button>
</template>

<script lang="ts" setup>
import { ref, onBeforeUnmount } from 'vue'
import type { AnimationPreset } from '@/common/animations/presets'
import { playPreset, cancelAll } from '@/common/animations/play'

type TProps = {
  preset: AnimationPreset
  selected?: boolean
}

const props = defineProps<TProps>()
defineEmits<{ (event: 'choose', id: string): void }>()

const mockRef = ref<HTMLElement | null>(null)
let running: Animation[] = []

/**
 * A long preset is cut short here. `drift` runs for nearly two seconds, which is
 * right on a slide and far too slow to sit through fifteen times in a picker.
 */
const TILE_MAX_MS = 900

function play() {
  if (!mockRef.value) return
  cancelAll(running)
  running = playPreset(mockRef.value, props.preset, {
    duration: Math.min(props.preset.duration, TILE_MAX_MS),
  })
}

onBeforeUnmount(() => cancelAll(running))

defineExpose({ play })
</script>

<style lang="less" scoped>
.tile {
  appearance: none;
  border: 1px solid @line;
  background: @surface;
  border-radius: @radius;
  padding: 0;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  transition: border-color 0.12s ease, background-color 0.12s ease;

  &:hover {
    border-color: @line-strong;
    background: @surface-2;
  }

  &.tile--on {
    border-color: @accent-border;
    background: @accent-soft;
  }
}

// The stage clips, so anything that flies in from outside reads as arriving
// from off the slide rather than appearing out of the panel background.
.tile__stage {
  display: block;
  position: relative;
  height: 52px;
  overflow: hidden;
  background: @surface-3;
  border-bottom: 1px solid @line-soft;
}

.tile__mock {
  position: absolute;
  left: 14%;
  top: 22%;
  width: 72%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tile__bar {
  display: block;
  height: 7px;
  border-radius: 2px;
  background: @accent;
}

.tile__line {
  display: block;
  height: 3px;
  border-radius: 2px;
  background: @ink-4;
}

.tile__line--short {
  width: 62%;
}

.tile__name {
  display: block;
  padding: 5px 6px 6px;
  font-size: @text-xs;
  color: @ink-2;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tile--on .tile__name {
  color: @ink;
  font-weight: 500;
}
</style>
