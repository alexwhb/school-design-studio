/**
 * The text's colour, carried through its effect stack.
 *
 * A preset is drawn around one colour: the front face is that colour and the
 * glow, the cast shadow or the second copy behind it is the same colour again,
 * usually at a lower alpha. Change the text's colour on its own and only the
 * plain text underneath moves — the stack keeps painting the old colour over
 * the top, so the swatch looks like it does nothing at all.
 *
 * So every part of the stack that was the old colour follows the new one, and
 * a part that was some other colour — a white outline, a black drop shadow —
 * is left where it is. Alpha belongs to the part rather than to the colour: a
 * glow is the text colour at 40% and has to stay at 40% afterwards. A part
 * that matched the old colour exactly, alpha included, takes the new colour
 * whole instead, so picking a translucent colour still reaches the front face.
 *
 * The colours a preset brought with it that were never the text's own — the
 * second tone of a check, the middle band of a three-colour gradient — are
 * reached the same way, through the palette in effectColors.ts, which calls
 * the walk below directly.
 */
import { type TTextEffect } from './effectStyle';
export type TColorParts = {
    rgb: string;
    alpha: string;
};
/** `#rrggbb` or `#rrggbbaa` split into colour and alpha, or null if neither. */
export declare function parseColor(value?: string): TColorParts | null;
/** Every part of the stack painted `was` painted `now` instead. */
export declare function replaceEffectColor(effects: TTextEffect[], was: TColorParts, now: TColorParts): TTextEffect[];
export default function recolorEffects(effects: TTextEffect[], from?: string, to?: string): TTextEffect[];
