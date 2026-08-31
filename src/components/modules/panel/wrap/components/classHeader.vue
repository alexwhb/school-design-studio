<!--
 * @Author: ShawnPhang
 * @Date: 2023-10-04 02:04:04
 * @Description: 列表分类头部
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-06 21:16:00
-->
<template>
  <div v-if="!isBack" class="content__wrap">
    <div v-for="(t, ti) in types" :key="ti + 't'">
      <div class="types__header" @click="select(t)">
        <span style="flex: 1">{{ t.name }}</span>
        <span class="types__header-more">All<i class="iconfont icon-right"></i></span>
      </div>
      <slot :index="ti" />
    </div>
  </div>
  <span v-else class="types__header-back" @click="back">
    <i class="iconfont icon-right"></i>
    <slot />
  </span>
</template>

<script lang="ts" setup>
export type TClassHeaderTypeData = {
  name: string
}

type TProps = {
  types?: TClassHeaderTypeData[]
  isBack?: boolean
}

type TEmits = {
  (event: 'select', data: string[]): void
  (event: 'back'): void
}

const { types, isBack } = defineProps<TProps>()
const emit = defineEmits<TEmits>()

const select = (item: any) => {
  emit('select', item)
}
const back = () => {
  emit('back')
}

defineExpose({ select, back })
</script>

<style lang="less" scoped>
.content {
  &__wrap {
    padding: 4px 14px 100px;
    height: 100%;
    overflow: auto;
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE 10+ */
  }
  &__wrap::-webkit-scrollbar {
    display: none;
  }
}

.types {
  display: flex;
  flex-wrap: wrap;
  padding: 10px 0 0 6px;

  &__item {
    position: relative;
    width: 64px;
    height: 64px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #fff;
    font-weight: 600;
    font-size: @text-base;
    border-radius: @radius;
    cursor: pointer;
    margin: 8px 4px 0 4px;
    background-size: cover;
    background-repeat: no-repeat;
    text-shadow: 0 1px 0 rgb(0 0 0 / 25%);
    opacity: 0.55;
    transition: opacity 0.12s ease;
    &:hover {
      opacity: 0.8;
    }
  }
  &--select {
    opacity: 1;
  }

  // Section heading inside a panel: quiet uppercase, with the "All" link
  // sitting on the same line.
  &__header {
    user-select: none;
    cursor: pointer;
    margin: 16px 0 10px;
    .section-label();
    display: flex;
    align-items: center;

    &-more {
      display: flex;
      align-items: center;
      gap: 2px;
      color: @ink-4;
      font-size: @text-xs;
      font-weight: 500;
      letter-spacing: 0;
      text-transform: none;
      .iconfont {
        font-size: 10px;
      }
      &:hover {
        color: @accent;
      }
    }

    &-back {
      cursor: pointer;
      padding: 0 0 0 14px;
      display: flex;
      align-items: center;
      gap: 6px;
      color: @ink;
      font-size: @text-md;
      font-weight: 500;
      height: 2.9rem;
      position: absolute;
      z-index: 2;
      background: @surface;
      width: @panel-width;
      .icon-right {
        transform: rotate(180deg);
        font-size: 12px;
        color: @ink-3;
      }
    }
  }
}
</style>
