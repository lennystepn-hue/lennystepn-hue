/**
 * Shared SVG furniture: CRT treatment, arcade panels, bars, starfields and the
 * slot-machine digit roll.
 *
 * Everything here is declarative SVG plus CSS keyframes. No script runs inside
 * these files -- GitHub serves them as images, where scripting is inert.
 */

import { C, mulberry32 } from './theme.mjs';
import { textSvg, textSvgCentered, textWidth, CHAR_H } from './pixelfont.mjs';

export function svgOpen(w, h, { title, desc } = {}) {
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img"${
      title ? ` aria-labelledby="t d"` : ''
    }>`,
    title ? `<title id="t">${esc(title)}</title>` : '',
    desc ? `<desc id="d">${esc(desc)}</desc>` : '',
  ].join('');
}

export const svgClose = () => '</svg>';

export function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Keyframes shared by every asset.
 *
 * Motion is kept slow and low-amplitude on purpose: these loop forever on a
 * profile page, and anything energetic becomes irritating within seconds.
 */
export function baseStyle(extra = '') {
  return `<style>
    .blink   { animation: blink 1.4s steps(1) infinite; }
    .blink-s { animation: blink 2.2s steps(1) infinite; }
    .twinkle { animation: twinkle 3s ease-in-out infinite; }
    .fringe-r{ animation: fringe-r 4.2s ease-in-out infinite; }
    .fringe-b{ animation: fringe-b 4.2s ease-in-out infinite; }
    .crt     { animation: crt-on 620ms cubic-bezier(.2,.8,.2,1) both; transform-box: fill-box; transform-origin: center; }
    .flare   { animation: flare 620ms ease-out both; }
    .beam    { animation: beam 7s linear infinite; }
    .seg     { animation: seg-in 260ms cubic-bezier(.2,.8,.2,1) both; transform-box: fill-box; transform-origin: left center; }
    .roll    { animation: roll 1180ms cubic-bezier(.16,.84,.32,1) both; }
    .rise    { animation: rise 460ms cubic-bezier(.2,.8,.2,1) both; transform-box: fill-box; }
    .type    { animation: type 2.4s steps(40) both; }
    .bob     { animation: bob 1.6s steps(2) infinite; }
    .glowpulse { animation: glowpulse 3.4s ease-in-out infinite; }

    /* Lit far longer than it is dark. An even duty cycle means a screenshot --
       or a glance -- catches an empty gap almost half the time. */
    @keyframes blink   { 0%,74% { opacity:1 } 75%,100% { opacity:0 } }
    @keyframes twinkle { 0%,100% { opacity:.25 } 50% { opacity:1 } }
    @keyframes fringe-r{ 0%,100% { transform:translateX(-1.5px) } 50% { transform:translateX(-3px) } }
    @keyframes fringe-b{ 0%,100% { transform:translateX(1.5px) }  50% { transform:translateX(3px) } }
    @keyframes crt-on  {
      0%   { transform: scaleY(.006) scaleX(1.1); opacity:.2 }
      42%  { transform: scaleY(.02)  scaleX(1);   opacity:.9 }
      70%  { transform: scaleY(1.04) scaleX(.995);opacity:1 }
      100% { transform: scaleY(1)    scaleX(1);   opacity:1 }
    }
    @keyframes flare   { 0% { opacity:.85 } 60% { opacity:.25 } 100% { opacity:0 } }
    @keyframes beam    { 0% { transform:translateY(-40px) } 100% { transform:translateY(var(--h,320px)) } }
    @keyframes seg-in  { from { transform:scaleX(0); opacity:.2 } to { transform:scaleX(1); opacity:1 } }
    @keyframes roll    { from { transform:translateY(var(--from,0px)) } to { transform:translateY(var(--to,0px)) } }
    @keyframes rise    { from { transform:translateY(7px); opacity:0 } to { transform:translateY(0); opacity:1 } }
    @keyframes type    { from { clip-path: inset(0 100% 0 0) } to { clip-path: inset(0 0 0 0) } }
    @keyframes bob     { 0% { transform:translateY(0) } 50% { transform:translateY(-2px) } 100% { transform:translateY(0) } }
    @keyframes glowpulse { 0%,100% { opacity:.30 } 50% { opacity:.60 } }

    @media (prefers-reduced-motion: reduce) {
      .blink,.blink-s,.twinkle,.fringe-r,.fringe-b,.crt,.flare,.beam,
      .seg,.roll,.rise,.type,.bob,.glowpulse { animation: none !important; }
      .type { clip-path: none !important; }
      .crt  { opacity: 1 !important; transform: none !important; }
      .flare{ opacity: 0 !important; }
    }
    ${extra}
  </style>`;
}

/** Bloom, scanline tile and the soft dither used behind panels. */
export function commonDefs({ scanStep = 3, glowRadius = 2.4 } = {}) {
  return `<defs>
    <!-- Filter regions are widened well past the default -10%/120% box, which
         otherwise clips the blur to nothing, and forced to sRGB because the
         SVG default of linearRGB washes warm colours out. -->
    <filter id="bloom" x="-30%" y="-40%" width="160%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="${glowRadius}" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="softbloom" x="-30%" y="-40%" width="160%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur stdDeviation="1.1" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="scan" width="4" height="${scanStep}" patternUnits="userSpaceOnUse">
      <rect width="4" height="1" fill="#000" opacity=".30"/>
    </pattern>
    <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="8" height="1" fill="${C.blue}" opacity=".05"/>
      <rect width="1" height="8" fill="${C.blue}" opacity=".05"/>
    </pattern>
    <linearGradient id="marquee" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${C.marquee[0]}"/>
      <stop offset="42%" stop-color="${C.marquee[1]}"/>
      <stop offset="100%" stop-color="${C.marquee[2]}"/>
    </linearGradient>
    <linearGradient id="beamgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity="0"/>
      <stop offset="50%" stop-color="#fff" stop-opacity=".055"/>
      <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <radialGradient id="vig" cx="50%" cy="48%" r="72%">
      <stop offset="55%" stop-color="#000" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity=".48"/>
    </radialGradient>
  </defs>`;
}

/** Scanlines, travelling beam and vignette. Draw last so it sits over content. */
export function crtOverlay(w, h, { beam = true } = {}) {
  return [
    `<rect width="${w}" height="${h}" fill="url(#scan)"/>`,
    beam
      ? `<rect class="beam" style="--h:${h + 60}px" width="${w}" height="46" fill="url(#beamgrad)"/>`
      : '',
    `<rect width="${w}" height="${h}" fill="url(#vig)"/>`,
  ].join('');
}

/** The white flash of a tube coming to life. */
export function powerOnFlare(w, h) {
  return `<rect class="flare" width="${w}" height="${h}" fill="#fff" opacity="0" style="mix-blend-mode:screen"/>`;
}

export function starfield(w, h, { count = 46, seed = 20250811, exclude = null } = {}) {
  const rnd = mulberry32(seed);
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = Math.round(rnd() * (w - 4)) + 2;
    const y = Math.round(rnd() * (h - 4)) + 2;
    if (exclude && x > exclude.x && x < exclude.x + exclude.w && y > exclude.y && y < exclude.y + exclude.h) {
      continue;
    }
    const size = rnd() < 0.14 ? 2 : 1;
    const delay = (rnd() * 3).toFixed(2);
    const tone = rnd();
    const fill = tone < 0.7 ? C.dim : tone < 0.9 ? C.ink : C.primary;
    out.push(
      `<rect class="twinkle" x="${x}" y="${y}" width="${size}" height="${size}" fill="${fill}" style="animation-delay:${delay}s"/>`,
    );
  }
  return out.join('');
}

/**
 * An arcade UI panel: thin border ring with bracketed corners in the accent
 * colour. Built from rectangles rather than a stroke so edges stay pixel-crisp
 * at any scale.
 */
export function panel(x, y, w, h, opts = {}) {
  const {
    fill = C.panel,
    border = C.dimmer,
    accent = C.primary,
    t = 2,
    corner = 10,
    label = null,
    labelColor = C.bg,
    labelScale = 2,
  } = opts;

  const parts = [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${fill}"/>`,
    `<rect x="${x}" y="${y}" width="${w}" height="${t}" fill="${border}"/>`,
    `<rect x="${x}" y="${y + h - t}" width="${w}" height="${t}" fill="${border}"/>`,
    `<rect x="${x}" y="${y}" width="${t}" height="${h}" fill="${border}"/>`,
    `<rect x="${x + w - t}" y="${y}" width="${t}" height="${h}" fill="${border}"/>`,
  ];

  const corners = [
    [x, y, 1, 1],
    [x + w - corner, y, -1, 1],
    [x, y + h - t, 1, -1],
    [x + w - corner, y + h - t, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    const hx = sx > 0 ? cx : cx + corner - corner;
    parts.push(`<rect x="${hx}" y="${cy}" width="${corner}" height="${t}" fill="${accent}"/>`);
    const vy = sy > 0 ? cy : cy + t - corner;
    const vx = sx > 0 ? cx : cx + corner - t;
    parts.push(`<rect x="${vx}" y="${vy}" width="${t}" height="${corner}" fill="${accent}"/>`);
  }

  if (label) {
    const lw = textWidth(label, labelScale, 1) + 14;
    const lh = CHAR_H * labelScale + 8;
    parts.push(
      `<rect x="${x + 16}" y="${y - Math.floor(lh / 2) + 1}" width="${lw}" height="${lh}" fill="${accent}"/>`,
      textSvg(label, {
        x: x + 16 + 7,
        y: y - Math.floor(lh / 2) + 5,
        scale: labelScale,
        fill: labelColor,
      }),
    );
  }

  return parts.join('');
}

