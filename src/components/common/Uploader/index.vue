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
import { onMounted, nextTick, withDefaults } from 'vue'
import { ElUpload, UploadRequestOptions } from 'element-plus'
// import Qiniu from '@/common/methods/QiNiu'
import api from '@/api'
import { getImage } from '@/common/methods/getImgDetail'
import _config from '@/config'
import useNotification from '@/common/methods/notification'

type TModelData = {
  num?: string | number
  ratio?: string
}

export type TUploadDoneData = {
  width: number
  height: number
  url: string
}

type TQiNiuUploadReturn = { hash: string; key: string }

type TProps = {
  modelValue?: TModelData
  options?: { bucket: string; prePath: string }
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

let tempSimpleRes: TQiNiuUploadReturn | null // Returned for a single-file upload

// onMounted(async () => {
//   await nextTick()
//   setTimeout(() => {
//     // 加载七牛上传插件
//     const link_element = document.createElement('script')
//     link_element.setAttribute('src', _config.QINIUYUN_PLUGIN)
//     document.head.appendChild(link_element)
//   }, 1000)
// })

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
  if (!uploading) {
    uploading = true
    const file = uploadList[0]
    if (file) {
      if (file.size <= 1024 * 1024) {
        tempSimpleRes = await qiNiuUpload(file) // Files queued, start uploading
        const { width, height } = await getImage(file)
        useNotification('Uploaded', '', { position: 'bottom-left' })
        emit('done', { width, height, url: tempSimpleRes?.url }) // Respond for a single file
      } else useNotification('Keep uploads small', 'Please upload an image smaller than 1M !', { type: 'error', position: 'bottom-left' })
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
}

const qiNiuUpload = async (file: File): Promise<null | TQiNiuUploadReturn> => {
  updatePercent(0)
  return new Promise(async (resolve) => {
    if (props.hold) {
      emit('load', file)
      resolve(null)
    } else {
      const result = await api.material.upload({ file }, (up: any, dp: any) => {
        console.log(up, dp)
      })
      // const result = await Qiniu.upload(file, props.options, (res: Type.Object) => {
      //   updatePercent(res.total.percent)
      // })
      resolve(result)
    }
  })
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
