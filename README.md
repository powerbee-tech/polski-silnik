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

## Notes

- Requires Node 18+ (uses the built-in Web Crypto API). No dependencies.
- The ciphertext is public, so an attacker can brute-force offline. Use a
  high-entropy password and share it out of band, never in this repository or in
  commit messages.
- Decryption needs a secure context: `https://` or `localhost`. Opening the file
  over `file://` will not work.
