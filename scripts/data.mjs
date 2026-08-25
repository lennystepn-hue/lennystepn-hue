/**
 * Everything the cards render is fetched here, in one GraphQL round trip.
 *
 * Only PUBLIC repositories are counted. That is deliberate: the scheduled
 * workflow authenticates with a repo-scoped GITHUB_TOKEN that cannot see the
 * account's private work, so counting private repos locally would make the
 * numbers lurch every time the workflow ran. Public-only is stable, honest, and
 * matches what a visitor can verify for themselves.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { languageColor } from './theme.mjs';

const API = 'https://api.github.com/graphql';

const QUERY = `
query($login: String!) {
  user(login: $login) {
    login
    name
    bio
    url
    avatarUrl
    websiteUrl
    twitterUsername
    location
    createdAt
    followers { totalCount }
    following { totalCount }
    repositories(
      first: 100
      ownerAffiliations: OWNER
      isFork: false
      privacy: PUBLIC
      orderBy: { field: PUSHED_AT, direction: DESC }
    ) {
      totalCount
      nodes {
        name
        description
        url
        stargazerCount
        forkCount
        isArchived
        pushedAt
        primaryLanguage { name }
        languages(first: 12, orderBy: { field: SIZE, direction: DESC }) {
          edges { size node { name } }
        }
        repositoryTopics(first: 8) { nodes { topic { name } } }
      }
    }
    contributionsCollection {
      totalCommitContributions
      totalPullRequestContributions
      totalIssueContributions
      totalPullRequestReviewContributions
      totalRepositoriesWithContributedCommits
      contributionCalendar {
        totalContributions
        weeks {
          contributionDays { date contributionCount weekday }
        }
      }
    }
  }
}`;

async function graphql(login, token) {
  const res = await fetch(API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'lennystepn-hue-profile-generator',
    },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });

  if (!res.ok) {
    throw new Error(`GitHub API ${res.status} ${res.statusText}: ${await res.text()}`);
  }
  const body = await res.json();
  if (body.errors?.length) {
    throw new Error(`GitHub GraphQL: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  if (!body.data?.user) throw new Error(`No such user: ${login}`);
  return body.data.user;
}

/**
 * The contribution calendar, read from the same page a visitor sees.
 *
 * The GraphQL calendar only ever reports contributions the *requesting token*
 * is allowed to see, which in a scheduled workflow means public repositories
 * only. This HTML view is the account's own public graph, so it reflects
 * whatever the profile is actually set to display -- including private
 * contributions the moment their owner opts to publish them. No token, no
 * scopes, and it can never disagree with what someone reads on the profile.
 */
async function fetchCalendarHtml(login) {
  const res = await fetch(`https://github.com/users/${encodeURIComponent(login)}/contributions`, {
    headers: {
      Accept: 'text/html',
      'User-Agent': 'lennystepn-hue-profile-generator',
    },
  });
  if (!res.ok) throw new Error(`contributions page ${res.status}`);
  const html = await res.text();

  // Levels live on the cell, exact counts only in the linked tooltip.
  const counts = new Map();
  for (const m of html.matchAll(/<tool-tip[^>]*\bfor="([^"]+)"[^>]*>([^<]*)<\/tool-tip>/g)) {
    const text = m[2];
    const n = /^\s*no contributions/i.test(text)
      ? 0
      : Number((text.match(/^\s*([\d,]+)/)?.[1] ?? '0').replace(/,/g, ''));
    counts.set(m[1], n);
  }

  const days = [];
  for (const m of html.matchAll(/<td\b[^>]*\bdata-date="[^"]*"[^>]*>/g)) {
    const tag = m[0];
    const date = /\bdata-date="([^"]+)"/.exec(tag)?.[1];
    const id = /\bid="([^"]+)"/.exec(tag)?.[1];
    const level = Number(/\bdata-level="(\d+)"/.exec(tag)?.[1] ?? 0);
    if (!date) continue;
    days.push({ date, level, count: counts.get(id) ?? 0 });
  }

  if (days.length < 300) throw new Error(`contributions page yielded only ${days.length} days`);
  days.sort((a, b) => a.date.localeCompare(b.date));
  return days;
}

const DAY_MS = 86400000;

/** Lay a flat day list out as calendar columns, Sunday at the top. */
function toWeeks(days) {
  const first = Date.parse(days[0].date);
  const offset = new Date(days[0].date).getUTCDay();
  const weeks = [];

  for (const day of days) {
    const index = Math.round((Date.parse(day.date) - first) / DAY_MS) + offset;
    const w = Math.floor(index / 7);
    const weekday = index % 7;
    (weeks[w] ??= [])[weekday] = { ...day, weekday };
  }

  return weeks.map((week) => (week ?? []).filter(Boolean));
}

function computeStreaks(days) {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.count > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }

  // A streak stays alive until today's date has passed without a contribution,
  // so an empty final day is tolerated rather than treated as a break.
  let current = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].count > 0) current++;
    else if (i === days.length - 1) continue;
    else break;
  }

  const last30 = days.slice(-30);
  const activeLast30 = last30.filter((d) => d.count > 0).length;

  return { current, longest, activeLast30, windowDays: last30.length };
}

