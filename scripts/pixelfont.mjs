/**
 * A 5x7 bitmap font, drawn by hand, rendered to SVG rectangles.
 *
 * GitHub READMEs cannot load web fonts inside an SVG, and system font stacks
 * render differently on every platform. Drawing each glyph as rectangles is the
 * only way to get identical output everywhere -- and for an arcade aesthetic the
 * pixel grid is the point rather than a compromise.
 *
 * Each glyph is seven rows of five bits, top to bottom, '1' meaning "lit".
 */

export const CHAR_W = 5;
export const CHAR_H = 7;

const G = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01110'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],

  0: ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  3: ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],

  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '01100', '11000'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ';': ['00000', '01100', '01100', '00000', '01100', '01100', '11000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  _: ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '\\': ['10000', '01000', '01000', '00100', '00010', '00010', '00001'],
  '|': ['00100', '00100', '00100', '00100', '00100', '00100', '00100'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '[': ['01110', '01000', '01000', '01000', '01000', '01000', '01110'],
  ']': ['01110', '00010', '00010', '00010', '00010', '00010', '01110'],
  '<': ['00010', '00100', '01000', '10000', '01000', '00100', '00010'],
  '>': ['01000', '00100', '00010', '00001', '00010', '00100', '01000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '*': ['00000', '10101', '01110', '11111', '01110', '10101', '00000'],
  '#': ['01010', '01010', '11111', '01010', '11111', '01010', '01010'],
  '@': ['01110', '10001', '10111', '10101', '10111', '10000', '01110'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  "'": ['00100', '00100', '00000', '00000', '00000', '00000', '00000'],
  '"': ['01010', '01010', '00000', '00000', '00000', '00000', '00000'],
  $: ['00100', '01111', '10100', '01110', '00101', '11110', '00100'],
  '^': ['00100', '01010', '10001', '00000', '00000', '00000', '00000'],
  '~': ['00000', '00000', '01000', '10101', '00010', '00000', '00000'],
  '×': ['00000', '10001', '01010', '00100', '01010', '10001', '00000'],

  // Arcade furniture.
  '★': ['00100', '00100', '11111', '01110', '01110', '01010', '10001'],
  '▶': ['10000', '11000', '11100', '11110', '11100', '11000', '10000'],
  '◀': ['00001', '00011', '00111', '01111', '00111', '00011', '00001'],
  '♥': ['00000', '01010', '11111', '11111', '01110', '00100', '00000'],
  '·': ['00000', '00000', '01100', '01100', '00000', '00000', '00000'],
  '→': ['00000', '00100', '00010', '11111', '00010', '00100', '00000'],
  '←': ['00000', '00100', '01000', '11111', '01000', '00100', '00000'],
  '█': ['11111', '11111', '11111', '11111', '11111', '11111', '11111'],
};

export const GLYPHS = G;

/**
 * Fold typographic characters onto glyphs the font actually has.
 *
 * Repository descriptions are full of em dashes and curly quotes. Both the
 * width calculation and the renderer route through here so a substitution that
 * changes length (an ellipsis becoming three dots) can never desynchronise them.
 */
const FOLD = [
  [/[—–−]/g, '-'],
  [/[‘’‛]/g, "'"],
  [/[“”„]/g, '"'],
  [/…/g, '...'],
  [/ /g, ' '],
  [/[•‧]/g, '·'],
  [/[→➡]/g, '→'],
  [/[←]/g, '←'],
  [/[★☆⭐]/g, '★'],
  [/[❤♥]/g, '♥'],
  [/ß/g, 'SS'],
  [/[Ää]/g, 'AE'],
  [/[Öö]/g, 'OE'],
  [/[Üü]/g, 'UE'],
  [/\s+/g, ' '],
];

const dropped = new Set();

/**
 * Anything still unrepresentable after folding -- emoji, CJK, box drawing -- is
 * removed rather than rendered as a blank, because a hole in the middle of a
 * word reads as a bug while a clean elision does not.
 */
export function sanitize(str) {
  let s = String(str ?? '');
  for (const [re, to] of FOLD) s = s.replace(re, to);
  s = s.toUpperCase();

  let out = '';
  for (const ch of s) {
    if (ch in G) out += ch;
    else if (/\s/.test(ch)) out += ' ';
    else if (!dropped.has(ch)) {
      dropped.add(ch);
      process.stderr.write(`pixelfont: dropping unrepresentable ${JSON.stringify(ch)}\n`);
    }
  }
  return out.replace(/\s+/g, ' ').trim();
}

function glyphFor(ch) {
  return G[ch] ?? G[' '];
}

/** Advance width of a string, excluding the trailing tracking gap. */
export function textWidth(str, scale = 1, tracking = 1) {
  const n = [...sanitize(str)].length;
  if (!n) return 0;
  return n * (CHAR_W + tracking) * scale - tracking * scale;
}

export function textHeight(scale = 1) {
  return CHAR_H * scale;
}

/**
 * Lit pixels as rectangles, with horizontal runs merged into single rects.
 * Merging typically cuts the rect count by about half, which matters because a
 * README SVG is downloaded on every profile view.
 */
export function textRects(str, { x = 0, y = 0, scale = 1, tracking = 1 } = {}) {
  const rects = [];
  const chars = [...sanitize(str)];

  chars.forEach((ch, i) => {
    const glyph = glyphFor(ch);
    const originX = x + i * (CHAR_W + tracking) * scale;

    glyph.forEach((bits, row) => {
      let col = 0;
      while (col < bits.length) {
        if (bits[col] !== '1') {
          col++;
          continue;
        }
        let run = 1;
        while (col + run < bits.length && bits[col + run] === '1') run++;
        rects.push({
          x: originX + col * scale,
          y: y + row * scale,
          w: run * scale,
          h: scale,
        });
        col += run;
      }
    });
  });

  return rects;
}

const num = (v) => (Number.isInteger(v) ? String(v) : String(+v.toFixed(2)));

/**
 * Collapse every lit pixel into one path.
 *
 * A profile README downloads these assets on every view, and one <path> of
 * subpaths costs roughly a third of what the equivalent <rect> elements do --
 * a line of body text drops from about 40 bytes per pixel-run to 15.
 */
export function rectsToPath(rects) {
  return rects
    .map((r) => `M${num(r.x)} ${num(r.y)}h${num(r.w)}v${num(r.h)}h-${num(r.w)}z`)
    .join('');
}

/**
 * A single path. It carries no fill of its own unless asked, which is what lets
 * one `<path id>` be instantiated by several `<use>` elements in different
 * colours to build the chromatic fringe.
 */
export function textSvg(str, opts = {}) {
  const { fill, opacity, className, id, style, ...layout } = opts;
  const d = rectsToPath(textRects(str, layout));
  if (!d) return '';

  const attrs = [
    id ? `id="${id}"` : '',
    className ? `class="${className}"` : '',
    style ? `style="${style}"` : '',
    fill ? `fill="${fill}"` : '',
    opacity != null ? `opacity="${opacity}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<path ${attrs} d="${d}"/>`;
}

/** Same as textSvg, but `cx` is the horizontal centre rather than the left edge. */
export function textSvgCentered(str, opts = {}) {
  const { cx = 0, scale = 1, tracking = 1, ...rest } = opts;
  const x = Math.round(cx - textWidth(str, scale, tracking) / 2);
  return textSvg(str, { ...rest, x, scale, tracking });
}

/** Right-aligned: `rx` is the right edge. */
export function textSvgRight(str, opts = {}) {
  const { rx = 0, scale = 1, tracking = 1, ...rest } = opts;
  const x = Math.round(rx - textWidth(str, scale, tracking));
  return textSvg(str, { ...rest, x, scale, tracking });
}
