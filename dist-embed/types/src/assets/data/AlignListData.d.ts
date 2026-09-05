/**
 * Lining things up: three against the page's width, three against its height.
 *
 * The axis is carried here rather than worked out from the value, because the
 * panel draws the two as separate groups with a hairline between them — put
 * them in one run of six and "align right" and "align top" sit side by side
 * looking like a pair, which they are not.
 */
export type AlignListData = {
    key: string;
    icon: string;
    tip: string;
    value: string;
    axis: 'horizontal' | 'vertical';
};
declare const _default: AlignListData[];
export default _default;
