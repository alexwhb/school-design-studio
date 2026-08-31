<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-29 18:17:13
 * @Description: 二次封装上传组件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @Date: 2024-03-05 10:50:00
-->
<template>
  <el-upload action="" accept="image/*" :http-request="upload" :show-file-list="false" multiple>
    <slot>
      <el-button size="small">Upload image<i class="el-icon-upload el-icon--right"></i></el-button>
    </slot>
  </el-upload>
</template>

<script lang="ts" setup>
import { withDefaults } from 'vue'
import { ElUpload, UploadRequestOptions } from 'element-plus'
import { saveUpload } from '@/common/methods/localUploads'
import useNotification from '@/common/methods/notification'

type TModelData = {
  num?: string | number
  ratio?: string
}

export type TUploadDoneData = {
  width: number
  height: number
  url: string
  id?: string
  title?: string
}

type TProps = {
  modelValue?: TModelData
  options?: { bucket: string; prePath: string }
  /**
   * Hand the raw File to the parent instead of storing it — used by the tools
   * that open a picture in a cropper or a cut-out editor rather than adding it
   * to the library.
   */
  hold?: boolean
}

type TEmits = {
  (event: 'done', data: TUploadDoneData): void
  (event: 'update:modelValue', data: TModelData): void
  (event: 'load', data: File): void
}

const props = withDefaults(defineProps<TProps>(), {
  modelValue: () => ({}),
  options: () => ({ bucket: 'xp-design', prePath: 'user' }),
  hold: false,
})

const emit = defineEmits<TEmits>()

let uploading: boolean = false // Upload stateFlag
let timer: number

let uploadList: File[] = [] // Upload queue
let index: number = 0 // Index of the file being uploaded
let count: number = 0 // Total files being uploaded

const upload = async ({ file }: UploadRequestOptions) => {
  if (props.hold) {
    emit('load', file)
    return
  }
  uploadList.push(file)
  clearTimeout(timer)
  count++
  updatePercent(null)
  uploadQueue()
}

// Upload queue
const uploadQueue = async () => {
  if (uploading) return
  uploading = true
  const file = uploadList[0]
  if (file) {
    // There used to be a 1MB ceiling here, which rejected most photos taken on
    // a phone. The store downscales instead, so the only thing worth refusing
    // is a file so large that reading it would stall the tab.
    if (file.size > 40 * 1024 * 1024) {
      useNotification('That image is too big', 'Please use a picture under 40MB.', { type: 'error', position: 'bottom-left' })
    } else {
      updatePercent(0)
      try {
        const saved = await saveUpload(file)
        useNotification('Uploaded', saved.title, { position: 'bottom-left' })
        emit('done', { id: saved.id, width: saved.width, height: saved.height, url: saved.url, title: saved.title })
      } catch (error) {
        // Storing can genuinely fail — the browser's quota is full, or the file
        // is not an image the browser can decode. Say which, rather than
        // leaving a broken thumbnail in the panel.
        const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
        useNotification(
          quota ? 'No room left for uploads' : "That image could not be added",
          quota ? 'Delete some uploads and try again.' : (error as Error)?.message || 'The file could not be read.',
          { type: 'error', position: 'bottom-left' },
        )
      }
    }
    uploading = false
    handleRemove() // Remove uploaded file
    index++
    updatePercent(null)
    uploadQueue()
  } else {
    uploading = false
    timer = setTimeout(() => {
      index = count = 0
      updatePercent(0)
    }, 3000)
  }
}

// 更新视图
const updatePercent = (p?: number | null) => {
  const num = typeof p === 'number' ? String(p) : p
  const percent = { ...props.modelValue }
  percent.num = num ? Number(num).toFixed(0) : percent.num
  percent.ratio = count ? `${index} / ${count}` : ''
  emit('update:modelValue', percent)
}
const handleRemove = () => {
  uploadList.length > 0 && uploadList.splice(0, 1)
}

defineExpose({
  upload,
})
</script>

<style lang="less" scoped>
:deep(.el-upload) {
  display: inherit;
}
</style>
