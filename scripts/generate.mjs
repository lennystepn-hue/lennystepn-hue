#!/usr/bin/env node
/**
 * Renders every profile asset and the README.
 *
 *   node scripts/generate.mjs              fetch live, write everything
 *   node scripts/generate.mjs --cached     re-render from .cache (no network)
 *   node scripts/generate.mjs --theme ice  preview a palette without editing config
 *
 * --cached exists so the visual design can be iterated on without hammering the
 * API, and so a transient API outage during the scheduled run is easy to
 * reproduce locally.
 */

import { writeFile, mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fetchProfile, loadCached, saveCache } from './data.mjs';
import { loadConfig } from './config.mjs';
import { applyTheme, THEME_NAMES } from './theme.mjs';
import {
  renderHero,
  renderPlayer,
  renderStack,
  renderSelect,
  renderGrid,
  renderFooter,
} from './cards.mjs';
import { renderReadme } from './readme.mjs';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'assets');

/** Present in every README this script writes; see the overwrite guard below. */
const GENERATED_MARKER = 'This file is generated.';

const RENDERERS = {
  hero: renderHero,
  player: renderPlayer,
  stack: renderStack,
  select: renderSelect,
  grid: renderGrid,
  footer: renderFooter,
};

function flag(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? null : (process.argv[i + 1] ?? '');
}

function previewPage(files, theme) {
  return `<!doctype html><meta charset="utf-8"><title>profile preview</title>
<style>
  body { background:#0d0a16; margin:0; padding:32px; font:13px ui-monospace,monospace; color:#7a6f9b }
  h1 { color:#ffb627; font-size:14px; letter-spacing:.18em; margin:0 0 6px }
  p  { margin:0 0 24px }
  figure { margin:0 0 28px }
  figcaption { margin-bottom:8px; letter-spacing:.14em; text-transform:uppercase }
  img { display:block; width:100%; max-width:900px; border:1px solid #272040 }
  button { background:#1d1730; color:#f4ecd8; border:1px solid #4a4270; padding:8px 14px;
           font:inherit; letter-spacing:.12em; cursor:pointer; margin-bottom:24px }
</style>
<h1>ASSET PREVIEW — THEME: ${theme.toUpperCase()}</h1>
<p>Try another palette: <code>npm run build:cached -- --theme ${THEME_NAMES.join(' | ')}</code></p>
<button onclick="document.querySelectorAll('img').forEach(i=>i.src=i.src.split('?')[0]+'?'+Date.now())">
  REPLAY ANIMATIONS
</button>
${files.map((f) => `<figure><figcaption>${f}</figcaption><img src="assets/${f}" alt="${f}"></figure>`).join('\n')}
`;
}

async function main() {
  const cfg = await loadConfig(ROOT);

  const themeOverride = flag('theme');
  if (themeOverride) cfg.theme = themeOverride;
  applyTheme(cfg.theme);

  let data;
  if (process.argv.includes('--cached')) {
    data = await loadCached();
    console.log(`• using cached snapshot from ${data.generatedAt}`);
  } else {
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (!token) {
      console.error(
        'GITHUB_TOKEN is not set.\n' +
          '  Locally:  GITHUB_TOKEN=$(gh auth token) npm run build\n' +
          '  In CI:    the workflow passes secrets.GITHUB_TOKEN for you',
      );
      process.exit(1);
    }
    data = await fetchProfile(cfg.login, token, cfg);
    await saveCache(data);
    console.log(
      `• ${data.login}: ${data.repoCount} public repos, ` +
        `${data.contributions.total} contributions, ${data.totalStars} stars ` +
        `(calendar via ${data.contributions.source})`,
    );
  }

  await mkdir(ASSETS, { recursive: true });

  const written = [];
  for (const card of cfg.cards) {
    const file = `${card}.svg`;
    const svg = RENDERERS[card](data, cfg);
    await writeFile(path.join(ASSETS, file), svg, 'utf8');
    written.push(file);
    console.log(`  ${file.padEnd(12)} ${(Buffer.byteLength(svg) / 1024).toFixed(1)} KB`);
  }

  // Refuse to clobber a README nobody generated. Running the build inside the
  // template repository, or in a repository whose README someone wrote by hand,
  // would otherwise replace it with a profile and lose the original.
  const readmePath = path.join(ROOT, 'README.md');
  const existing = await readFile(readmePath, 'utf8').catch(() => null);
  const isOurs = existing === null || existing.includes(GENERATED_MARKER);

  if (isOurs || process.argv.includes('--force')) {
    await writeFile(readmePath, renderReadme(data, cfg), 'utf8');
  } else {
    console.warn(
      '• README.md was not written: it does not look generated, so it was left alone.\n' +
        '  Pass --force to overwrite it anyway.',
    );
  }

  await writeFile(path.join(ROOT, 'preview.html'), previewPage(written, cfg.theme), 'utf8');
  console.log(`• wrote assets and preview.html  [theme: ${cfg.theme}]`);
}

main().catch((err) => {
  console.error(err.name === 'ConfigError' ? `\n${err.message}\n` : err);
  process.exit(1);
});
