/**
 * The Background section of the image panel: cut the background away, and put
 * it back.
 *
 * The cut-out is stored the way an upload is — a data URL, run through the same
 * downscaling rules — so it survives a reload, embeds into a .pptx and never
 * taints the canvas during a PNG export. Only `imgUrl` changes, so the crop,
 * the size, the corner radius and everything else about the widget stay exactly
 * as they were; the picture underneath is the same shape, just with holes in it.
 *
 * The original is kept on the widget as `originalImgUrl` rather than thrown
 * away, because the cut is a guess and sometimes it takes an ear off.
 */
import { useState } from 'react'
import { recordHistory } from '@/common/hooks/history'
import { REMOVAL_FAILED, canRemoveBackground, removeBackground, type TRemovalProgress } from '@/common/methods/backgroundRemoval'
import { dataUrlToBlob, imageToDataUrl } from '@/common/methods/export/utils'
import { downscale } from '@/common/methods/localUploads'
import useNotification from '@/common/methods/notification'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import { updateWidgetData } from '@/store/widget'
import './imageBackground.less'

type Props = {
  uuid: string
  imgUrl?: string
  originalImgUrl?: string
}

export default function ImageBackground({ uuid, imgUrl, originalImgUrl }: Props) {
  const [progress, setProgress] = useState<TRemovalProgress | null>(null)
  // Its own open state rather than the panel's group: one button is not worth
  // folding away, and the group's list is shared with sections that are.
  const [open, setOpen] = useState(true)
  const removed = Boolean(originalImgUrl)

  async function remove() {
    if (!imgUrl || progress) return
    setProgress({ fraction: -1, message: 'Getting ready…' })
    try {
      // Whatever the picture is — an upload, a stock photo on another origin —
      // it has to become bytes here. This is the same read the exports do,
      // including the canvas fallback for an image that refuses a fetch.
      const source = await imageToDataUrl(imgUrl)
      if (!source) throw new Error('the picture could not be read')
      const cutOut = await removeBackground(dataUrlToBlob(source), setProgress)
      const file = new File([cutOut], 'cut-out.png', { type: 'image/png' })
      const { url } = await downscale(file)
      recordHistory(() => {
        // The original first: a widget that has one is a widget whose picture
        // has already been replaced, and the two land in one undo entry anyway.
        updateWidgetData({ uuid, key: 'originalImgUrl', value: imgUrl })
        updateWidgetData({ uuid, key: 'imgUrl', value: url })
      })
    } catch (e) {
      console.warn('[background removal] failed', e)
      useNotification(REMOVAL_FAILED, e instanceof Error ? e.message : '', { type: 'warning', duration: 8000 })
    } finally {
      setProgress(null)
    }
  }

  function restore() {
    if (!originalImgUrl) return
    recordHistory(() => {
      updateWidgetData({ uuid, key: 'imgUrl', value: originalImgUrl })
      updateWidgetData({ uuid, key: 'originalImgUrl', value: null })
    })
  }

  if (!canRemoveBackground()) return null

  return (
    <PanelSection name="background" className="image-background" title="Background" open={open} onToggle={() => setOpen(!open)}>
      {removed ? (
        <>
          <p className="image-background__note">The background has been removed.</p>
          <Button className="image-background__button" plain onClick={restore}>
            Restore original
          </Button>
        </>
      ) : (
        <Button className="image-background__button" plain disabled={!!progress} onClick={remove}>
          {progress ? progress.message : 'Remove background'}
        </Button>
      )}
      {progress ? (
        <div className="image-background__progress" role="progressbar">
          {/* A download has an end to show; the cutting out itself does not, so
              it gets a bar that sweeps rather than one that lies about a share. */}
          <div className={progress.fraction < 0 ? 'image-background__bar is-waiting' : 'image-background__bar'} style={progress.fraction < 0 ? undefined : { width: `${Math.round(progress.fraction * 100)}%` }} />
        </div>
      ) : null}
    </PanelSection>
  )
}
