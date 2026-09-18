import './snapGuides.less';
/**
 * Stand-ins for the ruler guides, laid out in page coordinates.
 *
 * The visible red line is drawn by @scena/guides, over the top of everything in
 * the editor's own coordinate space. Moveable cannot snap to that: it works
 * from elements it can measure. So for every guide there is an invisible,
 * zero-thickness box here, inside the page, and Moveable is handed those — which
 * also means the maths survives zooming, scrolling and resizing for free.
 */
export default function SnapGuides(): import("react").JSX.Element | null;
