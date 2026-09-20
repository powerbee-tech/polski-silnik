# Polish Engine — public landing page and protected document

Password-protected static page. `index.html` is generated and contains only
AES-256-GCM ciphertext; the key is derived from the password in the browser with
PBKDF2-SHA256 (310 000 iterations). Nothing readable ships in this repository.

The markup wrapped around that ciphertext is the project's only public page. It
states the name, the alternate name, the one-line description and the country,
and is meant to be indexable so that a search for "Polish Engine" finds the
official site. Nothing else belongs there — see "Indexing" below.

## Build

The plaintext source lives in `content/page.html`, which is gitignored and must
never be committed — it is kept locally and in Google Drive, not here. After
editing it, regenerate the published page:

```sh
node build.mjs "<password>"
```

That rewrites `index.html`. Commit and push it; Vercel serves it from `main`.
Changing the password is the same command with a new value.

The link-preview card `assets/og.png` is a 1200x630 screenshot of
`og-template.html`; regenerate it whenever that template changes.

## Indexing

Only `/` may be indexed. Everything else is a password gate and must stay out of
search results:

- `/` carries `index, follow`, a canonical URL, Open Graph and Twitter cards and
  a minimal `ResearchProject` / `WebSite` JSON-LD block. All of it repeats the
  same public facts: Polish Engine, Polski Silnik, Poland, one-line description.
- Every other path is served with `X-Robots-Tag: noindex, nofollow, noarchive,
  nosnippet` (`vercel.json`) and the generated gates also carry a `noindex` meta
  tag. Those URLs are deliberately left crawlable in `robots.txt`: a crawler
  that may not fetch a page never sees its noindex and can still list the bare
  URL.
- `sitemap.xml` lists `/` and nothing else.
- Public text, metadata, JSON-LD and the preview card never mention the
  architecture, parameters, patents, acronyms, results, roadmap, team or
  partners. Adding any of that to the shell would publish it.

## Relationship to the source document

The rendered page is not a byte-for-byte copy of its source `.docx`. Some
departures are deliberate: added rows, typography handled in CSS, and repairs to
line breaks that split words mid-sentence in the original.

The itemised list of those departures lives in `content/DEVIATIONS.md`, next to
the plaintext source, because naming them means quoting the document. Like
`content/page.html`, it is gitignored and is never published. Read it before
concluding that something on the page is a transcription error.

## Notes

- Requires Node 18+ (uses the built-in Web Crypto API). No dependencies.
- The ciphertext is public, so an attacker can brute-force offline. Use a
  high-entropy password and share it out of band, never in this repository or in
  commit messages.
- Decryption needs a secure context: `https://` or `localhost`. Opening the file
  over `file://` will not work.
