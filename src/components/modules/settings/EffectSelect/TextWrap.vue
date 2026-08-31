<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-09 14:00:23
 * @Description: Text effects选择框组件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-03-11 01:43:21
-->
<template>
  <!--
    Text effects is one section of the settings panel, not a card sitting on
    top of it: the same left edge, the same uppercase heading and the same
    label-above-control rhythm as Size and position or Letter spacing. The old
    el-card wrapper put a bordered box inside a bordered panel, and the effect
    layers put a third box inside that.
  -->
  <div class="effects">
    <div class="effects__head">
      <span class="effects__title">Text effects</span>
      <div class="effects__head-right">
        <div
          class="effect-preview"
          :style="{
            position: 'relative',
            width: '22px',
            fontSize: '22px',
            color: data.color,
            fontWeight: data.fontWeight,
            fontStyle: data.fontStyle,
            textDecoration: data.textDecoration,
            opacity: data.opacity,
            backgroundColor: data.backgroundColor,
          }"
        >
          <div
            v-for="(ef, efi) in modelValue"
            :key="efi + 'effect'"
            :style="{
              color: ef.filling && ef.filling.enable && ef.filling.type === 0 ? ef.filling.color : 'transparent',
              WebkitTextStroke: ef.stroke && ef.stroke.enable ? `${ef.stroke.width / coefficient}px ${ef.stroke.color}` : '',
              textShadow: ef.shadow && ef.shadow.enable ? `${ef.shadow.offsetX / coefficient}px ${ef.shadow.offsetY / coefficient}px ${ef.shadow.blur / coefficient}px ${ef.shadow.color}` : undefined,
              backgroundImage: ef.filling && ef.filling.enable ? (ef.filling.type === 0 ? undefined : getGradientOrImg(ef)) : undefined,
              WebkitBackgroundClip: ef.filling && ef.filling.enable ? (ef.filling.type === 0 ? undefined : 'text') : undefined,
            }"
            class="demo"
          >
            A
          </div>
          A
        </div>
        <el-popover :visible="state.visiable" placement="left" :width="220" trigger="click">
          <div class="select__box">
            <div class="select__box__select-item" @click="selectEffect()">None</div>
            <div v-for="(l, li) in state.list" :key="'list' + li" class="select__box__select-item" @click="selectEffect(l.id)">
              <img :src="l.cover" />
            </div>
          </div>
          <template #reference>
            <el-button class="effects__choose" link @click="openSet">{{ state.visiable ? 'Cancel' : 'Choose' }}</el-button>
          </template>
        </el-popover>
      </div>
    </div>

    <!-- filling 描边 stroke 阴影 shadow -->
    <number-slider v-show="state.layers && state.layers.length > 0" v-model="state.strength" class="effects__intensity" label="Intensity" :minValue="0" :maxValue="100" />

    <el-collapse-item class="advanced">
      <template #title>Advanced</template>
      <div class="advanced__actions">
        <el-button class="advanced__action" size="small" type="primary" link @click="addLayer"> + Add effect </el-button>
        <el-button v-show="state.layers && state.layers.length > 0" class="advanced__action" size="small" type="primary" link @click="state.unfold = !state.unfold">
          {{ state.unfold ? 'Collapse all' : 'Expand all' }}
        </el-button>
      </div>
      <draggable v-model="state.layers" handle=".sd-yidong" item-key="uuid" v-bind="dragOptions" class="layers">
        <template #item="{ element, index }">
          <div class="layer">
            <div class="layer__title">
              <i class="icon sd-yidong" />
              <span class="layer__name">Effect {{ index + 1 }}</span>
              <i class="icon sd-delete" @click="removeLayer(index)" />
            </div>
            <div v-show="state.unfold" class="layer__body">
              <div v-if="element.filling && [0, 2, '0', '2'].includes(element.filling.type)" class="feature" :class="{ 'feature--off': !element.filling.enable }">
                <div class="feature__row">
                  <el-checkbox v-model="element.filling.enable" label="Fill" class="feature__toggle" />
                  <color-select v-model="element.filling.color" width="32px" :modes="['Solid', 'Gradient']" label="" class="feature__swatch" @change="colorChange($event, element.filling)" />
                </div>
              </div>
              <div v-if="element.stroke" class="feature" :class="{ 'feature--off': !element.stroke.enable }">
                <div class="feature__row">
                  <el-checkbox v-model="element.stroke.enable" label="Outline" class="feature__toggle" />
                  <color-select v-model="element.stroke.color" width="32px" label="" class="feature__swatch" @finish="(value) => finish('color', value)" />
                </div>
                <div class="feature__fields">
                  <label class="field">
                    <span class="field__label">Width</span>
                    <numberInput v-model="element.stroke.width" class="field__input" :minValue="0" type="simple" />
                  </label>
                </div>
              </div>
              <div v-if="element.offset" class="feature" :class="{ 'feature--off': !element.offset.enable }">
                <div class="feature__row">
                  <el-checkbox v-model="element.offset.enable" label="Offset" class="feature__toggle" />
                </div>
                <div class="feature__fields">
                  <label class="field">
                    <span class="field__label">X</span>
                    <numberInput v-model="element.offset.x" class="field__input" type="simple" />
                  </label>
                  <label class="field">
                    <span class="field__label">Y</span>
                    <numberInput v-model="element.offset.y" class="field__input" type="simple" />
                  </label>
                </div>
              </div>
              <div v-if="element.shadow" class="feature" :class="{ 'feature--off': !element.shadow.enable }">
                <div class="feature__row">
                  <el-checkbox v-model="element.shadow.enable" label="Shadow" class="feature__toggle" />
                  <color-select v-model="element.shadow.color" width="32px" label="" class="feature__swatch" @finish="(value) => finish('color', value)" />
                </div>
                <div class="feature__fields">
                  <label class="field field--full">
                    <span class="field__label">Blur</span>
                    <numberInput v-model="element.shadow.blur" class="field__input" :minValue="0" type="simple" />
                  </label>
                  <label class="field">
                    <span class="field__label">X</span>
                    <numberInput v-model="element.shadow.offsetX" class="field__input" type="simple" />
                  </label>
                  <label class="field">
                    <span class="field__label">Y</span>
                    <numberInput v-model="element.shadow.offsetY" class="field__input" type="simple" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </el-collapse-item>
  </div>
