/**
 * Pixel sprites, drawn as layered bitmaps.
 *
 * Each sprite is a solid body plus punch-through layers for features. Drawing
 * an outline and leaving the middle empty would let the page background show
 * through, which reads as hollow rather than solid on a dark canvas.
 */

import { C } from './theme.mjs';
import { rectsToPath } from './pixelfont.mjs';

/** Run-length-merged path data for any '#'/'.'-style bitmap. */
export function bitmapSvg(rows, { x = 0, y = 0, scale = 1, fill, opacity, className, style } = {}) {
  const rects = [];
  rows.forEach((bits, row) => {
    let col = 0;
    while (col < bits.length) {
      if (bits[col] !== '#') {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < bits.length && bits[col + run] === '#') run++;
      rects.push({ x: x + col * scale, y: y + row * scale, w: run * scale, h: scale });
      col += run;
    }
  });

  const d = rectsToPath(rects);
  if (!d) return '';

  const attrs = [
    className ? `class="${className}"` : '',
    style ? `style="${style}"` : '',
    fill ? `fill="${fill}"` : '',
    opacity != null ? `opacity="${opacity}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<path ${attrs} d="${d}"/>`;
}

// ---------------------------------------------------------------------------
// The agent: this profile's player character, and a nod to the account's
// autonomous-agent projects.
// ---------------------------------------------------------------------------

const AGENT_BODY = [
  '..#....#..',
  '..#....#..',
  '.########.',
  '##########',
  '##########',
  '##########',
  '##########',
  '.########.',
  '..######..',
  '.##....##.',
  '.##....##.',
];

const AGENT_CUT = [
  '..........',
  '..........',
  '..........',
  '..##..##..',
  '..##..##..',
  '..........',
  '...####...',
  '..........',
  '..........',
  '..........',
  '..........',
];

const AGENT_PUPIL = [
  '..........',
  '..........',
  '..........',
  '..........',
  '...#...#..',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

export function agentSprite({
  x = 0,
  y = 0,
  scale = 4,
  body = C.amber,
  cut = C.bgDeep,
  pupil = C.green,
  className,
  style,
} = {}) {
  return (
    `<g${className ? ` class="${className}"` : ''}${style ? ` style="${style}"` : ''}>` +
    bitmapSvg(AGENT_BODY, { x, y, scale, fill: body }) +
    bitmapSvg(AGENT_CUT, { x, y, scale, fill: cut }) +
    bitmapSvg(AGENT_PUPIL, { x, y, scale, fill: pupil }) +
    `</g>`
  );
}

export const AGENT_W = 10;
export const AGENT_H = 11;

// ---------------------------------------------------------------------------
// The pursuer. Every cabinet needs something chasing you.
// ---------------------------------------------------------------------------

const GHOST_BODY = [
  '..######..',
  '.########.',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '##########',
  '#.##..##.#',
];

const GHOST_CUT = [
  '..........',
  '..........',
  '..##..##..',
  '..##..##..',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

const GHOST_PUPIL = [
  '..........',
  '..........',
  '..........',
  '...#...#..',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
  '..........',
];

export function ghostSprite({
  x = 0,
  y = 0,
  scale = 4,
  body = C.magenta,
  cut = C.ink,
  pupil = C.bgDeep,
  className,
  style,
} = {}) {
  return (
    `<g${className ? ` class="${className}"` : ''}${style ? ` style="${style}"` : ''}>` +
    bitmapSvg(GHOST_BODY, { x, y, scale, fill: body }) +
    bitmapSvg(GHOST_CUT, { x, y, scale, fill: cut }) +
    bitmapSvg(GHOST_PUPIL, { x, y, scale, fill: pupil }) +
    `</g>`
  );
}

export const GHOST_W = 10;
export const GHOST_H = 10;

// ---------------------------------------------------------------------------
// Pellets for the agent to run along, and a coin for the credits line.
// ---------------------------------------------------------------------------

export function pelletRow({ x, y, count, step, size = 2, fill = C.dimmer }) {
  const out = [];
  for (let i = 0; i < count; i++) {
    out.push(`<rect x="${x + i * step}" y="${y}" width="${size}" height="${size}" fill="${fill}"/>`);
  }
  return out.join('');
}

const COIN = [
  '.####.',
  '#.##.#',
  '#.##.#',
  '#.##.#',
  '#.##.#',
  '.####.',
];

export function coinSprite({ x = 0, y = 0, scale = 2, fill = C.amber, className, style } = {}) {
  return bitmapSvg(COIN, { x, y, scale, fill, className, style });
}
