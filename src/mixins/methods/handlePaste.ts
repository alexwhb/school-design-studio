import { saveUpload } from '@/common/methods/localUploads'
import eventBus from '@/utils/plugins/eventBus'
import { canvasState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget/widget'
import { copyWidget } from '@/store/widget/clone'
import { recordHistory } from '@/common/hooks/history'
import { plainToHtml } from '@/utils/widgets/richText'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'

/**
 * What a paste off the system clipboard turned into.
 *
 * `none` is the answer the caller acts on: the clipboard had nothing of its own
 * to put on the page, so a widget copied inside the editor is pasted instead.
 * Copying a widget empties the system clipboard for exactly that reason (see
 * `copyWidget`), which is why an empty string counts as nothing here — it is
 * the editor's own marker, not a word anybody copied.
 */
export type TPasteResult = 'image' | 'text' | 'none'

/**
 * Words off the clipboard as the markup a text box holds.
 *
 * A text box is drawn by setting its innerHTML, so what is pasted has to be
 * made into markup rather than dropped in as it came: "A < B" and "Tom & Jerry"
 * were mangled on the way, and a clipboard somebody else filled could carry
 * `<img onerror>`. `plainToHtml` escapes every run and turns each line into a
 * line of the box, which is what typing the same words would have produced.
 */
export function clipboardTextToMarkup(text: string): string {
  return plainToHtml(String(text ?? '').replace(/\r\n?/g, '\n'))
}

/** Always settles, and says what it did. */
export default async function handlePaste(pasteImageFile?: File | null): Promise<TPasteResult> {
  // Text being edited takes the paste itself — see wText's own handler.
  if (widgetState.dActiveElement?.editable) return 'text'
  if (pasteImageFile) {
    await uploadParseImage(pasteImageFile)
    return 'image'
  }
  let items: ClipboardItems
  try {
    items = await navigator.clipboard.read()
  } catch {
    // Permission refused, or a browser without the async clipboard. Nothing of
    // the system's to paste, so the editor's own copy still can be.
    return 'none'
  }
  for (const item of items) {
    const image = item.types.find((type) => type.startsWith('image/'))
    if (image) {
      const blob = await item.getType(image)
      await uploadParseImage(new File([blob], 'screenshot.png', { type: 'image/png' }))
      return 'image'
    }
    if (item.types.some((type) => type.startsWith('text/'))) {
      const text = await navigator.clipboard.readText().catch(() => '')
      if (!text.trim()) return 'none'
      addTextWidget(text)
      return 'text'
    }
  }
  return 'none'
}

/** A new text box holding `text`, as one step of undo. */
export function addTextWidget(text: string) {
  setShowMoveable(false)
  const setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = clipboardTextToMarkup(text)
  recordHistory(() => addWidget(setting))
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
  // The upload took however long it took, so the press that asked for it has
  // long since been bracketed and closed. The picture landing is its own step.
  recordHistory(() => addWidget(setting))
  // The picture is now a widget, so the next Ctrl+V should paste a copy of
  // that rather than upload the same file a second time.
  navigator.clipboard
    .write([
      new ClipboardItem({
        'text/plain': new Blob([''], { type: 'text/plain' }),
      }),
    ])
    .catch(() => undefined)
  setTimeout(() => {
    copyWidget()
  }, 100)
}
