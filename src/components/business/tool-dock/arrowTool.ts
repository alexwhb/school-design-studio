/**
 * The Arrow tool, which is not a tool.
 *
 * An arrow is a line with a head on its end, and the line tool already draws
 * one: armed carrying the Arrows row's `Arrow` preset it lands exactly that.
 * So the dock's Arrow item arms the line tool with that preset rather than
 * adding a second way of drawing a straight line — the same armed state the
 * Graphics panel's Arrow tile sets, which is why clicking either lights both.
 *
 * The preset's name and the key that arms it live here because two places need
 * them — the dock's Shapes menu and the keyboard shortcuts — and a name that
 * no longer matches a preset arms a bare line without complaining.
 */
import { toggleLinePreset } from '@/store/control'
import { controlState } from '@/store/state'

/** The preset in `linePresets.ts` that puts a triangle on the far end. */
const ARROW_PRESET = 'Arrow'

/** Free, where XD has nothing: Ctrl+A is select-all and never reaches the letter cases. */
export const ARROW_SHORTCUT = 'A'

/** Arms the line tool carrying the arrow, or puts the pointer back if it already is. */
export function toggleArrowTool() {
  toggleLinePreset(ARROW_PRESET)
}

/** True while the arrow is what the next two points on the page will draw. */
export function isArrowArmed(tool = controlState.dDrawTool, preset = controlState.dLinePreset) {
  return tool === 'line' && preset === ARROW_PRESET
}
