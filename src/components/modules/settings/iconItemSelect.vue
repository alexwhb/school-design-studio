<!--
 * @Author: ShawnPhang
 * @Date: 2021-07-29 18:31:27
 * @Description: 
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-11-14 16:48:06
-->
<template>
  <div class="icon-item-select">
    <span v-if="label" class="label">{{ label }}</span>
    <ul v-if="data" class="list btn__bar flex">
      <el-tooltip v-for="(item, index) in data" :key="index" class="item" effect="dark" :content="item.tip" placement="top" :show-after="300" >
        <li :class="{ 'list-item': true, active: item.select }" @click="selectItem(item)">
          <i :class="`${item.extraIcon ? 'icon' : 'iconfont'} ${item.icon}`"></i>
        </li>
      </el-tooltip>
    </ul>
  </div>
</template>

<script lang="ts" setup>
// 图标按钮选择组件
// const NAME = 'icon-item-select'

export type TIconItemSelectData = {
  key?: string
  select?: boolean,
  extraIcon?: boolean,
  tip?: string
  icon?: string
  value?: string | number | number[] | string[]
}

type TProps = {
  label?: string
  data: TIconItemSelectData[]
}

type TEmits = {
  (event: 'finish', data: TIconItemSelectData): void
}

const props = withDefaults(defineProps<TProps>(), {
  label: ''
})

const emit = defineEmits<TEmits>()


function selectItem(item: TIconItemSelectData) {
  if (typeof item.select !== 'undefined') {
    item.select = !item.select
  }
  emit('finish', item)
  // text-align非独立选项，恢复选中状态
  item.key === 'textAlign' && (item.select = true)
}

</script>

<style lang="less" scoped>
.flex {
  display: flex;
  justify-content: space-between;
  flex-direction: row;
}

// A segmented group: one hairline around the set, the active item tinted.
.btn__bar {
  margin-bottom: 12px;
  padding: 3px;
  background: @surface;
  border: 1px solid @line;
  border-radius: @radius;
  height: 34px;
  gap: 2px;
}
</style>

<style lang="less" scoped>
.icon-item-select {
  width: 100%;
  .label {
    margin-right: 10px;
    color: @ink-2;
    font-size: @text-base;
  }
  .list {
    line-height: 1;
    display: flex;
    flex: 1;
    justify-content: space-between;

    .list-item {
      color: @ink-2;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      margin: 0;
      height: 26px;
      border-radius: @radius-sm;
      transition: background-color 0.12s ease, color 0.12s ease;

      i {
        font-size: 17px;
      }
      &:hover {
        background-color: @surface-2;
        color: @ink;
      }
    }

    .list-item.active {
      color: @accent;
      background-color: @accent-soft;
    }
  }
}
</style>
