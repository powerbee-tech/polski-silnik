/**
 * Prints content/pitch.html to a 16:9 PDF with headless Chrome, and checks
 * every page for overflow before it does.
 *
 *   node polishengine/pitch/pdf.mjs                 # -> content/Polish-Engine-Investor-Book.pdf
 *   node polishengine/pitch/pdf.mjs --check         # layout check only, no PDF
 *   CHROME=/path/to/chrome node polishengine/pitch/pdf.mjs
 *
 * The PDF carries the whole presentation in plaintext, so it lands in
 * content/ — gitignored, like every other plaintext source here.
 *
 * Chrome is given a copy of the source placed next to assets/, because the
 * pages load Sora from assets/ with a relative URL and content/ is one level
 * down. The copy is left behind on purpose: .preview.html is the file to open
 * in a browser while iterating.
 */

import { spawn } from 'node:child_process';
import { access, readFile, stat, unlink, writeFile } from 'node:fs/promises';

const here = (name) => new URL(name, import.meta.url);
const path = (url) => decodeURIComponent(url.pathname);

const checkOnly = process.argv.includes('--check');

const CANDIDATES = [
  process.env.CHROME,
  '/usr/local/bin/google-chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

const exists = (file) => access(file).then(() => true, () => false);

const chrome = await (async () => {
  for (const candidate of CANDIDATES) {
    if (await exists(candidate)) return candidate;
  }
  console.error('No Chrome found. Set CHROME=/path/to/chrome.');
  process.exit(1);
})();

const source = await readFile(here('content/pitch.html'), 'utf8');

// Reports, per page, anything that leaves the safe area — the page's own
// padding box, which is where the header sits and where the footer strip
// stops. Elements that are meant to run to the edge carry .bleed. Runs in the
// preview copy only; the published page never sees it.
const CHECKER = `
<script>
window.addEventListener('load', function () {
  document.fonts.ready.then(function () {
    var problems = [];
    var pages = document.querySelectorAll('.page');
    for (var i = 0; i < pages.length; i++) {
      var page = pages[i], box = page.getBoundingClientRect(), pad = getComputedStyle(page);
      var safe = {
        left: box.left + parseFloat(pad.paddingLeft),
        right: box.right - parseFloat(pad.paddingRight),
        top: box.top + parseFloat(pad.paddingTop),
        bottom: box.bottom - parseFloat(pad.paddingBottom),
      };
      if (page.scrollWidth > page.clientWidth + 1 || page.scrollHeight > page.clientHeight + 1) {
        problems.push((i + 1) + ': page scrolls ' + page.scrollWidth + 'x' + page.scrollHeight);
      }
      var nodes = page.querySelectorAll('*');
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        if (node.closest('.bleed, .pf, .corner')) continue;
        var rect = node.getBoundingClientRect();
        if (!rect.width && !rect.height) continue;
        var over = [];
        if (rect.left   < safe.left   - 0.6) over.push('left ' + Math.round(safe.left - rect.left));
        if (rect.top    < safe.top    - 0.6) over.push('top ' + Math.round(safe.top - rect.top));
        if (rect.right  > safe.right  + 0.6) over.push('right ' + Math.round(rect.right - safe.right));
        if (rect.bottom > safe.bottom + 0.6) over.push('bottom ' + Math.round(rect.bottom - safe.bottom));
        if (over.length) {
          problems.push((i + 1) + ': <' + node.tagName.toLowerCase() +
            (node.className && node.className.baseVal === undefined ? '.' + String(node.className).split(' ').join('.') : '') +
            '> outside the safe area by ' + over.join(', ') + 'px');
        }
      }

      // Text that lands on other text. Fixed-height pages make this the most
      // likely way for a page to go wrong without anything leaving the box.
      var leaves = [];
      var all = page.querySelectorAll('p, li, h1, h2, h3, span, td, th, blockquote, figcaption');
      for (var k = 0; k < all.length; k++) {
        var leaf = all[k];
        if (leaf.closest('.bleed')) continue;
        if (!leaf.textContent.trim()) continue;
        if (leaf.querySelector('p, li, h1, h2, h3, td, th, blockquote, figcaption')) continue;
        var leafRect = leaf.getBoundingClientRect();
        if (leafRect.width < 2 || leafRect.height < 2) continue;
        leaves.push({ node: leaf, rect: leafRect });
      }

      for (var a = 0; a < leaves.length; a++) {
        for (var b = a + 1; b < leaves.length; b++) {
          var one = leaves[a], two = leaves[b];
          if (one.node.contains(two.node) || two.node.contains(one.node)) continue;
          var dx = Math.min(one.rect.right, two.rect.right) - Math.max(one.rect.left, two.rect.left);
          var dy = Math.min(one.rect.bottom, two.rect.bottom) - Math.max(one.rect.top, two.rect.top);
          if (dx > 3 && dy > 4) {
            problems.push((i + 1) + ': "' + one.node.textContent.trim().slice(0, 28) +
              '" overlaps "' + two.node.textContent.trim().slice(0, 28) + '"');
          }
        }
      }
    }

    document.body.setAttribute('data-pages', pages.length);
    document.body.setAttribute('data-problems', problems.join(' | ') || 'none');
  });
});
</script>
`;

const preview = here('.preview.html');
await writeFile(preview, source.replace('</body>', CHECKER + '</body>'));

const run = async (args, { until }) => {
  const child = spawn(chrome, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    '--font-render-hinting=none',
    '--virtual-time-budget=10000',
    ...args,
  ], { stdio: ['ignore', 'pipe', 'ignore'] });

  let out = '';
  child.stdout.on('data', (chunk) => { out += chunk; });

  // Chrome does its work and then, on some hosts, simply does not exit. Wait
  // for the result instead of for the process, and kill it once it is there.
  const deadline = Date.now() + 120000;
  let done = null;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 250));
    done = await until(out);
    if (done) break;
  }
  child.kill('SIGKILL');
  if (!done) {
    console.error('Chrome produced nothing within 120 s.');
    process.exit(1);
  }
  return out;
};

const dom = await run(['--dump-dom', `file://${path(preview)}`], {
  until: (out) => (out.includes('data-problems') ? out : null),
});

const pages = dom.match(/data-pages="(\d+)"/)?.[1] ?? '?';
const problems = dom.match(/data-problems="([^"]*)"/)?.[1] ?? '';

console.log(`${pages} pages`);
if (problems && problems !== 'none') {
  console.error('Layout problems:');
  for (const problem of problems.split(' | ')) console.error(`  ${problem}`);
  process.exit(1);
}
console.log('Layout clean — nothing overflows a page.');

if (checkOnly) process.exit(0);

const pdf = here('content/Polish-Engine-Investor-Book.pdf');
await unlink(pdf).catch(() => {});

await run([
  '--no-pdf-header-footer',
  `--print-to-pdf=${path(pdf)}`,
  `file://${path(preview)}`,
], {
  until: async () => {
    const first = await stat(pdf).catch(() => null);
    if (!first || !first.size) return null;
    await new Promise((resolve) => setTimeout(resolve, 600));
    const second = await stat(pdf);
    return second.size === first.size ? second : null;
  },
});

const { size } = await stat(pdf);
console.log(`content/Polish-Engine-Investor-Book.pdf written — ${(size / 1024 / 1024).toFixed(2)} MB, 960 x 540 pt (16:9).`);
