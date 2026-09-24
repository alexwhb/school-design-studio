/**
 * Starting sizes offered when someone creates a new design.
 *
 * Print sizes are given in pixels at 150 DPI, which prints cleanly on a normal
 * school copier without making the files enormous — and which is the same
 * convention the PDF is written at, so a page picked here comes out of the
 * exporter as the sheet it is named after. A4 is 210 × 297mm at 150 DPI, which
 * is 1240 × 1754 to the nearest pixel. Screen sizes use their native pixel
 * dimensions.
 */
declare const _default: {
    name: string;
    width: number;
    height: number;
    icon: string;
}[];
export default _default;
