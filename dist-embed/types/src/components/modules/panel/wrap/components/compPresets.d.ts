/**
 * The ready-made pieces: a text preset with an effect on it, or a small group
 * of widgets like a ribbon banner.
 *
 * Both are the same record in the library and both are placed the same way —
 * the thumbnail is a cover image, the real thing is a saved widget tree fetched
 * on demand — so the fetching, the drag and the placement live here and the
 * Text and Graphics panels only decide how to draw them.
 */
import { type MouseEvent as ReactMouseEvent } from 'react';
import type { TGetCompListResult } from '../../../../../api/home';
export type TCompItemProps = {
    draggable: false;
    onMouseDown: (e: ReactMouseEvent<HTMLElement>) => void;
    onMouseMove: (e: ReactMouseEvent<HTMLElement>) => void;
    onMouseUp: (e: ReactMouseEvent<HTMLElement>) => void;
    onClick: (e: ReactMouseEvent<HTMLElement>) => void;
    onDragStart: (e: ReactMouseEvent<HTMLElement>) => void;
};
export default function useCompPresets(cate: 'text' | 'comp'): {
    list: TGetCompListResult[];
    itemProps: (item: TGetCompListResult) => TCompItemProps;
};
