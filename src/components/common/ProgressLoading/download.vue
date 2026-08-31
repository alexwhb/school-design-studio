<!--
 * @Author: ShawnPhang
 * @Date: 2024-03-17 16:10:21
 * @Description:  
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-11 18:42:09
-->
<template>
  <div v-if="percent" v-show="!hide" class="mask">
    <div class="content">
      <div class="tool">
        <div v-show="percent < 100" class="backstage" @click="close"><span style="margin-left: 0.4rem">Download in the background</span></div>
        <iconClose v-show="percent >= 100" class="backstage" @click="cancel" width="20" />
      </div>
      <div class="text">{{ text }}</div>
      <el-progress style="width: 100%" :text-inside="true" :percentage="percent" />
      <div v-show="percent < 100" class="text btn" @click="cancel">{{ cancelText }}</div>
      <div class="text info">{{ msg }}</div>
      <!-- Drawn here rather than fetched: this used to hotlink a PNG from the
           upstream project's asset host, so the one moment the app says "done"
           depended on a third-party CDN being up. -->
      <div v-show="percent >= 100" class="success" aria-hidden="true">
        <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="24" cy="24" r="21" opacity="0.25" />
          <path d="M14 24.5 21 31.5 34 17.5" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, ref } from 'vue'
import { ElProgress } from 'element-plus'
import { Close as iconClose } from '@element-plus/icons-vue'
// import toolTip from '@/components/common/PopoverTip.vue'

type TProps = {
  percent: number
  text?: string
  cancelText?: string
  msg?: string
}

type TEmits = {
  (event: 'done'): void
  (event: 'cancel'): void
}

const props = withDefaults(defineProps<TProps>(), {
  percent: 0,
  text: '',
  cancelText: '',
  msg: '',
})

const hide = ref(false)

const emit = defineEmits<TEmits>()

watch(
  () => props.percent,
  (num) => {
    if (num >= 100) {
      // setTimeout(() => {
      //   emit('done')
      // }, 1000)
      hide.value = false
    }
  },
)

const cancel = () => {
  emit('cancel')
  hide.value = false
}

const close = () => {
  hide.value = true
}

defineExpose({
  cancel,
})
</script>

<style lang="less" scoped>
:deep(.el-progress-bar__innerText) {
  opacity: 0;
}
.mask {
  user-select: none;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 0 24%;
  width: 100%;
  height: 100%;
  position: fixed;
  z-index: 9999;
  top: 0;
  left: 0;
  background: @overlay;
}
.content {
  background: @popover;
  border-radius: 8px;
  padding: 2rem 4rem;
}
.text {
  margin: 2rem 0;
  font-size: 20px;
  font-weight: bold;
  width: 100%;
  text-align: center;
  color: @ink;
}
.btn {
  font-weight: 400;
  font-size: 16px;
  cursor: pointer;
  color: @accent;
}
.info {
  font-weight: 400;
  font-size: 16px;
  color: @ink-3;
}
.tool {
  text-align: right;
  .backstage {
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    font-size: 14px;
  }
}
.success {
  display: flex;
  justify-content: center;
  color: @accent;
  svg {
    width: 64px;
    height: 64px;
  }
}
</style>
