<!--
 * @Author: ShawnPhang
 * @Date: 2022-01-27 11:05:48
 * @Description:  
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-06 21:16:00
-->
<template>
  <div class="search__wrap">
    <el-dropdown v-if="type !== 'none'" placement="bottom-start">
      <div class="search__type"><i class="iconfont icon-ego-caidan" /></div>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item v-for="type in state.materialCates" :key="type.id" @click="action('change', type, type.id)">
            <span :class="['cate__text', { 'cate--select': +state.currentIndex === type.id }]">{{ type.name }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>

    <el-input v-model="state.searchValue" size="large" :placeholder="placeholder || 'Search'" class="search__input" clearable @keyup.enter="submit" @clear="submit">
      <!-- Inside the field rather than in an "append" box: the magnifier is a
           label for what the field does, not a second control to press. -->
      <template #prefix>
        <i class="iconfont icon-search" />
      </template>
    </el-input>
  </div>
</template>
<script lang="ts" setup>
import { reactive, watch } from 'vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import api from '@/api'

type TProps = {
  type?: string
  modelValue?: string
  placeholder?: string
  /**
   * Search as you type. Only for panels backed by the local library — a live
   * search against a rate-limited third-party API spends the hourly quota a
   * keystroke at a time.
   */
  live?: boolean
}

type TEmits = {
  (event: 'update:modelValue', data: string): void
  (event: 'change', data: TMaterialCatesData): void
  /** The user asked for these results — Enter, typing, or clearing the box. */
  (event: 'search', data: string): void
}

type TMaterialCatesData = { id: string | number; name: string }

type TState = {
  searchValue: string
  materialCates: TMaterialCatesData[]
  currentIndex: number | string
}

const props = defineProps<TProps>()

const emit = defineEmits<TEmits>()

const state = reactive<TState>({
  searchValue: props.modelValue || '',
  materialCates: [],
  currentIndex: 1,
})

if (props.type != 'none') {
  state.materialCates = [{ id: 0, name: 'Sample templates' }]
  // api.home.getCategories({ type: 1 }).then((list: any) => {
  //   list.unshift({ id: 0, name: 'All' })
  //   state.materialCates = list
  //   const { cate } = route.query
  //   cate && (state.currentIndex = cate as string)
  //   cate && action('change', state.materialCates[Number(cate)], Number(cate))
  // })
}

/**
 * Long enough that a search fires once you have stopped typing rather than
 * mid-word, short enough that it still feels like the list is following you.
 */
const LIVE_DELAY = 200
let liveTimer: ReturnType<typeof setTimeout> | undefined

watch(
  () => state.searchValue,
  (value) => {
    emit('update:modelValue', value)
    if (!props.live) return
    clearTimeout(liveTimer)
    liveTimer = setTimeout(submit, LIVE_DELAY)
  },
)

// The owner clears the box by clearing what it bound with v-model — going
// "back" out of a set of results is one of the ways that happens.
watch(
  () => props.modelValue,
  (value) => {
    if (value !== undefined && value !== state.searchValue) {
      state.searchValue = value
    }
  },
)

function action(fn: 'change', type: TMaterialCatesData, currentIndex: number | string) {
  currentIndex && (state.currentIndex = currentIndex)
  emit(fn, type)
}

/**
 * Enter and the clear button always search immediately, even where typing
 * does not: waiting out the debounce after a deliberate press reads as a
 * dropped keystroke.
 */
function submit() {
  clearTimeout(liveTimer)
  emit('search', state.searchValue.trim())
}

defineExpose({
  action,
  submit,
})
</script>

<style lang="less" scoped>
.search__wrap {
  padding: 14px 14px 6px;
  display: flex;
  gap: 8px;
  cursor: pointer;
}

.search__input {
  // The field is the only thing in the row when there is no category menu, so
  // it takes the full width and the panel's padding is even on both sides.
  flex: 1;
  min-width: 0;

  :deep(.el-input__wrapper) {
    padding-left: 10px;
  }
  :deep(.el-input__prefix) {
    color: @ink-4;
    .iconfont {
      font-size: 15px;
    }
  }
  :deep(.el-input__inner) {
    font-size: @text-md;
  }
}

.search {
  &__type {
    border: 1px solid @line;
    color: @ink-2;
    width: 36px;
    flex-shrink: 0;
    border-radius: @radius;
    display: flex;
    align-items: center;
    justify-content: center;
    transition:
      background-color 0.12s ease,
      color 0.12s ease;
    .iconfont {
      font-size: 16px;
    }
    &:hover {
      background: @surface-2;
      color: @ink;
    }
  }
}

.cate {
  &__text {
    font-size: @text-base;
  }
  &--select {
    color: @accent;
    font-weight: 600;
  }
}
</style>
