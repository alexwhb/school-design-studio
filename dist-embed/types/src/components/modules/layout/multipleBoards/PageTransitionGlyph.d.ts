import type { TPageState } from '../../../../store/types';
/**
 * A small mark on a page's thumbnail when the page has a transition, so a
 * deck can be read for them without opening each page. Named in the tooltip
 * because the glyph is the same for all of them; what matters at a glance is
 * that there is one.
 */
export default function PageTransitionGlyph({ page }: {
    page: TPageState;
}): import("react").JSX.Element | null;
