/**
 * Writes motion into a .pptx after pptxgenjs has finished with it.
 *
 * pptxgenjs has no API for either half of this — it never emits a
 * `<p:transition>` element and never emits a `<p:timing>` tree, and exposes no
 * hook to add one. So the deck is built normally, and this module reopens the
 * finished file and edits the slide XML directly.
 *
 * That sounds worse than it is. Both elements are leaves of `CT_Slide` that sit
 * after `</p:clrMapOvr>`, so adding them is an append rather than a rewrite,
 * and everything pptxgenjs produced is left exactly as it was.
 *
 * WHY THIS EXISTS AT ALL: a deck exported from here is usually opened in Google
 * Slides rather than PowerPoint — the planner uploads it to Drive asking for a
 * `application/vnd.google-apps.presentation` conversion. Drive's importer reads
 * both of these elements faithfully, so a transition set in the editor arrives
 * as a real Slides transition the school can then edit. Verified end to end
 * before any of this was written: a hand-injected file was converted, opened,
 * and the effects were there in the Motion panel.
 *
 * WHAT IS DELIBERATELY NOT HERE: per-paragraph builds, where the bullets of one
 * text box appear one at a time. The XML for it works — the same experiment
 * proved it — but the editor has no way to *author* one (an animation is held
 * on a widget, not on a line of it) and the presenter has no way to play one.
 * Writing it would put a beat in the school's Google copy that neither the
 * editor nor the presenter agrees with, which is the drift this codebase keeps
 * out of its export paths. It needs an authoring model first.
 */
import { type AnimatableWidget } from '../../animations/play';
import { type TPageTransition } from '../../animations/transitions';
/** What one slide should be given. */
export type SlideMotion = {
    /** The page's own transition, or null. */
    transition: TPageTransition | null;
    /**
     * The widgets that were actually placed on this slide, in the order they were
     * placed, each with the `objectName` the exporter gave it. A widget the
     * exporter skipped must not appear: its shape is not in the file, and an
     * effect pointed at a missing shape is what makes PowerPoint offer to repair
     * the deck.
     */
    builds: MotionTarget[];
};
export type MotionTarget = AnimatableWidget & {
    /** The `objectName` passed to pptxgenjs, which lands in the shape's `name`. */
    objectName: string;
};
/** Prefix for every `objectName` this exporter sets, so a shape can be found again. */
export declare const MOTION_NAME_PREFIX = "ds:";
export declare function motionName(uuid: string): string;
export declare function transitionXml(transition: TPageTransition): string;
/**
 * The whole `<p:timing>` tree for one slide.
 *
 * The shape is PowerPoint's own and is not worth deviating from: a root node
 * holding one `mainSeq`, holding one group per advance. A group that waits for
 * the presenter starts on `indefinite`; the first group starts on `0`, because
 * in the editor's model step 0 plays the moment the slide opens.
 *
 * Returns '' when nothing on the slide is animated, so a slide with only a
 * transition gets no timing tree at all rather than an empty one.
 */
export declare function timingXml(targets: MotionTarget[], spids: Map<string, number>): string;
/**
 * Renumbers every shape on the slide and reports where each one ended up.
 *
 * This is not tidying. pptxgenjs counts pictures, shapes and tables on separate
 * counters and writes the result into one slide, so a deck with a text box and
 * a table on the same page ships two shapes both claiming `id="2"`. That is
 * invalid OOXML on its own — PowerPoint offers to repair such a file — and it
 * makes `<p:spTgt spid="2">` ambiguous, which is exactly what an entrance is.
 *
 * So ids are reassigned in document order before anything points at one. The
 * first `<p:cNvPr>` in a slide belongs to the shape tree itself and keeps id 1;
 * real shapes start at 2.
 */
export declare function renumberShapes(xml: string): {
    xml: string;
    spids: Map<string, number>;
};
/**
 * Puts a slide's motion into its XML.
 *
 * Order matters: `CT_Slide` wants `cSld`, `clrMapOvr`, `transition`, `timing`,
 * so both go in immediately before `</p:sld>`, which is where pptxgenjs leaves
 * off. A slide with neither comes back untouched — including its original shape
 * ids, so a deck with no motion is byte-for-byte what it was before.
 */
export declare function applySlideMotion(xml: string, motion: SlideMotion): string;
/**
 * Reopens a finished .pptx and writes the motion for every slide into it.
 *
 * JSZip is imported here rather than at the top of the file so a deck with no
 * motion in it never pays for the library. pptxgenjs already carries a copy for
 * its own writing but does not re-export it, so this is the same code twice in
 * the bundle — which is why it is worth keeping behind a dynamic import and out
 * of the main chunk.
 *
 * Anything that goes wrong here gives back the original deck. A file that opens
 * without its transitions beats no file at all, and the caller has no better
 * answer to offer than the deck it already had.
 */
export declare function applyPptxMotion(blob: Blob, motion: SlideMotion[]): Promise<Blob>;
