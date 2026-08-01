# Self-hosted fonts

These `.woff2` files are vendored so datagoblin.ca serves its own type and makes
no third-party font requests. No reader's IP address reaches a font CDN, which
is the least a book about data sovereignty can do.

Regenerate with `node scripts/fetch-fonts.cjs` from `site/app`. Do not hand-edit
`fonts.css` or `atkinson.css` — the script writes them.

## Faces and licences

Every family here is under the **SIL Open Font License 1.1**, which permits
redistribution and web embedding provided the licence travels with the files and
the fonts are not sold on their own. Both conditions are met by shipping this
notice alongside them.

| Family | Used for | Copyright |
|---|---|---|
| Playfair Display | display headings, logo | Claus Eggers Sørensen |
| Source Serif 4 | body / reading type | Adobe |
| JetBrains Mono | mono, folios, labels | JetBrains |
| Inter | UI chrome | The Inter Project Authors |
| Caveat | handwritten accents | Impallari Type |
| Atkinson Hyperlegible | dyslexia-friendly mode | Braille Institute of America |

Full licence text for each: <https://openfontlicense.org/> and the family's page
on Google Fonts, from which these files were fetched.

## What is loaded when

Only `fonts.css` is linked from `index.html`. `atkinson.css` is injected at
runtime the first time a reader turns on the dyslexia-friendly mode — it is
~99 kB that most readers never need.

Files are split by unicode range. `latin` covers ordinary English and French
text; `latin-ext` is fetched only when a page actually renders a character in
that range. **`latin-ext` is not optional here**: the manuscript uses `œ` plus
the macron and caron letters in Indigenous-language words (`ā`, `ȟ`, `ē`, `ū`).

Inter is upright-only on purpose. Its italic is ~221 kB and nothing uses it —
italics in this app are Playfair, Source Serif, or Caveat.
