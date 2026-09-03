/**
 * What a layer is called and what it looks like in a list.
 *
 * Both the Layers tab and the Design tab's selection header name the thing you
 * have selected, and they were naming it two different ways — the layer list
 * from the widget, the settings panel not at all. One helper, so a box called
 * "Gold rule" in one is called "Gold rule" in the other.
 */
import { cx } from '@/utils/dom'
import { PhotoIcon } from '@/components/ui/icons'
import { textToLines } from '../../widgets/wText/listMarkup'
import type { TdWidgetData } from '@/store/types'

/**
 * The name it was given, else its own text, else its kind. A text widget's text
 * is markup — a bulleted one is a whole <ul> — so it is read back as lines
 * rather than printed raw.
 */
export function layerLabel(element: Pick<TdWidgetData, 'label' | 'text' | 'name'>) {
  return element.label || (element.text ? textToLines(element.text).join(' ') : '') || element.name || ''
}

/**
 * One character standing for the kind of thing a layer is. A letter or a shape
 * rather than an icon: at 15px in a list, a drawn glyph of a rectangle and a
 * drawn glyph of a frame are the same grey smudge, whereas □ and T are not.
 */
const GLYPHS: Record<string, string> = {
  page: '▭',
  'w-text': 'T',
  'w-rect': '□',
  'w-ellipse': '○',
  'w-polygon': '⬠',
  'w-path': '⌒',
  'w-line': '╱',
  'w-svg': '◇',
  'w-group': '⧉',
  'w-qrcode': '▦',
  'w-table': '▤',
}

/** A photograph is the one kind a character does not say; it gets the icon. */
export function LayerBadge({ type, className }: { type?: string; className?: string }) {
  return (
    <span className={cx('layer-badge', className || '')} aria-hidden="true">
      {type === 'w-image' ? <PhotoIcon /> : GLYPHS[type || ''] || '◇'}
    </span>
  )
}
