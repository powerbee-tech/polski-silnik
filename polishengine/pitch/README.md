# Polish Engine investor book

A print-ready, English-only investor presentation built from the Polish Engine
project deck at `/polishengine`. Twenty-nine 16:9 pages, served at
`powerbee.tech/polishengine/pitch` and exportable to PDF with one command.

`index.html` is generated and contains only AES-256-GCM ciphertext; the key is
derived from the password in the browser with PBKDF2-SHA256 (310 000
iterations). Nothing readable ships in this repository. The password is the
same as the deck's at `/polishengine` — the two documents have the same
audience, and the browser keeps one unlocked session for both.

## Build

The plaintext source lives in `content/pitch.html`, which is gitignored and must
never be committed. After editing it, regenerate the published page:

```sh
node polishengine/pitch/build.mjs "<password>"
```

To recover an editable source on a machine that has never held one:

```sh
node polishengine/pitch/unbuild.mjs "<password>"   # writes content/pitch.html
```

## The shell, and changing it without the password

`shell.html` is the published page with the payload taken out: the password
gate, and the slide viewer that runs once the book is decrypted. `build.mjs`
fills in its four placeholders — salt, IV, ciphertext, iteration count.

The shell carries nothing confidential, so working on it should not require the
book. It does not:

```sh
node polishengine/pitch/reshell.mjs
```

That lifts the payload out of the published `index.html`, puts the current
shell back around it, and checks all four fields came through byte for byte
before it writes. The same password opens the result. Use `build.mjs` instead
whenever the book itself has changed.

## On screen

The book is a stack of fixed pages built for print, and a browser handed that
stack lays it out as a column — on a phone, twenty-nine stamps down a long
scroll. The viewer in the shell turns it into a presentation instead: one page
at a time, scaled to the viewport, moved with a swipe, the arrow keys, a
scroll, the on-screen arrows, or the tick for a page in the bar along the
bottom. `Home` and `End` jump to the covers, `F` goes full screen, and the
address bar keeps `#p12`, so a page can be linked to.

A phone held upright fits a 16:9 page at under a third of its design size, so
there the page and the interface turn a quarter turn together and fill the
screen at nearly twice that; turning the phone un-turns the page and grows it
again. The control in the bar opts out of the turn for the session. The turn is
offered only on a handheld screen, held upright, where it buys at least a
quarter more page. Pinch to zoom is left to the browser throughout.

None of this reaches the PDF. Every rule is inside `@media screen`, and the
per-page geometry travels in custom properties rather than inline transforms,
so printing from the browser produces the pages below — verified pixel for
pixel against the same document printed without the viewer. A document with no
`.page` elements is left to scroll as it did.

Three things are worth knowing before editing the viewer. The book scales
itself to the window with a transform of its own, so a page's rendered box is
not its page box — take the design size from `offsetWidth`, which the transform
does not touch. The gradients and filters its light trails are painted with
live in a zero-sized element beside the pages, which is why what is not a page
is hidden rather than taken out of the layout: `display: none` there leaves the
cover and the closing page unpainted. And `document.close()` ends the writing,
not the parsing: WebKit returns from it with the book's stylesheet still on its
way, so the viewer starts on `DOMContentLoaded` and keeps a `ResizeObserver` on
the first page. Measure a page before its stylesheet reaches it and every
number the viewer derives is wrong for the rest of the session.

Chrome's parser finishes inside `document.close()` and Safari's does not, so a
layout bug can be invisible in one engine and ruin the page in the other. The
viewer is checked in both: Chrome through Puppeteer, Safari through Playwright's
WebKit on its iPhone profiles.

## The PDF

```sh
node polishengine/pitch/pdf.mjs          # -> content/Polish-Engine-Investor-Book.pdf
node polishengine/pitch/pdf.mjs --check  # layout check only
```

The script drives headless Chrome, so it needs Chrome or Chromium installed;
point `CHROME` at the binary if it is somewhere unusual. It writes
`.preview.html` next to `assets/` — that is the file to open in a browser while
iterating, and it is gitignored.

Every page is a fixed 1280 x 720 box and prints as **960 x 540 pt — 16:9,
339 x 191 mm**, which scales without cropping to any 16:9 screen and to paper
larger than A4 landscape. Nothing reflows: what the browser shows is what the
PDF carries.

Printing from the browser gives the same result: Print, landscape, margins
none, background graphics on, paper size 339 x 191 mm or *Scale to fit*.

