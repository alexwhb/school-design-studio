/**
 * How one slide gives way to the next in the presenter.
 *
 * A transition belongs to the page being arrived at, which is how PowerPoint
 * and Keynote both read it: "this slide fades in" is a fact about this slide.
 * Going backwards plays the same transition mirrored, so a slide that pushed in
 * from the right pushes back out to the right.
 *
 * Played through the Web Animations API for the same reasons the entrances are
 * (see play.ts): nothing is written to an element's inline style, and a
 * transition still running when the next key is pressed can be cancelled
 * cleanly, which is what stops a quick run of arrow presses from stacking up
 * half-finished fades. Nothing fills forwards: when an animation ends the
 * slot simply reverts to its own CSS, which is already where it was heading.
 *
 * PowerPoint export cannot carry any of this — pptxgenjs has no slide
 * transition API — so a transition lives in the presenter only.
 */
import type { TPageState } from '../../store/types';
export type TTransitionType = 'none' | 'fade' | 'slide' | 'push' | 'zoom' | 'wipe';
export type TPageTransition = {
    type: TTransitionType;
    /** Milliseconds. */
    duration: number;
};
export type TTransitionSpec = {
    id: TTransitionType;
    name: string;
    /** One line describing the movement, in plain words. */
    hint: string;
};
export declare const TRANSITIONS: TTransitionSpec[];
export declare const DEFAULT_TRANSITION_DURATION = 500;
export declare const MIN_TRANSITION_DURATION = 150;
export declare const MAX_TRANSITION_DURATION = 2500;
/** Set on every animation this file starts, so a test or a debugger can tell them from the entrances. */
export declare const TRANSITION_ANIMATION_ID = "page-transition";
export declare function getTransitionSpec(type: unknown): TTransitionSpec | undefined;
/**
 * The transition a page carries, or null when it has none. Absent, 'none' and
 * anything unrecognised all read as none, so a design saved before this
 * existed, or edited by hand, still presents.
 */
export declare function readTransition(page: Partial<TPageState> | null | undefined): TPageTransition | null;
/** Whether the person watching has asked their system for less movement. */
export declare function prefersReducedMotion(): boolean;
type TTracks = {
    in: Keyframe[];
    out: Keyframe[];
    easing: string;
};
/**
 * What the arriving slot and the departing slot each do. `forwards` mirrors
 * the horizontal ones; a fade and a zoom look the same in either direction.
 *
 * The departing slot's CSS puts it at opacity 0 the moment it stops being
 * current, so a transition that wants it to stay visible underneath — a slide
 * gliding in over it, a wipe revealing across it — has to say so with an
 * explicit `[1, 1]` opacity track.
 */
export declare function transitionTracks(type: TTransitionType, forwards: boolean): TTracks;
/**
 * Plays a transition between two slots and hands back the animations, so the
 * caller can cancel them if the talk moves on before they finish. Cancelling
 * drops both elements straight to their resting CSS, which is the state the
 * transition was heading for anyway — so a run of quick presses ends on the
 * right slide with nothing left over.
 *
 * `out` may be missing: opening the presenter has nothing to leave from.
 */
export declare function playTransition(inEl: HTMLElement, outEl: HTMLElement | null, transition: TPageTransition, forwards: boolean): Animation[];
export declare function cancelTransitions(animations: Animation[]): void;
/**
 * Previews a transition on any element — the canvas, in the page settings
 * panel — by playing only the arriving half of it onto the element itself.
 * The transform is composited onto whatever the element already carries, so
 * the canvas keeps its zoom while it glides in.
 */
export declare function previewTransition(el: HTMLElement, transition: TPageTransition): Animation[];
export {};
