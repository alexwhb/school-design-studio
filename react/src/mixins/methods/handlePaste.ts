import { saveUpload } from '@/common/methods/localUploads'
import eventBus from '@/utils/plugins/eventBus'
import { canvasState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget, copyWidget } from '@/store/widget'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'

export default (pasteImageFile?: any) => {
  return new Promise<void>((resolve) => {
    navigator.clipboard
      .read()
      .then(async (dataTransfer: ClipboardItems) => {
        if (widgetState.dActiveElement?.editable) {
          return
        }
        if (pasteImageFile) {
          uploadParseImage(pasteImageFile)
          return
        }
        for (let i = 0; i < dataTransfer.length; i++) {
          const item = dataTransfer[i]
          if (item.types.toString().indexOf('image') !== -1) {
            const imageBlob = await item.getType(item.types[0])
            const file = new File([imageBlob], 'screenshot.png', { type: 'image/png' })
            uploadParseImage(file)
            break
          } else if (item.types.toString().indexOf('text') !== -1) {
            setShowMoveable(false)

            const setting = JSON.parse(JSON.stringify(wTextSetting))
            setting.text = await navigator.clipboard.readText()

            addWidget(setting)
            break
          } else resolve()
        }
      })
      .catch(() => {
        resolve()
      })
  })
}

async function uploadParseImage(file: File) {
  const saved = await saveUpload(file).catch(() => null)
  if (!saved) return
  const { width, height } = saved
  eventBus.emit('refreshUserImages')
  setShowMoveable(false)
  const setting = JSON.parse(JSON.stringify(wImageSetting))
  setting.width = width
  setting.height = height
  setting.imgUrl = saved.url
  const { width: pW, height: pH } = canvasState.dPage
  setting.left = pW / 2 - width / 2
  setting.top = pH / 2 - height / 2
  addWidget(setting)
  navigator.clipboard.write([
    new ClipboardItem({
      'text/plain': new Blob([''], { type: 'text/plain' }),
    }),
  ])
  setTimeout(() => {
    copyWidget()
  }, 100)
}
