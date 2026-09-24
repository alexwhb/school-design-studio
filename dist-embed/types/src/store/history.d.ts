export declare function changeHistory({ patches, inversePatches }: {
    patches: any;
    inversePatches: any;
}): void;
/**
 * Forgets every step.
 *
 * The stack is a list of patches, and a patch is only meaningful against the
 * document it was taken from — undoing one of them onto a different design
 * either writes one design's changes into another or throws halfway. So the
 * stack goes whenever the design underneath it is replaced wholesale, and when
 * the editor that built it goes away: the store is a module, and outlives any
 * one mount of the editor.
 */
export declare function clearHistory(): void;
/**
 * One step back or forward, or nothing at all.
 *
 * The new layouts are worked out on a plain copy before the store is touched,
 * and the pointer moves only once they are on the canvas. A step that cannot be
 * applied — a patch naming a page that is no longer there — used to throw
 * between the two, which left the design swapped and the pointer where it was,
 * so the next Ctrl+Z tried the same patch again and undo was dead from then on.
 * A step like that means the stack no longer describes the design, so it is
 * dropped whole rather than retried.
 */
export declare function handleHistory(action: 'undo' | 'redo'): void;
export declare function pushColorToHistory(color: string): void;
