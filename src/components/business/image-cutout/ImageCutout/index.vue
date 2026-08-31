<!--
  Remove background.

  Upstream shipped this as a demo: whichever file you picked was thrown away and
  a stock photo was loaded from an image host instead, then a second stock photo
  stood in for the result. The matting service behind it is not ours to call, so
  the work is done here instead, by the brush-based eraser in
  packages/image-extraction. Nothing leaves the browser, and the result lands in
  the Uploads panel like every other picture.
-->
<template>
  <el-dialog v-model="state.show" title="Remove background" align-center width="650" @close="handleClose">
    <uploader v-if="!state.rawImage" :hold="true" :drag="true" class="uploader" @load="handleUploaderLoad">
      <div class="uploader__box">
        <upload-filled style="width: 64px; height: 64px" />
        <div class="el-upload__text">Choose a picture, then brush away the parts you don't want.</div>
      </div>
      <div class="el-upload__tip el-upload__text"><em>It stays on this computer. Nothing is uploaded.</em></div>
    </uploader>

    <div v-else class="content">
      <div :style="{ width: state.offsetWidth ? state.offsetWidth + 'px' : '100%' }" class="scan-effect transparent-bg">
        <img ref="raw" :style="{ clipPath: state.cutImage ? `inset(0 0 0 ${state.percent}%)` : undefined }" :src="state.rawImage" alt="" @load="measure" />
        <img v-show="state.cutImage" :src="state.cutImage" alt="Result" @mousemove="mousemove" />
        <div v-show="state.cutImage" :style="{ left: state.percent + '%' }" class="scan-line"></div>
      </div>
      <p v-if="state.cutImage" class="hint">Move the pointer across the picture to compare it with the original.</p>
    </div>

    <template #footer>
      <span class="dialog-footer">
        <template v-if="state.cutImage">
          <el-button v-show="state.toolModel" @click="clear">Start over</el-button>
          <el-button plain @click="openEraser">Edit again</el-button>
          <el-button v-show="state.toolModel" @click="download">Download</el-button>
          <el-button type="primary" :loading="state.loading" @click="cutDone">{{ state.loading ? 'Saving…' : 'Use this picture' }}</el-button>
        </template>
        <template v-else-if="state.rawImage">
          <el-button v-show="state.toolModel" @click="clear">Choose another</el-button>
          <el-button type="primary" @click="openEraser">Erase background</el-button>
        </template>
      </span>
    </template>
    <ImageExtraction ref="matting" />
  </el-dialog>
</template>

<script lang="ts" setup>
import { reactive, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import uploader from '@/components/common/Uploader/index.vue'
import _dl from '@/common/methods/download'
import ImageExtraction from '../ImageExtraction/index.vue'
import { saveCutOut } from './method'
import { useControlStore } from '@/store'
import type { LocalUpload } from '@/common/methods/localUploads'

export type TImageCutoutState = {
  show: boolean
  rawImage: string
  cutImage: string
  offsetWidth: number
  percent: number
  /** True when opened from the Tools panel, false when opened from a picture already on the page. */
  toolModel: boolean
  loading: boolean
}

const controlStore = useControlStore()
const state = reactive<TImageCutoutState>({
  show: false,
  rawImage: '',
  cutImage: '',
  offsetWidth: 0,
  percent: 0,
  toolModel: true,
  loading: false,
})

let fileName = 'cut-out.png'
let isRunning = false
/** The eraser opens itself once per picture, but not again after a Start over. */
let opened = false

const emits = defineEmits<{
  (event: 'done', data: LocalUpload): void
}>()

const raw = ref<HTMLImageElement | null>(null)
const matting = ref<typeof ImageExtraction | null>(null)

const open = (file?: File) => {
  clear()
  state.show = true
  // Opened from a picture on the page: that picture is the subject, so there is
  // nothing to choose and the result replaces it rather than being downloaded.
  state.toolModel = !file
  controlStore.setShowMoveable(false)
  nextTick(() => {
    file && handleUploaderLoad(file)
  })
}

defineExpose({ open })

const handleUploaderLoad = (file: File) => {
  state.rawImage && URL.revokeObjectURL(state.rawImage)
  // An object URL, not a data URL: this only has to outlive the dialog, the
  // eraser reads it back with fetch(), and base64 would double a phone photo
  // in memory for no gain. The result is what gets stored.
  state.rawImage = URL.createObjectURL(file)
  fileName = file.name || fileName
  opened = false
}

/** Sizes the comparison box to the picture as laid out, so both layers line up. */
const measure = () => {
  state.offsetWidth = raw.value?.offsetWidth || 0
  if (!opened) {
    opened = true
    openEraser()
  }
}

const handleClose = () => {
  controlStore.setShowMoveable(true)
}

const mousemove = (e: MouseEvent) => {
  !isRunning && (state.percent = (e.offsetX / (e.target as HTMLImageElement).width) * 100)
}

const download = () => {
  _dl.downloadBase64File(state.cutImage, fileName)
}

const clear = () => {
  state.rawImage && URL.revokeObjectURL(state.rawImage)
  state.rawImage = ''
  state.cutImage = ''
  state.percent = 0
  state.offsetWidth = 0
  state.loading = false
  opened = false
}

/** Sweeps the reveal across once so it is obvious what changed. */
const run = () => {
  state.percent += 1
  isRunning = true
  state.percent < 100 ? requestAnimationFrame(run) : (isRunning = false)
}

const cutDone = async () => {
  state.loading = true
  const saved = await saveCutOut(state.cutImage)
  state.loading = false
  if (!saved) {
    ElMessage.error('That picture could not be saved. Please try again.')
    return
  }
  emits('done', saved)
  state.show = false
  handleClose()
}

const openEraser = () => {
  if (!matting.value) return
  // The eraser masks whatever is opaque in the second picture, so handing it the
  // original as its own starting mask means "everything is kept" — which is the
  // right place to start erasing from. After one pass it re-opens on the result,
  // so a second go touches up rather than starting again.
  matting.value.open(state.rawImage, state.cutImage || state.rawImage, (base64: string) => {
    if (!base64) return
    state.cutImage = base64
    state.percent = 0
    requestAnimationFrame(run)
  })
}
</script>

<style lang="less" scoped>
.uploader {
  &__box {
    color: @ink;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  }
}
.content {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.hint {
  margin: 12px 0 0;
  color: @ink-3;
  font-size: @text-sm;
}
.scan-effect {
  position: relative;
  height: 50vh;
  overflow: hidden;
  img {
    height: 100%;
    object-fit: contain;
    position: absolute;
  }
}

.scan-line {
  position: absolute;
  top: 0;
  width: 1.5px;
  height: 100%;
  background: rgba(255, 255, 255, 0.7);
  box-shadow: 0 0 2px rgba(0, 0, 0, 0.3);
}
</style>
