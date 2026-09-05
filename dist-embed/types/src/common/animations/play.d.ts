/**
 * Plays presets on real elements, and works out what runs when.
 *
 * Everything here goes through the Web Animations API rather than CSS classes,
 * for two reasons that matter to this editor:
 *
 *  - A WAAPI animation never writes to the element's inline style, so a clone of
 *    the canvas is always at rest. That is what the PNG and .pptx exporters take
 *    (`export/renderPage.ts` clones the node before rasterising it), so a
 *    preview that happens to be mid-flight cannot leak a half-faded element into
 *    an exported file.
 *  - Transforms can be composited *onto* the element rather than replacing it,
 *    which is the only way an already-rotated widget can be animated without
 *    losing its rotation.
 *
 * That second point is why a preset is played as two animations rather than one:
 * WAAPI sets `composite` per keyframe effect, not per property, and the two
 * halves need opposite behaviour. Transforms add; opacity, filter and clip-path
 * replace — an additive opacity of 0 → 1 would resolve to 1 → 2 and never fade.
 */
import type { AnimationPreset, TWidgetAnimation } from './presets';
/** Set on an element that is waiting for its build step, to hold it off screen. */
export declare const PENDING_CLASS = "ds-anim-pending";
export type PlayOptions = {
    /** Overrides the preset's own duration, in milliseconds. */
    duration?: number;
    delay?: number;
    iterations?: number;
    onFinish?: () => void;
};
/**
 * Runs a preset on an element and hands back the animations, so the caller can
 * cancel them if the user navigates away mid-flight.
 *
 * `fill: 'backwards'` holds the opening frame through the delay, which is what
 * keeps a staggered build from flashing every element on screen before its turn.
 * Nothing fills forwards: at the end the element simply reverts to its own CSS,
 * which is already the state the animation was heading for.
 */
export declare function playPreset(el: HTMLElement, preset: AnimationPreset, options?: PlayOptions): Animation[];
/** Plays whatever a widget is configured with, if anything. */
export declare function playWidgetAnimation(el: HTMLElement, animation?: TWidgetAnimation | null, extraDelay?: number): Animation[];
export declare function cancelAll(animations: Animation[]): void;
/** The least a scheduler needs to know about a widget. */
export type AnimatableWidget = {
    uuid: string;
    animation?: TWidgetAnimation;
};
export type ScheduledItem<T extends AnimatableWidget> = {
    widget: T;
    /** Which advance of the presenter reveals this element. 0 shows on arrival. */
    step: number;
    /** Milliseconds after that step begins. */
    at: number;
};
export type Schedule<T extends AnimatableWidget> = {
    /** Items grouped by step, so `steps[0]` runs the moment the slide opens. */
    steps: ScheduledItem<T>[][];
    /** Widgets with no animation, which are simply on screen from the start. */
    immediate: T[];
};
/**
 * Turns a page's layer list into a running order.
 *
 * Order follows the layer stack, which is also the order the elements were added
 * — the same thing the layer panel shows, so "the next one down the list goes
 * next" is a rule the user can see rather than guess.
 */
export declare function buildSchedule<T extends AnimatableWidget>(widgets: T[]): Schedule<T>;
