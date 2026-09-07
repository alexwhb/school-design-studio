/**
 * The shape tools, and everything that differs between them.
 *
 * There is one entry per tool and one list, because a tool is described in
 * three places at once — the dock names it, the line of instructions above the
 * dock names what is being pulled out, and the drag itself has to know what
 * widget to make — and with three tools those had started to drift. `DrawShape`
 * and `ToolDock` both read this and neither knows one shape from another, so
 * the next shape is an entry here plus its widget rather than another branch
 * through either of them.
 *
 * The tools split into two. A drag tool is pulled out of the page in one press
 * and comes out at whatever size it was pulled to; the pen is a point at a time
 * and is not finished until it is told it is, and it is drawn by its own
 * component. The line is a drag too, but it is pulled from one point to another
 * rather than out of a box, so it has a component of its own as well, and so
 * does the text tool, which is pulled out of a box like a shape but leaves a
 * box of words behind rather than a shape. Everything the dock shows is common
 * to all of them and lives in `drawTools`; what a drag needs to make a shape
 * out of a rectangle is in `dragTools`, which is what `DrawShape` reads and
 * what makes "is this drag mine?" a lookup rather than a list of names.
 *
 * The keys are `TControlState['dDrawTool']`, which is where the armed tool is
 * held, so the two cannot drift apart without the compiler noticing.
 */
import type { ComponentType } from 'react';
import type { TDragTool, TDrawTool } from '../../../store/types';
export type TDrawToolSpec = {
    /** What the dock calls it, on its button and in its tooltip. */
    label: string;
    Icon: ComponentType<{
        className?: string;
    }>;
    /** The shortcut, named as it is on the key. It arms and disarms the tool. */
    shortcut: string;
};
export type TDragToolSpec = TDrawToolSpec & {
    /** Said above the dock while the tool is armed: "Drag to draw ⟨noun⟩." */
    noun: string;
    /** And then: "Shift keeps it ⟨equal⟩." */
    equal: string;
    /**
     * What the rubber band draws while the shape is being pulled out. A box for
     * the rectangle, which is the box; `round` for the ellipse, which fills it;
     * and for a shape that is neither, the outline itself, handed back by the
     * same function the widget is painted with. Watching a square come out of a
     * drag that is going to land as a triangle is the confusion this settles, and
     * borrowing the widget's own geometry is what stops the band and the shape
     * from drifting into two different triangles.
     */
    band: 'box' | 'round' | ((width: number, height: number) => string);
    /** The widget a drag turns into, copied rather than used. */
    setting: Record<string, any>;
};
/** In the order Adobe XD has them, which is also the order of their shortcuts. */
export declare const drawToolOrder: TDrawTool[];
/** The tools a shape is pulled out of the page with, in one press. */
export declare const dragTools: Record<TDragTool, TDragToolSpec>;
/** Every tool the dock offers: the drag tools, the line, the pen and text. */
export declare const drawTools: Record<TDrawTool, TDrawToolSpec>;
/**
 * The line said above the dock while a tool is armed, in two halves: the one
 * sentence that matters, and the modifiers after it.
 *
 * A function rather than a field per tool, because the drag tools all say the
 * same sentence about the shape they are pulling out of the page and only the
 * noun changes; it was three copies of that sentence in three components
 * before the dock drew all of them.
 *
 * The line tool takes a second argument because it is the one tool that can be
 * armed carrying something — an Arrows preset, by name — and what it is about
 * to draw is an arrow rather than a line. See linePresets.ts.
 */
export declare function toolHint(tool: TDrawTool, preset?: string | null): {
    lead: string;
    rest: string;
};
