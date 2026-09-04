import type { TdWidgetData } from '../types';
/**
 * Locking, the way Canva does it.
 *
 * A locked layer can still be selected — that is how you see it is locked, and
 * how you unlock it — but it stays exactly as it is: it will not move, resize,
 * turn, nudge, delete, group or change its place in the stack. Each of those,
 * asked of a locked layer, is refused with a short notice rather than ignored,
 * so a key that does nothing is never a mystery.
 */
export declare function setLayerLock({ uuid, lock }: {
    uuid: string;
    lock: boolean;
}): void;
export declare function toggleLayerLock(uuid: string): void;
/** The locked ones among these — a group counts as locked when it is. */
export declare function lockedAmong(widgets: readonly (TdWidgetData | null | undefined)[]): TdWidgetData[];
/**
 * True, and a notice shown, when any of these layers is locked. `verb` is what
 * was about to be done to them: "moved", "deleted".
 */
export declare function refuseLocked(widgets: readonly (TdWidgetData | null | undefined)[], verb: string): boolean;
/** What an action on the current selection would touch: the selection, or the active layer. */
export declare function selectionWidgets(): TdWidgetData[];