/**
 * A segmented arcade meter. Blocks light up left to right on load, which reads
 * as a value being measured rather than a bar that was simply drawn.
 */
export function segBar(x, y, w, h, pct, opts = {}) {
  const {
    color = C.green,
    empty = C.dimmer,
    segments = 24,
    gap = 2,
    delay = 0,
    stagger = 22,
    animate = true,
  } = opts;

  const segW = (w - gap * (segments - 1)) / segments;
  const clamped = Math.max(0, Math.min(100, pct));
  // A present-but-tiny value gets one block rather than none: an empty meter
  // beside a non-zero label reads as a rendering fault.
  const lit = clamped > 0 ? Math.max(1, Math.round((clamped / 100) * segments)) : 0;
  const out = [];

  for (let i = 0; i < segments; i++) {
    const sx = +(x + i * (segW + gap)).toFixed(2);
    const on = i < lit;
    const cls = on && animate ? ' class="seg"' : '';
    const style = on && animate ? ` style="animation-delay:${delay + i * stagger}ms"` : '';
    out.push(
      `<rect${cls}${style} x="${sx}" y="${y}" width="${segW.toFixed(2)}" height="${h}" fill="${
        on ? color : empty
      }"${on ? '' : ' opacity=".45"'}/>`,
    );
  }
  return out.join('');
}

