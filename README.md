# Protected document

Password-protected static page. `index.html` is generated and contains only
AES-256-GCM ciphertext; the key is derived from the password in the browser with
PBKDF2-SHA256 (310 000 iterations). Nothing readable ships in this repository.

## Build

The plaintext source lives in `content/page.html`, which is gitignored and must
never be committed — it is kept locally and in Google Drive, not here. After
editing it, regenerate the published page:

```sh
node build.mjs "<password>"
```

That rewrites `index.html`. Commit and push it; GitHub Pages serves it from
`main`. Changing the password is the same command with a new value.

## Editing from a machine that has no source

`index.html` is the only copy of the document in the repository, so recover an
editable source from it:

```sh
node unbuild.mjs "<password>"   # writes content/page.html
# edit content/page.html
node build.mjs "<password>"     # rewrites index.html
```

That round trip is what makes it possible to iterate from a fresh clone, a cloud
agent or a phone with nothing but the password.

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
