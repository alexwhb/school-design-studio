/**
 * A picture dropped onto a picture that is already on the page.
 *
 * Dropping a photo used to add another widget wherever it landed, even when
 * what it landed on was the photo it was meant to replace, and swapping one
 * meant deleting the old one and lining the new one up with the frame by hand.
 * Now a drop onto a photo puts the new picture in the old frame: same place,
 * same size, same mask, keyline, corners, shadow and adjustments, cropped to
 * cover the frame and centred, as the composer places one. A drop onto the grey
 * slot a composed slide leaves for a photo (`IMAGE_SLOT_ROLE`) turns the slot
 * into that photo. Either is one step of undo.
 *
 * The alt text goes, because it described the picture that has gone. Whether
 * the picture is decorative stays: a frame that held a texture still does.
 */
import { recordHistory } from '@/common/hooks/history'
import { coverCrop, IMAGE_SLOT_ROLE, imageWidget } from '@/compose/widgets'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { selectWidget } from './select'

export type PictureSource = { url: string; width: number; height: number }

/** Whether a picture dropped on this layer goes into it rather than beside it. */
export function takesPicture(layer: TdWidgetData | null | undefined): boolean {
  if (!layer || layer.lock || layer.hidden) return false
  if (layer.type === 'w-image') return true
  return layer.type === 'w-svg' && layer.role === IMAGE_SLOT_ROLE
}

/**
 * The layer with the new picture in it. Pure: the layer given is not touched,
 * and what comes back keeps its uuid, so a host holding the id still has it.
 */
export function withPicture(layer: TdWidgetData, picture: PictureSource): TdWidgetData {
  if (layer.type === 'w-image') {
    const next = { ...layer, imgUrl: picture.url, ...coverCrop(layer, picture) } as TdWidgetData & Record<string, unknown>
    // The cut-out's original was of the old photo; Restore original must not
    // put that back over this one.
    delete next.originalImgUrl
    delete next.alt
    return next
  }
  const image = imageWidget(layer.left, layer.top, layer.width, layer.height, picture) as TdWidgetData & Record<string, unknown>
  image.uuid = layer.uuid
  image.parent = layer.parent ?? '-1'
  image.opacity = layer.opacity ?? 1
  if (layer.rotate) image.rotate = layer.rotate
  if (layer.label) image.label = layer.label
  if ((layer as any).animation) image.animation = (layer as any).animation
  return image
}

/**
 * Puts `picture` into the layer `uuid` on the page on screen, as one step of
 * undo, and selects it. False when there is no such layer or it does not take
 * pictures, so the caller can place the picture the ordinary way instead.
 */
export function fillPicture(uuid: string, picture: PictureSource): boolean {
  const index = widgetState.dWidgets.findIndex((item) => String(item.uuid) === String(uuid))
  const layer = widgetState.dWidgets[index]
  if (index < 0 || !takesPicture(layer) || !picture.url) return false
  const next = withPicture(JSON.parse(JSON.stringify(layer)), picture)
  recordHistory(() => {
    if (layer.type === 'w-image') {
      // In place, so the widget on the canvas is the same object and keeps its
      // selection and its place in any group.
      for (const key of Object.keys(layer)) if (!(key in next)) delete (layer as Record<string, unknown>)[key]
      Object.assign(layer, next)
    } else {
      widgetState.dWidgets.splice(index, 1, next)
    }
  })
  selectWidget({ uuid: String(uuid) })
  return true
}

/**
 * The layer under a pointer that a dropped picture would go into, by uuid, or
 * null. The nearest widget wins, so a photo inside a group is found rather
 * than the group around it.
 */
export function pictureTargetOf(element: Element | null | undefined): string | null {
  const root = element?.closest?.('#page-design-canvas [data-uuid]')
  const uuid = root?.getAttribute('data-uuid')
  if (!uuid || uuid === '-1') return null
  const layer = widgetState.dWidgets.find((item) => String(item.uuid) === uuid)
  return takesPicture(layer) ? uuid : null
}
