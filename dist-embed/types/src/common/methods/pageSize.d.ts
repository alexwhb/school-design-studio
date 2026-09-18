export type TSizeUnit = 'px' | 'in' | 'mm' | 'cm';
export declare const SIZE_UNITS: TSizeUnit[];
/** A measurement in design pixels, shown in `unit` and rounded to suit it. */
export declare function fromPx(px: number, unit: TSizeUnit): number;
/** A measurement typed in `unit`, as the whole design pixels the store keeps. */
export declare function toPx(value: number, unit: TSizeUnit): number;
/**
 * What this page would print on: "A4 portrait", "Letter landscape". Null when
 * it is not a sheet of anything, which is most screen sizes.
 */
export declare function paperName(widthPx: number, heightPx: number): string | null;
/**
 * The same page as a measurement: "210 × 297 mm", "8.5 × 11 in". Given in the
 * units the paper is named in where it is used, and in millimetres for anything
 * that is not a sheet of paper at all.
 */
export declare function realSize(widthPx: number, heightPx: number): string;
