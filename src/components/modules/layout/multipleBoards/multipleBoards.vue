<!--
  The page strip along the bottom.

  Collapsed it is a pill showing which page you are on; expanded it is a row of
  thumbnails you can drag into a different order. Everything that changes the
  pages themselves is a store action — this file decides how they look and what
  the menu says, not what "duplicate a page" means.

  Reordering is by drag, and also by Move left / Move right in each page's menu.
  Drag is nobody's only way to reorder a deck: it is unusable from a keyboard,
  awkward on a trackpad, and impossible when the strip has scrolled.
-->
<template>
  <div :style="{ position, bottom: -1 * st + 'px', left: sl + 'px' }" :class="['artboards', isFold ? 'fold' : 'unfold']">
    <div ref="listRef" class="wrap">
      <div v-if="isFold" v-show="dLayouts.length > 0" class="btn" :title="foldLabel" @click="isFold = !isFold"><span class="btn__label">{{ foldLabel }}</span> <i class="icon sd-zhankai" /></div>
      <div class="list" v-else>
        <span @click="isFold = !isFold" class="icon-btn"><i class="icon sd-zhankai" /></span>

        <draggable :list="dLayouts" :item-key="pageKey" class="pages" ghost-class="is-dragging" :animation="150" @end="onReordered">
          <template #item="{ element: l, index: li }">
            <div :class="['page', index == li ? 'is-current' : '']" @click="widgetStore.showPage(li)">
              <div :style="{ width: getPW(l.global) + 'px' }" :class="['item-box', index == li ? 'item-select' : 'item-default']">
                <div
                  class="mini-poster"
                  :style="{
                    transform: getTransform(l.global),
                    width: l.global.width + 'px',
                    height: l.global.height + 'px',
                    backgroundColor: l.global.backgroundGradient ? undefined : l.global.backgroundColor,
                    backgroundImage: l.global.backgroundImage ? `url(${l.global?.backgroundImage})` : l.global.backgroundGradient || undefined,
                    backgroundSize: l.global.backgroundTransform?.x ? 'auto' : 'cover',
                    backgroundPositionX: (l.global.backgroundTransform?.x || 0) + 'px',
                    backgroundPositionY: (l.global.backgroundTransform?.y || 0) + 'px',
                  }"
                >
                  <component :is="layer.type + '-static'" v-for="layer in getlayers(l.layers)" :key="layer.uuid" :params="layer" :parent="l.global">
                    <template v-if="layer.isContainer">
                      <component :is="widget.type + '-static'" v-for="widget in getChilds(l.layers, layer.uuid)" :key="widget.uuid" :params="widget" :parent="layer" />
                    </template>
                  </component>
                </div>
                <div class="item-idx">{{ li + 1 }}</div>

                <el-dropdown trigger="click" placement="top-end" @command="(command: string) => runPageCommand(command, li)">
                  <i class="iconfont icon-more page-menu" title="Page options" @click.stop />
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="duplicate">Duplicate</el-dropdown-item>
                      <el-dropdown-item command="rename">Rename…</el-dropdown-item>
                      <el-dropdown-item command="left" divided :disabled="li === 0">Move left</el-dropdown-item>
                      <el-dropdown-item command="right" :disabled="li === dLayouts.length - 1">Move right</el-dropdown-item>
                      <el-dropdown-item command="delete" divided>{{ dLayouts.length === 1 ? 'Empty this page' : 'Delete' }}</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
              <span class="page__name" :title="pageLabel(l, li)">{{ pageLabel(l, li) }}</span>
            </div>
          </template>
        </draggable>

        <el-tooltip :show-after="400" :hide-after="0" effect="dark" :content="atLimit ? `A design can have ${MAX_PAGES} pages` : 'Add a page'" placement="top">
          <div :class="['item-add', { 'is-disabled': atLimit }]" @click="addPage"><i class="iconfont icon-add" /></div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, Ref, onMounted, nextTick, watch, computed } from 'vue'
import draggable from 'vuedraggable'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useWidgetStore, useForceStore } from '@/store'
import { ElDropdown, ElDropdownItem, ElDropdownMenu, ElMessage, ElMessageBox } from 'element-plus'
import { MAX_PAGES } from '@/store/design/widget/actions/pages'
import type { TdLayout } from '@/store/design/widget'

const forceStore = useForceStore()
const canvasStore = useCanvasStore()
const widgetStore = useWidgetStore()
const position: Ref = ref('absolute') // sticky
const isFold = ref(true)
const st = ref(0)
const sl = ref(0)
const listRef: Ref<HTMLElement | null> = ref(null)
const index = computed(() => canvasStore.dCurrentPage)
const { dZoom, dPage } = storeToRefs(canvasStore)
const { dLayouts } = storeToRefs(widgetStore)

const atLimit = computed(() => dLayouts.value.length >= MAX_PAGES)
/**
 * The collapsed pill. "Page 2/5" while pages are unnamed, and the name plus its
 * position once one has been given — "Welcome · 2/5" — because a bare
 * "Welcome/5" reads like a fraction.
 */
