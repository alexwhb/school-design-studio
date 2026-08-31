<!--
  Presentation mode.

  The design's pages become slides on a full-screen black stage: no toolbars,
  no panels, nothing but the artwork. Arrow keys, space and page up/down move
  between slides the way they do in every other presentation tool, so nobody
  has to learn anything before standing up in front of a room.

  A slide is mounted once it comes within reach of the current one, and then
  stays mounted for the rest of the session. Walking forwards through a talk
  therefore pays for each slide just ahead of needing it, and going back to one
  costs nothing — it is still there, images and all, so moving between slides is
  a cross-fade rather than a fresh render. Mounting the whole deck up front
  would be simpler, but a design may run to MAX_PAGES.
-->
<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      ref="rootRef"
      class="present"
      :class="{ 'present--idle': isIdle && !isOverview }"
      tabindex="-1"
      @mousemove="wake"
      @click="onStageClick"
      @wheel.prevent="onWheel"
      @touchstart.passive="onTouchStart"
      @touchend.passive="onTouchEnd"
    >
      <div ref="stageRef" class="present__stage">
        <div v-for="(page, i) in pages" :key="'slide' + i" class="present__slot" :class="{ 'is-current': i === index }" :aria-hidden="i !== index">
          <SlideView v-if="mounted.has(i)" :page="page" :max-width="stage.width" :max-height="stage.height" />
        </div>
      </div>

      <!-- B and W blank the screen mid-talk, so the room looks at you instead. -->
      <div v-if="curtain" class="present__curtain" :class="`present__curtain--${curtain}`" />

      <!-- Jump to any slide without walking through the ones in between. -->
      <div v-if="isOverview" class="present__overview" @click.self.stop="isOverview = false">
        <div class="present__overview-grid">
          <button
            v-for="(page, i) in pages"
            :key="'thumb' + i"
            type="button"
            class="present__thumb"
            :class="{ 'is-current': i === index }"
            @click.stop="goTo(i, { closeOverview: true })"
          >
            <SlideView :page="page" :max-width="248" :max-height="140" />
            <span class="present__thumb-num">{{ i + 1 }}</span>
            <span class="present__thumb-name">{{ pageLabel(page, i) }}</span>
          </button>
        </div>
      </div>

      <div class="present__chrome" @click.stop @mousemove.stop="wake">
        <div class="present__bar">
          <button type="button" class="present__btn" title="Previous slide (←)" :disabled="index === 0" @click="prev">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 8 12l7 7" /></svg>
          </button>
          <button type="button" class="present__counter" title="All slides (G)" @click="isOverview = !isOverview">
            <b>{{ index + 1 }}</b> / {{ pages.length }}
          </button>
          <button type="button" class="present__btn" title="Next slide (→)" :disabled="index >= pages.length - 1" @click="next">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>
          </button>

          <span class="present__divider" />

          <button type="button" class="present__timer" title="Time on this presentation — click to reset" @click="resetTimer">
            {{ elapsedLabel }}
          </button>
          <button type="button" class="present__btn" :class="{ 'is-on': isOverview }" title="All slides (G)" @click="isOverview = !isOverview">
            <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="7" height="7" rx="1" /><rect x="14" y="4" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>
          </button>
          <button type="button" class="present__btn" :title="isFullscreen ? 'Leave full screen (F)' : 'Full screen (F)'" @click="toggleFullscreen">
            <svg v-if="isFullscreen" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
            <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
          <button type="button" class="present__btn present__btn--exit" title="End the presentation (Esc)" @click="close">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </div>

        <div class="present__progress"><span :style="{ width: progress + '%' }" /></div>
      </div>
    </div>
  </Teleport>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useWidgetStore } from '@/store'
import type { TdLayout } from '@/store/design/widget'
import SlideView from './SlideView.vue'

/** How long the mouse has to sit still before the controls and cursor fade. */
const IDLE_AFTER = 2600
/** Trackpads report a stream of small deltas; only a decisive one turns a page. */
const WHEEL_THRESHOLD = 40
const WHEEL_COOLDOWN = 420
const SWIPE_THRESHOLD = 50
/** How many slides either side of the current one to draw before they are needed. */
const REACH = 2

