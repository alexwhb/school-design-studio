<!--
  Read-only twin of wQrcode.vue.

  The editing component reports its measured size back to the store and pokes
  moveable on every update, which is exactly what a page thumbnail or a slide
  must not do. This renders the same QR code and nothing else.
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
  >
    <QRCode v-bind="qrCodeOptions" :width="width" :height="width" class="target" :image="params.url" :value="params.value" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Options } from 'qr-code-styling'
import QRCode from '@/components/business/qrcode'
import { TWQrcodeSetting } from './wQrcodeSetting'

type TProps = {
  params: TWQrcodeSetting & {
    rotate?: number
  }
  parent: {
    top: number
    left: number
  }
}

const props = defineProps<TProps>()
const widgetRef = ref<HTMLElement | null>(null)
const width = computed(() => Number(props.params.width))

const qrCodeOptions = computed<Options>(() => ({
  qrOptions: { typeNumber: 0, mode: 'Byte', errorCorrectionLevel: 'H' },
  dotsOptions: {
    type: props.params.dotType,
    color: props.params.dotColor,
    gradient: {
      type: 'linear',
      rotation: props.params.dotRotation,
      colorStops: [
        { offset: 0, color: props.params.dotColor },
        { offset: 1, color: props.params.dotColorType === 'single' ? props.params.dotColor : props.params.dotColor2 },
      ],
    },
  },
}))

onMounted(() => {
  if (!widgetRef.value) return
  props.params.rotate && (widgetRef.value.style.transform = `rotate(${props.params.rotate})`)
})
</script>
