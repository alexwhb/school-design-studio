export declare function copyWidget(): void;
export declare function pasteWidget(): void;
/**
 * Puts a copy of the selection on the canvas straight away, without going
 * through the copy buffer — a duplicate should not cost you whatever you had
 * copied earlier.
 *
 * Grouped elements point at their container by id, so a group and its children
 * are renumbered together and the child links rewritten to match, the same rule
 * `duplicatePage` follows. Children keep page-absolute coordinates, so every
 * copy is offset by the same 30px and the group arrives intact.
 */
export declare function duplicateOne(): void;
