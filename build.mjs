/**
 * Encrypts content/page.html into a self-contained index.html that asks for a
 * password and decrypts in the browser (PBKDF2-SHA256 -> AES-256-GCM).
 *
 * The published index.html contains only ciphertext, so it is safe in a public
 * repository. content/page.html must stay out of git.
 *
 *   node build.mjs "<password>"
 *   PAGE_PASSWORD="<password>" node build.mjs
 */

import { webcrypto as crypto } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

const ITERATIONS = 310000;

const password = process.argv[2] ?? process.env.PAGE_PASSWORD;
if (!password) {
  console.error('Password required:  node build.mjs "<password>"');
  process.exit(1);
}

const plaintext = await readFile(new URL('content/page.html', import.meta.url));

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

const shell = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Protected document</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" type="image/svg+xml" href="assets/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg: #faf9f6; --surface: #fff; --ink: #17171a; --ink-soft: #5c5c68;
  --ink-faint: #8a8a95; --line: #e6e2da; --accent: #b57508;
  --accent-bg: rgba(181,117,8,.09); --danger: #b3261e;
  --shadow: 0 1px 2px rgba(23,23,26,.04), 0 12px 32px rgba(23,23,26,.07);
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0e0e12; --surface: #16161c; --ink: #e9e7e2; --ink-soft: #a2a0ab;
    --ink-faint: #75737e; --line: rgba(255,255,255,.09); --accent: #f0ab2e;
    --accent-bg: rgba(240,171,46,.12); --danger: #f2897f;
    --shadow: 0 1px 2px rgba(0,0,0,.3), 0 12px 32px rgba(0,0,0,.3);
  }
}

body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
}

.gate {
  width: 100%;
  max-width: 400px;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 36px 34px;
  box-shadow: var(--shadow);
}

.lock {
  width: 38px; height: 38px;
  display: grid; place-items: center;
  border-radius: 9px;
  background: var(--accent-bg);
  color: var(--accent);
  margin-bottom: 20px;
}

h1 { font-size: 1.12rem; font-weight: 600; letter-spacing: -.01em; }

.hint {
  margin-top: 8px;
  font-size: .89rem;
  line-height: 1.6;
  color: var(--ink-soft);
}

form { margin-top: 24px; display: grid; gap: 12px; }

input {
  width: 100%;
  font: inherit;
  font-size: .95rem;
  color: var(--ink);
  background: var(--bg);
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 12px 14px;
  transition: border-color .15s, box-shadow .15s;
}

input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-bg);
}

button {
  font: inherit;
  font-size: .93rem;
  font-weight: 600;
  color: #fff;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  padding: 12px 16px;
  cursor: pointer;
  transition: opacity .15s;
}

button:hover { opacity: .88; }
button:disabled { opacity: .55; cursor: default; }

.msg {
  min-height: 1.2em;
  font-size: .85rem;
  color: var(--danger);
}

.msg[data-busy] { color: var(--ink-faint); }

footer {
  margin-top: 22px;
  padding-top: 18px;
  border-top: 1px solid var(--line);
  font-size: .76rem;
  line-height: 1.6;
  color: var(--ink-faint);
}
</style>
</head>
<body>

<div class="gate">
  <div class="lock" aria-hidden="true">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <rect x="4" y="11" width="16" height="10" rx="2"/>
      <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
    </svg>
  </div>

  <h1>Protected document</h1>
  <p class="hint">This document is confidential and for internal use only. Enter the password to continue.</p>

  <form id="f">
    <input id="p" type="password" placeholder="Password" autocomplete="current-password" autofocus required>
    <button id="b" type="submit">Unlock</button>
    <p class="msg" id="m" role="status" aria-live="polite"></p>
  </form>

  <footer>Exclusive intangible and intellectual property of IBS. All rights reserved.</footer>
</div>

<script>
const PAYLOAD = {
  salt: "${b64(salt)}",
  iv: "${b64(iv)}",
  data: "${b64(ciphertext)}",
  iterations: ${ITERATIONS}
};

const bytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
const form = document.getElementById('f');
const input = document.getElementById('p');
const button = document.getElementById('b');
const msg = document.getElementById('m');

async function unlock(password) {
  const baseKey = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']
  );
  const key = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: bytes(PAYLOAD.salt), iterations: PAYLOAD.iterations, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: bytes(PAYLOAD.iv) }, key, bytes(PAYLOAD.data)
  );
  return new TextDecoder().decode(plain);
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  button.disabled = true;
  msg.dataset.busy = '';
  msg.textContent = 'Decrypting\\u2026';

  try {
    const html = await unlock(input.value);
    sessionStorage.setItem('unlocked', input.value);
    render(html);
  } catch {
    delete msg.dataset.busy;
    msg.textContent = 'Wrong password.';
    button.disabled = false;
    input.select();
  }
});

function render(html) {
  document.open();
  document.write(html);
  document.close();
  if (location.hash) {
    const target = document.querySelector(location.hash);
    if (target) target.scrollIntoView();
  }
}

// Stay unlocked while the tab is open.
const remembered = sessionStorage.getItem('unlocked');
if (remembered) {
  unlock(remembered).then(render).catch(() => sessionStorage.removeItem('unlocked'));
}
</script>

</body>
</html>
`;

await writeFile(new URL('index.html', import.meta.url), shell);

const size = (n) => `${(n / 1024).toFixed(1)} kB`;
console.log(`index.html written — ${size(shell.length)} (payload ${size(ciphertext.byteLength)}, ${ITERATIONS} PBKDF2 iterations)`);
