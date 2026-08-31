<!--
  Light / dark appearance.

  A single button rather than a menu: one click flips it, and the icon shows
  what you would get, not what you have. Long-pressing or right-clicking is not
  discoverable, so "follow the system" is offered in the same tooltip via a
  second, quieter action only once the user has pinned a theme — until then the
  editor is already following the system and there is nothing to go back to.
-->
<template>
  <el-tooltip :show-after="400" :hide-after="0" effect="dark" :content="tip" placement="bottom">
    <div class="theme-toggle" role="button" tabindex="0" :aria-label="tip" @click="onClick" @keydown.enter.prevent="onClick" @keydown.space.prevent="onClick">
      <i class="iconfont" :class="resolved === 'dark' ? 'icon-sun' : 'icon-moon'" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="resolved === 'dark'">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
          </template>
          <template v-else>
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
          </template>
        </svg>
      </i>
    </div>
  </el-tooltip>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import useTheme from '@/common/hooks/useTheme'

const { preference, resolved, toggleTheme, setThemePreference } = useTheme()

const tip = computed(() => {
  const next = resolved.value === 'dark' ? 'light' : 'dark'
  return preference.value === 'system' ? `Switch to ${next} mode (following your system)` : `Switch to ${next} mode · shift-click to follow your system`
})

function onClick(e: MouseEvent | KeyboardEvent) {
  // Shift-click hands control back to the OS. Hidden, but the only way out
  // once you have pinned a theme, and the tooltip says so.
  if ((e as MouseEvent).shiftKey) setThemePreference('system')
  else toggleTheme()
}
</script>

<style lang="less" scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: @radius-sm;
  cursor: pointer;
  color: @ink-2;
  transition: background-color 0.12s ease, color 0.12s ease;

  svg {
    display: block;
  }
  &:hover {
    background: @surface-2;
    color: @ink;
  }
  &:focus-visible {
    outline: 2px solid @accent;
    outline-offset: -2px;
  }
}
</style>
