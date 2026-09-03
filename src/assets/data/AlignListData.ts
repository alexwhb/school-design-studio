/**
 * Lining things up: three against the page's width, three against its height.
 *
 * The axis is carried here rather than worked out from the value, because the
 * panel draws the two as separate groups with a hairline between them — put
 * them in one run of six and "align right" and "align top" sit side by side
 * looking like a pair, which they are not.
 */
export type AlignListData = {
  key: string
  icon: string
  tip: string
  value: string
  axis: 'horizontal' | 'vertical'
}

export default [
  {
    key: 'align',
    icon: 'icon-align-left',
    tip: 'Align left',
    value: 'left',
    axis: 'horizontal',
  },
  {
    key: 'align',
    icon: 'icon-align-center-horiz',
    tip: 'Align centre',
    value: 'ch',
    axis: 'horizontal',
  },
  {
    key: 'align',
    icon: 'icon-align-right',
    tip: 'Align right',
    value: 'right',
    axis: 'horizontal',
  },
  {
    key: 'align',
    icon: 'icon-align-top',
    tip: 'Align top',
    value: 'top',
    axis: 'vertical',
  },
  {
    key: 'align',
    icon: 'icon-align-center-verti',
    tip: 'Align middle',
    value: 'cv',
    axis: 'vertical',
  },
  {
    key: 'align',
    icon: 'icon-align-bottom',
    tip: 'Align bottom',
    value: 'bottom',
    axis: 'vertical',
  },
] as AlignListData[]
