/**
 * How tall the drawer is when open, in CSS pixels. The strip and the zoom
 * control both stand on top of it. Mirrored as `@notes-drawer-height` in
 * tokens.less, for the rules that cannot be given a number from here.
 */
export declare const NOTES_DRAWER_HEIGHT = 156;
export declare const notesState: {
    open: boolean;
};
export declare function setNotesOpen(open: boolean): void;
export declare function toggleNotes(): void;
