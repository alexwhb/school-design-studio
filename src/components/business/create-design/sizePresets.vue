<!--
  The list of page sizes a school actually uses.

  Shared by the new-design dialog and the resize dialog, which ask the same
  question at different moments — "how big is this?" — and should not answer it
  with two different lists.
-->
<template>
  <ul class="pre-list">
    <li v-for="(size, index) in sizes" :key="'s' + index" :class="['item', { 'is-on': isCurrent(size) }]" @click="$emit('pick', size)">
      <i :class="['icon', size.icon]" /> {{ size.name }} <span class="info">{{ size.width }} × {{ size.height }} px</span>
    </li>
  </ul>
</template>

<script lang="ts" setup>
import sizes from '@/assets/data/PageSizeData'

type TProps = {
  /** Marks whichever preset matches, so the current size is obvious in the list. */
  width?: number
  height?: number
}
const props = defineProps<TProps>()

defineEmits<{
  (event: 'pick', size: { width: number; height: number }): void
}>()

function isCurrent(size: { width: number; height: number }) {
  return Math.round(props.width || 0) === size.width && Math.round(props.height || 0) === size.height
}
</script>

<style lang="less" scoped>
.pre-list {
  margin: 1rem 0;
  height: 245px;
  overflow-y: auto;
  .item {
    padding: 10px 8px;
    border-radius: 8px;
    cursor: pointer;
    font-size: 15px;
    color: @ink;
    .icon {
      margin-right: 0.2rem;
    }
    .info {
      margin-left: 0.4rem;
      font-size: 12px;
      color: @ink-4;
    }
  }
  .item:hover {
    background-color: @surface-2;
  }
  .item.is-on {
    background-color: @accent-a25;
  }
}
</style>
