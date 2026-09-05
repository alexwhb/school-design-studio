import './pageGrid.less';
type Props = {
    width: number;
    height: number;
    /** The editor's zoom, as a percentage. */
    zoom: number;
};
/**
 * The grid, drawn over the page in design pixels.
 *
 * It lives inside the page rather than over the workspace, so it is scaled by
 * the same transform as the artwork and needs no arithmetic of its own to
 * follow the zoom, a scroll or a resize. The squares are painted with a pair of
 * repeating gradients — one element rather than a few hundred — and the lines
 * are widened as you zoom out so that a grid line stays a hairline instead of
 * fading away at 25%.
 *
 * `data-export="off"` keeps it out of every rendered picture; see `capture` in
 * common/methods/export/renderPage.ts. The page strip's thumbnails and the
 * presenter draw the design themselves, from the store, and never see this at
 * all.
 *
 * The stand-ins are what Moveable lines things up against, for the reason the
 * ruler guides have their own: Moveable's snapping is measured in the
 * container's screen pixels, which is the wrong space for a page that is
 * CSS-scaled by the zoom, but an invisible box inside the page is measured like
 * any other object. See SnapGuides, which does the same thing for guides.
 */
export default function PageGrid({ width, height, zoom }: Props): import("react").JSX.Element | null;
export {};
