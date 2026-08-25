/**
 * Palettes, language colours and small formatting helpers.
 *
 * `C` is a live object rather than a frozen constant. `applyTheme()` swaps its
 * contents once at start-up and every card reads it at render time, which keeps
 * theming out of the drawing code entirely. Anything that captures a colour at
 * module load would freeze the default theme, so don't.
 */

/**
 * Four complete palettes. Each is warm or cool on purpose and none of them is
 * the cyan-and-violet-on-black that every generated "retro tech" design lands
 * on. `primary` leads; `green` is reserved for live data so it never reads as
 * decoration; `ramp` is the five-step contribution heat scale; `marquee` is the
 * three-stop gradient behind the hero title.
 */
export const PALETTES = {
  /** Arcade marquee. Amber-led, the default. */
  amber: {
    bg: '#14101f',
    bgDeep: '#0d0a16',
    panel: '#1d1730',
    panelLit: '#272040',
    ink: '#f4ecd8',
    dim: '#7a6f9b',
    dimmer: '#4a4270',
    primary: '#ffb627',
    primaryDeep: '#e08700',
    red: '#ef3d3d',
    magenta: '#ff5da2',
    green: '#7ee787',
    blue: '#4d9bff',
    violet: '#b06cff',
    claude: '#e0785a',
    ramp: ['#231d3a', '#5c4a1f', '#a8791f', '#ffb627', '#ffe9a8'],
    marquee: ['#fff4d6', '#ffb627', '#e08700'],
  },

  /** Green CRT terminal. */
  phosphor: {
    bg: '#0b1410',
    bgDeep: '#060d0a',
    panel: '#12211a',
    panelLit: '#1b2f24',
    ink: '#e2f5e8',
    dim: '#6f9a83',
    dimmer: '#3d5c4c',
    primary: '#5ef78b',
    primaryDeep: '#1f9b52',
    red: '#ff6b5c',
    magenta: '#c98bff',
    green: '#5ef78b',
    blue: '#54d6ff',
    violet: '#9d7bff',
    claude: '#e0785a',
    ramp: ['#16261d', '#1f5c38', '#2f9b57', '#5ef78b', '#c8ffd9'],
    marquee: ['#e8ffef', '#5ef78b', '#1f9b52'],
  },

  /** Hot pink cabinet lighting. */
  synth: {
    bg: '#150d1f',
    bgDeep: '#0d0714',
    panel: '#1f1430',
    panelLit: '#2b1c42',
    ink: '#f6e9ff',
    dim: '#9b7ab8',
    dimmer: '#5c4478',
    primary: '#ff5da2',
    primaryDeep: '#c72d76',
    red: '#ff4d6d',
    magenta: '#ff8ac4',
    green: '#6ef7c4',
    blue: '#6b8cff',
    violet: '#c77dff',
    claude: '#e0785a',
    ramp: ['#261a38', '#5c2049', '#a82f74', '#ff5da2', '#ffc4de'],
    marquee: ['#ffe0f0', '#ff5da2', '#c72d76'],
  },

  /** Cool blue tube. */
  ice: {
    bg: '#0d131f',
    bgDeep: '#070b14',
    panel: '#141d2e',
    panelLit: '#1e2a40',
    ink: '#e6f1ff',
    dim: '#7089a8',
    dimmer: '#42546e',
    primary: '#4dd0ff',
    primaryDeep: '#1a86b8',
    red: '#ff6b6b',
    magenta: '#a78bfa',
    green: '#5eead4',
    blue: '#6ba8ff',
    violet: '#a78bfa',
    claude: '#e0785a',
    ramp: ['#1a2436', '#1c4f6b', '#2a86ad', '#4dd0ff', '#c4edff'],
    marquee: ['#eaf8ff', '#4dd0ff', '#1a86b8'],
  },
};

export const THEME_NAMES = Object.keys(PALETTES);

/** The live palette. Read it at call time; never destructure it at import. */
export const C = { ...PALETTES.amber };

export function applyTheme(name = 'amber') {
  const palette = PALETTES[name];
  if (!palette) {
    throw new Error(`Unknown theme "${name}". Available: ${THEME_NAMES.join(', ')}`);
  }
  for (const key of Object.keys(C)) delete C[key];
  Object.assign(C, palette);
  return C;
}

/**
 * GitHub's own language colours, so the inventory slots are recognisable at a
 * glance. Unknown languages fall back to a stable pick from the active palette
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
  Clojure: '#db5855',
  Erlang: '#B83998',
  OCaml: '#ef7a08',
  Scala: '#c22d40',
  Perl: '#0298c3',
  R: '#198CE7',
  Julia: '#a270ba',
  Crystal: '#000100',
  Nim: '#ffc200',
  'Objective-C': '#438eff',
  Assembly: '#6E4C13',
  CMake: '#DA3434',
  Twig: '#c1d026',
  Vim_Script: '#199f4b',
  'Emacs Lisp': '#c065db',
  TeX: '#3D6117',
  Procfile: '#a0a0a0',
};

export function languageColor(name) {
  if (LANGUAGE_COLORS[name]) return LANGUAGE_COLORS[name];
  // Read the palette at call time, not at module load: applyTheme() swaps these
  // values, and a list captured at import would freeze the default theme's.
  const fallbacks = [C.primary, C.magenta, C.green, C.blue, C.violet, C.red];
  let hash = 0;
  for (const ch of String(name)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return fallbacks[hash % fallbacks.length];
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
  'Objective-C': 'OBJC',
  'Emacs Lisp': 'ELISP',
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

/**
 * 847 -> "847", 1046 -> "1046", 12345 -> "12.3K", 1240000 -> "1.2M"
 *
 * Abbreviation only starts at five figures. Rounding 1046 commits to "1K"
 * reads as an estimate and throws away the precision that makes the number
 * convincing -- and every figure on this profile fits its box at full length
 * well past ten thousand.
 */
export function compact(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (v >= 10_000) return `${(v / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(v);
}

export function pad(n, width) {
  return String(n).padStart(width, '0');
}
