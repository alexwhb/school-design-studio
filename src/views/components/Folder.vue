<!--
 * @Author: ShawnPhang
 * @Date: 2024-04-03 19:15:21
 * @Description: 文件 
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-10 07:16:00
-->
<template>
  <el-dropdown trigger="click" size="large" placement="bottom-start">
    <span class="el-dropdown-link">
      <slot />
    </span>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item><div @click="$emit('select', 'newDesign')" class="item">New design</div></el-dropdown-item>
        <el-dropdown-item><div @click="$emit('select', 'resizeDesign')" class="item">Resize design…</div></el-dropdown-item>
        <el-dropdown-item @click="openPSD">Import file</el-dropdown-item>
        <el-dropdown-item @click="$emit('select', 'save')" divided>Save</el-dropdown-item>
        <el-dropdown-item @click="$emit('select', 'download')">Export file</el-dropdown-item>
        <el-dropdown-item disabled>Version history</el-dropdown-item>
        <el-dropdown-item disabled>Batch apply template</el-dropdown-item>
        <el-dropdown-item @click="$emit('select', 'changeLineGuides')" divided>Rulers and guides</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
// import { ref, Ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElDropdown, ElDropdownItem, ElDropdownMenu } from 'element-plus'

const router = useRouter()

const openPSD = () => {
  window.open(router.resolve('/psd').href, '_blank')
}
</script>

<style lang="less" scoped>
.item {
  width: 224px;
}
</style>