const canvasStore = useCanvasStore()
const widgetStore = useWidgetStore()
const { dLayouts } = storeToRefs(widgetStore)

const isOpen = ref(false)
const index = ref(0)
const isOverview = ref(false)
const isIdle = ref(false)
const isFullscreen = ref(false)
const curtain = ref<'' | 'black' | 'white'>('')
const stage = ref({ width: 0, height: 0 })
const elapsed = ref(0)
/** Slides drawn so far. Only ever grows, so going back is instant. */
const mounted = ref(new Set<number>())

const rootRef = ref<HTMLElement | null>(null)
const stageRef = ref<HTMLElement | null>(null)

const pages = computed(() => dLayouts.value || [])

/** Draws the current slide and its neighbours, keeping everything drawn before. */
function reach(centre: number) {
  const next = new Set(mounted.value)
  for (let i = centre - REACH; i <= centre + REACH; i++) {
    if (i >= 0 && i < pages.value.length) next.add(i)
  }
  mounted.value = next
}

watch(index, (n) => reach(n))

/** The name the page strip would show, so a slide is called the same thing in both. */
function pageLabel(page: TdLayout | undefined, position: number) {
  const name = page?.global?.name
  return name && name !== 'New page' ? name : `Page ${position + 1}`
}
const progress = computed(() => (pages.value.length < 2 ? 100 : (index.value / (pages.value.length - 1)) * 100))

const elapsedLabel = computed(() => {
  const total = elapsed.value
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
})

let idleTimer: ReturnType<typeof setTimeout> | undefined
let clockTimer: ReturnType<typeof setInterval> | undefined
let lastWheel = 0
let touchStartX = 0
/** Set while we ourselves are leaving full screen, to tell that apart from Esc. */
let leavingFullscreenOnPurpose = false

/* ---------------------------------------------------------------- opening */

/** Starts the show. Defaults to the page being edited, as slide software does. */
async function open(startAt?: number) {
  if (isOpen.value) return
  if (pages.value.length === 0) return

  index.value = clamp(startAt ?? canvasStore.dCurrentPage)
  isOverview.value = false
  curtain.value = ''
  isIdle.value = false
  elapsed.value = 0
  mounted.value = new Set()
  reach(index.value)
  isOpen.value = true

  await nextTick()
  rootRef.value?.focus()
  measureStage()
  window.addEventListener('keydown', onKeydown, true)
  window.addEventListener('resize', measureStage)
  document.addEventListener('fullscreenchange', onFullscreenChange)
  clockTimer = setInterval(() => (elapsed.value += 1), 1000)
  wake()
  await enterFullscreen()
}

/**
 * Ends the show and leaves the editor on whichever slide the talk finished on,
 * which is nearly always the one you want to go back and fix.
 */
function close() {
  if (!isOpen.value) return
  isOpen.value = false
  isOverview.value = false
  curtain.value = ''

  window.removeEventListener('keydown', onKeydown, true)
  window.removeEventListener('resize', measureStage)
  document.removeEventListener('fullscreenchange', onFullscreenChange)
  clearTimeout(idleTimer)
  clearInterval(clockTimer)
  clockTimer = undefined

  exitFullscreen()
  syncEditorPage(index.value)
}

/** Puts the editor on `page`. The store owns the order these have to happen in. */
function syncEditorPage(page: number) {
  if (page === canvasStore.dCurrentPage) return
  if (!dLayouts.value[page]) return
  widgetStore.showPage(page)
}

/* ------------------------------------------------------------- navigation */

function clamp(n: number) {
  return Math.max(0, Math.min(n, pages.value.length - 1))
}

function goTo(n: number, { closeOverview = false } = {}) {
  curtain.value = ''
  index.value = clamp(n)
  if (closeOverview) isOverview.value = false
}

function next() {
  if (index.value < pages.value.length - 1) goTo(index.value + 1)
}

function prev() {
  if (index.value > 0) goTo(index.value - 1)
}

/* --------------------------------------------------------------- keyboard */

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter', 'n', 'N']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P']

/**
 * Runs on capture so the editor's own shortcuts never see these keys — an
 * arrow key mid-presentation must not nudge a layer on the page behind us.
 */
