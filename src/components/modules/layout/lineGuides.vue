<!--
 * @Author: ShawnPhang
 * @Date: 2022-04-08 10:31:34
 * @Description: 标尺
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-10 23:07:44
-->
<template>
  <div></div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, watch } from 'vue'

import Guides, { GuideOptions } from '@scena/guides'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useControlStore, useWidgetStore } from '@/store'
import useTheme from '@/common/hooks/useTheme'
import getSnapPositions from '@/common/methods/snapping'

type TProps = {
  show: boolean
}

type TSameParams = {
  backgroundColor: string
  lineColor: string
  textColor: string
  // direction: 'start',
  // height: 30,
  displayDragPos: boolean
  dragPosFormat: (v: string | number) => string
  snapThreshold: number
}

type TGuidesData = Guides & GuideOptions

const props = withDefaults(defineProps<TProps>(), {
  show: false,
})

const canvasStore = useCanvasStore()
const controlStore = useControlStore()
const widgetStore = useWidgetStore()
const { resolved: theme } = useTheme()
const { dPage, dZoom, guidelines } = storeToRefs(canvasStore)
const { dWidgets } = storeToRefs(widgetStore)
const { dSnapEnabled } = storeToRefs(controlStore)
const container = 'page-design' // page-design out-page
let guidesTop: TGuidesData | null = null
let guidesLeft: TGuidesData | null = null
let resizeObserver: ResizeObserver | null = null
const lastSnaps = { x: '', y: '' }

/**
 * A guide sits within a couple of pixels of an object's edge either way, so the
 * pull has to be gentle enough that you can still place one deliberately.
 */
const GUIDE_SNAP_THRESHOLD = 5

watch(
  () => props.show,
  (open) => {
    if (open) {
      render()
      return
    }
    destroy()
    // Hidden guides that objects still stuck to would be baffling, so putting
    // the rulers away puts the guides away with them.
    canvasStore.updateGuidelines({ verticalGuidelines: [], horizontalGuidelines: [] })
  },
)

watch(
  () => [dZoom.value, dPage.value.width, dPage.value.height],
  () => changeScroll(),
)

// What a dragged guide sticks to is whatever is on the page, so keep the list
// in step with the layers.
watch([dWidgets, dSnapEnabled], () => updateSnaps(), { deep: true })

// @scena/guides paints the rulers into a canvas from colours passed at
// construction, so it cannot follow a CSS variable. Rebuild them when the
// theme changes — cheap, and only while the rulers are actually shown.
watch(theme, () => {
  if (!props.show) return
  destroy()
  render()
})

onBeforeUnmount(destroy)

function destroy() {
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', changeScroll)
  guidesTop?.destroy()
  guidesLeft?.destroy()
  guidesTop = null
  guidesLeft = null
  lastSnaps.x = ''
  lastSnaps.y = ''
}

/** Reads a theme token, so the rulers match whichever palette is live. */
function token(name: string, fallback: string) {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || fallback
}

function render() {
  const sameParams: TSameParams = {
    backgroundColor: token('--ds-ruler-bg', '#f3f8fa'),
    lineColor: token('--ds-ruler-line', '#acbac1'),
    textColor: token('--ds-ruler-text', '#75838a'),
    // direction: 'start',
    // height: 30,
    displayDragPos: true,
    dragPosFormat: (v) => v + 'px',
    snapThreshold: GUIDE_SNAP_THRESHOLD,
  }

  const containerEl = document.getElementById(container)
  if (!containerEl) return

  // The top ruler measures x; the guides you pull out of it are horizontal
  // lines, so their positions are y values. The left ruler is the mirror image.
  guidesTop = new Guides(containerEl, {
    ...sameParams,
    type: 'horizontal',
    className: 'my-horizontal',
    // Rebuilt from scratch on a theme change; the guides survive it.
    defaultGuides: [...guidelines.value.horizontalGuidelines],
  }).on('changeGuides', (e) => {
    canvasStore.updateGuidelines({ horizontalGuidelines: e.guides })
  })

  guidesLeft = new Guides(containerEl, {
    ...sameParams,
    type: 'vertical',
    className: 'my-vertical',
    defaultGuides: [...guidelines.value.verticalGuidelines],
  }).on('changeGuides', (e) => {
    canvasStore.updateGuidelines({ verticalGuidelines: e.guides })
  })

  // The page is centred in whatever space the panels leave, so its position
  // moves when the window does — and with it where the rulers read zero.
  window.addEventListener('resize', changeScroll)
  const pageDesignEl = document.getElementById('page-design')
  if (pageDesignEl && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => changeScroll())
    resizeObserver.observe(pageDesignEl)
  }

  changeScroll()
}

