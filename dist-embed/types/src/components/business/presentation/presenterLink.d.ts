/**
 * The link between the presenter on the projector and the presenter view on the
 * laptop.
 *
 * They are two documents. That is the whole difficulty: the second window has
 * its own `window`, so its own key handler, and a press of the space bar while
 * you are looking at your notes arrives nowhere near the code that turns the
 * page. Neither can the windows simply reach into each other — a reference into
 * another document's DOM goes stale the moment that document is closed or
 * reloaded, and the presenter view is exactly the window somebody closes by
 * accident halfway through a talk.
 *
 * So they talk over a BroadcastChannel instead, which needs no references and
 * survives either end going away. The presenter is the one that holds the state:
 * it broadcasts where the talk is, and the view sends it presses. A view that
 * has just opened says hello and is told where things stand.
 */
export declare const PRESENTER_CHANNEL = "design-presenter";
/** Everything a presenter view needs that it cannot read out of the store itself. */
export type TPresenterState = {
    index: number;
    /** When the clock was started, so both windows count from the same instant. */
    startedAt: number;
    /** False once the talk has ended, which is the view's cue to say so. */
    live: boolean;
};
export type TPresenterMessage = ({
    kind: 'state';
} & TPresenterState)
/** Forwards or back, from a press or a button in the view. */
 | {
    kind: 'step';
    by: 1 | -1;
} | {
    kind: 'restartClock';
} | {
    kind: 'hello';
};
/** Null where the browser has no BroadcastChannel; everything here is then simply off. */
export declare function openPresenterChannel(): BroadcastChannel | null;
export type TPresenterWindow = {
    window: Window;
    /** The element the presenter view is rendered into, from the main window's React tree. */
    mount: HTMLElement;
};
/**
 * Opens the second window and prepares an empty document to draw into.
 *
 * The view is rendered into it with a React portal rather than by booting a
 * second copy of the editor: the design is already in memory in this window, and
 * a second copy would have to be sent a whole deck of artwork and kept in step
 * with every edit. A portal into another document needs that document to carry
 * the editor's stylesheets, so they are cloned across, and a `<base>` so that the
 * relative URLs inside them — fonts, icon sheets, background images — resolve
 * against the app rather than against `about:blank`, where nothing exists.
 *
 * Null when the browser blocked the pop-up, which is common enough that the
 * caller has to have an answer for it.
 */
export declare function openPresenterWindow(): TPresenterWindow | null;
