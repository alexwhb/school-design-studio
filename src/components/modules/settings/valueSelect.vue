<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-02 19:10:06
 * @Description: 选项选择（未拆分字体选择器）
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-03-15 17:34:00
-->
<template>
  <div ref="select" class="value-select" :style="{ width: inputWidth }">
    <p v-if="label" class="input-label">
      {{ label }}
    </p>
    <el-popover placement="bottom-end" trigger="click" width="auto">
      <!-- 单列表 -->
      <ul v-if="data && Array.isArray(data)" class="list-ul">
        <li
          v-for="listItem in data" :key="typeof listItem === 'object' ? listItem.alias : listItem"
          :class="{ active: listItem == state.innerValue }"
          @click="selectItem(listItem)"
        >
          <img v-if="listItem.preview" class="preview" :src="listItem.preview" alt="preview" />
          <span v-else>{{ (typeof listItem === 'object' ? listItem.alias : listItem) + suffix }}</span>
        </li>
      </ul>
      <!-- tab分类列表 -->
      <div v-else class="tabs-wrap">
        <el-tabs v-model="state.activeTab">
          <el-tab-pane v-for="(val, key, i) in data" :key="'tab' + i" :label="key" :name="key">
            <ul class="list-ul">
              <li v-for="listItem in data[key]" :key="typeof listItem === 'object' ? listItem.alias : listItem" :class="{ active: listItem == state.innerValue }" @click="selectItem(listItem)">
                <img v-if="listItem.preview" class="preview" :src="listItem.preview" alt="preview" />
                <span v-else :style="{ fontFamily: `'${listItem.value}'` }">{{ (typeof listItem === 'object' ? listItem.alias : listItem) + suffix }}</span>
              </li>
            </ul>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #reference>
        <div :class="['input-wrap', { active: state.inputBorder }]" :style="{ width: inputWidth }">
          <!-- <img v-if="innerPreview" class="preview" :src="innerPreview" /> -->
          <input
            :style="{ fontFamily: (modelValue as Record<string, any>).value }"
            :class="['real-input', { disable: !disable }]"
            :readonly="readonly" type="text"
            :value="showValue"
            @input="inputText" @focus="state.inputBorder = true"
            @blur="state.inputBorder = false" @keydown="(e) => opNumber(e)"
          />
          <!-- <span class="input-unit">{{ suffix }}</span> -->
          <div class="op-btn">
            <!-- <div class="down" @click="inputBorder = !inputBorder"></div> -->
            <i class="iconfont icon-down1"></i>
          </div>
        </div>
      </template>
    </el-popover>
  </div>
</template>

<script lang="ts" setup>
// 下拉选择框
const NAME = 'value-input'
import { ElTabPane, ElTabs } from 'element-plus'
import { computed, onMounted, reactive, ref, watch } from 'vue';

type TProps = {
  label?: string
  modelValue?: Record<string, any> | string | number
  suffix?: string
  data: Record<string, any>
  disable?: boolean
  inputWidth?: string
  readonly?: boolean
  step?: number
}

type TEmits = {
  (event:'update:modelValue', data: Record<string, any> | string | number): void
  (event: 'finish', data: Record<string, any> | string | number): void
}

type TState = {
  inputBorder: boolean
  tagText: string
  width: string | number
  innerValue: string
  innerPreview: string
  activeTab: string
}

const props = withDefaults(defineProps<TProps>(), {
  label: '',
  modelValue: () => ({}),
  suffix: '',
  data: () => ({}),
  disable: true,
  inputWidth: '80px',
  readonly: false,
  step: 1,
})
const emit = defineEmits<TEmits>()
const state = reactive<TState>({
  inputBorder: false,
  tagText: '',
  width: '0',
  innerValue: '',
  innerPreview: '',
  activeTab: '',
})
const selectRef = ref<HTMLElement | null>(null)

// Default to the first group rather than a fixed name. The original hard-coded
// the Chinese font tab, so renaming the groups left the picker showing a tab
// bar with no list under it.
watch(
  () => props.data,
  (data) => {
    if (!data || Array.isArray(data)) return
    const keys = Object.keys(data)
    if (keys.length && !keys.includes(state.activeTab)) state.activeTab = keys[0]
  },
  { immediate: true, deep: true },
)

const showValue = computed(() => {
  return state.innerValue
})

watch(
  () => props.modelValue,
  () => {
    state.innerValue = typeof props.modelValue === 'object' ? props.modelValue.alias : props.modelValue
  }
)