/** The zero of both rulers is the top-left corner of the page. */
function alignToPage() {
  if (!guidesTop || !guidesLeft) return
  const zoom = dZoom.value / 100
  if (!zoom) return

  const canvasEl = document.getElementById('page-design-canvas')
  const topEl = document.querySelector('.my-horizontal') as HTMLElement | null
  const leftEl = document.querySelector('.my-vertical') as HTMLElement | null
  if (!canvasEl || !topEl || !leftEl) return

  // The page is CSS-scaled, so its measured rect already carries the zoom —
  // which is exactly the mapping the rulers need, and it stays right whatever
  // the transform-origin happens to be at this zoom level.
  const page = canvasEl.getBoundingClientRect()
  const topRect = topEl.getBoundingClientRect()
  const leftRect = leftEl.getBoundingClientRect()

  // Both rulers draw a value at `(value - scrollPos) * zoom` from their own
  // origin, so the offset wanted is simply the gap to the page, unscaled.
  const topRuler = topEl.querySelector('canvas') as HTMLElement | null
  const leftRuler = leftEl.querySelector('canvas') as HTMLElement | null
  // The guide layer is a separate box, tucked past the ruler gutter.
  const topGuides = topEl.querySelector('.scena-guides') as HTMLElement | null
  const leftGuides = leftEl.querySelector('.scena-guides') as HTMLElement | null

  guidesTop.scroll((topRect.left + (topRuler?.offsetLeft ?? 0) - page.left) / zoom)
  guidesTop.scrollGuides((topRect.top + (topGuides?.offsetTop ?? 0) - page.top) / zoom)
  guidesLeft.scroll((leftRect.top + (leftRuler?.offsetTop ?? 0) - page.top) / zoom)
  guidesLeft.scrollGuides((leftRect.left + (leftGuides?.offsetLeft ?? 0) - page.left) / zoom)
}

/** Feeds the rulers the object edges a dragged guide should stick to. */
function updateSnaps() {
  if (!guidesTop || !guidesLeft) return
  const positions = dSnapEnabled.value ? getSnapPositions(dWidgets.value, dPage.value) : { x: [], y: [] }
  // A guide can only sit on a whole pixel, so offer it whole pixels.
  const x = [...new Set(positions.x.map(Math.round))]
  const y = [...new Set(positions.y.map(Math.round))]
  // Assigning re-renders the ruler, and the layers change on every keystroke in
  // a text box, so only hand over a list that is actually different.
  if (y.join() !== lastSnaps.y) {
    lastSnaps.y = y.join()
    guidesTop.snaps = y
  }
  if (x.join() !== lastSnaps.x) {
    lastSnaps.x = x.join()
    guidesLeft.snaps = x
  }
}

function changeScroll() {
  if (!guidesTop || !guidesLeft) return
  const zoom = dZoom.value / 100
  guidesTop.zoom = zoom
  guidesLeft.zoom = zoom
  if (zoom < 0.9) {
    guidesTop.unit = Math.floor(1 / zoom) * 50
    guidesLeft.unit = Math.floor(1 / zoom) * 50
  } else {
    guidesTop.unit = 50
    guidesLeft.unit = 50
  }
  updateSnaps()
  alignToPage()
  // The page finishes moving after a zoom change, so measure again once it has.
  setTimeout(alignToPage, 300)
}
</script>

<style lang="less">
// :deep(.shortLineSize) {
//   height: 1px !important;
// }
.my-horizontal,
.my-vertical {
  position: absolute !important;
  z-index: 99;
}

// A guide crosses the whole page, so no single colour can be relied on to show
// up: red guides vanish on a red poster, and any colour picked to suit the
// background still runs over a photo on its way past. Casing the line solves it
// for every background at once — you see the colour, or you see the casing.
//
// @scena/guides injects its own rules through a styled element, so these are
// written from #page-design down to outrank them without !important.
#page-design {
  .my-horizontal,
  .my-vertical {
    .scena-guide {
      background: @guide-line;
      box-shadow: 0 0 0 1px @guide-casing;
    }
    // The px readout that follows a guide while you drag it.
    .scena-display-drag,
    .scena-guide-pos {
      background: @guide-line;
      color: #fff;
      padding: 1px 5px;
      border-radius: @radius-sm;
      font-size: @text-xs;
      line-height: 1.5;
    }
  }
}
.my-horizontal {
  left: 0px;
  top: 0;
  width: calc(100% - 30px);
  height: 30px !important;
}
.my-vertical {
  top: 30px;
  left: 0px;
  height: calc(100% - 60px);
  width: 30px !important;
}
</style>
