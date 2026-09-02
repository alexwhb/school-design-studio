/**
 * The shape tools, and everything that differs between them.
 *
 * There is one entry per tool and one list, because a tool is described in
 * three places at once — the Tools panel names it, the line of instructions
 * under the canvas names what is being pulled out, and the drag itself has to
 * know what widget to make — and with three tools those had started to drift.
 * `DrawShape` and `ToolsListWrap` both read this and neither knows one shape
 * from another, so the next shape is an entry here plus its widget rather than
 * another branch through either of them.
 *
 * The tools split into two. A drag tool is pulled out of the page in one press
 * and comes out at whatever size it was pulled to; the pen is a point at a time
 * and is not finished until it is told it is, and it is drawn by its own
 * component. Everything the Tools panel shows is common to both and lives in
 * `drawTools`; what a drag needs to make a shape out of a rectangle is in
 * `dragTools`, which is what `DrawShape` reads and what makes "is this drag
 * mine?" a lookup rather than a list of names.
 *
 * The keys are `TControlState['dDrawTool']`, which is where the armed tool is
 * held, so the two cannot drift apart without the compiler noticing.
 */
import type { ComponentType } from 'react'
import { EllipseIcon, PenIcon, PolygonIcon, RectangleIcon } from '@/components/ui/icons'
import { wEllipseSetting } from '@/components/modules/widgets/wEllipse/wEllipseSetting'
import { wPolygonSetting } from '@/components/modules/widgets/wPolygon/wPolygonSetting'
import { wRectSetting } from '@/components/modules/widgets/wRect/wRectSetting'
import type { TDragTool, TDrawTool } from '@/store/types'

export type TDrawToolSpec = {
  /** What the Tools panel calls it, and what it says underneath. */
  label: string
  desc: string
  Icon: ComponentType<{ className?: string }>
  /** The shortcut, named as it is on the key. It arms and disarms the tool. */
  shortcut: string
}

export type TDragToolSpec = TDrawToolSpec & {
  /** Said under the canvas while the tool is armed: "Drag to draw ⟨noun⟩." */
  noun: string
  /** And then: "Shift keeps it ⟨equal⟩." */
  equal: string
  /**
   * Whether the rubber band is drawn round. An ellipse is pulled out of the
   * same box a rectangle is, and showing that box would show the wrong shape.
   */
  round: boolean
  /** The widget a drag turns into, copied rather than used. */
  setting: Record<string, any>
}

/** In the order Adobe XD has them, which is also the order of their shortcuts. */
export const drawToolOrder: TDrawTool[] = ['rect', 'ellipse', 'polygon', 'pen']

/** The tools a shape is pulled out of the page with, in one press. */
export const dragTools: Record<TDragTool, TDragToolSpec> = {
  rect: {
    label: 'Rectangle',
    desc: 'Drag out a box at any size, then round its corners',
    Icon: RectangleIcon,
    shortcut: 'R',
    noun: 'a box',
    equal: 'square',
    round: false,
    setting: wRectSetting,
  },
  ellipse: {
    label: 'Ellipse',
    desc: 'Drag out an oval at any size, or hold Shift for a circle',
    Icon: EllipseIcon,
    shortcut: 'E',
    noun: 'an ellipse',
    equal: 'circular',
    round: true,
    setting: wEllipseSetting,
  },
  polygon: {
    label: 'Polygon',
    desc: 'Drag out a triangle, then add corners up to a hundred',
    Icon: PolygonIcon,
    shortcut: 'Y',
    noun: 'a polygon',
    equal: 'regular',
    round: false,
    setting: wPolygonSetting,
  },
}

/** Every tool the panel lists, which is the drag tools and the pen. */
export const drawTools: Record<TDrawTool, TDrawToolSpec> = {
  ...dragTools,
  pen: {
    label: 'Pen',
    desc: 'Click a point at a time to draw a line, or close it into a shape',
    Icon: PenIcon,
    shortcut: 'P',
  },
}