</template>

<script lang="ts" setup>
import { 
  reactive, watch, onMounted, nextTick, computed
} from 'vue'
import colorSelect from '../colorSelect.vue'
import { ElCheckbox } from 'element-plus'
import numberInput from '../numberInput.vue'
import numberSlider from '../numberSlider.vue'
import draggable from 'vuedraggable'
import api from '@/api'
import getGradientOrImg from '../../widgets/wText/getGradientOrImg'
import { TGetCompListResult } from '@/api/home'

let froze_font_effect_list: TGetCompListResult[] = []

type TProps = {
  modelValue?: Record<string, any>
  degree?: string | number
  data: Record<string, any>
}

type TEmits = {
  (event: 'update:modelValue', data: Record<string, any>[]): void
}

type TState = {
  strength: number
  visiable: boolean
  list: TGetCompListResult[]
  layers: Record<string, any>[]
  draging: boolean
  unfold: boolean
}

const props = withDefaults(defineProps<TProps>(), {
  modelValue: () => ({}),
  data: () => ({})
})

const emit = defineEmits<TEmits>()

const state = reactive<TState>({
  strength: 50, // Intensity
  visiable: false, // Layer picker popover
  list: [],
  layers: [],
  draging: false,
  unfold: true,
})

const dragOptions = {
  animation: 300,
  ghostClass: 'ghost',
  chosenClass: 'choose',
}
const coefficient = computed(() => Math.round(160 / 27))
let rawData: Record<string, any>[] = [] // Initial values, used when changing intensity

