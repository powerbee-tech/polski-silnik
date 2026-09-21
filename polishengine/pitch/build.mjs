/**
 * Encrypts content/pitch.html into a self-contained index.html that asks for a
 * password and decrypts in the browser (PBKDF2-SHA256 -> AES-256-GCM).
 *
 * The published index.html contains only ciphertext, so it is safe in a public
 * repository. content/pitch.html must stay out of git.
 *
 *   node polishengine/pitch/build.mjs "<password>"
 *   PAGE_PASSWORD="<password>" node polishengine/pitch/build.mjs
 *
 * The page around the ciphertext — the gate and the slide viewer — is
 * shell.html. Changing it needs no password: see reshell.mjs.
 */

import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

import { renderShell } from './shell.mjs';

const ITERATIONS = 310000;

const password = process.argv[2] ?? process.env.PAGE_PASSWORD;
if (!password) {
  console.error('Password required:  node polishengine/pitch/build.mjs "<password>"');
  process.exit(1);
}

const plaintext = await readFile(new URL('content/pitch.html', import.meta.url));

const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const baseKey = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt']
);
const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);

const b64 = (buf) => Buffer.from(buf).toString('base64');

const shell = await renderShell({
  salt: b64(salt),
  iv: b64(iv),
  data: b64(ciphertext),
  iterations: ITERATIONS,
});

await writeFile(new URL('index.html', import.meta.url), shell);

const size = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`polishengine/pitch/index.html written — ${size(shell.length)} (payload ${size(ciphertext.byteLength)}, ${ITERATIONS} PBKDF2 iterations)`);
