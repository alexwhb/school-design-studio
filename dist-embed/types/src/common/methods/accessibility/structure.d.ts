import type { TdWidgetData } from '../../../store/types';
/**
 * A group is a container for the elements under it, which appear in `layers`
 * in their own right. Placing both would say everything twice.
 */
export declare const isContainerOnly: (widget: TdWidgetData) => boolean;
/**
 * Sorts a page into the order a sighted person would take it: across, then
 * down.
 *
 * Stacking order is no use for this — it says which element is in front, and
 * the front element on a poster is usually the last one someone dragged. Two
 * elements are treated as being on the same line when one's midpoint falls
 * inside the other's vertical span, which keeps a headline and the logo beside
 * it together instead of interleaving them with the paragraph below.
 *
 * Rows are built greedily from a top-down pass rather than by comparing pairs,
 * because "roughly level with" is not transitive and a sort comparator built on
 * it gives a different answer depending on the starting order.
 */
export declare function readingOrder(layers: readonly TdWidgetData[]): TdWidgetData[];
export type StructureTag = 'H1' | 'H2' | 'H3' | 'P';
export declare const isTextWidget: (widget: TdWidgetData) => boolean;
/** The words in a text widget, with the contenteditable markup taken off. */
export declare const textOf: (widget: TdWidgetData) => string;
/**
 * Works out which text on a page is a heading, and at what level.
 *
 * Nothing in the design says so, but the page shows it: a heading is the type
 * that is bigger than the type most of the words are set in. So the body size
 * is found first — the size carrying the most characters, not the most boxes,
 * because three words of caption should not outvote four paragraphs — and every
 * distinct size above it becomes a level, largest first.
 *
 * The levels stop at H3. A poster with four sizes of heading and no body text
 * has a design problem, not a structure that is worth reproducing faithfully.
 * A page holding a single piece of text is that page's title, whatever size it
 * is set at.
 */
export declare function headingLevels(layers: readonly TdWidgetData[]): Map<string, StructureTag>;
export type AltText = 
/** Has a description, either written or derivable. */
{
    state: 'described';
    text: string;
}
/** Deliberately skipped: it carries no information a reader would miss. */
 | {
    state: 'decorative';
}
/** Nobody has said what it is, and nothing here can work it out. */
 | {
    state: 'missing';
};
/**
 * What a screen reader should say about an element that is not text.
 *
 * Only pictures the person chose can be described by the person, so only those
 * are ever reported as missing. A QR code describes itself — it is a link, and
 * the link is right there in the widget — and a shape from the sticker library
 * is scenery until somebody says otherwise, which is what `decorative` is for
 * and what "an image of a swoosh" would be worse than.
 */
export declare function altTextOf(widget: TdWidgetData): AltText;
/** Elements a reader needs described. Text is excluded: it describes itself. */
export declare const isPictorial: (widget: TdWidgetData) => boolean;
export type Box = {
    left: number;
    top: number;
    width: number;
    height: number;
};
export declare const boxOf: (widget: TdWidgetData) => Box;
export declare const rotationOf: (widget: TdWidgetData) => number;
/** True when an element is invisible and so has nothing to say to anybody. */
export declare function isHidden(widget: TdWidgetData): boolean;
