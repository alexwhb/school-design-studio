<template>
  <div id="style-panel">
    <div class="style-tab">
      <span :class="['tab', { 'active-tab': activeTab === 0 }]" @click="activeTab = 0">Settings</span>
      <span :class="['tab', { 'active-tab': activeTab === 1 }]" @click="activeTab = 1">Layers</span>
    </div>
    <div v-show="activeTab === 0" class="style-wrap">
      <div v-show="showGroupCombined" style="padding: 2rem 0">
        <el-button plain type="primary" class="gounp__btn" @click="handleCombine">Group</el-button>
        <icon-item-select label="" :data="iconList" @finish="alignAction" />
      </div>
      <component :is="dActiveElement?.type + '-style'" v-show="!showGroupCombined" v-if="dActiveElement?.type" />
      <!--
        Animation sits here rather than inside each w*Style component so that
        every element type gets it from one place. The page itself is not an
        element and has nothing to animate, so it is excluded.
      -->
      <div v-if="animatable" v-show="!showGroupCombined" class="animate-slot">
        <animate-wrap :widget="dActiveElement as TdWidgetData" :key="dActiveElement?.uuid" />
      </div>
    </div>
    <div v-show="activeTab === 1" class="layer-wrap">
      <layer-list :data="dWidgets" @change="layerChange" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Style面板
// const NAME = 'style-panel'
import alignIconList, { AlignListData } from '@/assets/data/AlignListData'
import iconItemSelect, { TIconItemSelectData } from '../settings/iconItemSelect.vue'
import animateWrap from '../settings/AnimateSelect/AnimateWrap.vue'
import { computed, ref, watch } from 'vue';
// import { useSetupMapGetters } from '@/common/hooks/mapGetters';
import { useControlStore, useGroupStore, useHistoryStore, useWidgetStore } from '@/store';
import { storeToRefs } from 'pinia';
import { TdWidgetData } from '@/store/design/widget';
import type { TUpdateAlignData } from '@/store/design/widget/actions/align'

const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const groupStore = useGroupStore()
const historyStore = useHistoryStore()

const activeTab = ref(0)
const iconList = ref<AlignListData[]>(alignIconList)
const showGroupCombined = ref(false)

// const { dActiveElement, dWidgets, dSelectWidgets } = useSetupMapGetters(['dActiveElement', 'dWidgets', 'dSelectWidgets'])
const { dActiveElement, dWidgets, dSelectWidgets } = storeToRefs(widgetStore)

/** The page has no entrance of its own; everything drawn on it does. */
const animatable = computed(() => {
  const type = dActiveElement.value?.type
  return !!type && type !== 'page'
})

watch(
  dSelectWidgets,
  (items) => {
    setTimeout(() => {
      showGroupCombined.value = items.length > 1
    }, 100)
  },
  {
    deep: true
  }
)

function handleCombine() {
  groupStore.realCombined()
  // store.dispatch('realCombined')
}

// ...mapActions(['selectWidget', 'updateAlign', 'updateHoverUuid', 'getCombined', 'realCombined', 'ungroup', 'pushHistory']),
function alignAction(item: TIconItemSelectData) {
  const sWidgets: TdWidgetData[] = JSON.parse(JSON.stringify(dSelectWidgets.value))
  groupStore.getCombined().then(group => {
    sWidgets.forEach((element) => {
      widgetStore.updateAlign({
        align: (item.value as TUpdateAlignData['align']),
        uuid: element.uuid,
        group,
      })
    });
  })
}
function layerChange(newLayer: TdWidgetData[]) {
  widgetStore.setDWidgets(newLayer.toReversed())
  controlStore.setShowMoveable(false)
}

</script>

<style lang="less" scoped>
// The animation card is the one control that is not part of a widget's own
// style component, so it carries its own gutter.
.animate-slot {
  padding: 12px 10px 20px;
}

#style-panel {
  background-color: @surface;
  border-left: 1px solid @line;
  display: flex;
  flex-direction: column;
  height: 100%;
  position: relative;
  width: @style-panel-width;
  flex-shrink: 0;

  // A quiet two-up switch rather than a shadowed tab bar.
  .style-tab {
    display: flex;
    gap: 4px;
    padding: 10px 12px;
    border-bottom: 1px solid @line;
    width: 100%;
    z-index: 10;

    .tab {
      user-select: none;
      flex: 1;
      text-align: center;
      padding: 6px 10px;
      border-radius: @radius-sm;
      font-size: @text-base;
      font-weight: 500;
      color: @ink-3;
      cursor: pointer;
      transition: background-color 0.12s ease, color 0.12s ease;

      &:hover {
        background: @surface-2;
        color: @ink-2;
      }
    }

    .tab.active-tab {
      background: @accent-soft;
      color: @accent;
      font-weight: 600;
    }
  }

  .style-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
    padding: 4px 16px 24px;
  }

  .layer-wrap {
    flex: 1;
    overflow: auto;
    width: 100%;
  }
}

#style-panel ::-webkit-scrollbar {
  width: 6px;
}

.gounp {
  &__btn {
    width: 100%;
    margin-bottom: 1.5rem;
  }
}
</style>
