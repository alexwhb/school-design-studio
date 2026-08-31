<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-09 11:44:29
 * @Description: 数值滑块组件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-10-16 09:46:23
-->
<template>
  <!--
    Label sits above the track rather than beside it. English control names
    ("Letter spacing", "Line height") are long enough to wrap in a fixed-width
    gutter, and stacking also gives the slider its full width.
  -->
  <div id="number-slider">
    <div class="slider-head">
      <span class="label">{{ label }}</span>
      <span class="value">{{ displayValue }}</span>
    </div>
    <el-slider
      v-model="innerValue"
      :min="minValue" :max="maxValue" :step="step"
      input-size="small"
      :show-input="false" :show-tooltip="false" :show-input-controls="false"
      @change="changeValue"
    />
  </div>
</template>

<script lang="ts" setup>
// const NAME = 'number-slider'
import { watch, ref, computed, onMounted } from 'vue';

type TProps = {
  label?: string
  modelValue?: number
  minValue?: number
  maxValue?: number
  step?: number
  showInput?: boolean
}

type TEmits = {
  (event: 'update:modelValue', data: number): void
  (event: 'finish', data: number | number[]): void
}

const props = withDefaults(defineProps<TProps>(), {
  label: '',
  modelValue: 0,
  minValue: 0,
  maxValue: 500,
  step: 1,
  showInput: true
})
const emit = defineEmits<TEmits>()

const innerValue = ref<number>(props.minValue)
innerValue.value = props.modelValue

watch(
  () => innerValue.value,
  (value) => {
    if (props.modelValue !== value) {
      emit('update:modelValue', value)
    }
  }
)

watch(
  () => props.modelValue,
  () => {
    innerValue.value = props.modelValue
  }
)

/** Trims float noise so the readout stays short: 1.5, not 1.4999999999. */
const displayValue = computed(() => Number(Number(innerValue.value).toFixed(2)))

function changeValue(value: number | number[]) {
  emit('finish', value)
}
</script>

<style lang="less">
// style fix
.el-slider {
  width: 100%;
  .show-input {
    margin-right: 15px !important;
  }
  .el-slider__input {
    width: 50px !important;
    // .el-input-number__decrease {
    //   width: 16px !important;
    // }
    // .el-input-number__increase {
    //   width: 16px !important;
    // }
    .el-input--small {
      .el-input__wrapper {
        padding-left: 10px !important;
        padding-right: 10px !important;
      }
    }
  }
}
</style>

<style lang="less" scoped>
#number-slider {
  display: flex;
  flex-direction: column;
  width: 100%;

  .slider-head {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 8px;

    .label {
      user-select: none;
      color: @ink-2;
      font-size: @text-base;
    }
    .value {
      color: @ink-3;
      font-size: @text-sm;
      font-variant-numeric: tabular-nums;
    }
  }

  :deep(.el-slider) {
    margin-top: 2px;
  }
}
</style>
