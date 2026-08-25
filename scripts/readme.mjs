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

const img = (src, alt, width = 900) =>
  `<img src="${src}" alt="${alt}" width="${width}">`;

export function renderReadme(d) {
  const site = d.websiteUrl?.replace(/\/$/, '') ?? d.url;
  const siteLabel = site.replace(/^https?:\/\//, '');

  const links = [
    [badge('WEBSITE', siteLabel, 'ffb627'), site, 'Website'],
    d.twitterUsername
      ? [badge('X', `@${d.twitterUsername}`, 'ff5da2'), `https://x.com/${d.twitterUsername}`, 'X']
      : null,
    [
      `https://img.shields.io/github/followers/${d.login}?style=for-the-badge&label=FOLLOWERS&color=7ee787&labelColor=14101f`,
      `${d.url}?tab=followers`,
      'Followers',
    ],
    [
      `https://img.shields.io/github/stars/${d.login}?style=for-the-badge&label=STARS&color=4d9bff&labelColor=14101f`,
      `${d.url}?tab=repositories`,
      'Stars',
    ],
  ].filter(Boolean);

  const projectLinks = d.featured
    .map((p) => `[\`${p.name}\`](${p.url})`)
    .join(' · ');

  const topLangs = d.languages
    .slice(0, 4)
    .map((l) => l.name)
    .join(', ');

  const repo = (name) => `[\`${name}\`](https://github.com/${d.login}/${name})`;
  const [first, second] = d.languages.map((l) => l.name);
  const systems = ['Go', 'Rust'].filter((l) => d.languages.some((x) => x.name === l));
  const systemsLine = systems.length
    ? `, reaching for ${systems.join(' and ')} when a single fast binary is the right answer`
    : '';

  return `<!--
  This file is generated. Edit scripts/ and run \`npm run build\` instead.
  See HOW-IT-WORKS.md for what is going on here.
-->

<div align="center">

<a href="${site}">${img('assets/hero.svg', `${d.name} — building autonomous agents that actually ship`)}</a>

${links.map(([src, href, alt]) => `<a href="${href}"><img src="${src}" alt="${alt}"></a>`).join('\n')}

</div>

<br>

<div align="center">

${img('assets/player.svg', `Player card: level ${d.repoCount}, score ${d.contributions.total}, active on ${d.contributions.activeDays} days in the last year`)}

</div>

<br>

<div align="center">

${img('assets/stack.svg', `Loadout: top languages by bytes — ${topLangs}`)}

</div>

<br>

<div align="center">

${img('assets/select.svg', `Featured projects: ${d.featured.map((p) => p.name).join(', ')}`)}

**▶ PLAY** &nbsp;&nbsp; ${projectLinks}

<sub>All ${d.repoCount} public repositories → [github.com/${d.login}?tab=repositories](${d.url}?tab=repositories)</sub>

</div>

<br>

<div align="center">

${img('assets/grid.svg', `Contribution map: ${d.contributions.total} contributions in the last year, active on ${d.contributions.activeDays} days`)}

</div>

---

### ▸ About

I build infrastructure for autonomous AI agents, and small products that get from
idea to production fast. ${d.repoCount} public repositories in my first year on GitHub,
most of them running somewhere real rather than sitting in a drawer.

The work falls into two piles.

**Agent infrastructure** — making it practical, and safe, to actually run AI agents.
${repo('clawshield')} is a security layer for them: one binary, zero config, 50+ checks.
${repo('vibecell')} keeps the state of everything you are shipping in one place and wires
it straight into Claude Code over MCP. ${repo('butlr-openclaw-platform')} turns OpenClaw
into a managed service, with dedicated VMs and billing attached.

**Products with a job to do** — ${repo('schichtplaner')} is open-source shift planning
with real-time collaboration and self-hosting. ${repo('agentcheck')} tells you whether
ChatGPT, Claude and Perplexity can find your website at all. ${repo('MenuMagic')} turns a
photo of a restaurant menu into print-ready, allergen-compliant, multilingual designs.

Mostly ${first} and ${second}${systemsLine}. Based in Germany, working in English and German.

### ▸ Currently

Building agent tooling in the open, and taking on selected freelance work through
[${siteLabel}](${site}). If any of this is useful to you, issues and pull requests are
genuinely welcome — most of these repositories are one contributor away from being a
good deal better.

---

<div align="center">
<sub>
  This profile is a program. Every number above is real and re-rendered from the
  GitHub API each night by a workflow in this repository — the artwork is drawn
  pixel by pixel from a hand-built 5×7 font, with no image editor involved.
  <br>
  <a href="HOW-IT-WORKS.md">How it works →</a>
</sub>
</div>
`;
}
