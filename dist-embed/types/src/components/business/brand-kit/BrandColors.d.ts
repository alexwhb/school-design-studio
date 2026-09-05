import './brandColors.less';
/**
 * The school's colours: one row each, and the card that edits one in place.
 *
 * A row is a button that paints whatever is selected, because that is what a
 * colour in a kit is mostly for. Editing is the deliberate act, behind the
 * pencil, and it happens where the row was rather than in a popover — the
 * strip of nearby colours and the "used on N layers" line are the reason to
 * change a colour at all, and neither survives being read through a hole.
 */
export default function BrandColors(): import("react").JSX.Element;