function aggregateLanguages(repos, { limit = 8, exclude = [] } = {}) {
  const skip = new Set(exclude.map((s) => s.toLowerCase()));
  const totals = new Map();
  for (const repo of repos) {
    for (const edge of repo.languages?.edges ?? []) {
      const name = edge.node.name;
      if (skip.has(name.toLowerCase())) continue;
      totals.set(name, (totals.get(name) ?? 0) + edge.size);
    }
  }
  // Percentages are of the languages that survived the exclude list, so a bar
  // chart of five entries still adds up to something close to 100.
  const grand = [...totals.values()].reduce((a, b) => a + b, 0) || 1;
  return [...totals.entries()]
    .map(([name, bytes]) => ({
      name,
      bytes,
      pct: (bytes / grand) * 100,
      color: languageColor(name),
    }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, limit);
}

/**
 * Projects worth putting on a cabinet screen: described, not archived, ranked by
 * stars but with recency breaking ties so the shelf stays alive.
 */
function pickFeatured(repos, { limit = 6, pin = [], exclude = [] } = {}) {
  const pinned = pin.map((s) => s.toLowerCase());
  const skip = new Set(exclude.map((s) => s.toLowerCase()));

  return repos
    .filter((r) => !skip.has(r.name.toLowerCase()))
    // Pinned repositories bypass the "must have a description" rule: naming one
    // explicitly is a stronger signal than any heuristic here.
    .filter((r) => (r.description && !r.isArchived) || pinned.includes(r.name.toLowerCase()))
    .map((r) => ({
      name: r.name,
      description: r.description,
      url: r.url,
      stars: r.stargazerCount,
      forks: r.forkCount,
      language: r.primaryLanguage?.name ?? null,
      pushedAt: r.pushedAt,
      topics: (r.repositoryTopics?.nodes ?? []).map((n) => n.topic.name),
    }))
    .sort((a, b) => {
      const ap = pinned.indexOf(a.name.toLowerCase());
      const bp = pinned.indexOf(b.name.toLowerCase());
      if (ap !== -1 || bp !== -1) {
        if (ap === -1) return 1;
        if (bp === -1) return -1;
        return ap - bp;
      }
      return b.stars - a.stars || new Date(b.pushedAt) - new Date(a.pushedAt);
    })
    .slice(0, limit);
}

/** GitHub's own five-step scale, so a fallback graph looks like the real one. */
function levelFor(count, max) {
  if (count <= 0) return 0;
  return Math.min(4, Math.ceil((count / Math.max(1, max)) * 4));
}

export async function fetchProfile(login, token, cfg = {}) {
  const user = await graphql(login, token);
  const repos = user.repositories.nodes ?? [];
  const cc = user.contributionsCollection;

  let weeks;
  let calendarSource;
  try {
    weeks = toWeeks(await fetchCalendarHtml(login));
    calendarSource = 'public-profile';
  } catch (err) {
    process.stderr.write(`• contributions page unavailable (${err.message}); using GraphQL\n`);
    const graphMax = Math.max(
      1,
      ...cc.contributionCalendar.weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)),
    );
    weeks = cc.contributionCalendar.weeks.map((w) =>
      w.contributionDays.map((d) => ({
        date: d.date,
        count: d.contributionCount,
        weekday: d.weekday,
        level: levelFor(d.contributionCount, graphMax),
      })),
    );
    calendarSource = 'graphql';
  }

  const days = weeks.flat();
  const calendarTotal = days.reduce((a, d) => a + d.count, 0);

  const totalStars = repos.reduce((a, r) => a + r.stargazerCount, 0);
  const totalForks = repos.reduce((a, r) => a + r.forkCount, 0);
  const languageCount = new Set(
    repos.flatMap((r) => (r.languages?.edges ?? []).map((e) => e.node.name)),
  ).size;

  return {
    login: user.login,
    name: user.name ?? user.login,
    bio: user.bio,
    url: user.url,
    avatarUrl: user.avatarUrl,
    websiteUrl: user.websiteUrl,
    twitterUsername: user.twitterUsername,
    location: user.location,
    createdAt: user.createdAt,

    followers: user.followers.totalCount,
    following: user.following.totalCount,
    repoCount: repos.length,
    totalStars,
    totalForks,
    languageCount,

    contributions: {
      total: calendarTotal,
      bestDay: Math.max(0, ...days.map((d) => d.count)),
      activeDays: days.filter((d) => d.count > 0).length,
      totalDays: days.length,
      perWeek: Math.round(calendarTotal / Math.max(1, days.length / 7)),
      source: calendarSource,

      // Everything above is derived from the calendar and is therefore identical
      // no matter which token ran the job. The three counts below come from
      // GraphQL and are NOT: a repo-scoped workflow token sees public activity
      // only, while a token with `read:user` also sees private. Displaying them
      // would make the profile's figures lurch every time the schedule ran, so
      // they are kept for reference and deliberately not rendered.
      commits: cc.totalCommitContributions,
      prs: cc.totalPullRequestContributions,
      issues: cc.totalIssueContributions,
      reviews: cc.totalPullRequestReviewContributions,
      reposContributed: cc.totalRepositoriesWithContributedCommits,
    },

    weeks,
    streak: computeStreaks(days),
    languages: aggregateLanguages(repos, {
      limit: cfg.languages?.count ?? 8,
      exclude: cfg.languages?.exclude ?? [],
    }),
    featured: pickFeatured(repos, {
      limit: cfg.featured?.count ?? 6,
      pin: cfg.featured?.pin ?? [],
      exclude: cfg.featured?.exclude ?? [],
    }),

    generatedAt: new Date().toISOString(),
  };
}

const CACHE = path.join(process.cwd(), '.cache', 'profile.json');

export async function loadCached() {
  return JSON.parse(await readFile(CACHE, 'utf8'));
}

export async function saveCache(data) {
  await mkdir(path.dirname(CACHE), { recursive: true });
  await writeFile(CACHE, JSON.stringify(data, null, 2));
}
