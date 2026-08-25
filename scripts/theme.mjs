/**
 * Palette and shared constants.
 *
 * Deliberately warm. The obvious choice for "retro tech" is cyan-and-violet on
 * black, which is also the most recognisable signature of machine-generated
 * design work. Real arcade cabinets were lit by amber marquees and warm
 * phosphor, so that is what this uses: amber leads, red and pink accent, and
 * green is held back for live data so it never reads as decoration.
 */

export const C = {
  bg: '#14101f',
  bgDeep: '#0d0a16',
  panel: '#1d1730',
  panelLit: '#272040',
  ink: '#f4ecd8',
  dim: '#7a6f9b',
  dimmer: '#4a4270',

  amber: '#ffb627',
  amberDeep: '#e08700',
  red: '#ef3d3d',
  magenta: '#ff5da2',
  green: '#7ee787',
  blue: '#4d9bff',
  violet: '#b06cff',
};

/**
 * GitHub's own language colours, so the inventory slots are recognisable at a
 * glance. Unknown languages fall back to a stable pick from the arcade palette
 * rather than a flat grey, so a new language never looks like an error state.
 */
const LANGUAGE_COLORS = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  Vue: '#41b883',
  HTML: '#e34c26',
  CSS: '#663399',
  SCSS: '#c6538c',
  Rust: '#dea584',
  Go: '#00ADD8',
  Astro: '#ff5a03',
  Svelte: '#ff3e00',
  PLpgSQL: '#336790',
  EJS: '#a91e50',
  Shell: '#89e051',
  Dockerfile: '#384d54',
  Makefile: '#427819',
  C: '#555555',
  'C++': '#f34b7d',
  'C#': '#178600',
  Java: '#b07219',
  Kotlin: '#A97BFF',
  Swift: '#F05138',
  Ruby: '#701516',
  PHP: '#4F5D95',
  Dart: '#00B4AB',
  Elixir: '#6e4a7e',
  Haskell: '#5e5086',
  Lua: '#000080',
  Zig: '#ec915c',
  Solidity: '#AA6746',
  MDX: '#fcb32c',
  'Jupyter Notebook': '#DA5B0B',
  PowerShell: '#012456',
  Batchfile: '#C1F12E',
  Nix: '#7e7eff',
  Handlebars: '#f7931e',
  Blade: '#f7523f',
  SQL: '#e38c00',
  Procfile: '#a0a0a0',
};

const FALLBACK_COLORS = [C.amber, C.magenta, C.green, C.blue, C.violet, C.red];

export function languageColor(name) {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

/**
 * Short labels for the inventory slots. Full language names blow out the slot
 * width, and arcade inventories use terse item codes anyway.
 */
const LANGUAGE_ABBR = {
  TypeScript: 'TS',
  JavaScript: 'JS',
  Python: 'PY',
  Rust: 'RS',
  Go: 'GO',
  Vue: 'VUE',
  HTML: 'HTML',
  CSS: 'CSS',
  SCSS: 'SCSS',
  Astro: 'ASTRO',
  Svelte: 'SVLT',
  PLpgSQL: 'SQL',
  EJS: 'EJS',
  Shell: 'SH',
  Dockerfile: 'DOCK',
  'C++': 'CPP',
  'C#': 'CS',
  'Jupyter Notebook': 'NB',
  PowerShell: 'PS',
  Handlebars: 'HBS',
};

export function languageAbbr(name) {
  return LANGUAGE_ABBR[name] ?? String(name).toUpperCase().slice(0, 5);
}

/** Deterministic PRNG, so regenerated assets do not churn the git diff. */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 847 -> "847", 1240 -> "1.2K", 1240000 -> "1.2M" */
export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 10_000) return `${Math.round(v / 1000)}K`;
  if (v >= 1_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
}

export function pad(n, width) {
  return String(n).padStart(width, '0');
}
