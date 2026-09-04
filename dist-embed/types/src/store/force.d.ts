export declare function setZoomScreenChange(): void;
export declare function setUpdateRect(): void;
export declare function setUpdateSelect(): void;
/**
 * Undo, redo and restoring an autosave swap dLayouts for a freshly parsed copy.
 * Every widget is then a new object holding the same values, which is exactly
 * the change valtio's snapshot comparison is built to ignore: the board would
 * go on rendering the old, now detached, objects and an undone rotation would
 * stay on screen. This says the list itself is new and has to be read again.
 */
export declare function setLayoutsChange(): void;
