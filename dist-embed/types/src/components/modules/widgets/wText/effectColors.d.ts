export type TEffectColor = {
    /** The six hex digits every part behind this swatch has in common. */
    rgb: string;
    /** The alpha the swatch opens on: the most solid use of the colour. */
    alpha: string;
    /** `#rrggbbaa`, for the swatch to show and the picker to open on. */
    value: string;
};
export default function effectColors(effects: unknown, textColor?: string): TEffectColor[];
