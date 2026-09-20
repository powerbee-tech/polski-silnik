/**
 * Recovers content/pitch.html from the published index.html — the inverse of
 * build.mjs. The ciphertext in the repository is the only copy of the deck, so
 * this is how you get an editable source on a machine that has never held it
 * (a fresh clone, a cloud agent, a phone).
 *
 *   node polishengine/pitch/unbuild.mjs "<password>"
 *   PAGE_PASSWORD="<password>" node polishengine/pitch/unbuild.mjs
 *
 * Refuses to overwrite an existing content/pitch.html unless --force is passed.
 */

import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile, access, mkdir } from 'node:fs/promises';

const args = process.argv.slice(2).filter((arg) => arg !== '--force');
const force = process.argv.includes('--force');

const password = args[0] ?? process.env.PAGE_PASSWORD;
if (!password) {
  console.error('Password required:  node polishengine/pitch/unbuild.mjs "<password>"');
  process.exit(1);
}

const target = new URL('content/pitch.html', import.meta.url);

if (!force) {
  const exists = await access(target).then(() => true, () => false);
  if (exists) {
    console.error('content/pitch.html already exists. Pass --force to overwrite it.');
    process.exit(1);
  }
}

const shell = await readFile(new URL('index.html', import.meta.url), 'utf8');

const field = (name) => {
  const match = shell.match(new RegExp(name + ':\\s*"([A-Za-z0-9+/=]+)"'));
  if (!match) {
    console.error(`Could not find "${name}" in polishengine/pitch/index.html — is it a built page?`);
    process.exit(1);
  }
  return Uint8Array.from(Buffer.from(match[1], 'base64'));
};

const iterations = Number(shell.match(/iterations:\s*(\d+)/)?.[1]);
if (!iterations) {
  console.error('Could not find "iterations" in polishengine/pitch/index.html — is it a built page?');
  process.exit(1);
}

const baseKey = await crypto.subtle.importKey(
  'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt: field('salt'), iterations, hash: 'SHA-256' },
  baseKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['decrypt']
);

let plaintext;
try {
  plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: field('iv') }, key, field('data')
  );
} catch {
  console.error('Wrong password — could not decrypt polishengine/pitch/index.html.');
  process.exit(1);
}

await mkdir(new URL('content/', import.meta.url), { recursive: true });
await writeFile(target, Buffer.from(plaintext));

const size = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`polishengine/pitch/content/pitch.html restored — ${size(plaintext.byteLength)}. It is gitignored; keep it that way.`);
