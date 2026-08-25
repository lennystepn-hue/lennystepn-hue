# Use this for your own profile

This repository generates an animated arcade-cabinet GitHub profile from live
API data. Everything is drawn in code — a hand-built pixel font, no image
editor, no third-party stat-card service that can rate-limit or go down.

Setting it up takes about five minutes and one JSON file.

> Prefer to hand this to an AI assistant? Point it at [AGENTS.md](AGENTS.md),
> which contains the same procedure written as a runbook.

---

## 1. Create your repository

Click **Use this template → Create a new repository** at the top of this page.

Two things must be exactly right, or GitHub will not show the profile:

| Setting | Value |
|---|---|
| Repository name | **Exactly your GitHub username**, character for character |
| Visibility | **Public** |

If your username is `octocat`, the repository must be `octocat/octocat`. This is
GitHub's rule for profile READMEs, not this template's.

## 2. Tell it who you are

Edit `profile.config.json`. The only field you must change is `login`:

```json
{
  "login": "your-github-username",
  "tagline": "WHAT YOU DO, IN A SHORT LINE",
  "playerClass": "YOUR TITLE",
  "theme": "amber"
}
```

Delete the `about` and `currently` blocks, or replace them with your own text.
They are plain Markdown — see [Writing your prose](#writing-your-prose) below.

## 3. Let the workflow write to your repository

**Settings → Actions → General → Workflow permissions →
"Read and write permissions" → Save.**

The workflow commits the regenerated artwork back to your repository, so it
needs this. New repositories often default to read-only, and the first run will
fail with a `403` if you skip this step.

## 4. Run it

**Actions → Refresh profile → Run workflow.**

The run takes about fifteen seconds. When it finishes, open
`github.com/your-username` and the cabinet should be there.

After this it re-renders itself every night. You never have to touch it again.

## 5. Optional, but the biggest single improvement

By default GitHub shows visitors only your **public** contributions, which for
most people is a fraction of what they actually did. On your profile page, above
the contribution graph, open **Contribution settings** and tick **Private
contributions**.

The numbers on the cards are read from the same public graph a visitor sees, so
they pick this up automatically on the next nightly run. No configuration
change needed.

---

## Configuration reference

Everything below lives in `profile.config.json`. Every field is optional except
`login`.

### Identity

| Field | Type | Default | What it does |
|---|---|---|---|
| `login` | string | — | Your GitHub username. **Required for local builds.** In Actions the workflow passes `PROFILE_LOGIN` set to the repository owner, and that wins over this field — so a fresh copy of the template renders *you* from its first run even if you forget to change this. |
| `tagline` | string | `"BUILDING THINGS THAT SHIP"` | The line under your name on the hero. Drawn as pixels; under 45 characters reads best, and it shrinks itself if you go longer. |
| `playerClass` | string | `"SOFTWARE ENGINEER"` | The `CLASS` field on the player card. Your job title, or something funnier. |

### Look

| Field | Type | Default | What it does |
|---|---|---|---|
| `theme` | string | `"amber"` | One of `amber`, `phosphor`, `synth`, `ice`. See below. |
| `cards` | string[] | all six | Which cards to render, in order: `hero`, `player`, `stack`, `select`, `grid`, `footer`. Drop any you don't want. |

**Themes**

| Name | Feel |
|---|---|
| `amber` | Arcade marquee. Warm gold on deep indigo. The default. |
| `phosphor` | Green CRT terminal. |
| `synth` | Hot pink cabinet lighting. |
| `ice` | Cool blue tube. |

Preview one without committing to it:

```bash
npm run build:cached -- --theme phosphor
```

Then open `preview.html`.

### Content

| Field | Type | Default | What it does |
|---|---|---|---|
| `featured.count` | 1–12 | `6` | How many projects appear on the "Select your game" screen. |
| `featured.pin` | string[] | `[]` | Repository names to force to the front, in this order. Pinned repositories skip the "must have a description" rule. |
| `featured.exclude` | string[] | `[]` | Repository names to keep off the board entirely. |
| `languages.count` | 1–12 | `8` | How many languages appear in the loadout. |
| `languages.exclude` | string[] | `[]` | Languages to ignore. Useful for `HTML` or `CSS` if a vendored folder is skewing your numbers. Percentages are recalculated over what remains. |

### Links

| Field | Type | Default | What it does |
|---|---|---|---|
| `links.website` | boolean | `true` | Badge linking to the website on your GitHub profile. Hidden automatically if you haven't set one. |
| `links.x` | boolean | `true` | Badge linking to your X account, if your profile has one. |
| `links.followers` | boolean | `true` | Live follower count badge. |
| `links.stars` | boolean | `true` | Live total-stars badge. |

### Prose and credit

| Field | Type | Default | What it does |
|---|---|---|---|
| `about.heading` | string | `"About"` | Heading above your first prose block. |
| `about.body` | string[] | `[]` | One string per paragraph, Markdown. Empty array hides the section. |
| `currently.heading` | string | `"Currently"` | Heading for the second block. |
| `currently.body` | string[] | `[]` | Same as above. |
| `showTemplateCredit` | boolean | `true` | The small line at the very bottom linking to how it works. Turn it off if you'd rather not have it. |
| `templateRepo` | string | this repo | Where the credits card points. Leave it alone unless you're maintaining your own fork of the template. |

---

## Writing your prose

`about.body` and `currently.body` are arrays of Markdown paragraphs. A handful
of tokens are substituted so your text stays correct as your account grows, and
stays portable if you rename yourself:

| Token | Becomes |
|---|---|
| `{{repo:name}}` | A Markdown link to `github.com/<your-login>/name` |
| `{{login}}` | Your username |
| `{{name}}` | Your display name |
| `{{site}}` | A Markdown link to your website |
| `{{siteUrl}}` | The bare website URL |
| `{{repoCount}}` | Number of public repositories |
| `{{contributions}}` | Contributions in the last year |
| `{{stars}}` | Total stars across your public repositories |
| `{{followers}}` | Follower count |
| `{{languageCount}}` | How many languages you've used publicly |
| `{{topLanguages}}` | Your top three, as a sentence: "TypeScript, Python and Go" |

For example:

```json
"about": {
  "heading": "About",
  "body": [
    "I build developer tools. {{repoCount}} public repositories, mostly {{topLanguages}}.",
    "The one I'd start with is {{repo:my-best-project}}. Find me at {{site}}."
  ]
}
```

---

## Running it locally

Node 20 or newer. No dependencies to install.

```bash
GITHUB_TOKEN=$(gh auth token) npm run build
```

That fetches live data, writes `assets/*.svg` and `README.md`, and saves a
snapshot to `.cache/`. To iterate on the look without touching the network:

```bash
npm run build:cached
```

Either way, open `preview.html` to see every card with its animations, and use
the replay button to watch them start over.

---

## Troubleshooting

**The profile page is blank, or shows the repository instead of the cards.**
The repository name must match your username exactly, and it must be public.
Check both.

**The workflow fails with `403` or `permission denied` when pushing.**
Step 3 above. Settings → Actions → General → Workflow permissions → Read and
write.

**The images are broken on the profile but fine in the repository.**
Give it five minutes. `raw.githubusercontent.com` caches for that long. If it
persists, confirm the workflow actually committed the `assets/` folder.

**My numbers look too low.**
That is the public view, which is what visitors see. Step 5 above turns on
private contributions.

**The cards say someone else's name.**
You changed `login` but haven't re-run the build. Trigger the workflow manually
from the Actions tab.

**A repository I want isn't on the "Select your game" screen.**
It probably has no description — the board skips undescribed repositories so it
doesn't show empty cards. Either add a description on GitHub, or name it in
`featured.pin`, which overrides that rule.

**The build says `unknown "theme"` or `unknown card`.**
The error lists the valid values. It is a typo in `profile.config.json`.

---

## What you can safely change

Edit `profile.config.json` freely. Edit `scripts/` if you want to change the
artwork itself — [HOW-IT-WORKS.md](HOW-IT-WORKS.md) explains the drawing code
and the constraints it works within.

**Do not hand-edit `README.md` or anything in `assets/`.** Both are generated,
and the next nightly run will overwrite your changes without warning.
