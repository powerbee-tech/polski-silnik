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

The deck is a restyled, translated web version of the source presentation kept
in Google Drive. The Polish wording is transcribed verbatim; the English is a
faithful translation of it written as an English business deck rather than word
for word, so calques of Polish constructions are avoided and a number of terms
are rendered by their English terms of art. The slide order and the reading
logic of each slide are preserved, and the diagrams are redrawn in CSS and
inline SVG rather than reproduced as images.

The deck departs from the source in a number of deliberate ways: in wording, in
the terms of art chosen for the translation, and in rows filled from documents
the source presentation does not contain. The itemised list of those departures,
the translation glossary and the sources behind them live in
`content/DEVIATIONS.md`, next to the plaintext deck — gitignored and never
published, because naming a departure or a source means quoting the protected
material. Read it before concluding that something on the page is a
transcription error, and record new departures there rather than here. Anything
else that looks like a transcription error probably is one — report it rather
than working around it.

This repository is public. Nothing that identifies the technology, the patents,
the figures, the people or the partners behind the project belongs in any file
that is committed to it — only in `content/`.

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