`pdf.mjs --check` fails the build on three classes of defect, which is what
makes the export safe to send without opening every page:

- content outside the page's safe area (the padding box; the footer strip sits
  below it),
- a page whose content scrolls,
- text that overlaps other text.

Elements that are meant to run past the safe area — the light trails on the
cover and the closing page — carry `class="bleed"` and are exempt.

## Fonts

Sora is self-hosted in `assets/`: a `<link>` to fonts.googleapis.com would not
be fetched when Chrome prints from a local file, and the PDF would ship without
its typeface. `assets/` is served unencrypted, so it holds fonts and nothing
else.

The four files are static instances — weight 400 and 600, the only two the book
uses, each split across Google's latin and latin-ext ranges — cut from the
upstream Sora variable font with `fonttools`. The instancing is what makes the
export printable. Given a variable font, Chrome cannot subset it and instead
embeds every glyph as a Type 3 procedure, which prepress RIPs handle badly; the
static faces come out as ordinary CIDFontType2 subsets.

For the same reason the book sets no character Sora does not carry. U+2265 was
added to the latin range for the single "≥80%", and the marks that would
otherwise have pulled in a fallback face — the list bullets, the timeline keys,
the "before → after" arrows in the number cards — are drawn in CSS from the
page's own square-and-triangle vocabulary. The finished PDF reports two fonts,
Sora Regular and Sora SemiBold, both embedded.

## Relationship to the deck

Content comes from the deck at `/polishengine`; design comes from the same
place — the palette, Sora, the uppercase letterspaced eyebrows, the bracketed
cards, the red hairlines, the SVG line-art and the light trails are the deck's
own, reused rather than reinterpreted.

The narrative is rebuilt. The deck's 16 slides are re-ordered into a
progressive investor story — why now, the two problems, the insight, the
project, each technology with its evidence, IP, products, market, business
model, the next milestone, roadmap, team, the ask, sources — and single slides
that carried several ideas are split across pages. No fact, figure or diagram
is added that is not in the deck.

### Claim labelling

Every figure carries its status, because the deck mixes kinds of number that an
investor must not read as equivalent:

- **Demonstrated** — measured on the PS3 prototype (2 cylinders, 8 kg, block
  rotation 3 000 rpm, piston speed >11 500 rpm).
- **Calculated** — from the ICCHMT 2018 model (BMW 2.0 diesel 41.2 → 60.8%,
  Audi 2.5 TFSI 37.0 → 52.3%, ~2 l/100 km and 46 g CO₂/km for AKS, ~1.3 l/100 km
  and >30 g CO₂/km for AKS-P, 70% fuel and 65 g CO₂/km for PSE).
- **Target** — the engineering goals: >240 000 piston cycles per minute, block
  volume smaller by a factor of about 27, protection in at least 80% of world
  markets.
- **Assumption** — external material: the 100 million cars forecast for 2030,
  the EU path from 95 to about 62 g CO₂/km, and the BMW and Mazda figures.
- **To be supplied** — collected on page 27.

Page 2 explains the labels to the reader and page 28 lists the sources.

## What the book deliberately does not answer

The deck does not state them, so the book does not invent them. They are named
on page 27 instead:

- the amount being raised, the instrument and the valuation,
- use of proceeds, and the verification programme's own cost figures, which the
  source material withholds pending the round,
- development time frames for PS, PSG and PSE, which the deck marks *in
  preparation*,
- a market model in euros — addressable volume, licence pricing, penalty
  exposure,
- confirmation of the patent priority position in each jurisdiction.

The last one is the open question already recorded in `../README.md`: the
12-month priority window from 21.07.2025 closed on 21.07.2026 while the PCT is
dated 20.08.2026, which is inside the restoration window of PCT Rule 26bis.3 but
only if restoration was requested and allowed. Like the deck, the book states
filing dates and reach and claims no more.

## Notes

- Requires Node 18+ for `build.mjs`, `unbuild.mjs` and `reshell.mjs` (no
  dependencies), and Chrome for `pdf.mjs`.
- The generated PDF carries the whole presentation in plaintext. It is written
  into `content/`, which is gitignored, and must never be committed or attached
  to anything public.
- The ciphertext is public, so an attacker can brute-force offline. Share the
  password out of band.
- Decryption needs a secure context: `https://` or `localhost`.
