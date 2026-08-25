#!/usr/bin/env node
/**
 * Renders every profile asset.
 *
 *   node scripts/generate.mjs              fetch live, write assets
 *   node scripts/generate.mjs --cached     re-render from .cache (no network)
 *
 * --cached exists so the visual design can be iterated on without hammering the
 * API, and so a transient API outage during the scheduled run is easy to
 * reproduce locally.
 */

import { writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fetchProfile, loadCached, saveCache } from './data.mjs';
import { renderHero, renderPlayer, renderStack, renderSelect, renderGrid } from './cards.mjs';
import { renderReadme } from './readme.mjs';

const LOGIN = process.env.PROFILE_LOGIN ?? 'lennystepn-hue';
const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'assets');

const CARDS = [
  ['hero.svg', renderHero],
  ['player.svg', renderPlayer],
  ['stack.svg', renderStack],
  ['select.svg', renderSelect],
  ['grid.svg', renderGrid],
];

function previewPage(files) {
  return `<!doctype html><meta charset="utf-8"><title>profile preview</title>
<style>
  body { background:#0d0a16; margin:0; padding:32px; font:13px ui-monospace,monospace; color:#7a6f9b }
  h1 { color:#ffb627; font-size:14px; letter-spacing:.18em; margin:0 0 24px }
  figure { margin:0 0 28px }
  figcaption { margin-bottom:8px; letter-spacing:.14em; text-transform:uppercase }
  img { display:block; width:100%; max-width:900px; border:1px solid #272040 }
  button { background:#1d1730; color:#f4ecd8; border:1px solid #4a4270; padding:8px 14px;
           font:inherit; letter-spacing:.12em; cursor:pointer; margin-bottom:24px }
</style>
<h1>LENNYSTEPN-HUE — ASSET PREVIEW</h1>
<button onclick="document.querySelectorAll('img').forEach(i=>i.src=i.src.split('?')[0]+'?'+Date.now())">
  REPLAY ANIMATIONS
</button>
${files.map((f) => `<figure><figcaption>${f}</figcaption><img src="assets/${f}" alt="${f}"></figure>`).join('\n')}
`;
}

async function main() {
  const useCache = process.argv.includes('--cached');
  let data;

  if (useCache) {
    data = await loadCached();
    console.log(`• using cached snapshot from ${data.generatedAt}`);
  } else {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
      console.error('GITHUB_TOKEN is not set. Try: GITHUB_TOKEN=$(gh auth token) node scripts/generate.mjs');
      process.exit(1);
    }
    data = await fetchProfile(LOGIN, token);
    await saveCache(data);
    console.log(
      `• fetched ${data.login}: ${data.repoCount} public repos, ` +
        `${data.contributions.total} contributions, ${data.totalStars} stars`,
    );
  }

  await mkdir(ASSETS, { recursive: true });

  for (const [file, render] of CARDS) {
    const svg = render(data);
    await writeFile(path.join(ASSETS, file), svg, 'utf8');
    console.log(`  ${file.padEnd(12)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
  }

  await writeFile(path.join(ROOT, 'README.md'), renderReadme(data), 'utf8');
  console.log('• wrote README.md');

  await writeFile(path.join(ROOT, 'preview.html'), previewPage(CARDS.map(([f]) => f)), 'utf8');
  console.log('• wrote preview.html');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