function onKeydown(e: KeyboardEvent) {
  if (!isOpen.value) return

  const handled = () => {
    e.preventDefault()
    e.stopPropagation()
    wake()
  }

  if (e.key === 'Escape') {
    handled()
    if (isOverview.value) isOverview.value = false
    else if (curtain.value) curtain.value = ''
    else close()
    return
  }

  // Anything that moves the talk along also lifts a blanked screen, rather
  // than needing the same key twice.
  const lift = () => {
    if (!curtain.value) return false
    curtain.value = ''
    return true
  }

  if (NEXT_KEYS.includes(e.key)) {
    handled()
    if (!lift()) next()
    return
  }
  if (PREV_KEYS.includes(e.key)) {
    handled()
    if (!lift()) prev()
    return
  }

  switch (e.key) {
    case 'Home':
      handled()
      goTo(0)
      break
    case 'End':
      handled()
      goTo(pages.value.length - 1)
      break
    case 'f':
    case 'F':
      handled()
      toggleFullscreen()
      break
    case 'b':
    case 'B':
      handled()
      curtain.value = curtain.value === 'black' ? '' : 'black'
      break
    case 'w':
    case 'W':
      handled()
      curtain.value = curtain.value === 'white' ? '' : 'white'
      break
    case 'g':
    case 'G':
    case 'o':
    case 'O':
      handled()
      isOverview.value = !isOverview.value
      break
    default:
      // A digit jumps straight to that slide, for questions at the end.
      if (/^[1-9]$/.test(e.key)) {
        handled()
        goTo(Number(e.key) - 1)
      }
  }
}

/* ------------------------------------------------------- mouse and touch */

function onStageClick() {
  if (isOverview.value) return
  if (curtain.value) {
    curtain.value = ''
    return
  }
  next()
}

function onWheel(e: WheelEvent) {
  if (isOverview.value) return
  const now = Date.now()
  if (now - lastWheel < WHEEL_COOLDOWN) return
  const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
  if (Math.abs(delta) < WHEEL_THRESHOLD) return
  lastWheel = now
  delta > 0 ? next() : prev()
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0]?.clientX ?? 0
  wake()
}

function onTouchEnd(e: TouchEvent) {
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX
  if (Math.abs(dx) < SWIPE_THRESHOLD) return
  dx < 0 ? next() : prev()
}

/** Any sign of life brings the controls and the cursor back for a moment. */
function wake() {
  isIdle.value = false
  clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (!isOverview.value) isIdle.value = true
  }, IDLE_AFTER)
}

function resetTimer() {
  elapsed.value = 0
}

/* ------------------------------------------------------------ full screen */

async function enterFullscreen() {
  const el = rootRef.value
  if (!el || document.fullscreenElement) return
  try {
    await el.requestFullscreen()
  } catch (e) {
    // Some browsers refuse without a direct gesture, and some are in a mode
    // that forbids it outright. The overlay already covers the viewport, so
    // the presentation still works — it just keeps the browser chrome.
  }
  isFullscreen.value = !!document.fullscreenElement
}

function exitFullscreen() {
  if (!document.fullscreenElement) return
  leavingFullscreenOnPurpose = true
  document.exitFullscreen().catch(() => {})
}

function toggleFullscreen() {
  if (document.fullscreenElement) exitFullscreen()
  else enterFullscreen()
}

/**
 * In full screen the browser swallows Esc to drop out of it, so our own key
 * handler never sees it. Treat that as "end the presentation", which is what
 * pressing Esc during a talk is meant to do — unless we were the ones who
 * asked to leave full screen, via the F key or the button.
 */
function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement
  requestAnimationFrame(measureStage)
  if (document.fullscreenElement) return
  if (leavingFullscreenOnPurpose) {
    leavingFullscreenOnPurpose = false
    return
  }
  close()
}

/* ----------------------------------------------------------------- layout */

/**
 * The stage always fills the viewport, so the slide is re-fitted whenever that
 * changes — a window resize, a rotated tablet, or moving in and out of full
 * screen, which is the one that happens in front of an audience.
 */
