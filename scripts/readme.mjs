/**
 * Builds README.md from the same snapshot the cards are drawn from, so the
 * project links under the cabinet screen can never drift out of sync with the
 * projects drawn on it.
 *
 * Two rendering constraints shape the markup:
 *   - GitHub strips `class`, `style`, `srcset` and `loading` from <img>. Only
 *     `width` survives, and supplying `height` makes GitHub inject a max-height,
 *     so width alone is the predictable choice.
 *   - Hyperlinks inside an SVG are inert when it is embedded as an image, which
 *     is why every project on the cabinet screen also gets a real text link.
 */

const badge = (label, message, color) =>
  `https://img.shields.io/badge/${encodeURIComponent(label)}-${encodeURIComponent(
    message.replace(/-/g, '--').replace(/_/g, '__'),
  )}-${color}?style=for-the-badge&labelColor=14101f`;

const img = (src, alt, width = 900) => `<img src="${src}" alt="${alt}" width="${width}">`;

const centred = (body) => `<div align="center">\n\n${body}\n\n</div>`;

/** Join names the way a sentence does: "A, B and C". */
function list(names) {
  if (names.length <= 1) return names[0] ?? '';
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Expand the {{...}} tokens available inside about/currently prose.
 *
 * These exist so the config stays portable: someone can copy a paragraph
 * between accounts, or rename themselves, without hand-editing a dozen URLs.
 */
export function expand(text, d, cfg) {
  const site = d.websiteUrl?.replace(/\/$/, '') ?? d.url;
  const siteLabel = site.replace(/^https?:\/\//, '');

  return String(text)
    .replace(
      /\{\{repo:([A-Za-z0-9._-]+)\}\}/g,
      (_, name) => `[\`${name}\`](https://github.com/${cfg.login}/${name})`,
    )
    .replace(/\{\{login\}\}/g, d.login)
    .replace(/\{\{name\}\}/g, d.name)
    .replace(/\{\{site\}\}/g, `[${siteLabel}](${site})`)
    .replace(/\{\{siteUrl\}\}/g, site)
    .replace(/\{\{repoCount\}\}/g, String(d.repoCount))
    .replace(/\{\{contributions\}\}/g, String(d.contributions.total))
    .replace(/\{\{stars\}\}/g, String(d.totalStars))
    .replace(/\{\{followers\}\}/g, String(d.followers))
    .replace(/\{\{languageCount\}\}/g, String(d.languageCount))
    .replace(/\{\{topLanguages\}\}/g, list(d.languages.slice(0, 3).map((l) => l.name)));
}

function linkBadges(d, cfg) {
  const site = d.websiteUrl?.replace(/\/$/, '') ?? d.url;
  const siteLabel = site.replace(/^https?:\/\//, '');

  const rows = [
    cfg.links.website && d.websiteUrl
      ? [badge('WEBSITE', siteLabel, 'ffb627'), site, 'Website']
      : null,
    cfg.links.x && d.twitterUsername
      ? [badge('X', `@${d.twitterUsername}`, 'ff5da2'), `https://x.com/${d.twitterUsername}`, 'X']
      : null,
    cfg.links.followers
      ? [
          `https://img.shields.io/github/followers/${d.login}?style=for-the-badge&label=FOLLOWERS&color=7ee787&labelColor=14101f`,
          `${d.url}?tab=followers`,
          'Followers',
        ]
      : null,
    cfg.links.stars
      ? [
          `https://img.shields.io/github/stars/${d.login}?style=for-the-badge&label=STARS&color=4d9bff&labelColor=14101f`,
          `${d.url}?tab=repositories`,
          'Stars',
        ]
      : null,
  ].filter(Boolean);

  return rows.map(([src, href, alt]) => `<a href="${href}"><img src="${src}" alt="${alt}"></a>`);
}

/** Alt text per card, written to be useful when read aloud rather than seen. */
const ALT = {
  hero: (d, cfg) => `${d.name} — ${cfg.tagline.toLowerCase()}`,
  player: (d) =>
    `Player card: level ${d.repoCount}, score ${d.contributions.total}, active on ${d.contributions.activeDays} days in the last year`,
  stack: (d) =>
    `Loadout: top languages by bytes — ${d.languages.slice(0, 4).map((l) => l.name).join(', ')}`,
  select: (d) => `Featured projects: ${d.featured.map((p) => p.name).join(', ')}`,
  grid: (d) =>
    `Contribution map: ${d.contributions.total} contributions in the last year, active on ${d.contributions.activeDays} days`,
  footer: (d, cfg) => `Built with Claude Code. Template at github.com/${cfg.templateRepo}`,
};

export function renderReadme(d, cfg) {
  const site = d.websiteUrl?.replace(/\/$/, '') ?? d.url;
  const show = (card) => cfg.cards.includes(card);

  const blocks = [];

  if (show('hero')) {
    blocks.push(
      centred(
        `<a href="${site}">${img('assets/hero.svg', ALT.hero(d, cfg))}</a>\n\n` +
          linkBadges(d, cfg).join('\n'),
      ),
    );
  }

  for (const card of ['player', 'stack']) {
    if (show(card)) blocks.push(centred(img(`assets/${card}.svg`, ALT[card](d, cfg))));
  }

  if (show('select')) {
    const links = d.featured
      .map((p) => `[\`${p.name}\`](${p.url})`)
      .join(' · ');
    blocks.push(
      centred(
        `${img('assets/select.svg', ALT.select(d, cfg))}\n\n` +
          `**▶ PLAY** &nbsp;&nbsp; ${links}\n\n` +
          `<sub>All ${d.repoCount} public repositories → ` +
          `[github.com/${d.login}?tab=repositories](${d.url}?tab=repositories)</sub>`,
      ),
    );
  }

  if (show('grid')) blocks.push(centred(img('assets/grid.svg', ALT.grid(d, cfg))));

  const prose = [];
  const aboutBody = cfg.about.body.filter(Boolean);
  if (aboutBody.length) {
    prose.push(`### ▸ ${cfg.about.heading}\n`);
    prose.push(aboutBody.map((p) => expand(p, d, cfg)).join('\n\n'));
  }
  const currentlyBody = cfg.currently.body.filter(Boolean);
  if (currentlyBody.length) {
    prose.push(`\n### ▸ ${cfg.currently.heading}\n`);
    prose.push(currentlyBody.map((p) => expand(p, d, cfg)).join('\n\n'));
  }
  if (prose.length) blocks.push(`---\n\n${prose.join('\n')}`);

  if (show('footer')) {
    blocks.push(
      centred(
        `<a href="https://github.com/${cfg.templateRepo}">` +
          `${img('assets/footer.svg', ALT.footer(d, cfg))}</a>`,
      ),
    );
  }

  if (cfg.showTemplateCredit) {
    blocks.push(
      centred(
        `<sub>\n` +
          `  Every number above is real, and re-rendered from the GitHub API each night by a\n` +
          `  workflow in this repository. The artwork is drawn pixel by pixel from a hand-built\n` +
          `  5×7 font, with no image editor involved.\n` +
          `  <br>\n` +
          `  <a href="HOW-IT-WORKS.md">How it works</a> · ` +
          `<a href="SETUP.md">Use this template for your own profile</a>\n` +
          `</sub>`,
      ),
    );
  }

  return (
    `<!--\n` +
    `  This file is generated. Edit profile.config.json (or scripts/) and run\n` +
    `  \`npm run build\`. Hand edits here are overwritten by the nightly workflow.\n` +
    `  See SETUP.md to use this as a template for your own profile.\n` +
    `-->\n\n` +
    blocks.join('\n\n<br>\n\n') +
    '\n'
  );
}
