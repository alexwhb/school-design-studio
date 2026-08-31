<template>
  <div class="color__select" :style="{ width }">
    <p v-if="label" class="input-label">
      {{ label }}
    </p>
    <div class="content">
      <el-popover placement="left-end" trigger="click" width="auto" @after-enter="enter" @before-leave="hide">
        <!-- eslint-disable-next-line vue/no-v-model-argument -->
        <color-picker v-model:value="state.innerColor" :modes="modes" @change="colorChange" @nativePick="dropColor" />
        <template #reference>
          <!-- A small chip beside the value reads more like a colour field than
               a full-width bar, and leaves room to show the value itself. -->
          <div class="color__field">
            <span class="color__chip transparent-bg"><span class="color__chip-fill" :style="{ background: state.innerColor }"></span></span>
            <span class="color__value">{{ readableColor }}</span>
          </div>
        </template>
      </el-popover>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, computed, onMounted, watch } from 'vue'

import colorPicker from '@palxp/color-picker'
import { useControlStore } from '@/store';

type TProps = {
  label?: string
  modelValue?: string
  width?: string
  modes?: string[]
}

type TEmits = {
  (event: 'finish', data: string): void
  (event: 'update:modelValue', data: string): void
  (event: 'change', data: colorChangeData): void
}

type TState = {
  innerColor: string
}

export type colorChangeData = {
  angle: number
  color: string
  mode: string
}

const props = withDefaults(defineProps<TProps>(), {
  label: '',
  modelValue: '',
  width: '100%',
  modes: () => (['Solid'])
})

const emit = defineEmits<TEmits>()


const controlStore = useControlStore()

const state = reactive<TState>({
  innerColor: '',
  // colorLength: 0,
  // hasEyeDrop: 'EyeDropper' in window,
})
let first = true

    // const dColorHistory = computed(() => {
    //   return store.getters.dColorHistory
    // })

onMounted(() => {
  checkColorLength()
})

/** Shows a plain hex, or the kind of fill when it is not a flat colour. */
const readableColor = computed(() => {
  const value = state.innerColor || ''
  if (!value) return 'None'
  if (value.includes('gradient')) return 'Gradient'
  if (value.startsWith('url')) return 'Image'
  const hex = value.replace(/^#/, '').toUpperCase()
  // Drop a fully opaque alpha pair; it is noise.
  return '#' + (hex.length === 8 && hex.endsWith('FF') ? hex.slice(0, 6) : hex)
})

const dropColor = async (color: string) => {
  console.log('picked colour: ', color)
}

watch(
  () => state.innerColor,
  (value) => {
    activeChange(value)
    if (first) {
      first = false
      return
    }
  },
)

watch(
  () => props.modelValue,
  (val) => {
    val !== state.innerColor && (state.innerColor = val)
    checkColorLength()
  },
)

const updateValue = (value: any) => {
  emit('update:modelValue', value)
}

const activeChange = (value: any) => {
  updateValue(value)
}

const onChange = () => {
  emit('finish', state.innerColor)
}

function checkColorLength() {
  if (!props.modelValue) {
    return
  }
  state.innerColor = props.modelValue + (props.modelValue.length === 7 ? 'ff' : '')
}

const inputBlur = (color: string) => {
  state.innerColor = color
}

const enter = () => {
  // store.commit('setShowMoveable', false) // Clear the previous selection box
  controlStore.setShowMoveable(false) // Clear the previous selection box
}

const hide = () => {
  // store.commit('setShowMoveable', true) // Restore the previous selection box
  controlStore.setShowMoveable(true) // Restore the previous selection box
}


const colorChange = (color: colorChangeData) => {
  emit('change', color)
}

defineExpose({
  // dColorHistory,
  activeChange,
  onChange,
  dropColor,
  inputBlur,
  enter,
  hide,
  colorChange,
})
</script>

<style lang="less" scoped>
:deep(.el-color-picker--small .el-color-picker__trigger) {
  width: 100%;
}

.color {
  &__field {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 30px;
    padding: 0 8px;
    .control-surface();
    cursor: pointer;
    transition: border-color 0.12s ease;
    &:hover {
      border-color: #d4d4d8;
    }
  }
  &__chip {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    flex-shrink: 0;
    display: block;
    position: relative;
    box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
    background-size: 8px 8px;
  }
  &__chip-fill {
    position: absolute;
    inset: 0;
    border-radius: 4px;
  }
  &__value {
    color: @ink-2;
    font-size: @text-sm;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.color__select {
  .content {
    width: 100%;
    align-items: center;
    display: flex;
  }
  .input-label {
    user-select: none;
    padding: 0 0 6px;
    font-size: @text-base;
    color: @ink-2;
  }
}

.native {
  position: relative;
  margin-left: 4px;
  .input {
    width: 20px;
    height: 31px;
    opacity: 0;
    cursor: pointer;
  }
  .sd-xggj {
    position: absolute;
    width: 100%;
    height: 100%;
    top: 0;
    right: 0;
    z-index: 9;
    pointer-events: none;
    color: @ink-2;
    border: 1px solid @line;
    border-radius: @radius-sm;
    line-height: 28px;
  }
}
.native:hover {
  background: @surface-2;
}
</style>
