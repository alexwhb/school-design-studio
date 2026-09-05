/**
 * The animation presets an element can be given.
 *
 * A preset is stored as a list of stops rather than a CSS `@keyframes` block,
 * because every place that plays one — the picker tiles, the canvas preview and
 * the presenter — drives it through the Web Animations API. Keeping one
 * declarative source and no injected `<style>` tags means a preset cannot drift
 * between where it is previewed and where it is played, and it keeps generated
 * keyframe names out of the document entirely.
 *
 * Each stop is split at play time into two tracks (see `play.ts`): `transform`
 * is composited *onto* whatever transform the element already carries, so a
 * rotated element still animates correctly, while the remaining properties
 * replace theirs for the duration.
 */
export type AnimationStop = {
    /** 0-1 position in the animation. Omitted stops are spaced evenly. */
    offset?: number;
    transform?: string;
    opacity?: number;
    filter?: string;
    clipPath?: string;
};
export type AnimationGroup = 'Fade' | 'Move' | 'Scale' | 'Reveal' | 'Flourish';
export type AnimationPreset = {
    id: string;
    /** Shown in the picker and on the settings card. */
    name: string;
    /** One line describing the movement, in plain words. */
    hint: string;
    group: AnimationGroup;
    /** Milliseconds. The user can override this per element. */
    duration: number;
    easing: string;
    stops: AnimationStop[];
};
export declare const ANIMATION_PRESETS: AnimationPreset[];
/** The order groups appear in the picker. */
export declare const ANIMATION_GROUPS: AnimationGroup[];
export declare function getPreset(id?: string | null): AnimationPreset | null;
export declare function presetsInGroup(group: AnimationGroup): AnimationPreset[];
/**
 * What is stored on a widget.
 *
 * `start` describes how this element's entrance relates to the one before it in
 * the layer order, which is the same vocabulary PowerPoint and Keynote use:
 *
 *  - `after` — waits for the previous element to finish, giving a cascade
 *  - `with`  — begins at the same moment as the previous element
 *  - `click` — holds until the presenter advances, making it a separate build
 */
export type TWidgetAnimation = {
    preset: string;
    /** Milliseconds. Defaults to the preset's own duration when first chosen. */
    duration: number;
    /** Milliseconds to wait before this element starts. */
    delay: number;
    start: 'after' | 'with' | 'click';
};
export declare function defaultAnimationFor(preset: AnimationPreset): TWidgetAnimation;
