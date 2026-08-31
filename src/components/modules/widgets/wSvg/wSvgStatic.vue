<!--
  Read-only twin of wSvg.vue.

  Shapes are stored as SVG markup rather than a URL, and their colours as
  `{{colors[n]}}` placeholders, so drawing one means parsing the markup and
  substituting the colours. That has to happen the same way here as it does on
  the canvas — see wSvg.vue — or a shape shows up as an empty box in the page
  thumbnails and in presentation mode.
-->
<template>
  <div
    ref="widgetRef"
    :style="{
      position: 'absolute',
      left: params.left - parent.left + 'px',
      top: params.top - parent.top + 'px',
      width: params.width + 'px',
      height: params.height + 'px',
      opacity: params.opacity,
    }"
  ></div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, ref } from 'vue'
import { TWSvgSetting } from './wSvgSetting'

type TProps = {
  params: TWSvgSetting
  parent: {
    left: number
    top: number
  }
}

const props = defineProps<TProps>()
const widgetRef = ref<HTMLElement | null>(null)

onMounted(async () => {
  // Keep any rotation the shape was given on the canvas.
  if (widgetRef.value) {
    props.params.transform && (widgetRef.value.style.transform = props.params.transform)
    props.params.rotate && (widgetRef.value.style.transform += `rotate(${props.params.rotate})`)
  }
  await nextTick()
  drawSvg()
})

function drawSvg() {
  const Snap = (window as any).Snap
  if (!Snap || !widgetRef.value) return

  // Snap.parse only hands back the <svg> element itself when the source
  // *starts* with `<svg`; a licence comment in front of it makes it wrap the
  // lot in a DocumentFragment instead. Dig the element out either way.
  const parsed = Snap.parse(props.params.svgUrl)
  const svgNode: SVGSVGElement | null = parsed.node.nodeType === Node.ELEMENT_NODE ? parsed.node : parsed.node.querySelector('svg')
  if (!svgNode) return

  svgNode.removeAttribute('width')
  svgNode.removeAttribute('height')
  svgNode.setAttribute('style', 'height: inherit;width: inherit;')

  const colours = colourMap()
  // The root <svg> carries the colour placeholder as often as its children do
  // (every Lucide icon puts `stroke` there), so the walk starts at it.
  applyColours(svgNode, colours)

  widgetRef.value.appendChild(svgNode)
}

function applyColours(el: Element, colours: Record<string, string>) {
  if (el.attributes) {
    for (const attr of Array.from(el.attributes)) {
      if (colours[attr.value]) attr.value = colours[attr.value]
    }
  }
  el.childNodes.forEach((child) => applyColours(child as Element, colours))
}

function colourMap() {
  const map: Record<string, string> = {}
  props.params.colors.forEach((colour: string, i: number) => {
    map[`{{colors[${i}]}}`] = colour
  })
  return map
}
</script>
