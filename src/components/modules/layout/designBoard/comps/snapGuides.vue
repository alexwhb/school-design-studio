<!--
 * Stand-ins for the ruler guides, laid out in page coordinates.
 *
 * The visible red line is drawn by @scena/guides, over the top of everything in
 * the editor's own coordinate space. Moveable cannot snap to that: it works
 * from elements it can measure. So for every guide there is an invisible,
 * zero-thickness box here, inside the page, and Moveable is handed those — which
 * also means the maths survives zooming, scrolling and resizing for free.
-->
<template>
  <div v-if="guidelines.verticalGuidelines.length || guidelines.horizontalGuidelines.length" class="snap-guide-layer">
    <i v-for="x in guidelines.verticalGuidelines" :key="'v' + x" class="snap-guide snap-guide-v" :style="{ left: x + 'px' }" />
    <i v-for="y in guidelines.horizontalGuidelines" :key="'h' + y" class="snap-guide snap-guide-h" :style="{ top: y + 'px' }" />
  </div>
</template>

<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useCanvasStore } from '@/store'

const { guidelines } = storeToRefs(useCanvasStore())
</script>

<style lang="less" scoped>
.snap-guide-layer {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
// visibility, not display: a box with no layout has no rect to measure.
.snap-guide {
  position: absolute;
  visibility: hidden;
}
.snap-guide-v {
  top: 0;
  width: 0;
  height: 100%;
}
.snap-guide-h {
  left: 0;
  height: 0;
  width: 100%;
}
</style>
