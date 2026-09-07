# Bundled fonts

Each `.woff2` file here is the Latin subset of an open-licence family from
Google Fonts. All of them permit bundling and redistribution with an
application, including commercial use, provided the licence notice travels with
the files — which is what this file is for.

Where a family is a variable font, one file covers the whole 400–700 weight
range and `fonts.css` declares it with a weight range so bold interpolates
properly instead of being faked by the browser.

| Family                | Licence                   |
| --------------------- | ------------------------- |
| Inter                 | SIL Open Font License 1.1 |
| Roboto                | Apache License 2.0        |
| Open Sans             | SIL Open Font License 1.1 |
| Lato                  | SIL Open Font License 1.1 |
| Montserrat            | SIL Open Font License 1.1 |
| Poppins               | SIL Open Font License 1.1 |
| Nunito                | SIL Open Font License 1.1 |
| Quicksand             | SIL Open Font License 1.1 |
| Archivo               | SIL Open Font License 1.1 |
| Oswald                | SIL Open Font License 1.1 |
| Anton                 | SIL Open Font License 1.1 |
| Bebas Neue            | SIL Open Font License 1.1 |
| Fredoka               | SIL Open Font License 1.1 |
| Merriweather          | SIL Open Font License 1.1 |
| Playfair Display      | SIL Open Font License 1.1 |
| Lora                  | SIL Open Font License 1.1 |
| Libre Baskerville     | SIL Open Font License 1.1 |
| Source Serif 4        | SIL Open Font License 1.1 |
| Caveat                | SIL Open Font License 1.1 |
| Pacifico              | SIL Open Font License 1.1 |
| Space Grotesk         | SIL Open Font License 1.1 |
| Karla                 | SIL Open Font License 1.1 |
| Spectral              | SIL Open Font License 1.1 |
| DM Serif Display      | SIL Open Font License 1.1 |
| IBM Plex Mono         | SIL Open Font License 1.1 |
| JetBrains Mono        | SIL Open Font License 1.1 |
| Raleway               | SIL Open Font License 1.1 |
| Lexend                | SIL Open Font License 1.1 |
| Atkinson Hyperlegible | SIL Open Font License 1.1 |
| Archivo Narrow        | SIL Open Font License 1.1 |
| Barlow Condensed      | SIL Open Font License 1.1 |
| Roboto Slab           | Apache License 2.0        |
| EB Garamond           | SIL Open Font License 1.1 |
| Alfa Slab One         | SIL Open Font License 1.1 |
| Lilita One            | SIL Open Font License 1.1 |
| Abril Fatface         | SIL Open Font License 1.1 |
| Patrick Hand          | SIL Open Font License 1.1 |
| Permanent Marker      | Apache License 2.0        |

Full licence texts: <https://openfontlicense.org> and
<https://www.apache.org/licenses/LICENSE-2.0>.

To add a family, append it to the list in `tools/fetch-fonts.mjs` and re-run
it. It downloads the files it does not already have, rewrites `fonts.css`, and
writes `tools/font-list.json`, which is what `src/assets/data/FontsData.ts` is
kept in step with.

Append only. A brand kit stores a font by its id and a saved design stores it by
file path, so reordering the list or dropping a family changes what somebody's
heading font resolves to a year after they picked it. Existing files are left
alone on a re-run for the same reason.
