<!--
  Starting a new design.

  Only that. This dialog used to double as the page-size editor for an existing
  design, with a checkbox deciding whether the artwork moved with it — but that
  only ever resized the page you were looking at, which quietly left a
  multi-page design with pages of different sizes. Resizing something that
  already exists is its own question, and it is asked in resize-design/.
-->
<template>
  <div>
    <el-dialog v-model="dialogVisible" center destroy-on-close :align-center="false" title="New blank design" width="380" draggable>
      <sizeEditor :params="page" class="add-mode">
        <el-button @click="finish" plain size="large" type="primary">Create</el-button>
      </sizeEditor>
      <el-divider content-position="left">Common sizes</el-divider>
      <sizePresets :width="page.width" :height="page.height" @pick="applySize" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, Ref } from 'vue'
import { useRouter } from 'vue-router'
import sizeEditor from './sizeEditor.vue'
import sizePresets from './sizePresets.vue'
import { useControlStore } from '@/store'

const router = useRouter()
const controlStore = useControlStore()
const dialogVisible: Ref<boolean> = ref(false)
const page = ref({ width: 1275, height: 1650 })

const applySize = ({ width, height }: { width: number; height: number }) => {
  page.value.width = width
  page.value.height = height
}

const open = () => {
  controlStore.setShowMoveable(false) // Clear the previous selection box
  dialogVisible.value = true
}

function finish() {
  const { width, height } = page.value
  window.open(router.resolve(`/home?mode=create&w_h=${width}*${height}`).href, '_blank')
}

defineExpose({
  open,
})
</script>

<style lang="less" scoped>
:deep(.el-dialog__header) {
  padding-bottom: 7px !important;
}
.add-mode {
  padding: 1rem 0 0.5rem 0;
}
</style>
