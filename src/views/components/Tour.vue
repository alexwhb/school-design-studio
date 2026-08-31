<!--
 * @Author: ShawnPhang
 * @Date: 2024-04-04 03:05:45
 * @Description: 漫游导航
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-05 05:31:01
-->
<template>
  <el-tour v-model="isShow">
    <el-tour-step :target="steps[0]?.$el" title="File menu">
      <div>Use the File menu to start a new design, import or export files, and change page settings.</div>
    </el-tour-step>
    <el-tour-step placement="right" :target="steps[1]?.$el" title="Toolbar" description="Start from a template, or drag text, photos and shapes onto your page." />
    <el-tour-step placement="left" :target="steps[2]?.$el" title="Settings panel" description="Select anything on the page and its settings appear here. Switch to Layers to reorder items." />
    <el-tour-step :target="steps[3]?.$el" title="Download" description="Export your design as an image, PDF or PowerPoint file." />
  </el-tour>
</template>

<script setup lang="ts">
import { ElTour, ElTourStep } from 'element-plus'
import { ref } from 'vue'

type TProps = {
  steps: any,
}

const props = withDefaults(defineProps<TProps>(), {
  steps: [],
})

const isShow = ref(false)

const open = () => {
  isShow.value = true
}

defineExpose({
  open
})
</script>
