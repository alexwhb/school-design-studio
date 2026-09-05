import './resizeDesign.less';
export type ResizeDesignHandle = {
    open: () => void;
};
/**
 * Resize an existing design.
 *
 * The reuse people ask for: the flyer that worked becomes a slide, or a display
 * board, without rebuilding it. Three decisions, in the order someone makes
 * them — how big, what happens to the artwork, and how much of the design it
 * applies to — with the outcome stated in words underneath rather than left to
 * be discovered after pressing the button.
 *
 * The choice of what happens to the artwork is not hardcoded here: it renders
 * whatever is in common/methods/resize/strategies.ts.
 */
declare const ResizeDesign: import("react").ForwardRefExoticComponent<import("react").RefAttributes<ResizeDesignHandle>>;
export default ResizeDesign;