const foldLabel = computed(() => {
  const total = dLayouts.value.length
  const position = index.value
  const label = pageLabel(dLayouts.value[position], position)
  return label.startsWith('Page ') ? `${label}/${total}` : `${label} · ${position + 1}/${total}`
})

/**
 * A stable key per page, for the drag list.
 *
 * Pages have no id of their own — `global.uuid` is '-1' on every one of them,
 * because that is how the rest of the editor spells "the page itself" — and
 * keying by array index makes the list re-render mid-drag. Keys are held
 * against the page object instead, in a WeakMap, so a page keeps its key while
 * it moves and a deleted one takes its key with it.
 */
const keys = new WeakMap<object, string>()
let nextKey = 0
function pageKey(page: TdLayout) {
  if (!keys.has(page)) keys.set(page, `page-${++nextKey}`)
  return keys.get(page) as string
}

/** A page's own name if it has one, otherwise its position. */
function pageLabel(page: TdLayout | undefined, position: number) {
  const name = page?.global?.name
  return name && name !== 'New page' ? name : `Page ${position + 1}`
}

watch(
  () => dZoom.value,
  () => {
    // 在画布缩放时bottom复位
    mainEl.scrollTop = 0
  },
)

watch(
  () => isFold.value,
  (folded) => {
    canvasStore.setBottomHeight(folded ? 0 : 112)
    setTimeout(() => {
      forceStore.setZoomScreenChange()
    }, 300)
  },
)

let mainEl: any = null

onMounted(async () => {
  await nextTick()
  mainEl = document.getElementById('main')
  mainEl.addEventListener('scroll', function (e: any) {
    st.value = mainEl.scrollTop
    sl.value = mainEl.scrollLeft
  })

  const list = listRef.value
  list?.addEventListener('wheel', (event) => {
    event.preventDefault()
    // 使用滚轮横向滚动
    list.scrollLeft += event.deltaY
  })
})

/** 计算变换量 */
function getTransform(global: any) {
  const { width, height } = global
  const isVertical = height > width
  const edge = isVertical ? Math.max(width, height) : Math.min(width, height)
  const s = 72 / edge
  const left = isVertical ? ((72 - width * s) / 2 - 1) / s : 0
  return `scale(${s}) translateX(${left}px)`
}
/** 计算实际宽度 */
function getPW(global: any) {
  const { width, height } = global
  const isVertical = height > width
  const s = 72 / Math.min(width, height)
  return isVertical ? 72 : width * s
}

function getlayers(widgets: any) {
  return widgets.filter((item: any) => item.parent === dPage.value.uuid)
}

function getChilds(widgets: any, uuid: string) {
  return widgets.filter((item: any) => item.parent === uuid)
}

function addPage() {
  if (atLimit.value) {
    ElMessage.warning(`A design can have up to ${MAX_PAGES} pages.`)
    return
  }
  widgetStore.addPage()
}

/**
 * Keeps you looking at the page you were looking at after a drag.
 *
 * vuedraggable has already moved the array by the time this runs, so this is
 * only the bookkeeping: where did the page on screen end up?
 */
function onReordered({ oldIndex, newIndex }: { oldIndex?: number; newIndex?: number }) {
  if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
  const current = index.value
  let next = current
  if (current === oldIndex) next = newIndex
  else if (oldIndex < current && newIndex >= current) next = current - 1
  else if (oldIndex > current && newIndex <= current) next = current + 1
  widgetStore.showPage(next)
}

async function runPageCommand(command: string, position: number) {
  switch (command) {
    case 'duplicate':
      if (atLimit.value) {
        ElMessage.warning(`A design can have up to ${MAX_PAGES} pages.`)
        return
      }
      widgetStore.duplicatePage(position)
      return
    case 'rename':
      return renamePage(position)
    case 'left':
      return widgetStore.movePage(position, position - 1)
    case 'right':
      return widgetStore.movePage(position, position + 1)
    case 'delete':
      return deletePage(position)
  }
}

async function renamePage(position: number) {
  const page = dLayouts.value[position]
  try {
    const { value } = await ElMessageBox.prompt('What should this page be called?', 'Rename page', {
      confirmButtonText: 'Rename',
      cancelButtonText: 'Cancel',
      inputValue: page?.global?.name === 'New page' ? '' : page?.global?.name || '',
      inputPlaceholder: `Page ${position + 1}`,
    })
    widgetStore.renamePage(position, value || '')
  } catch {
    // Dismissed. A name is not worth an error message.
  }
}

