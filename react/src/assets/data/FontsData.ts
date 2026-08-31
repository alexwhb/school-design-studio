/**
 * The fonts offered in the text panel.
 *
 * All files are bundled in public/fonts and declared in public/fonts/fonts.css,
 * so they are available offline and render identically in the editor and in
 * every export. See public/fonts/LICENSES.md for the licence of each family.
 */

export type TFontKind = 'sans' | 'serif' | 'display' | 'mono' | 'handwriting'

export type TFontItem = {
  id: number
  oid: number
  /** CSS font-family name, also what gets written into the design data */
  value: string
  /** Name shown in the picker */
  alias: string
  kind: TFontKind
  url: string
  preview: string
}

/** Group headings shown in the font picker, in the order they appear. */
export const FONT_GROUPS: Record<TFontKind, string> = {
  sans: 'Sans serif',
  serif: 'Serif',
  display: 'Display',
  mono: 'Monospace',
  handwriting: 'Handwriting',
}

/** The font a new text box starts with. */
export const DEFAULT_FONT = { id: 1, oid: 0, value: 'Inter', alias: 'Inter', url: '/fonts/inter-400-700.woff2' }

const fonts: TFontItem[] = [
  { id: 1, oid: 0, value: 'Inter', alias: 'Inter', kind: 'sans', url: '/fonts/inter-400-700.woff2', preview: '' },
  { id: 2, oid: 0, value: 'Roboto', alias: 'Roboto', kind: 'sans', url: '/fonts/roboto-400-700.woff2', preview: '' },
  { id: 3, oid: 0, value: 'Open Sans', alias: 'Open Sans', kind: 'sans', url: '/fonts/open-sans-400-700.woff2', preview: '' },
  { id: 4, oid: 0, value: 'Lato', alias: 'Lato', kind: 'sans', url: '/fonts/lato-400.woff2', preview: '' },
  { id: 5, oid: 0, value: 'Montserrat', alias: 'Montserrat', kind: 'sans', url: '/fonts/montserrat-400-700.woff2', preview: '' },
  { id: 6, oid: 0, value: 'Poppins', alias: 'Poppins', kind: 'sans', url: '/fonts/poppins-400.woff2', preview: '' },
  { id: 7, oid: 0, value: 'Nunito', alias: 'Nunito', kind: 'sans', url: '/fonts/nunito-400-700.woff2', preview: '' },
  { id: 8, oid: 0, value: 'Quicksand', alias: 'Quicksand', kind: 'sans', url: '/fonts/quicksand-400-700.woff2', preview: '' },
  { id: 9, oid: 0, value: 'Archivo', alias: 'Archivo', kind: 'sans', url: '/fonts/archivo-400-700.woff2', preview: '' },
  { id: 10, oid: 0, value: 'Oswald', alias: 'Oswald', kind: 'display', url: '/fonts/oswald-400-700.woff2', preview: '' },
  { id: 11, oid: 0, value: 'Anton', alias: 'Anton', kind: 'display', url: '/fonts/anton-400.woff2', preview: '' },
  { id: 12, oid: 0, value: 'Bebas Neue', alias: 'Bebas Neue', kind: 'display', url: '/fonts/bebas-neue-400.woff2', preview: '' },
  { id: 13, oid: 0, value: 'Fredoka', alias: 'Fredoka', kind: 'display', url: '/fonts/fredoka-400-700.woff2', preview: '' },
  { id: 14, oid: 0, value: 'Merriweather', alias: 'Merriweather', kind: 'serif', url: '/fonts/merriweather-400-700.woff2', preview: '' },
  { id: 15, oid: 0, value: 'Playfair Display', alias: 'Playfair Display', kind: 'serif', url: '/fonts/playfair-display-400-700.woff2', preview: '' },
  { id: 16, oid: 0, value: 'Lora', alias: 'Lora', kind: 'serif', url: '/fonts/lora-400-700.woff2', preview: '' },
  { id: 17, oid: 0, value: 'Libre Baskerville', alias: 'Libre Baskerville', kind: 'serif', url: '/fonts/libre-baskerville-400-700.woff2', preview: '' },
  { id: 18, oid: 0, value: 'Source Serif 4', alias: 'Source Serif', kind: 'serif', url: '/fonts/source-serif-4-400-700.woff2', preview: '' },
  { id: 19, oid: 0, value: 'Caveat', alias: 'Caveat', kind: 'handwriting', url: '/fonts/caveat-400-700.woff2', preview: '' },
  { id: 20, oid: 0, value: 'Pacifico', alias: 'Pacifico', kind: 'handwriting', url: '/fonts/pacifico-400.woff2', preview: '' },
  { id: 21, oid: 0, value: 'Space Grotesk', alias: 'Space Grotesk', kind: 'sans', url: '/fonts/space-grotesk-400-700.woff2', preview: '' },
  { id: 22, oid: 0, value: 'Karla', alias: 'Karla', kind: 'sans', url: '/fonts/karla-400-700.woff2', preview: '' },
  { id: 23, oid: 0, value: 'Spectral', alias: 'Spectral', kind: 'serif', url: '/fonts/spectral-400.woff2', preview: '' },
  { id: 24, oid: 0, value: 'DM Serif Display', alias: 'DM Serif Display', kind: 'serif', url: '/fonts/dm-serif-display-400.woff2', preview: '' },
  { id: 25, oid: 0, value: 'IBM Plex Mono', alias: 'IBM Plex Mono', kind: 'mono', url: '/fonts/ibm-plex-mono-400.woff2', preview: '' },
  { id: 26, oid: 0, value: 'JetBrains Mono', alias: 'JetBrains Mono', kind: 'mono', url: '/fonts/jetbrains-mono-400-700.woff2', preview: '' },
]

export default fonts