/**
 * Digits that spin and settle, like a cabinet tallying a score.
 *
 * The real digit sits FIRST in each column, at offset zero, so an untransformed
 * column already shows the truth. The decoys live below it and the animation
 * starts scrolled down among them, rolling up to rest on the real value. Doing
 * it the other way round -- decoys first, target last -- would leave anyone with
 * animations turned off staring at a random number forever.
 */
export function digitRoll(value, opts = {}) {
  const {
    x = 0,
    y = 0,
    scale = 4,
    tracking = 1,
    fill = C.primary,
    width: forceWidth = null,
    spins = 7,
    delay = 0,
    seed = 7,
    id = 'r',
  } = opts;

  const str = forceWidth ? String(value).padStart(forceWidth, ' ') : String(value);
  const cellH = CHAR_H * scale;
  const advance = (5 + tracking) * scale;
  const rnd = mulberry32(seed);
  const out = [`<defs>`];
  const bodies = [];

  [...str].forEach((ch, i) => {
    const cx = x + i * advance;
    const clipId = `${id}c${i}`;
    out.push(
      `<clipPath id="${clipId}"><rect x="${cx}" y="${y}" width="${5 * scale}" height="${cellH}"/></clipPath>`,
    );

    if (ch === ' ') return;

    if (!/[0-9]/.test(ch)) {
      bodies.push(textSvg(ch, { x: cx, y, scale, fill }));
      return;
    }

    const column = [ch];
    for (let s = 0; s < spins; s++) column.push(String(Math.floor(rnd() * 10)));

    const glyphs = column
      .map((d, k) => textSvg(d, { x: cx, y: y + k * cellH, scale }))
      .join('');

    bodies.push(
      `<g clip-path="url(#${clipId})" fill="${fill}">` +
        `<g class="roll" style="--from:-${spins * cellH}px;--to:0px;animation-delay:${
          delay + i * 60
        }ms">${glyphs}</g>` +
        `</g>`,
    );
  });

  out.push('</defs>');
  return out.join('') + bodies.join('');
}

/** Small caption above a value, in the dim tone. */
export function caption(text, { x, y, scale = 1, fill = C.dim, ...rest } = {}) {
  return textSvg(text, { x, y, scale, fill, ...rest });
}

export { textSvg, textSvgCentered, textWidth };