async function deletePage(position: number) {
  const onlyPage = dLayouts.value.length === 1
  // Deleting is the one page action that cannot be undone by doing it again, so
  // it is the one that asks — but only when there is artwork to lose.
  if (dLayouts.value[position]?.layers.length) {
    try {
      await ElMessageBox.confirm(
        onlyPage ? 'Everything on this page will be removed.' : `“${pageLabel(dLayouts.value[position], position)}” and everything on it will be removed.`,
        onlyPage ? 'Empty this page?' : 'Delete this page?',
        { confirmButtonText: onlyPage ? 'Empty it' : 'Delete', cancelButtonText: 'Keep it', type: 'warning' },
      )
    } catch {
      return
    }
  }
  widgetStore.removePage(position)
  onlyPage && ElMessage('The page is now empty')
}
</script>

<style lang="less" scoped>
// The page strip along the bottom. Collapsed it is a small pill showing which
// page you are on; expanded it is a row of thumbnails.
.artboards {
  left: 0;
  z-index: 99;
  padding: 0 12px;
  font-size: @text-base;
  color: @ink-2;
  font-weight: 500;
  transition: all 0.3s;

  .icon {
    transition: transform 0.2s ease;
    color: @ink-4;
  }
  .list {
    display: flex;
    align-items: center;
  }
  .pages {
    display: flex;
    align-items: flex-start;
  }

  // A page is its thumbnail plus its name, so the two move together on a drag.
  .page {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    cursor: pointer;

    &__name {
      max-width: 72px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: @text-xs;
      font-weight: 400;
      color: @ink-4;
    }
    &.is-current &__name {
      color: @ink-2;
    }
  }
  .is-dragging {
    opacity: 0.4;
  }

  .item-box,
  .item-add {
    position: relative;
    width: 72px;
    height: 72px;
    border-radius: @radius;
    margin: 5px 0 0 10px;
    background: @surface;
    overflow: hidden;
    border: 1px solid @line;
    transition: border-color 0.12s ease, box-shadow 0.12s ease;
  }
  .item-box:hover .page-menu {
    opacity: 1;
  }

  .page-menu,
  .item-idx {
    position: absolute;
    z-index: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
  }
  .item-idx {
    font-size: @text-xs;
    bottom: 3px;
    left: 3px;
    width: 16px;
    height: 16px;
    color: @ink-3;
    background: @surface;
    box-shadow: 0 0 0 1px @line;
  }
  .page-menu {
    opacity: 0;
    font-size: 10px;
    width: 16px;
    height: 16px;
    border: 1px solid @line;
    cursor: pointer;
    background-color: @surface;
    color: @ink-3;
    right: 3px;
    top: 3px;
    transition: color 0.12s ease, border-color 0.12s ease, opacity 0.12s ease;
    &:hover {
      color: @accent;
      border-color: @accent;
    }
  }

  .item-add {
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: @ink-4;
    background: @surface-2;
    flex-shrink: 0;
    .icon-add {
      font-size: 18px;
    }
    &:hover {
      color: @accent;
      border-color: @accent-border;
      background: @accent-soft;
    }
    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;
      &:hover {
        color: @ink-4;
        border-color: @line;
        background: @surface-2;
      }
    }
  }

  .item-default:hover {
    border-color: @line-strong;
  }
  // Selected page: a ring in the accent colour, not a heavy glow.
  .item-select {
    border-color: @accent;
    box-shadow: 0 0 0 2px @accent-a25;
  }
  .page:first-child .item-box {
    margin-left: 0;
  }
}

.unfold {
  width: calc(100% - 155px);
  height: 112px;
  .wrap {
    padding: 8px 10px;
    height: 100%;
    background-color: @surface;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    overflow-x: auto;
    overflow-y: hidden;
    border: 1px solid @line;
    border-radius: @radius-lg;

    .icon-btn {
      cursor: pointer;
      width: 34px;
      height: 70px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      color: @ink-4;
      &:hover {
        color: @ink;
      }
    }
    .sd-zhankai {
      font-size: 14px;
    }
  }
}

// The pill grows with the page name rather than spilling out of its own border,
// and a name long enough to crowd the canvas is cut with an ellipsis.
.fold {
  cursor: pointer;
  width: max-content;
  min-width: 130px;
  max-width: min(320px, 100%);
  text-align: center;
  height: 34px;
  margin-bottom: 12px;

  .wrap {
    display: flex;
    align-items: center;
    height: 100%;
    background-color: @surface;
    border: 1px solid @line;
    border-radius: @radius;
  }
  .icon {
    margin-left: 6px;
    font-size: 11px;
    flex-shrink: 0;
  }
  .btn {
    padding: 0 14px;
    display: flex;
    width: 100%;
    align-items: center;
    justify-content: center;
    height: 100%;
    white-space: nowrap;
    border-radius: @radius;
    overflow: hidden;
    &__label {
      overflow: hidden;
      text-overflow: ellipsis;
    }
    &:hover {
      background: @surface-2;
    }
  }
  .btn:hover > .sd-zhankai {
    transform: rotate(180deg);
  }
}

.mini-poster {
  overflow: hidden;
  position: absolute;
  transform-origin: 0 0;
}
</style>
