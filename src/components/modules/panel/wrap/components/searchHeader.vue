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
          <el-dropdown-item
            v-for="type in state.materialCates" :key="type.id"
            @click="action('change', type, type.id)"
          >
            <span :class="['cate__text', { 'cate--select': + state.currentIndex === type.id }]">{{ type.name }}</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <span v-else style="width: 1rem"></span>

    <el-input v-model="state.searchValue" size="large" placeholder="Search" class="input-with-select">
      <template #append>
        <el-button><i class="iconfont icon-search"></i></el-button>
      </template>
    </el-input>
  </div>
</template>
<script lang="ts" setup>
import { reactive, toRefs, watch } from 'vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import { useRoute } from 'vue-router'
import api from '@/api'

type TProps = {
  type?: string
  modelValue?: string
}

type TEmits = {
  (event: 'update:modelValue', data: string): void
  (event: 'change', data: TMaterialCatesData): void
}

type TMaterialCatesData = {id: string | number, name: string}

type TState = {
  searchValue: string
  materialCates: TMaterialCatesData[]
  currentIndex: number | string
}

const props = defineProps<TProps>()

const emit = defineEmits<TEmits>()

const route = useRoute()
const state = reactive<TState>({
  searchValue: '',
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

watch(
  () => state.searchValue,
  () => {
    emit('update:modelValue', state.searchValue)
  },
)

function action(fn: 'change', type: TMaterialCatesData, currentIndex: number | string) {
  currentIndex && (state.currentIndex = currentIndex)
  emit(fn, type)
}

defineExpose({
  action
})

</script>

<style lang="less" scoped>
.search__wrap {
  padding: 14px 14px 6px;
  display: flex;
  gap: 8px;
  cursor: pointer;

  :deep(.el-input__wrapper) {
    box-shadow: 0 0 0 1px @line inset;
  }
  // The library's "append" slot draws its own bordered box; flatten it into
  // the field so the search bar reads as one control.
  :deep(.el-input-group__append) {
    background: transparent;
    box-shadow: none;
    border-left: 1px solid @line;
    padding: 0 10px;
    color: @ink-3;
    .el-button {
      border: none;
      background: transparent;
      padding: 0;
    }
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
    transition: background-color 0.12s ease, color 0.12s ease;
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
