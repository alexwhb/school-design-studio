<!--
 * @Author: ShawnPhang
 * @Date: 2024-04-08 16:50:04
 * @Description: 画布加水印
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-08 18:00:37
-->
<template>
  <el-tooltip :show-after="400" :hide-after="0" effect="dark" content="Stamp a faint name across the page" placement="bottom">
    <label class="watermark-toggle">
      <el-switch v-model="wmBollean" @change="wmChange" size="small" />
      <span class="watermark-toggle__label">Watermark</span>
    </label>
  </el-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBaseStore } from '@/store'
import _config from '@/config'

const baseStore = useBaseStore()
const wmBollean = ref(false)

// The switch now reads as "watermark on", which is the way round people expect.
function wmChange(enabled: string | number | boolean) {
  baseStore.changeWatermark(enabled ? [_config.APP_NAME] : '')
}
</script>

<style lang="less" scoped>
.watermark-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  cursor: pointer;
  user-select: none;
  padding: 0 4px;

  &__label {
    color: @ink-2;
    font-size: @text-base;
  }
}
</style>