onMounted(async () => {
  await nextTick()
  // console.log(props.data)
  if (!props.data.textEffects) {
    return
  }
  const clone = JSON.parse(JSON.stringify(props.data.textEffects)) || []
  state.layers = clone
    .map((x: any) => {
      x.uuid = String(Math.random())
      return x
    })
    .reverse()
  rawData = JSON.parse(JSON.stringify(state.layers))
})

// numberSlider only writes the value, so the rescale hangs off the value
// instead of a slider event.
watch(
  () => state.strength,
  () => strengthChange(state.strength),
)

watch(
  () => state.layers,
  (v) => {
    const newEffect = v.map((x) => {
      delete x.uuid
      return x
    })
    emit('update:modelValue', newEffect.reverse())
  },
  { deep: true },
)

// 选中加载特效预设
const selectEffect = async (id?: number) => {
  state.visiable = false
  if (id) {
    const { data } = await api.home.getTempDetail({ id, type: 1 })
    state.layers = JSON.parse(data)
      .textEffects.map((x: Record<string, any>) => {
        x.uuid = String(Math.random())
        return x
      })
      .reverse()
  } else state.layers = []
}

// 删除效果层
const removeLayer = (i: number) => {
  state.layers.splice(i, 1)
  rawData = JSON.parse(JSON.stringify(state.layers))
}

// 添加效果层
const addLayer = () => {
  const filling = { enable: false, type: 0, color: '#000000ff' }
  const stroke = { enable: false, width: 0, color: '#000000ff', type: 'outer' }
  const offset = { enable: false, x: 0, y: 0 }
  const shadow = { enable: false, color: '#000000ff', offsetX: 0, offsetY: 0, blur: 0, opacity: 0 }
  state.layers.unshift({ filling, stroke, shadow, offset, uuid: String(Math.random()) })
  rawData = JSON.parse(JSON.stringify(state.layers))
}

const finish = (type?: string, value?: string) => {}

const colorChange = (e: Record<string, any>, item: Record<string, any>) => {
  const modeStr: Record<string, number> = {
    Gradient: 2,
    Solid: 0,
  }
  item.gradient = {
    angle: e.angle,
    stops: e.stops,
  }
  setTimeout(() => {
    item.type = modeStr[e.mode] || 0
  }, 100)
}

    // const onMove = ({ relatedContext, draggedContext }: any) => {
    //   const relatedElement = relatedContext.element
    //   const draggedElement = draggedContext.element
    //   return (!relatedElement || relatedElement.parent == -1) && draggedElement.parent == -1
    // }
    const onDone = () => {
      state.draging = false
    }

    const strengthChange = (x: any) => {
      const effectScale = 1 + (x - 50) / 50
      state.layers.forEach((item: any, index) => {
        if (item.stroke) {
          item.stroke.width = rawData[index].stroke.width * effectScale
        }
        if (item.shadow) {
          item.shadow.blur = rawData[index].shadow.blur * effectScale
        }
      })
    }

// 打开特效字体集
const openSet = async () => {
  state.visiable = !state.visiable
  if (froze_font_effect_list.length <= 0) {
    const { list } = await api.home.getCompList({
      cate: 12,
      type: 1,
      pageSize: 30,
    })
    state.list = list
    froze_font_effect_list = list
  } else state.list = froze_font_effect_list
}

defineExpose({
  selectEffect,
  finish,
  coefficient,
  removeLayer,
  addLayer,
  dragOptions,
  onDone,
  strengthChange,
  openSet,
  colorChange,
  getGradientOrImg,
})
</script>

<style lang="less" scoped>
// The panel is narrow and every control here is small, so the only thing
// holding it together is rhythm: one left edge for everything, a feature's
// toggle and colour on one line, its numbers on an indented line below, and
// plain space — not borders — separating the parts.
:deep(.el-collapse-item__header),
:deep(.el-collapse-item__wrap),
:deep(.el-collapse-item__content) {
  border-bottom: none;
  // Element Plus fills collapse headers and content with its own surface
  // colour, which in the dark theme paints a lighter slab across the section.
  background: transparent;
}
// "Advanced" sits inside the Text effects section, so it reads as a sub
// disclosure rather than competing with the section heading above it.
:deep(.el-collapse-item__header) {
  height: 36px;
  line-height: 36px;
  font-size: @text-base;
  font-weight: 500;
  letter-spacing: normal;
  text-transform: none;
  color: @ink-2;
}
:deep(.el-checkbox) {
  height: auto;
}
:deep(.el-checkbox__label) {
  font-size: @text-base;
  color: @ink-2;
  padding-left: 10px;
}
:deep(.el-checkbox__input.is-checked + .el-checkbox__label) {
  color: @ink;
}

