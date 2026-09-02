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
 * The keys are `TControlState['dDrawTool']`, which is where the armed tool is
 * held, so the two cannot drift apart without the compiler noticing.
 */
import type { ComponentType } from 'react'
import { EllipseIcon, PolygonIcon, RectangleIcon } from '@/components/ui/icons'
import { wEllipseSetting } from '@/components/modules/widgets/wEllipse/wEllipseSetting'
import { wPolygonSetting } from '@/components/modules/widgets/wPolygon/wPolygonSetting'
import { wRectSetting } from '@/components/modules/widgets/wRect/wRectSetting'
import type { TDrawTool } from '@/store/types'

export type TDrawToolSpec = {
  /** What the Tools panel calls it, and what it says underneath. */
  label: string
  desc: string
  Icon: ComponentType<{ className?: string }>
  /** The shortcut, named as it is on the key. It arms and disarms the tool. */
  shortcut: string
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
export const drawToolOrder: TDrawTool[] = ['rect', 'ellipse', 'polygon']

export const drawTools: Record<TDrawTool, TDrawToolSpec> = {
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
