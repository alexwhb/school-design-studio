/*
 * @Author: ShawnPhang
 * @Date: 2023-10-09 09:47:40
 * @Description: 处理剪贴板
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2025-03-22 13:09:08
 */

// window.addEventListener('paste', (e: any) => {
//   const clipdata = e.clipboardData || (window as any).clipboardData
//   console.log('主动粘贴', clipdata.getData('text/plain'))
// })

// import store from '@/store'
import { saveUpload } from '@/common/methods/localUploads'
// import wImage from '@/components/modules/widgets/wImage/wImage.vue'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import eventBus from '@/utils/plugins/eventBus'
import { useControlStore, useCanvasStore, useWidgetStore } from '@/store'
// import wText from '@/components/modules/widgets/wText/wText.vue'

export default (pasteImageFile?: any) => {
  return new Promise<void>((resolve) => {
    const pageStore = useCanvasStore()
    const widgetStore = useWidgetStore()
    const controlStore = useControlStore()

    navigator.clipboard
      .read()
      .then(async (dataTransfer: ClipboardItems) => {
        if (widgetStore.dActiveElement?.editable) {
          return
        }
        if (pasteImageFile) {
          uploadParseImage(pasteImageFile, { controlStore, pageStore, widgetStore })
          return
        }
        for (let i = 0; i < dataTransfer.length; i++) {
          const item = dataTransfer[i]
          if (item.types.toString().indexOf('image') !== -1) {
            const imageBlob = await item.getType(item.types[0])
            const file = new File([imageBlob], 'screenshot.png', { type: 'image/png' })
            uploadParseImage(file, { controlStore, pageStore, widgetStore })
            break
          } else if (item.types.toString().indexOf('text') !== -1) {
            controlStore.setShowMoveable(false) // Clear the previous selection

            const setting = JSON.parse(JSON.stringify(wTextSetting))
            setting.text = await navigator.clipboard.readText()

            widgetStore.addWidget(setting)
            break
          } else resolve()
        }
      })
      .catch((error) => {
        // 剪贴板内容为空, 直接返回
        resolve()
      })
  })
}
async function uploadParseImage(file: File, { controlStore, pageStore, widgetStore }: any) {
  // Pasting a picture is an upload like any other, so it goes to the same
  // store the Upload button uses and shows up in the Uploads panel.
  const saved = await saveUpload(file).catch(() => null)
  if (!saved) return
  const { width, height } = saved
  // 刷新用户列表
  eventBus.emit('refreshUserImages')
  // 添加图片到画布中
  controlStore.setShowMoveable(false) // Clear the previous selection
  const setting = JSON.parse(JSON.stringify(wImageSetting))
  setting.width = width
  setting.height = height
  setting.imgUrl = saved.url
  const { width: pW, height: pH } = pageStore.dPage
  setting.left = pW / 2 - width / 2
  setting.top = pH / 2 - height / 2
  widgetStore.addWidget(setting)
  // 清空剪贴板，防止多次Upload image
  navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([''], { type: 'text/plain' }),
    }),
  ])
  // 最后尝试复制，将图片替换为图片组件
  setTimeout(() => {
    widgetStore.copyWidget()
  }, 100)
}