.effects {
  width: 100%;
  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    min-height: 28px;
  }
  &__title {
    .section-label();
  }
  &__head-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  &__choose {
    font-size: @text-base;
    height: auto;
    padding: 0;
    color: @ink-2;
    &:hover {
      color: @accent;
    }
  }
  &__intensity {
    margin-top: 10px;
  }
}

// The sample glyph is drawn in the text's own colour — usually black, because
// that is what it will be on the page. Sitting it on paper rather than on the
// panel is what keeps it visible in a dark theme, and is the more honest
// preview either way. An explicit background on the widget still wins, since
// Vue writes that inline.
.effect-preview {
  background: #ffffff;
  border-radius: 4px;
  box-shadow: 0 0 0 1px @line;
  line-height: 22px;
  text-align: center;
  flex: none;
}

.advanced {
  &__actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }
  &__action {
    font-size: @text-sm;
    height: auto;
    padding: 4px 0;
  }
}

.layers {
  display: flex;
  flex-direction: column;
}

// Layers are separated by a hairline and by space, not by a box each — a
// bordered card per effect inside an already bordered panel is what made this
// read as heavy.
.layer {
  padding: 12px 0 4px;
  & + & {
    border-top: 1px solid @line-soft;
  }
  &__title {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 22px;
  }
  &__name {
    flex: 1;
    font-size: @text-sm;
    font-weight: 600;
    color: @ink-2;
  }
  &__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
    margin-top: 12px;
  }
  .icon {
    font-size: 14px;
    color: @ink-3;
    cursor: pointer;
  }
  .sd-yidong {
    cursor: grab !important;
  }
  .icon:hover {
    color: @ink;
  }
}

.feature {
  display: flex;
  flex-direction: column;
  gap: 8px;
  &__row {
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 28px;
  }
  &__toggle {
    flex: 1;
    min-width: 0;
  }
  &__swatch {
    flex: none;
  }
  // An unticked effect still shows its values, just quietly — the row stays
  // readable and clickable, it simply stops competing for attention.
  &--off &__fields,
  &--off &__swatch {
    opacity: 0.55;
  }
  &__fields {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-left: 26px;
  }
}

.field {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  &__label {
    flex: none;
    font-size: @text-xs;
    color: @ink-3;
  }
  // Three fields on one line squeezes the boxes down to a couple of digits, so
  // a wider label like "Blur" takes a line of its own and the pair below keeps
  // the same half-and-half rhythm as Offset.
  &--full {
    flex: 1 1 100%;
  }
  &__input {
    flex: 1;
    min-width: 0;
  }
}

:deep(.small-input) {
  height: 28px;
  text-align: center;
  color: @ink;
  background: transparent;
  box-shadow: 0 0 0 1px @line inset;
  border-radius: @radius-sm;
  &:focus {
    box-shadow: 0 0 0 1px @accent inset;
  }
}

.select__box {
  display: flex;
  flex-wrap: wrap;
  &__select-item {
    cursor: pointer;
    position: relative;
    height: 40px;
    width: 33%;
    align-items: center;
    justify-content: center;
    display: flex;
  }
  &__select-item:hover {
    background: @surface-2;
  }
}

.demo {
  font-size: 22px;
  color: @accent-on;
  outline: none;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

// dragable
.choose {
  border: 1px dashed @accent-border !important;
}

.flip-list-move {
  transition: transform 0.5s;
}

.no-move {
  transition: transform 0s;
}
.disable {
  opacity: 0.3;
}
.ghost {
  opacity: 0.3;
  background: @main-color;
}
</style>
