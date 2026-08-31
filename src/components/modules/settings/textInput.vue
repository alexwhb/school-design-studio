<!--
 * @Author: ShawnPhang
 * @Date: 2022-03-30 15:18:12
 * @Description:  
 * @LastEditors: ShawnPhang
 * @LastEditTime: 2022-04-07 14:29:29
-->
<template>
  <div class="text-input">
    <p v-if="label" class="input-label">{{ label }}</p>
    <div :class="{ 'input-wrap': true, active: inputBorder }">
      <input 
        :class="{ 'real-input': true, disable: !props.editable }" 
        type="text" :value="props.modelValue" 
        :readonly="!editable" 
        @input="updateValue(($event.target as HTMLInputElement).value)" 
        @focus="focusInput"
        @blur="blurInput"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
// 文本输入组件
// const NAME = 'text-input'

type TProps = {
  label?: string
  modelValue?: string
  editable?: boolean
}

type TEmits = {
  (event:'update:modelValue', data: string): void
  (event: 'finish', data: string): void
}

const props = withDefaults(defineProps<TProps>(), {
  label: '',
  modelValue: '',
  editable: true,
})

const emit = defineEmits<TEmits>()

const inputBorder = ref(false)
const tagText = ref<string>('')

function updateValue(value: string) {
  emit('update:modelValue', value)
}

function focusInput() {
  inputBorder.value = true
  tagText.value = props.modelValue
}

function blurInput() {
  inputBorder.value = false
  if (props.modelValue !== tagText.value) {
    emit('finish', props.modelValue)
  }
}
</script>

<style lang="less" scoped>
.text-input {
  align-items: flex-start;
  display: flex;
  flex-direction: row;
  font-size: 12px;
  line-height: 12px;
  width: 100%;
  .input-label {
    user-select: none;
    padding-left: 0px;
    padding: 7px;
  }
  .input-wrap {
    border-radius: 3px;
    border: 1px solid @line;
    flex: 1;
    padding: 5px;
    .real-input {
      border-radius: 3px;
      border: 0px;
      outline: none;
      width: 100%;
    }
    .real-input.disable {
      color: @ink-2;
      cursor: not-allowed;
    }
  }
  .input-wrap.active {
    border: 1px solid @accent;
    box-shadow: 0 0 0 2px @accent-a25;
  }
}
</style>
