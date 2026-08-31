<!--
  The File menu.

  Three groups, divided: what to do with the whole design, what to do with the
  file, and what the editor itself shows you. The last group's items are
  settings rather than actions, so they carry a tick showing what they are
  currently set to — a menu item that silently toggles something is a menu item
  you have to press to find out.
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
        <el-dropdown-item divided @click="$emit('select', 'changeLineGuides')">
          <div class="item item--toggle">
            <span>Rulers and guides</span>
            <el-icon v-show="showGuides" class="tick"><Check /></el-icon>
          </div>
        </el-dropdown-item>
        <el-dropdown-item @click="toggleSpellcheck">
          <div class="item item--toggle">
            <span>Check spelling</span>
            <el-icon v-show="spellcheck" class="tick"><Check /></el-icon>
          </div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from 'element-plus'
import { Check } from '@element-plus/icons-vue'
import useSpellcheck from '@/common/hooks/useSpellcheck'

type TProps = {
  /** Ticked state for the rulers, which the editor owns. */
  showGuides?: boolean
}
defineProps<TProps>()

defineEmits<{
  (event: 'select', name: string): void
}>()

// Read straight from the module-level preference rather than passed down: every
// text widget already reads the same one, and threading it through the toolbar
// would only give it a second source of truth.
const { enabled: spellcheck, toggleSpellcheck } = useSpellcheck()

const router = useRouter()

const openPSD = () => {
  window.open(router.resolve('/psd').href, '_blank')
}
</script>

<style lang="less" scoped>
.item {
  width: 224px;
}
.item--toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  .tick {
    color: @accent;
    font-size: 14px;
  }
}
</style>
