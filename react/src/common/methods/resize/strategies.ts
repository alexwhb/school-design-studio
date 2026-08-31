/**
 * How a design's contents are re-laid-out when its page changes size.
 *
 * Reusing a design at another size is the thing people actually want from an
 * editor: the flyer becomes a slide, the slide becomes a display board. What
 * makes that hard is that there is no single right answer to "what should
 * happen to the artwork", so the answer is a choice, and each choice is one
 * object in the list below.
 *
 * Every strategy here scales about the page centre rather than mapping each
 * widget's position proportionally. Proportional mapping moves elements
 * relative to one another — a caption drifts away from the photo it belongs to
 * as the aspect ratio changes — whereas scaling the whole composition by one
 * factor keeps every relationship in the design intact and simply lands it,
 * centred, on the new page. It is the difference between resizing a design and
 * rearranging it.
 *
 * Adding a strategy means adding an entry to RESIZE_STRATEGIES. Nothing else
 * knows the list's contents: the dialog renders whatever is in it, and the
 * store action looks strategies up by id.
 */

export type PageSize = {
  width: number
  height: number
}

/**
 * The part of a widget a resize touches.
 *
 * `fontSize` is what makes text scale: a text widget's height comes from its
 * type size and its content, so scaling the box without the type would only
 * change where the words wrap.
 */
export type WidgetBox = {
  left: number
  top: number
  width: number
  height: number
  fontSize?: number
}

export type ResizeContext = {
  from: PageSize
  to: PageSize
}

export interface ResizeStrategy {
  readonly id: string
  /** Shown as the option's title. */
  readonly name: string
  /** One line under the name, in plain language rather than in ratios. */
  readonly description: string
  transform(box: WidgetBox, context: ResizeContext): WidgetBox
}

/**
 * Ids are plain strings, looked up at runtime with a fallback, rather than a
 * union derived from the list. A union would have to be widened the moment a
 * strategy came from anywhere but this file, and would make adding one a
 * two-place edit for no safety a caller actually needs.
 */
export type ResizeStrategyId = string

/** The two ratios a resize could scale by, guarded against an empty page. */
function ratios({ from, to }: ResizeContext): [number, number] {
  const horizontal = from.width > 0 ? to.width / from.width : 1
  const vertical = from.height > 0 ? to.height / from.height : 1
  return [horizontal, vertical]
}

/**
 * Builds a transform that scales every box by one factor about the centre of
 * the old page, and lands the result on the centre of the new one.
 *
 * Strategies differ only in how they pick that factor, so this is where the
 * geometry lives and they stay one line each. A strategy that needed a
 * different model entirely — reflowing to the top-left corner, say — can still
 * implement `transform` directly; nothing requires it to come through here.
 */
function aboutCentre(factorFor: (context: ResizeContext) => number) {
  return (box: WidgetBox, context: ResizeContext): WidgetBox => {
    const factor = factorFor(context)
    const { from, to } = context
    const resized: WidgetBox = {
      width: box.width * factor,
      height: box.height * factor,
      left: (box.left - from.width / 2) * factor + to.width / 2,
      top: (box.top - from.height / 2) * factor + to.height / 2,
    }
    if (typeof box.fontSize === 'number') resized.fontSize = box.fontSize * factor
    return resized
  }
}

export const RESIZE_STRATEGIES: readonly ResizeStrategy[] = [
  {
    id: 'fit',
    name: 'Scale to fit',
    description: 'Everything grows or shrinks together and stays on the page',
    transform: aboutCentre((context) => Math.min(...ratios(context))),
  },
  {
    id: 'fill',
    name: 'Fill the page',
    description: 'Fills the new shape — the edges of the design may fall outside it',
    transform: aboutCentre((context) => Math.max(...ratios(context))),
  },
  {
    id: 'keep',
    name: 'Keep sizes',
    description: 'Nothing is resized; the design is moved to the middle of the new page',
    transform: aboutCentre(() => 1),
  },
]

export const DEFAULT_RESIZE_STRATEGY: ResizeStrategyId = 'fit'

export function getResizeStrategy(id: string): ResizeStrategy {
  return RESIZE_STRATEGIES.find((strategy) => strategy.id === id) || RESIZE_STRATEGIES[0]
}