function measureStage() {
  const el = stageRef.value
  if (!el) return
  stage.value = { width: el.clientWidth, height: el.clientHeight }
}

onBeforeUnmount(close)

defineExpose({ open, close })
</script>

<style lang="less" scoped>
// Deliberately not themed. A presentation is projected artwork on a neutral
// surround, and it should look the same whether the editor is light or dark.
@present-ink: rgba(255, 255, 255, 0.92);
@present-ink-dim: rgba(255, 255, 255, 0.55);
@present-chrome: rgba(22, 22, 24, 0.82);

.present {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: #0b0b0d;
  overflow: hidden;
  outline: none;
  cursor: default;

  &--idle {
    cursor: none;
    .present__chrome {
      opacity: 0;
      pointer-events: none;
    }
  }

  &__stage {
    position: absolute;
    inset: 0;
  }

  // Every slide sits centred and stacked; only the current one is painted.
  &__slot {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.22s ease;

    &.is-current {
      opacity: 1;
    }
  }

  &__curtain {
    position: absolute;
    inset: 0;
    &--black {
      background: #000;
    }
    &--white {
      background: #fff;
    }
  }

  &__chrome {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding-bottom: 18px;
    transition: opacity 0.35s ease;
  }

  &__bar {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px;
    border-radius: @radius-pill;
    background: @present-chrome;
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.45);
    color: @present-ink;
  }

  &__btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    padding: 0;
    border: none;
    border-radius: 50%;
    background: transparent;
    color: @present-ink;
    cursor: pointer;
    transition: background-color 0.12s ease, color 0.12s ease, opacity 0.12s ease;

    svg {
      width: 17px;
      height: 17px;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    // The overview icon is drawn with rectangles, which want a fill.
    &.is-on,
    &:hover {
      background: rgba(255, 255, 255, 0.14);
    }
    &:disabled {
      opacity: 0.28;
      cursor: default;
      background: transparent;
    }
    &--exit:hover {
      background: rgba(255, 90, 90, 0.28);
    }
  }

  &__counter,
  &__timer {
    border: none;
    background: transparent;
    color: @present-ink-dim;
    font-size: @text-base;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
    border-radius: @radius-pill;
    padding: 0 10px;
    height: 34px;
    line-height: 34px;
    white-space: nowrap;

    b {
      color: @present-ink;
      font-weight: 600;
    }
    &:hover {
      background: rgba(255, 255, 255, 0.14);
    }
  }

  &__divider {
    width: 1px;
    height: 20px;
    margin: 0 4px;
    background: rgba(255, 255, 255, 0.16);
  }

  &__progress {
    width: min(560px, 60vw);
    height: 3px;
    border-radius: @radius-pill;
    background: rgba(255, 255, 255, 0.14);
    overflow: hidden;

    span {
      display: block;
      height: 100%;
      background: @present-ink;
      transition: width 0.22s ease;
    }
  }

  &__overview {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px;
    background: rgba(8, 8, 10, 0.9);
    backdrop-filter: blur(6px);
    overflow: auto;
  }

  &__overview-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 18px;
    justify-content: center;
    max-width: 1100px;
  }

  &__thumb {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 248px;
    height: 140px;
    padding: 0;
    background: #000;
    border: 2px solid transparent;
    border-radius: @radius;
    overflow: hidden;
    cursor: pointer;
    transition: border-color 0.12s ease, transform 0.12s ease;

    &:hover {
      border-color: rgba(255, 255, 255, 0.5);
      transform: translateY(-2px);
    }
    &.is-current {
      border-color: #fff;
    }
  }

  &__thumb-num {
    position: absolute;
    left: 6px;
    bottom: 6px;
    min-width: 18px;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.65);
    color: @present-ink;
    font-size: @text-xs;
    line-height: 16px;
  }

  // Named pages earn their name here; unnamed ones just repeat the number,
  // which is still the quickest way to find the slide you are after.
  &__thumb-name {
    position: absolute;
    left: 30px;
    right: 6px;
    bottom: 6px;
    padding: 1px 5px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.65);
    color: @present-ink;
    font-size: @text-xs;
    line-height: 16px;
    text-align: left;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
