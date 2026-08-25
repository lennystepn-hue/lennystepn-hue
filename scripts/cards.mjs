/**
 * The five cards that make up the profile.
 *
 * Every card is a self-contained SVG document. Coordinates are hand-placed
 * rather than computed by a layout engine, because the pixel grid only reads as
 * intentional when things land on whole numbers.
 */

import { C, compact, languageAbbr } from './theme.mjs';
import {
  textSvg,
  textSvgCentered,
  textSvgRight,
  textWidth,
  sanitize,
  CHAR_H,
} from './pixelfont.mjs';
import {
  svgOpen,
  svgClose,
  baseStyle,
  commonDefs,
  crtOverlay,
  powerOnFlare,
  starfield,
  panel,
  segBar,
  digitRoll,
} from './fx.mjs';
import { agentSprite, ghostSprite, claudeSprite, pelletRow, AGENT_H, CLAUDE_H } from './sprites.mjs';

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

function wrap(str, maxChars) {
  const words = sanitize(str).split(' ').filter(Boolean);
  const lines = [];
  let cur = '';

  for (let word of words) {
    while (word.length > maxChars) {
      if (cur) {
        lines.push(cur);
        cur = '';
      }
      lines.push(word.slice(0, maxChars - 1) + '-');
      word = word.slice(maxChars - 1);
    }
    if (!cur) cur = word;
    else if (cur.length + 1 + word.length <= maxChars) cur += ' ' + word;
    else {
      lines.push(cur);
      cur = word;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Trim to `max` lines, ending on a whole word where one is close enough. */
function clampLines(lines, max) {
  if (lines.length <= max) return lines;
  const kept = lines.slice(0, max);
  let last = kept[max - 1];
  const cut = last.lastIndexOf(' ');
  last = cut > last.length * 0.5 ? last.slice(0, cut) : last.slice(0, Math.max(0, last.length - 3));
  kept[max - 1] = last.replace(/[\s,.;:-]+$/, '') + '...';
  return kept;
}

/** A bracketed readout: dim label above, bright value below. */
function chip(x, y, w, h, label, value, { accent = C.primary, valueScale = 3 } = {}) {
  return [
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.panel}"/>`,
    `<rect x="${x}" y="${y}" width="3" height="${h}" fill="${accent}"/>`,
    textSvg(label, { x: x + 14, y: y + 7, scale: 2, fill: C.dim }),
    textSvg(value, { x: x + 14, y: y + 7 + CHAR_H * 2 + 6, scale: valueScale, fill: C.ink }),
  ].join('');
}

// ---------------------------------------------------------------------------
// 1. Hero — the cabinet in attract mode
// ---------------------------------------------------------------------------

export function renderHero(d, cfg = {}) {
  const W = 900;
  const H = 360;

  // Both the name and the tagline are author-supplied and can be any length, so
  // each picks the largest size that still fits rather than trusting a constant.
  const name = sanitize(d.name);
  let titleScale = 10;
  while (titleScale > 4 && textWidth(name, titleScale, 1) > W - 80) titleScale -= 1;
  const titleW = textWidth(name, titleScale, 1);
  const titleX = Math.round((W - titleW) / 2);
  const titleY = 70;
  const titleH = CHAR_H * titleScale;

  const tagline = sanitize(cfg.tagline ?? 'BUILDING THINGS THAT SHIP');
  let tagScale = 3;
  while (tagScale > 1 && textWidth(tagline, tagScale, 1) > W - 60) tagScale -= 1;

  const chips = [
    ['PROJECTS', String(d.repoCount)],
    ['CONTRIBUTIONS', compact(d.contributions.total)],
    ['STARS', String(d.totalStars)],
  ];
  const chipW = 186;
  const chipGap = 18;
  const chipsTotal = chips.length * chipW + (chips.length - 1) * chipGap;
  const chipX0 = Math.round((W - chipsTotal) / 2);
  const chipY = 216;

  const groundY = 344;
  const spriteScale = 3;

  return [
    svgOpen(W, H, {
      title: `${d.name} — GitHub profile`,
      desc: `An arcade cabinet in attract mode. ${tagline}. ${d.repoCount} public projects, ${d.contributions.total} contributions in the last year, ${d.totalStars} stars.`,
    }),
    baseStyle(),
    commonDefs({ glowRadius: 2.6 }),

    // The title is defined once and instantiated three times: two offset colour
    // copies for the chromatic fringe, then the real one on top.
    `<defs>${textSvg(name, { id: 'ttl', x: titleX, y: titleY, scale: titleScale })}</defs>`,

    `<g class="crt">`,
    `<rect width="${W}" height="${H}" fill="${C.bgDeep}"/>`,
    `<rect width="${W}" height="${H}" fill="url(#grid)"/>`,
    starfield(W, H, {
      count: 62,
      seed: 8110825,
      exclude: { x: titleX - 20, y: titleY - 12, w: titleW + 40, h: titleH + 24 },
    }),

    // Top status strip, the way a cabinet shows credits and the day's best.
    textSvg('1UP', { x: 32, y: 22, scale: 2, fill: C.red }),
    textSvg(String(d.contributions.total), { x: 32, y: 40, scale: 2, fill: C.ink }),
    textSvgRight('HI-SCORE', { rx: W - 32, y: 22, scale: 2, fill: C.magenta }),
    textSvgRight(`${d.followers} FOLLOWERS`, { rx: W - 32, y: 40, scale: 2, fill: C.ink }),

    `<use href="#ttl" class="fringe-r" fill="${C.red}" style="mix-blend-mode:screen"/>`,
    `<use href="#ttl" class="fringe-b" fill="${C.blue}" style="mix-blend-mode:screen"/>`,
    `<use href="#ttl" fill="url(#marquee)" filter="url(#bloom)"/>`,

    // Rule with end-notches, like a marquee bezel.
    `<rect x="210" y="${titleY + titleH + 18}" width="480" height="2" fill="${C.primaryDeep}"/>`,
    `<rect x="204" y="${titleY + titleH + 14}" width="4" height="10" fill="${C.primary}"/>`,
    `<rect x="692" y="${titleY + titleH + 14}" width="4" height="10" fill="${C.primary}"/>`,

    `<g class="type">${textSvgCentered(tagline, {
      cx: W / 2,
      y: 176,
      scale: tagScale,
      fill: C.ink,
      opacity: 0.92,
    })}</g>`,

    chips
      .map(([label, value], i) =>
        chip(chipX0 + i * (chipW + chipGap), chipY, chipW, 54, label, value, {
          accent: [C.primary, C.magenta, C.green][i],
        }),
      )
      .join(''),

    // The invitation stays centred, where a cabinet puts it. The chase gets its
    // own band underneath rather than sharing the line, so the two never read as
    // one crowded row. Pellets stop where the agent has not reached yet, which
    // is what makes the scene read as motion instead of scenery.
    `<g class="blink">${textSvgCentered('▶ PRESS START ◀', {
      cx: W / 2,
      y: 284,
      scale: 3,
      fill: C.primary,
    })}</g>`,

    `<rect x="0" y="${groundY}" width="${W}" height="2" fill="${C.dimmer}" opacity=".7"/>`,
    ghostSprite({
      x: 96,
      y: groundY - 10 * spriteScale,
      scale: spriteScale,
      className: 'bob',
      style: 'animation-delay:.38s',
    }),
    agentSprite({
      x: 186,
      y: groundY - AGENT_H * spriteScale,
      scale: spriteScale,
      className: 'bob',
    }),
    pelletRow({ x: 250, y: groundY - 10, count: 28, step: 22, size: 3, fill: C.dim }),

    crtOverlay(W, H),
    powerOnFlare(W, H),
    `</g>`,
    svgClose(),
  ].join('');
}

// ---------------------------------------------------------------------------
// 2. Player card — the character sheet
// ---------------------------------------------------------------------------

export function renderPlayer(d, cfg = {}) {
  const W = 900;
  const H = 296;

  // Four hard counts rather than ratio meters -- a "3 of 30 days" bar is an
  // accurate way to make a year of real output look like an idle account.
  //
  // Every figure here is derived from the contribution calendar, so it reads the
  // same whoever generated it. The commit/PR/issue split would be the obvious
  // choice, but GraphQL reports those relative to the requesting token, and the
  // nightly workflow's token sees several hundred fewer than a local one.
  const stats = [
    ['ACTIVE DAYS', String(d.contributions.activeDays), C.green],
    ['BEST DAY', String(d.contributions.bestDay), C.primary],
    ['LANGUAGES', String(d.languageCount), C.magenta],
    ['PER WEEK', String(d.contributions.perWeek), C.blue],
  ];
  const statW = 196;
  const statGap = 12;

  const avatarBox = { x: 40, y: 62, w: 116, h: 116 };
  const agentScale = 9;
  const agentW = 10 * agentScale;
  const agentH = AGENT_H * agentScale;

  const identityX = 190;

  // The headline numbers grow as the account does: a four-digit score is 60%
  // wider than a three-digit one, and a fixed origin sends it off the card the
  // day it crosses 1000. Lay the pair out from the right edge instead, stepping
  // the scale down until it fits the space the identity column leaves.
  const numbersRight = 862;
  const numbersLeft = 528;
  const numberGap = 38;
  const lvlText = String(d.repoCount);
  const scoreText = String(d.contributions.total);

  let numScale = 7;
  while (
    numScale > 4 &&
    textWidth(lvlText, numScale, 1) + numberGap + textWidth(scoreText, numScale, 1) >
      numbersRight - numbersLeft
  ) {
    numScale -= 1;
  }
  const scoreX = numbersRight - textWidth(scoreText, numScale, 1);
  const lvlX = scoreX - numberGap - textWidth(lvlText, numScale, 1);

  const home = d.websiteUrl ? d.websiteUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : d.login;

  return [
    svgOpen(W, H, {
      title: 'Player card',
      desc: `Level ${d.repoCount}, score ${d.contributions.total}, active on ${d.streak.activeLast30} of the last ${d.streak.windowDays} days.`,
    }),
    baseStyle(),
    commonDefs(),

    `<g class="crt">`,
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>`,
    starfield(W, H, { count: 24, seed: 4242 }),
    panel(16, 32, 868, 248, { label: 'PLAYER 01' }),

    // Portrait slot
    `<rect x="${avatarBox.x}" y="${avatarBox.y}" width="${avatarBox.w}" height="${avatarBox.h}" fill="${C.bgDeep}"/>`,
    `<rect x="${avatarBox.x}" y="${avatarBox.y}" width="${avatarBox.w}" height="2" fill="${C.dimmer}"/>`,
    `<rect x="${avatarBox.x}" y="${avatarBox.y + avatarBox.h - 2}" width="${avatarBox.w}" height="2" fill="${C.dimmer}"/>`,
    `<rect x="${avatarBox.x}" y="${avatarBox.y}" width="2" height="${avatarBox.h}" fill="${C.dimmer}"/>`,
    `<rect x="${avatarBox.x + avatarBox.w - 2}" y="${avatarBox.y}" width="2" height="${avatarBox.h}" fill="${C.dimmer}"/>`,
    agentSprite({
      x: avatarBox.x + Math.round((avatarBox.w - agentW) / 2),
      y: avatarBox.y + Math.round((avatarBox.h - agentH) / 2),
      scale: agentScale,
      className: 'bob',
    }),
    textSvgCentered('READY', {
      cx: avatarBox.x + avatarBox.w / 2,
      y: avatarBox.y + avatarBox.h + 12,
      scale: 2,
      fill: C.green,
      className: 'blink-s',
    }),

    // Identity
    textSvg('PLAYER', { x: identityX, y: 66, scale: 2, fill: C.dim }),
    textSvg(d.name, { x: identityX, y: 84, scale: 4, fill: C.primary }),
    textSvg('CLASS', { x: identityX, y: 128, scale: 2, fill: C.dim }),
    textSvg(cfg.playerClass ?? 'SOFTWARE ENGINEER', {
      x: identityX,
      y: 146,
      scale: 3,
      fill: C.ink,
    }),
    textSvg('HOME', { x: identityX, y: 176, scale: 2, fill: C.dim }),
    textSvg(home, { x: identityX, y: 192, scale: 2, fill: C.blue }),

    // Headline numbers, spun up like a cabinet tallying a score
    textSvg('LVL', { x: lvlX, y: 66, scale: 2, fill: C.dim }),
    digitRoll(lvlText, {
      x: lvlX,
      y: 84,
      scale: numScale,
      fill: C.green,
      id: 'lvl',
      seed: 11,
      delay: 120,
    }),
    textSvg('SCORE', { x: scoreX, y: 66, scale: 2, fill: C.dim }),
    digitRoll(scoreText, {
      x: scoreX,
      y: 84,
      scale: numScale,
      fill: C.primary,
      id: 'scr',
      seed: 29,
      delay: 220,
    }),

    stats
      .map(([label, value, accent], i) =>
        chip(40 + i * (statW + statGap), 214, statW, 52, label, value, { accent }),
      )
      .join(''),

    crtOverlay(W, H, { beam: false }),
    `</g>`,
    svgClose(),
  ].join('');
}

// ---------------------------------------------------------------------------
// 3. Loadout — languages by bytes
// ---------------------------------------------------------------------------

export function renderStack(d) {
  const W = 900;
  const H = 262;
  const langs = d.languages.slice(0, 8);
  const top = langs[0]?.pct ?? 100;

  const cols = [44, 470];
  const colW = 386;
  const rowY = [86, 124, 162, 200];

  const rows = langs
    .map((lang, i) => {
      const x = cols[i % 2];
      const y = rowY[Math.floor(i / 2)];
      // Bars are scaled against the leading language on a square-root curve.
      // Linear scaling against a 56%-dominant language leaves everything below
      // fourth place as an empty track; the exact figure sits alongside, so the
      // compression costs no accuracy.
      const relative = Math.sqrt(lang.pct / top) * 100;
      return [
        `<rect x="${x}" y="${y}" width="12" height="12" fill="${lang.color}"/>`,
        textSvg(languageAbbr(lang.name), { x: x + 24, y: y + 1, scale: 2, fill: C.ink }),
        segBar(x + 150, y + 1, 160, 11, relative, {
          color: lang.color,
          segments: 16,
          delay: 200 + i * 70,
        }),
        textSvgRight(`${lang.pct.toFixed(1)}%`, {
          rx: x + colW,
          y: y + 1,
          scale: 2,
          fill: C.dim,
        }),
      ].join('');
    })
    .join('');

  return [
    svgOpen(W, H, {
      title: 'Loadout',
      desc: `Top languages by bytes across ${d.repoCount} public repositories.`,
    }),
    baseStyle(),
    commonDefs(),

    `<g class="crt">`,
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>`,
    starfield(W, H, { count: 20, seed: 999 }),
    panel(16, 32, 868, 200, { label: 'LOADOUT', accent: C.magenta }),
    textSvg(`BY BYTES ACROSS ${d.repoCount} PUBLIC REPOSITORIES`, {
      x: 44,
      y: 58,
      scale: 2,
      fill: C.dim,
    }),
    rows,
    crtOverlay(W, H, { beam: false }),
    `</g>`,
    svgClose(),
  ].join('');
}

// ---------------------------------------------------------------------------
// 4. Select your game — featured projects
// ---------------------------------------------------------------------------

export function renderSelect(d) {
  const W = 900;
  const cardW = 422;
  const cardH = 138;
  const gapX = 20;
  const gapY = 16;
  const startY = 86;
  const projects = d.featured.slice(0, 6);
  const rowsCount = Math.ceil(projects.length / 2);
  const H = startY + rowsCount * cardH + (rowsCount - 1) * gapY + 24;

  const cards = projects
    .map((p, i) => {
      const cx = 16 + (i % 2) * (cardW + gapX);
      const cy = startY + Math.floor(i / 2) * (cardH + gapY);

      const nameScale = sanitize(p.name).length > 17 ? 2 : 3;
      const descLines = clampLines(wrap(p.description, 32), 3);
      const accent = [C.primary, C.magenta, C.green, C.blue, C.violet, C.red][i % 6];

      return [
        panel(cx, cy, cardW, cardH, { accent, corner: 8, t: 2 }),
        `<rect x="${cx + 2}" y="${cy + 2}" width="4" height="${cardH - 4}" fill="${accent}" opacity=".55"/>`,

        textSvg(`${i + 1}P`, { x: cx + 16, y: cy + 14, scale: 2, fill: C.dimmer }),
        textSvg(p.name, { x: cx + 48, y: cy + 12, scale: nameScale, fill: accent }),

        descLines
          .map((line, li) =>
            textSvg(line, { x: cx + 16, y: cy + 48 + li * 18, scale: 2, fill: C.ink, opacity: 0.78 }),
          )
          .join(''),

        `<rect x="${cx + 16}" y="${cy + 106}" width="${cardW - 32}" height="1" fill="${C.dimmer}" opacity=".5"/>`,

        p.language
          ? `<rect x="${cx + 16}" y="${cy + 117}" width="9" height="9" fill="${
              d.languages.find((l) => l.name === p.language)?.color ?? C.dim
            }"/>` + textSvg(p.language, { x: cx + 32, y: cy + 116, scale: 2, fill: C.dim })
          : '',

        p.stars > 0
          ? textSvgRight(`★ ${p.stars}`, {
              rx: cx + cardW - 16,
              y: cy + 116,
              scale: 2,
              fill: C.primary,
            })
          : textSvgRight('NEW', { rx: cx + cardW - 16, y: cy + 116, scale: 2, fill: C.green }),
      ].join('');
    })
    .join('');

  return [
    svgOpen(W, H, {
      title: 'Select your game',
      desc: `Featured projects: ${projects.map((p) => p.name).join(', ')}.`,
    }),
    baseStyle(),
    commonDefs(),

    `<g class="crt">`,
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>`,
    starfield(W, H, { count: 30, seed: 31337 }),

    textSvgCentered('SELECT YOUR GAME', { cx: W / 2, y: 26, scale: 4, fill: C.primary }),
    `<g class="blink-s">${textSvgCentered(
      `${projects.length} OF ${d.repoCount} CABINETS ON THE FLOOR  ·  INSERT COIN`,
      { cx: W / 2, y: 62, scale: 2, fill: C.dim },
    )}</g>`,

    cards,
    crtOverlay(W, H, { beam: false }),
    `</g>`,
    svgClose(),
  ].join('');
}

// ---------------------------------------------------------------------------
// 6. Credits strip
// ---------------------------------------------------------------------------

export function renderFooter(d, cfg = {}) {
  const W = 900;
  const H = 112;
  const templateRepo = cfg.templateRepo ?? `${d.login}/${d.login}`;

  const spriteScale = 5;
  const spriteX = 44;
  const spriteY = 26 + Math.round((72 - CLAUDE_H * spriteScale) / 2);

  return [
    svgOpen(W, H, {
      title: 'Credits',
      desc: `Built with Claude Code. Template available at github.com/${templateRepo}.`,
    }),
    baseStyle(),
    commonDefs(),

    `<g class="crt">`,
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>`,
    starfield(W, H, { count: 14, seed: 606 }),
    panel(16, 26, 868, 72, { label: 'CREDITS', accent: C.claude }),

    claudeSprite({ x: spriteX, y: spriteY, scale: spriteScale, className: 'bob' }),

    textSvg('BUILT WITH', { x: 130, y: 46, scale: 2, fill: C.dim }),
    textSvg('CLAUDE CODE', { x: 130, y: 64, scale: 3, fill: C.claude }),

    textSvgRight('USE THIS TEMPLATE', { rx: 856, y: 46, scale: 2, fill: C.dim }),
    textSvgRight(`GITHUB.COM/${templateRepo}`, { rx: 856, y: 66, scale: 2, fill: C.blue }),

    crtOverlay(W, H, { beam: false }),
    `</g>`,
    svgClose(),
  ].join('');
}

// ---------------------------------------------------------------------------
// 5. Contribution map
// ---------------------------------------------------------------------------

const MONTHS =['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

export function renderGrid(d) {
  const W = 900;
  const H = 208;
  const cell = 13;
  const gap = 2;
  const pitch = cell + gap;
  const originX = 56;
  const originY = 64;

  const weeks = d.weeks;

  const cells = weeks
    .map((week, wi) =>
      week
        .map((day) => {
          // GitHub's own bucketing, carried through from the profile page --
          // deriving levels from a local maximum washes the graph out whenever
          // a single busy day dwarfs the rest.
          const level = day.level ?? 0;
          const x = originX + wi * pitch;
          const y = originY + day.weekday * pitch;
          const delay = wi * 11 + day.weekday * 4;
          return `<rect class="rise" style="animation-delay:${delay}ms" x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${C.ramp[level]}"/>`;
        })
        .join(''),
    )
    .join('');

  // Label the first week that actually begins inside a month. Labelling the
  // first week that merely touches it puts two labels one column apart at the
  // partial week the calendar opens on.
  const monthLabels = [];
  let lastMonth = -1;
  weeks.forEach((week, wi) => {
    const first = week.find(Boolean);
    if (!first) return;
    const date = new Date(first.date);
    const month = date.getUTCMonth();
    if (month === lastMonth || date.getUTCDate() > 7 || wi > weeks.length - 3) return;
    lastMonth = month;
    monthLabels.push(
      textSvg(MONTHS[month], { x: originX + wi * pitch, y: 46, scale: 2, fill: C.dim }),
    );
  });

  const dayLabels = [
    [1, 'MON'],
    [3, 'WED'],
    [5, 'FRI'],
  ]
    .map(([row, label]) =>
      textSvg(label, { x: 12, y: originY + row * pitch + 2, scale: 2, fill: C.dimmer }),
    )
    .join('');

  const legendX = W - 250;
  const legendY = H - 26;
  const legend = [
    textSvg('LESS', { x: legendX, y: legendY, scale: 2, fill: C.dim }),
    C.ramp.map(
      (col, i) =>
        `<rect x="${legendX + 46 + i * 14}" y="${legendY - 1}" width="11" height="11" fill="${col}"/>`,
    ).join(''),
    textSvg('MORE', { x: legendX + 46 + C.ramp.length * 14 + 6, y: legendY, scale: 2, fill: C.dim }),
  ].join('');

  return [
    svgOpen(W, H, {
      title: 'Contribution map',
      desc: `${d.contributions.total} contributions over the last year, active on ${d.contributions.activeDays} days.`,
    }),
    baseStyle(),
    commonDefs(),

    `<g class="crt">`,
    `<rect width="${W}" height="${H}" fill="${C.bg}"/>`,

    textSvg('CONTRIBUTION MAP', { x: 16, y: 18, scale: 3, fill: C.primary }),
    textSvgRight(
      `${d.contributions.total} CONTRIBUTIONS  ·  ${d.contributions.activeDays} ACTIVE DAYS`,
      { rx: W - 16, y: 22, scale: 2, fill: C.dim },
    ),

    monthLabels.join(''),
    dayLabels,
    cells,
    legend,

    crtOverlay(W, H, { beam: false }),
    `</g>`,
    svgClose(),
  ].join('');
}
