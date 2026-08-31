import { forwardRef, useImperativeHandle } from 'react'
import html2canvas from 'html2canvas'
import FontFaceObserver from 'fontfaceobserver'
import Qiniu from '@/common/methods/QiNiu'
import { canvasState } from '@/store/state'
import { updateZoom } from '@/store/canvas'
import { selectWidget } from '@/store/widget/select'
import { getWidgets } from '@/store/widget/widget'
import './createCover.less'

export type CreateCoverHandle = {
  createCover: (cb: (result: any) => void) => Promise<void>
  createPoster: () => Promise<{ blob: Blob | null }>
}

const CreateCover = forwardRef<CreateCoverHandle>(function CreateCover(_props, ref) {
  async function createCover(cb: (result: any) => void) {
    const nowZoom = canvasState.dZoom
    selectWidget({ uuid: '-1' })
    updateZoom(100)

    const opts = {
      useCORS: true,
      scale: 0.2,
    }
    setTimeout(async () => {
      const clonePage = document.getElementById('page-design-canvas')?.cloneNode(true) as HTMLElement
      if (!clonePage) return
      clonePage.setAttribute('id', 'clone-page')
      document.body.appendChild(clonePage)
      html2canvas(clonePage, opts).then((canvas) => {
        canvas.toBlob(
          async (blobObj) => {
            if (blobObj) {
              const result = await Qiniu.upload(blobObj, { bucket: 'xp-design', prePath: 'cover/user' })
              cb(result)
            }
          },
          'image/jpeg',
          0.15,
        )
        updateZoom(nowZoom)
        clonePage.remove()
      })
    }, 10)
  }

  async function createPoster(): Promise<{ blob: Blob | null }> {
    await checkFonts()
    const fonts = document.fonts
    const opts = {
      backgroundColor: null,
      useCORS: true,
      scale: 100 / canvasState.dZoom,
      onclone: (doc: any) => fonts.forEach((font) => doc.fonts.add(font)),
    }
    return new Promise((resolve) => {
      const clonePage = document.getElementById('page-design-canvas')?.cloneNode(true) as HTMLElement
      if (!clonePage) return resolve({ blob: null })
      clonePage.setAttribute('id', 'clone-page')
      document.body.appendChild(clonePage)
      html2canvas(clonePage, opts as any).then((canvas) => {
        canvas.toBlob(async (blob) => resolve({ blob }), `image/png`)
        clonePage.remove()
      })
    })
  }

  async function checkFonts() {
    const widgets = getWidgets()
    const fontLoaders: Promise<void>[] = []
    widgets.forEach((item: any) => {
      if (item.fontClass && item.fontClass.value) {
        const loader = new FontFaceObserver(item.fontClass.value)
        fontLoaders.push(loader.load(null, 120000))
      }
    })
    await Promise.all(fontLoaders)
  }

  useImperativeHandle(ref, () => ({ createCover, createPoster }), [])

  return <div id="cover-wrap" />
})

export default CreateCover
