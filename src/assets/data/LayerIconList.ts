/**
 * The Arrange row every element's settings panel carries: where the layer sits
 * in the stack, one step at a time or all the way, and whether it is locked.
 *
 * Rendered by ArrangeRow, which is also where each button's action lives — the
 * list is only what the row is made of.
 */
import type { TIconItemSelectData } from '@/components/modules/settings/IconItemSelect'
import { BringToFrontIcon, SendToBackIcon } from '@/components/ui/icons'

export default [
  {
    key: 'zIndex',
    icon: 'icon-layer-up',
    tip: 'Bring forward',
    value: 1,
  },
  {
    key: 'zOrder',
    Icon: BringToFrontIcon,
    tip: 'Bring to front',
    value: 'front',
  },
  {
    key: 'zIndex',
    icon: 'icon-layer-down',
    tip: 'Send backward',
    value: -1,
  },
  {
    key: 'zOrder',
    Icon: SendToBackIcon,
    tip: 'Send to back',
    value: 'back',
  },
  // Tip, glyph and state are filled in by ArrangeRow from the layer itself
  {
    key: 'lock',
    icon: 'sd-jiesuo',
    extraIcon: true,
    tip: 'Lock',
    value: 'toggle',
  },
] as TIconItemSelectData[]
