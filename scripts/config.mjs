/**
 * Loads and validates profile.config.json.
 *
 * This is a template other people run, so every failure here has to say what is
 * wrong and what the allowed values are. A cryptic `undefined is not a function`
 * three modules deep is not an acceptable way to report a typo in a theme name.
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { THEME_NAMES } from './theme.mjs';

export const CARD_NAMES = ['hero', 'player', 'stack', 'select', 'grid', 'footer'];

export const DEFAULTS = {
  login: null,
  name: null,
  tagline: 'BUILDING THINGS THAT SHIP',
  playerClass: 'SOFTWARE ENGINEER',
  theme: 'amber',
  cards: [...CARD_NAMES],
  featured: { count: 6, pin: [], exclude: [] },
  languages: { count: 8, exclude: [] },
  links: { website: true, x: true, followers: true, stars: true },
  about: { heading: 'About', body: [] },
  currently: { heading: 'Currently', body: [] },
  showTemplateCredit: true,
  templateRepo: 'lennystepn-hue/lennystepn-hue',
};

class ConfigError extends Error {
  constructor(message) {
    super(`profile.config.json: ${message}`);
    this.name = 'ConfigError';
  }
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function mergeSection(name, defaults, given) {
  if (given === undefined) return { ...defaults };
  if (!isPlainObject(given)) throw new ConfigError(`"${name}" must be an object`);
  return { ...defaults, ...given };
}

function requireStringArray(name, value) {
  if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) {
    throw new ConfigError(`"${name}" must be an array of strings`);
  }
  return value;
}

function clampCount(name, value, min, max, fallback) {
  if (value === undefined) return fallback;
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new ConfigError(`"${name}" must be a whole number between ${min} and ${max}`);
  }
  return value;
}

export function validate(raw) {
  if (!isPlainObject(raw)) throw new ConfigError('the file must contain a JSON object');

  const cfg = { ...DEFAULTS, ...raw };

  // PROFILE_LOGIN wins over the configured value, and the workflow always sets
  // it to the repository owner. That makes a fresh copy of this template render
  // the right person from its very first scheduled run, instead of publishing
  // the original author's statistics to a stranger's profile because they had
  // not got round to editing this field yet.
  cfg.login = process.env.PROFILE_LOGIN || cfg.login || null;
  if (!cfg.login) {
    throw new ConfigError(
      'no GitHub login. Set "login" in the file, or pass PROFILE_LOGIN in the environment.',
    );
  }
  if (!/^[A-Za-z0-9](?:[A-Za-z0-9]|-(?=[A-Za-z0-9])){0,38}$/.test(cfg.login)) {
    throw new ConfigError(`"login" is not a valid GitHub username: ${JSON.stringify(cfg.login)}`);
  }

  if (!THEME_NAMES.includes(cfg.theme)) {
    throw new ConfigError(
      `unknown "theme" ${JSON.stringify(cfg.theme)}. Choose one of: ${THEME_NAMES.join(', ')}`,
    );
  }

  requireStringArray('cards', cfg.cards);
  const unknownCards = cfg.cards.filter((c) => !CARD_NAMES.includes(c));
  if (unknownCards.length) {
    throw new ConfigError(
      `unknown card${unknownCards.length > 1 ? 's' : ''} ${unknownCards
        .map((c) => JSON.stringify(c))
        .join(', ')}. Available: ${CARD_NAMES.join(', ')}`,
    );
  }
  if (!cfg.cards.length) throw new ConfigError('"cards" cannot be empty');

  for (const key of ['tagline', 'playerClass']) {
    if (typeof cfg[key] !== 'string' || !cfg[key].trim()) {
      throw new ConfigError(`"${key}" must be a non-empty string`);
    }
  }

  cfg.featured = mergeSection('featured', DEFAULTS.featured, raw.featured);
  cfg.featured.count = clampCount('featured.count', raw.featured?.count, 1, 12, 6);
  requireStringArray('featured.pin', cfg.featured.pin);
  requireStringArray('featured.exclude', cfg.featured.exclude);

  cfg.languages = mergeSection('languages', DEFAULTS.languages, raw.languages);
  cfg.languages.count = clampCount('languages.count', raw.languages?.count, 1, 12, 8);
  requireStringArray('languages.exclude', cfg.languages.exclude);

  cfg.links = mergeSection('links', DEFAULTS.links, raw.links);
  cfg.about = mergeSection('about', DEFAULTS.about, raw.about);
  cfg.currently = mergeSection('currently', DEFAULTS.currently, raw.currently);
  requireStringArray('about.body', cfg.about.body);
  requireStringArray('currently.body', cfg.currently.body);

  // The hero draws the tagline as pixels at a fixed size; past this it would run
  // off the canvas. The renderer shrinks it to cope, but at some point that is
  // unreadable and the author should just write something shorter.
  if (cfg.tagline.length > 52) {
    process.stderr.write(
      `• warning: "tagline" is ${cfg.tagline.length} characters; it will be drawn small. ` +
        `Under 45 reads best.\n`,
    );
  }

  return cfg;
}

export async function loadConfig(root = process.cwd()) {
  const file = path.join(root, 'profile.config.json');
  let text;
  try {
    text = await readFile(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return validate({});
    throw err;
  }

  let raw;
  try {
    raw = JSON.parse(text);
  } catch (err) {
    throw new ConfigError(`could not be parsed as JSON — ${err.message}`);
  }

  delete raw.$schema;
  return validate(raw);
}
