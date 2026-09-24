import { type Patch } from 'immer';
/**
 * The step from one state of the design to another, as a pair of immer patch
 * lists: the first takes `before` to `after`, the second takes it back.
 *
 * Both arguments are plain JSON, and `before` is used up — it is the draft the
 * forward patches are recorded against.
 */
export default function diffLayouts(before: unknown, after: unknown): {
    patches: Patch[];
    inversePatches: Patch[];
};
