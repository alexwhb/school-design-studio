<!--
 * @Author: ShawnPhang
 * @Date: 2024-04-03 19:15:21
 * @Description: 文件 
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-05 04:46:03
-->
<template>
  <el-dropdown ref="dropdownRef" max-height="70vh" :hide-on-click="false" trigger="click" size="large" placement="bottom-start">
    <span class="el-dropdown-link">
      <slot />
    </span>
    <template #dropdown>
      <div v-show="type === 'shortkey'" class="help-list">
        <div @click="type = 'menu'" class="back">
          <span class="icon-box"><i class="iconfont icon-right"></i></span> <b>Keyboard shortcuts</b>
        </div>
        <el-divider />
        <div v-for="(sc, si) in scKeyCodes" :key="'sc' + si" class="item">
          <span class="title">{{ sc.feat }}</span
          ><span class="instruct">{{ sc.info }}</span>
        </div>
      </div>
      <el-dropdown-menu v-show="type === 'menu'">
        <el-dropdown-item @click="type = 'shortkey'">Keyboard shortcuts</el-dropdown-item>
        <el-dropdown-item @click="openTour">Take the tour</el-dropdown-item>
        <el-dropdown-item @click="openIssues"><div class="menu-item">Send feedback</div></el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'
import scKeyCodes from '@/mixins/scKeyCodes'
const emit = defineEmits()

const type = ref('menu')
const dropdownRef = ref()

const openTour = () => {
  emit('select', 'openTour')
  dropdownRef.value?.handleClose()
}

const openIssues = () => {
  window.open('https://github.com/palxiao/poster-design/issues', '_blank')
}
</script>

<style lang="less" scoped>
:deep(.el-divider--horizontal) {
  margin: 12px 0;
}
.menu-item {
  width: 170px;
}
.help-list {
  user-select: none;
  .back {
    margin-top: 4px;
    cursor: pointer;
    display: flex;
    padding: 8px 16px 0 6px;
    .icon-box {
      display: inline-block;
      transform: rotate(180deg);
    }
  }
  .item {
    width: 240px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 16px;
    margin-bottom: 0;
    color: @ink-2;
    white-space: nowrap;
    .title {
      color: @ink;
      font-size: 14px;
      font-weight: 400;
    }
    .instruct {
      padding: 7px 8px;
      margin-left: 14px;
      color: @ink;
      background: @surface-2;
      border-radius: 8px;
    }
  }
}
</style>
