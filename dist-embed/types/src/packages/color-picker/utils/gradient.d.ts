export type GradientType = 'linear' | 'radial';
export type GradientStop = {
    color: string;
    offset: number;
};
export type ParsedGradient = {
    type: GradientType;
    /** Degrees, CSS convention: 0 points up, and it turns clockwise. Ignored by a radial. */
    angle: number;
    stops: GradientStop[];
};
export declare const isGradient: (value: string) => boolean;
export declare function toGradientString(type: GradientType, angle: number, stops: GradientStop[]): string;
/**
 * Reads a CSS gradient back into the angle and stops the picker edits.
 * Returns null for anything that is not a gradient, such as a flat colour.
 */
export declare function parseGradient(value: string): ParsedGradient | null;
