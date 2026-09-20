# Polish Engine project deck

Password-protected deck served at `powerbee.tech/polishengine-deck`. `index.html`
is generated and contains only AES-256-GCM ciphertext; the key is derived from
the password in the browser with PBKDF2-SHA256 (310 000 iterations). Nothing
readable ships in this repository.

## Build

The plaintext source lives in `content/deck.html`, which is gitignored and must
never be committed. After editing it, regenerate the published page:

```sh
node polishengine-deck/build.mjs "<password>"
```

That rewrites `polishengine-deck/index.html`. Commit and push it; Vercel serves
this directory at `/polishengine-deck`, so it goes live on the next push to
`main`, and a branch push gets a preview deployment first. Changing the password
is the same command with a new value.

This is the third encrypted page in the repository: `build.mjs` at the root
builds the document served at `/`, `deck/build.mjs` builds the PowerBee investor
deck at `/deck`, and this one builds the Polish Engine project deck at
`/polishengine-deck`. They share nothing but the scheme, and each has its own
password.

## Editing from a machine that has no source

`polishengine-deck/index.html` is the only copy of the deck in the repository, so
recover an editable source from it:

```sh
node polishengine-deck/unbuild.mjs "<password>"   # writes content/deck.html
# edit content/deck.html
node polishengine-deck/build.mjs "<password>"     # rewrites index.html
```

That round trip is what makes it possible to iterate from a fresh clone, a cloud
agent or a phone with nothing but the password.

## Bilingual content

The deck ships English and Polish in the same document and switches with the
EN / PL control in the top bar. English is the default; the choice is remembered
in `localStorage` and can be forced with `?lang=pl`.

Short strings are wrapped in `<t-en>` / `<t-pl>` elements, whole paragraphs in
`<p class="b-en">` / `<p class="b-pl">` siblings. A pair of CSS rules keyed off
`html[data-lang]` hides one language, so the default language renders correctly
before any script runs. When you add copy, always add both languages — the build
does not check for you, but `<t-en>` and `<t-pl>` counts should stay equal.

## Relationship to the source presentation

The deck is a restyled, translated web version of `Polski Silnik deck.pdf`
(16 slides, kept in Google Drive). The Polish wording is transcribed verbatim and
the English is a faithful translation of it. The slide order and the reading
logic of each slide are preserved, including the diagrams: the concentric rings
on slide 3 (AKS inside PS inside PSG), the two intersecting circles on slide 5
(classic combustion engine and Wankel, meeting at PS), the milestone timeline on
slide 12 and the benefit triangle on slide 15 are redrawn in CSS and inline SVG
rather than reproduced as images.

Two deliberate departures from the PDF, and one thing left as it stands:

- The source's `AktywnaKomora Spalania` (slide 7) and `Whatsup` (slide 16) are
  set as `Aktywna Komora Spalania` and `WhatsApp`.
- The photographs on the cover and the closing slide are replaced by light trails
  drawn in SVG, in the site's own identity. No raster art from the PDF is used.
- Slides 7 to 10 still carry the PDF's own `Lorem ipsum dolor sit amet.`
  placeholders in four of the five profile rows. They are kept, not invented
  around, and are styled as visibly unfinished fields so that nobody mistakes
  them for copy. They need real text before the deck goes to investors.

Anything else that looks like a transcription error probably is one — report it
rather than working around it.

## Notes

- Requires Node 18+ (uses the built-in Web Crypto API). No dependencies.
- The ciphertext is public, so an attacker can brute-force offline. Use a
  high-entropy password and share it out of band, never in this repository or in
  commit messages.
- Decryption needs a secure context: `https://` or `localhost`. Opening the file
  over `file://` will not work.
- While iterating, open `content/deck.html` directly instead of rebuilding — it
  is the same markup, unencrypted.
- `assets/` is served unencrypted, so it holds only the favicon and the link
  preview card. Anything confidential belongs inside `content/deck.html`.
- `og.png` is a screenshot of `og-template.html` at exactly 1200x630.
