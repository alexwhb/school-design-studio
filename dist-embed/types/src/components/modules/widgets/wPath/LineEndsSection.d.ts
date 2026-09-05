import type { TdWidgetData } from '../../../../store/types';
import { type TLineEnd } from './lineEnds';
import './lineEndsSection.less';
type TEndsChange = {
    closed?: boolean;
    lineStart?: TLineEnd | null;
    lineEnd?: TLineEnd | null;
};
/**
 * Changes what is on a path's ends, or whether it has any, and refits its
 * frame round the result.
 *
 * Closing a path takes its heads off and opening it puts them back, so the
 * panel's Closed switch comes through here too: either way the padding the
 * frame keeps for the heads changes, and the frame has to change with it or
 * the line moves inside it.
 */
export declare function applyLineEnds(active: TdWidgetData, change: TEndsChange): void;
export default function LineEnds({ active }: {
    active: TdWidgetData;
}): import("react").JSX.Element;
export {};
