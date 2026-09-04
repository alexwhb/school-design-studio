import type { TControlState } from './types';
export declare function setdMoving(bool: boolean): void;
export declare function setDraging(drag: boolean): void;
export declare function setdResizeing(bool: boolean): void;
export declare function showRefLine(show: boolean): void;
export declare function setShowMoveable(show: boolean): void;
export declare function setShowRotatable(e: boolean): void;
export declare function updateAltDown(e: boolean): void;
export declare function stopDResize(): void;
export declare function stopDMove(): void;
export declare function setCropUuid(uuid: string): void;
/**
 * Turns a path's points on for editing, or hands it back to the selection box.
 *
 * The two cannot both be on screen. A path's points lie on its own bounds by
 * definition — that is what the bounds are — so the corner and edge points sit
 * exactly under the selection box's resize handles, and whichever was drawn
 * last would take every press meant for the other. Adobe XD answers this the
 * same way: double-clicking a path swaps the box for its points, and leaving
 * swaps them back.
 */
export declare function setPathEditUuid(uuid: string): void;
export declare function setSpaceDown(val: boolean): void;
export declare function setSnapEnabled(enabled: boolean): void;
export declare function toggleSnapEnabled(): void;
/**
 * The grid. Kept beside snapping because it is the same kind of thing — a way
 * the editor helps you place something, remembered between sessions and
 * belonging to the person rather than to the design, so it is never saved into
 * a file and never travels to whoever opens it next.
 */
export declare function setShowGrid(show: boolean): void;
export declare function toggleShowGrid(): void;
/**
 * Chooses how fine the grid is, and turns it on — asking for 25px squares and
 * getting no squares at all would be a strange answer to the question.
 */
export declare function setGridSize(size: number): void;
/**
 * Arms a shape tool, or puts the pointer back. Nothing else is allowed to be
 * mid-flight while a tool is armed: what the tool draws becomes the selection.
 *
 * The preset is the line tool's alone, and it is passed here rather than set on
 * its own so that it cannot outlive the arming — a tool armed from the dock,
 * which knows nothing of presets, says nothing about one and gets a bare line.
 */
export declare function setDrawTool(tool: TControlState['dDrawTool'], preset?: string | null): void;
export declare function toggleDrawTool(tool: NonNullable<TControlState['dDrawTool']>): void;
/**
 * Arms the line tool carrying one of the Arrows presets, or puts the pointer
 * back when that preset is already armed — the same press-again-to-put-it-down
 * the dock's own tools have.
 */
export declare function toggleLinePreset(name: string): void;
