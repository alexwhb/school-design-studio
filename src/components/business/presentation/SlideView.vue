<!--
  One page of a design, drawn at whatever size it is given.

  The page is laid out at its true pixel size and then scaled as a whole, so a
  slide is the design exactly as it was drawn — the same trick the canvas and
  the page thumbnails use. Everything here is read-only: the widgets are the
  `-static` variants, which have none of the selection, drag or measurement
  hooks the editing components carry.

  With `animated` set, elements that have been given an entrance are held back
  until their turn and then played, one build step per advance of the presenter.
  The animation goes on the widget's own element rather than a wrapper around
  it: every `-static` component has a single root, so a class and a data
  attribute fall through to it, and transforms are composited additively (see
  `animations/play.ts`) so an element the renderer has already rotated keeps its
  rotation. The overview grid leaves `animated` off and gets built slides.
-->
<template>
  <div ref="slideRef" class="slide" :style="{ width: box.width + 'px', height: box.height + 'px' }">
    <div class="slide__page" :style="pageStyle">
      <component
        :is="layer.type + '-static'"
        v-for="layer in rootLayers"
        :key="layer.uuid"
        :params="layer"
        :parent="page.global"
        :data-anim="animated ? layer.uuid : undefined"
        :class="{ 'ds-anim-pending': pending(layer.uuid) }"
      >
        <template v-if="layer.isContainer">
          <component
            :is="child.type + '-static'"
            v-for="child in childrenOf(layer.uuid)"
            :key="child.uuid"
            :params="child"
            :parent="layer"
            :data-anim="animated ? child.uuid : undefined"
            :class="{ 'ds-anim-pending': pending(child.uuid) }"
          />
        </template>
      </component>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { CSSProperties, computed, onBeforeUnmount, nextTick, ref } from 'vue'
import type { TdLayout, TdWidgetData } from '@/store/design/widget'
import { buildSchedule, cancelAll, playWidgetAnimation, PENDING_CLASS } from '@/common/animations/play'

type TProps = {
  page: TdLayout
  /** The box the slide has to fit inside, in CSS pixels. */
  maxWidth: number
  maxHeight: number
  /** Play the elements' entrances. Off for thumbnails, which want a built slide. */
  animated?: boolean
}

const props = withDefaults(defineProps<TProps>(), { animated: false })

const slideRef = ref<HTMLElement | null>(null)

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

/* ------------------------------------------------------------- entrances */

const schedule = computed(() => (props.animated ? buildSchedule((props.page.layers || []) as TdWidgetData[]) : null))

/** How many advances this slide is worth. Always at least one, for the slide itself. */
const stepCount = computed(() => Math.max(1, schedule.value?.steps.length ?? 1))

/** Elements that have had their turn. Anything scheduled and absent is held back. */
const revealed = ref(new Set<string>())
const scheduled = computed(() => new Set((schedule.value?.steps.flat() ?? []).map((item) => item.widget.uuid)))

function pending(uuid: string) {
  return props.animated && scheduled.value.has(uuid) && !revealed.value.has(uuid)
}

let timers: number[] = []
let running: Animation[] = []

function stop() {
  timers.forEach((timer) => window.clearTimeout(timer))
  timers = []
  cancelAll(running)
  running = []
}

/**
 * Puts the slide into the state it should be in at `target`, playing that step's
 * entrances when asked to. Stepping backwards, and arriving from a later slide,
 * pass `animate` off: a build the room has already watched should not replay.
 */
async function showUpTo(target: number, animate: boolean) {
  if (!props.animated) return
  stop()

  const shown = new Set<string>()
  for (let i = 0; i <= target; i++) {
    for (const item of schedule.value?.steps[i] || []) {
      if (!(animate && i === target)) shown.add(item.widget.uuid)
    }
  }
  revealed.value = shown
  if (!animate) return

  await nextTick()
  for (const item of schedule.value?.steps[target] || []) {
    const uuid = item.widget.uuid
    timers.push(
      window.setTimeout(() => {
        const el = slideRef.value?.querySelector<HTMLElement>(`[data-anim="${uuid}"]`)
        if (!el) return
        // Drop the holding class on the element itself rather than waiting for a
        // re-render, so the first frame of the animation is the first frame seen.
        el.classList.remove(PENDING_CLASS)
        revealed.value.add(uuid)
        running.push(...playWidgetAnimation(el, item.widget.animation))
      }, item.at),
    )
  }
}

onBeforeUnmount(stop)

defineExpose({ stepCount, showUpTo })
</script>

<!--
  Not scoped: the class lands on a child component's root, and holding an
  element off screen must not depend on scope ids reaching that far.
-->
<style lang="less">
.ds-anim-pending {
  opacity: 0;
}
</style>

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
