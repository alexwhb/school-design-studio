/** Free, where XD has nothing: Ctrl+A is select-all and never reaches the letter cases. */
export declare const ARROW_SHORTCUT = "A";
/** Arms the line tool carrying the arrow, or puts the pointer back if it already is. */
export declare function toggleArrowTool(): void;
/** True while the arrow is what the next two points on the page will draw. */
export declare function isArrowArmed(tool?: import("../../../store").TDrawTool | null, preset?: string | null): boolean;
