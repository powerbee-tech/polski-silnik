# Polish Engine project deck

Password-protected deck served at `powerbee.tech/polishengine`. `index.html`
is generated and contains only AES-256-GCM ciphertext; the key is derived from
the password in the browser with PBKDF2-SHA256 (310 000 iterations). Nothing
readable ships in this repository.

## Build

The plaintext source lives in `content/deck.html`, which is gitignored and must
never be committed. After editing it, regenerate the published page:

```sh
node polishengine/build.mjs "<password>"
```

That rewrites `polishengine/index.html`. Commit and push it; Vercel serves
this directory at `/polishengine`, so it goes live on the next push to
`main`, and a branch push gets a preview deployment first. Changing the password
is the same command with a new value.

This is the third encrypted page in the repository: `build.mjs` at the root
builds the document served at `/`, `deck/build.mjs` builds the PowerBee investor
deck at `/deck`, and this one builds the Polish Engine project deck at
`/polishengine`. They share nothing but the scheme, and each has its own
password.

## Editing from a machine that has no source

`polishengine/index.html` is the only copy of the deck in the repository, so
recover an editable source from it:

```sh
node polishengine/unbuild.mjs "<password>"   # writes content/deck.html
# edit content/deck.html
node polishengine/build.mjs "<password>"     # rewrites index.html
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
the English is a faithful translation of it, written as an English business deck
rather than word for word: calques of Polish constructions are avoided, and a few
terms are rendered by their English terms of art instead of literally — `punkt
wyjścia` as "starting point", `część spalinowa` as "combustion unit", `węzły
konstrukcyjne` as "design sub-assemblies", `nadzór autorski` as "design
supervision", `warsztaty` as "repair shops", `koncerny` as "the major
manufacturers", `sprawność użytkowa` as "effective efficiency", and `maszyny
matematyczne` as "mathematical machines (computers)". The slide order and the
reading logic of each slide are preserved, including the diagrams: the concentric rings
on slide 3 (AKS inside PS inside PSG), the two intersecting circles on slide 5
(classic combustion engine and Wankel, meeting at PS), the milestone timeline on
slide 12 and the benefit triangle on slide 15 are redrawn in CSS and inline SVG
rather than reproduced as images.

Deliberate departures from the PDF:

- The source's `AktywnaKomora Spalania` (slide 7) and `Whatsup` (slide 16) are
  set as `Aktywna Komora Spalania` and `WhatsApp`.
- The photographs on the cover and the closing slide are replaced by light trails
  drawn in SVG, in the site's own identity. No raster art from the PDF is used.
- The PDF credits its diagrams on slides 3, 5 and 15 to `ABV`. That company does
  not exist; the footnotes now read `PowerBee P.S.A.`, the special-purpose company
  that commercialises the technology for generator applications up to 1 kW.
- Slide 13 said the PS patent application was "in preparation". The applications
  are filed, so the row now carries the filing dates and the PCT reach. The
  original goal of protection in at least 80% of world markets is kept.
- Slide 3 and slide 8 name the machine as it is named in the patents, Rotating
  Cylindrical Piston Machine (RCPM), alongside the project name. Slide 3 also
  carries a roles strip — owner, scientific supervision, commercialisation —
  which the PDF does not have.
- The profile rows on slides 7 to 10 held the PDF's own `Lorem ipsum` text in
  19 cells. Sixteen are now filled from the sources listed below. The three
  remaining development-time-frame rows, for PS, PSG and PSE, read `In
  preparation` and keep the unfinished-field styling.
- The closing line on slide 16 is English in both languages, and its articles are
  restored: `turn the unknown into the obvious`, not `turn unknown into obvious`.

Anything else that looks like a transcription error probably is one — report it
rather than working around it.

## Sources behind the filled profile rows

The PDF alone does not carry this material. It comes from:

- `content/page.html` at the root of this repository, the project's own general
  information document — ownership, scientific supervision, commercialisation,
  patent dates, the EU emission path to about 62 g CO₂/km in 2030, and the note
  on the range extenders the large manufacturers offer.
- Sroka Z. J., Sadlak Z., *Thermal activation of the combustion chamber of a
  reciprocating internal combustion engine*, ICCHMT 2018, Cracow — the peer-reviewed
  calculations for the BMW 2.0 diesel and the Audi 2.5 TFSI, and PCT/PL2017/000011.
- `Auto Świat Ekstra` 1/05 2025, the press article on the active chamber.
- `założenia-badania weryfik.2015.04.12a.docx`, the verification test assumptions —
  the 9, 13 and 19 week programme variants. Its cost figures are deliberately left
  out, in line with the withheld figures in the deck at `/deck`.
- Mazda press material on the 8C rotary engine in the MX-30 e-Skyactiv R-EV, for
  the competitive comparison on slide 9.
- WIPO, for the number of PCT Contracting States: 159 since the Bahamas acceded
  on 19 August 2026, which is the count a PCT application filed 20.08.2026 reaches.

Two things to settle with the source owners rather than in this repository. The
AKS CO₂ figure is 46 g/km in the deck PDF and 40 g/km in the root document; the
deck uses 46. And the 12-month priority window from 21.07.2025 closed on
21.07.2026, while the PCT is dated 20.08.2026 — inside the two-month restoration
window of PCT Rule 26bis.3, but only if restoration was requested and allowed.
The wording therefore states filing dates and reach, and does not claim the 2025
priority is secured everywhere.

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
