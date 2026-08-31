<!--
  One page of a design, drawn at whatever size it is given.

  The page is laid out at its true pixel size and then scaled as a whole, so a
  slide is the design exactly as it was drawn — the same trick the canvas and
  the page thumbnails use. Everything here is read-only: the widgets are the
  `-static` variants, which have none of the selection, drag or measurement
  hooks the editing components carry.
-->
<template>
  <div class="slide" :style="{ width: box.width + 'px', height: box.height + 'px' }">
    <div class="slide__page" :style="pageStyle">
      <component :is="layer.type + '-static'" v-for="layer in rootLayers" :key="layer.uuid" :params="layer" :parent="page.global">
        <template v-if="layer.isContainer">
          <component :is="child.type + '-static'" v-for="child in childrenOf(layer.uuid)" :key="child.uuid" :params="child" :parent="layer" />
        </template>
      </component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CSSProperties, computed } from 'vue'
import type { TdLayout, TdWidgetData } from '@/store/design/widget'

type TProps = {
  page: TdLayout
  /** The box the slide has to fit inside, in CSS pixels. */
  maxWidth: number
  maxHeight: number
}

const props = defineProps<TProps>()

/** Scale to fit, never past 1:1 in either direction — letterboxed, not cropped. */
const scale = computed(() => {
  const { width, height } = props.page.global
  if (!width || !height || !props.maxWidth || !props.maxHeight) return 0
  return Math.min(props.maxWidth / width, props.maxHeight / height)
})

/** The slide's own footprint once scaled, so the parent can centre it. */
const box = computed(() => ({
  width: props.page.global.width * scale.value,
  height: props.page.global.height * scale.value,
}))

const pageStyle = computed<CSSProperties>(() => {
  const g = props.page.global
  return {
    width: g.width + 'px',
    height: g.height + 'px',
    transform: `scale(${scale.value})`,
    opacity: g.opacity,
    backgroundColor: g.backgroundGradient ? undefined : g.backgroundColor,
    backgroundImage: g.backgroundImage ? `url(${g.backgroundImage})` : g.backgroundGradient || undefined,
    backgroundSize: g.backgroundTransform?.x ? 'auto' : 'cover',
    backgroundPositionX: (g.backgroundTransform?.x || 0) + 'px',
    backgroundPositionY: (g.backgroundTransform?.y || 0) + 'px',
  }
})

/** Top-level layers hang off the page itself; grouped ones hang off their group. */
const rootLayers = computed(() => (props.page.layers || []).filter((layer: TdWidgetData) => layer.parent === props.page.global.uuid))

function childrenOf(uuid: string) {
  return (props.page.layers || []).filter((layer: TdWidgetData) => layer.parent === uuid)
}
</script>

<style lang="less" scoped>
.slide {
  position: relative;
  overflow: hidden;

  &__page {
    position: absolute;
    top: 0;
    left: 0;
    transform-origin: 0 0;
    background-repeat: no-repeat;
    background-position: center;
  }
}
</style>
