# Bundled fonts

Each `.woff2` file here is the Latin subset of an open-licence family from
Google Fonts. All of them permit bundling and redistribution with an
application, including commercial use, provided the licence notice travels with
the files — which is what this file is for.

Where a family is a variable font, one file covers the whole 400–700 weight
range and `fonts.css` declares it with a weight range so bold interpolates
properly instead of being faked by the browser.

| Family | Licence |
| --- | --- |
| Inter | SIL Open Font License 1.1 |
| Roboto | Apache License 2.0 |
| Open Sans | SIL Open Font License 1.1 |
| Lato | SIL Open Font License 1.1 |
| Montserrat | SIL Open Font License 1.1 |
| Poppins | SIL Open Font License 1.1 |
| Nunito | SIL Open Font License 1.1 |
| Quicksand | SIL Open Font License 1.1 |
| Archivo | SIL Open Font License 1.1 |
| Oswald | SIL Open Font License 1.1 |
| Anton | SIL Open Font License 1.1 |
| Bebas Neue | SIL Open Font License 1.1 |
| Fredoka | SIL Open Font License 1.1 |
| Merriweather | SIL Open Font License 1.1 |
| Playfair Display | SIL Open Font License 1.1 |
| Lora | SIL Open Font License 1.1 |
| Libre Baskerville | SIL Open Font License 1.1 |
| Source Serif 4 | SIL Open Font License 1.1 |
| Caveat | SIL Open Font License 1.1 |
| Pacifico | SIL Open Font License 1.1 |

Full licence texts: <https://openfontlicense.org> and
<https://www.apache.org/licenses/LICENSE-2.0>.

To change the set, edit the family list in `experimental/tools/fetch-fonts.mjs`
and re-run it. It rewrites the `.woff2` files, `fonts.css`, and the list that
`src/assets/data/FontsData.ts` is generated from.