watch(
  () => state.inputBorder,
  (value) => {
    if (value) {
      state.tagText = state.innerValue
    } else {
      if (state.innerValue !== state.tagText) {
        emit('finish', state.innerValue)
      }
    }
  }
)

onMounted(() => {
  state.innerValue = typeof props.modelValue === 'object' ? props.modelValue.alias : props.modelValue
  if (selectRef.value) {
    state.width = selectRef.value.offsetWidth
  }
})

function selectItem(item: Record<string, any>) {
  let value = typeof item === 'object' ? item.alias : item
  if (state.innerValue !== value) {
    state.innerValue = value
    state.innerPreview = item.preview
    emit('finish', item)
  }
}

function inputText(e: Event) {
  // this.innerValue = e.target.value.replace(RegExp(this.suffix), '')
  state.innerValue = (e.target as HTMLInputElement).value
  setTimeout(() => {
    emit('finish', state.innerValue)
  }, 100)
}
function opNumber(e: KeyboardEvent) {
  e.stopPropagation()
  switch (e.keyCode) {
    case 38:
      typeof state.innerValue === 'number' && up()
      return
    case 40:
      typeof state.innerValue === 'number' && down()
      return
  }
}

function up() {
  emit('update:modelValue', parseInt(`${props.modelValue}` ?? '0', 10) + props.step)
}

function down() {
  let value = parseInt(`${props.modelValue}` ?? '0', 10) - props.step
  if (value < 0) {
    value = 0
  }
  emit('update:modelValue', value)
}
</script>

<style lang="less">
.value-select-list {
  min-width: 10px !important;
  padding: 5px !important;
}
</style>

<style lang="less" scoped>
@color0: @line;
@color1: @line-strong;

.value-select {
  // height: 60px;
  line-height: 1.15;
  width: 80px;
  .input-label {
    user-select: none;
    line-height: 20px;
    padding: 0 0 6px;
    font-size: @text-base;
    color: @ink-2;
  }
  .input-unit {
    font-size: 14px;
    margin-right: 5px;
    line-height: 30px;
    color: @ink-3;
  }
  .input-wrap {
    border-radius: @radius;
    border: 1px solid @line;
    display: flex;
    align-items: center;
    flex-direction: row;
    width: 80px;
    background: @surface;
    height: 34px;
    transition: border-color 0.12s ease;
    &:hover {
      border-color: @line-strong;
    }
    .preview {
      overflow: hidden;
    }
    .real-input {
      background: transparent;
      border-radius: 3px;
      border: 0px;
      font-size: @text-base;
      color: @ink;
      height: 32px;
      outline: none;
      padding: 6px;
      text-align: center;
      width: 100%;
    }
    .real-input.disable {
      color: @ink-2;
      cursor: not-allowed;
    }
    .op-btn {
      // border-left: 1px solid @color0;
      display: flex;
      align-items: center;
      // flex-direction: column;
      height: 32px;
      .icon-down1 {
        font-size: 18px;
        margin-right: 6px;
        color: @ink-4;
        line-height: 32px;
      }
      // .down {
      //   border-bottom-right-radius: 3px;
      //   flex: 1;
      //   position: relative;
      //   width: 13px;
      //   &:hover {
      //     background-color: @color1;
      //   }
      //   &:before {
      //     content: '';
      //     left: 50%;
      //     position: absolute;
      //     top: 50%;
      //     transform: translateY(-50%) translateX(-50%);
      //   }
      // }
    }
  }
  .input-wrap.active {
    border-color: @accent;
  }
}
.list-ul {
  max-height: 300px;
  overflow-y: auto;
  li {
    display: flex;
    align-items: center;
    color: @ink;
    cursor: pointer;
    font-size: 15px;
    overflow: hidden;
    padding: 7px 10px;
    border-radius: @radius-sm;
    text-overflow: ellipsis;
    white-space: nowrap;
    &:hover {
      background-color: @surface-2;
    }
  }
  li.active {
    color: @accent;
    background-color: @accent-soft;
  }
  .preview {
    height: 1.6em;
  }
}

// Wide enough for the font category tabs to sit on one line.
.tabs-wrap {
  width: 300px;

  :deep(.el-tabs__header) {
    margin-bottom: 6px;
  }
  :deep(.el-tabs__item) {
    font-size: @text-sm;
    padding: 0 10px;
    height: 34px;
    color: @ink-3;
    &.is-active {
      color: @accent;
    }
  }
  :deep(.el-tabs__nav-wrap::after) {
    height: 1px;
    background-color: @line;
  }
}
</style>
