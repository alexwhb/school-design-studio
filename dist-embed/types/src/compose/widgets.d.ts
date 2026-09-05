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
import type { TdWidgetData, TPageState } from '../store/types';
import type { FontChoice } from './themes';
/**
 * Ids the same shape the editor's own `nanoid` makes — twelve hex characters.
 * `Math.random` rather than a crypto source on purpose: this runs on a server
 * and in a browser, an id here is a key inside one document rather than a
 * secret, and a compose entry that reaches for `crypto` is a compose entry that
 * does not load somewhere.
 */
export declare function uuid(): string;
export type TextSpec = {
    left: number;
    top: number;
    width: number;
    height: number;
    fontSize: number;
    lineHeight: number;
    color: string;
    font: FontChoice;
    text: string;
    letterSpacing?: number;
    fontWeight?: number;
    textAlign?: 'left' | 'center' | 'right';
    /** Which of the kit's two fonts this box asks for when a brand lands on it. */
    brandRole?: 'heading' | 'body' | 'keep';
    /** What the box is for, so `describeDocument` can say. See `TdWidgetData.role`. */
    role?: string;
};
export declare function textWidget(spec: TextSpec): TdWidgetData;
/**
 * A filled rectangle, drawn as an SVG shape rather than a `w-rect`.
 *
 * The templates the themes are read from draw their rules and bands this way,
 * so a composed page and a bundled one are made of the same thing — and the
 * `{{colors[0]}}` placeholder is what lets Apply brand repaint it along with
 * everything else.
 */
export declare function rectWidget(left: number, top: number, width: number, height: number, color: string, radius?: number): TdWidgetData;
/**
 * A picture in a slot, cropped to fill it rather than squashed into it.
 *
 * The widget's box is the window; the picture behind it is drawn at
 * `width × zoom` by `height × zoomY` and centred, which is the same crop the
 * grips produce when somebody reframes a photo by hand. So covering a slot is
 * one division: whichever way round the picture is, scale that axis until the
 * short side of the slot is covered and let the long side run past the edge.
 */
export declare function imageWidget(left: number, top: number, width: number, height: number, image: {
    url: string;
    width: number;
    height: number;
}): TdWidgetData;
export declare function page(name: string, width: number, height: number, background: string, notes?: string | null): TPageState;
/** Plain words into the markup a text widget holds. Line breaks become `<br/>`. */
export declare function markup(text: string): string;
