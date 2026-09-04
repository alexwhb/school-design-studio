/**
 * The widgets a composed page is made of, in exactly the shape the editor's
 * store holds them.
 *
 * There is no widget factory to reuse: the editor builds its defaults out of
 * `wTextSetting` and friends, which are React-side modules, and half of what
 * they carry is only meaningful once something has been selected and measured
 * on a canvas. What matters to a stored design is the small set of keys the
 * renderer and the exporters read, and those are written out here in full so
 * that a page composed on a server opens in the editor with nothing missing.
 *
 * Every widget gets a fresh id. A design composed twice is two designs, and two
 * pages that shared an id would be one page as far as `applyOps` is concerned.
 */
import type { TdWidgetData, TPageState } from '@/store/types'
import type { FontChoice } from './themes'
import { escapeMarkup } from '@/utils/mergeFieldsCore'

/**
 * Ids the same shape the editor's own `nanoid` makes — twelve hex characters.
 * `Math.random` rather than a crypto source on purpose: this runs on a server
 * and in a browser, an id here is a key inside one document rather than a
 * secret, and a compose entry that reaches for `crypto` is a compose entry that
 * does not load somewhere.
 */
export function uuid(): string {
  let out = ''
  while (out.length < 12) out += Math.floor(Math.random() * 0x100000000).toString(16)
  return out.slice(0, 12)
}

export type TextSpec = {
  left: number
  top: number
  width: number
  height: number
  fontSize: number
  lineHeight: number
  color: string
  font: FontChoice
  text: string
  letterSpacing?: number
  fontWeight?: number
  textAlign?: 'left' | 'center' | 'right'
  /** Which of the kit's two fonts this box asks for when a brand lands on it. */
  brandRole?: 'heading' | 'body' | 'keep'
  /** What the box is for, so `describeDocument` can say. See `TdWidgetData.role`. */
  role?: string
}

export function textWidget(spec: TextSpec): TdWidgetData {
  return {
    name: 'Text',
    type: 'w-text',
    uuid: uuid(),
    editable: false,
    left: Math.round(spec.left),
    top: Math.round(spec.top),
    width: Math.round(spec.width),
    height: Math.round(spec.height),
    transform: '',
    lineHeight: spec.lineHeight,
    letterSpacing: spec.letterSpacing ?? 0,
    fontSize: spec.fontSize,
    fontClass: { ...spec.font },
    fontFamily: spec.font.value,
    brandRole: spec.brandRole,
    fontWeight: spec.fontWeight ?? 400,
    fontStyle: 'normal',
    writingMode: 'horizontal-tb',
    textDecoration: 'none',
    color: spec.color,
    textAlign: spec.textAlign ?? 'left',
    text: spec.text,
    opacity: 1,
    backgroundColor: '',
    parent: '-1',
    role: spec.role,
    record: { width: 0, height: 0, minWidth: 0, minHeight: 0, dir: 'horizontal' },
    rotate: '0',
    imgUrl: '',
  } as unknown as TdWidgetData
}

/**
 * A filled rectangle, drawn as an SVG shape rather than a `w-rect`.
 *
 * The templates the themes are read from draw their rules and bands this way,
 * so a composed page and a bundled one are made of the same thing — and the
 * `{{colors[0]}}` placeholder is what lets Apply brand repaint it along with
 * everything else.
 */
export function rectWidget(left: number, top: number, width: number, height: number, color: string, radius = 0): TdWidgetData {
  const w = Math.max(1, Math.round(width))
  const h = Math.max(1, Math.round(height))
  return {
    name: 'Shape',
    type: 'w-svg',
    uuid: uuid(),
    width: w,
    height: h,
    colors: [color],
    left: Math.round(left),
    top: Math.round(top),
    transform: '',
    radius: 0,
    opacity: 1,
    parent: '-1',
    svgUrl: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><rect x="0" y="0" width="${w}" height="${h}" rx="${radius}" fill="{{colors[0]}}"/></svg>`,
    setting: [],
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10 },
  } as unknown as TdWidgetData
}

/**
 * A picture in a slot, cropped to fill it rather than squashed into it.
 *
 * The widget's box is the window; the picture behind it is drawn at
 * `width × zoom` by `height × zoomY` and centred, which is the same crop the
 * grips produce when somebody reframes a photo by hand. So covering a slot is
 * one division: whichever way round the picture is, scale that axis until the
 * short side of the slot is covered and let the long side run past the edge.
 */
export function imageWidget(left: number, top: number, width: number, height: number, image: { url: string; width: number; height: number }): TdWidgetData {
  const slot = width / height
  const picture = image.width && image.height ? image.width / image.height : slot
  const zoom = picture > slot ? picture / slot : 1
  const zoomY = picture < slot ? slot / picture : 1
  return {
    name: 'Image',
    type: 'w-image',
    uuid: uuid(),
    width: Math.round(width),
    height: Math.round(height),
    left: Math.round(left),
    top: Math.round(top),
    zoom,
    zoomY,
    transform: ` scale(${zoom}, ${zoomY}) translate(0px, 0px)`,
    radius: 0,
    opacity: 1,
    borderWidth: 0,
    borderColor: '#000000ff',
    borderStyle: 'solid',
    parent: '-1',
    imgUrl: image.url,
    mask: '',
    setting: [],
    rotate: 0,
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10, dir: 'all' },
    lock: false,
    isNinePatch: false,
    flip: '',
    sliceData: { ratio: 0, left: 0 },
  } as unknown as TdWidgetData
}

export function page(name: string, width: number, height: number, background: string, notes?: string | null): TPageState {
  const global: TPageState = {
    name,
    type: 'page',
    uuid: '-1',
    left: 0,
    top: 0,
    width,
    height,
    backgroundColor: background,
    backgroundGradient: '',
    backgroundImage: '',
    backgroundTransform: {},
    opacity: 1,
    tag: 0,
    record: {},
  }
  if (notes && notes.trim()) global.notes = notes.trim()
  return global
}

/** Plain words into the markup a text widget holds. Line breaks become `<br/>`. */
export function markup(text: string): string {
  return escapeMarkup(text).split('\n').join('<br/>')
}
