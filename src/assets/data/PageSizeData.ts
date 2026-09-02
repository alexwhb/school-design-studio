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
export default [
  {
    name: 'Slide (16:9)',
    width: 1920,
    height: 1080,
    icon: 'sd-wangye',
  },
  {
    name: 'Letter — portrait',
    width: 1275,
    height: 1650,
    icon: 'sd-wangye',
  },
  {
    name: 'Letter — landscape',
    width: 1650,
    height: 1275,
    icon: 'sd-wangye',
  },
  {
    name: 'Legal — portrait',
    width: 1275,
    height: 2100,
    icon: 'sd-wangye',
  },
  {
    name: 'A4 — portrait',
    width: 1240,
    height: 1754,
    icon: 'sd-wangye',
  },
  {
    name: 'A4 — landscape',
    width: 1754,
    height: 1240,
    icon: 'sd-wangye',
  },
  {
    name: 'A3 — portrait',
    width: 1754,
    height: 2480,
    icon: 'sd-wangye',
  },
  {
    name: 'A3 — landscape',
    width: 2480,
    height: 1754,
    icon: 'sd-wangye',
  },
  {
    name: 'A5 — portrait',
    width: 874,
    height: 1240,
    icon: 'sd-wangye',
  },
  {
    name: 'Poster (11 × 17)',
    width: 1650,
    height: 2550,
    icon: 'sd-wangye',
  },
  {
    name: 'Half-page flyer',
    width: 1275,
    height: 825,
    icon: 'sd-wangye',
  },
  {
    name: 'Square post',
    width: 1080,
    height: 1080,
    icon: 'sd-shouji',
  },
  {
    name: 'Story / display board',
    width: 1080,
    height: 1920,
    icon: 'sd-shouji',
  },
  {
    name: 'Web banner',
    width: 1200,
    height: 400,
    icon: 'sd-wangye',
  },
  {
    name: 'Name badge',
    width: 1050,
    height: 600,
    icon: 'sd-wangye',
  },
]
