# AGENTS.md

Instructions for an AI assistant working in this repository.

## What this repository is

A GitHub **profile** repository that generates its own README and five or six
animated SVG cards from live GitHub API data. A scheduled workflow re-renders
everything nightly. It is also a template other people use for their own
profiles.

```
profile.config.json      the only file most people need to edit
scripts/
  config.mjs             loads and validates profile.config.json
  data.mjs               GraphQL call + the public contribution graph
  theme.mjs              four palettes, language colours, helpers
  pixelfont.mjs          hand-built 5x7 bitmap font -> SVG paths
  sprites.mjs            agent, ghost and Claude mascot bitmaps
  fx.mjs                 CRT treatment, panels, meters, digit roll
  cards.mjs              the six card compositions
  readme.mjs             README.md, built from the same snapshot
  generate.mjs           entry point
assets/*.svg             GENERATED
README.md                GENERATED
```

## Hard rules

1. **Never hand-edit `README.md` or anything under `assets/`.** They are build
   output. The nightly workflow overwrites them. Change `profile.config.json`
   or `scripts/`, then rebuild.
2. **Never display a figure that depends on which token fetched it.** GraphQL
   reports commit, pull-request and issue counts relative to the caller: a
   token with `read:user` sees several hundred more than the workflow's
   repo-scoped token. Only calendar-derived and public-repository figures may
   appear on a card. `data.mjs` marks the token-dependent fields as
   deliberately unrendered — leave them that way.
3. **Keep randomness seeded.** Star positions and digit decoys come from
   `mulberry32`. Introducing `Math.random()` would make every nightly run commit
   a diff of shuffled pixels.
4. **The resting state must be the truth.** Anything animated has to show
   correct data with animations disabled. The digit roll puts the real digit
   first at offset zero for exactly this reason.
5. **Verify visually before claiming a card is correct.** See *Checking your
   work* below. Layout bugs — text overflowing a panel, lines colliding — do not
   show up in the build log.

## Setting this up for a new user

Run these in order. Stop and ask the human at any step marked **[human]**.

### 1. Confirm the target account

```bash
gh api user --jq '{login, name, bio, blog, twitter_username, public_repos}'
```

The repository must be named **exactly** the `login` value and must be public.
If the human gave you a username that returns 404, check `gh auth status` — the
authenticated account's login is usually the one they meant.

### 2. Configure

Edit `profile.config.json`. At minimum set `login`. Then set `tagline`,
`playerClass`, `theme`, and rewrite `about.body` / `currently.body` for this
person. Do not leave the previous owner's prose in place.

Ground the prose in what you can actually verify:

```bash
gh api "users/<login>/repos?per_page=100&sort=updated" \
  --jq '.[] | select(.fork|not) | "\(.name) | \(.language) | ⭐\(.stargazers_count) | \(.description // "-")"'
```

Full field reference: [SETUP.md](SETUP.md). Valid themes: `amber`, `phosphor`,
`synth`, `ice`.

### 3. Build

```bash
GITHUB_TOKEN=$(gh auth token) npm run build
```

Configuration errors are reported in full with the allowed values. There are no
dependencies to install; Node 20+ is the only requirement.

### 4. Check your work

The build log will not tell you that text has overflowed a panel. Rasterise and
actually look:

```bash
npm i --no-save @resvg/resvg-js
```

```bash
node -e "const{Resvg}=require('@resvg/resvg-js'),fs=require('fs');for(const f of fs.readdirSync('assets'))if(f.endsWith('.svg'))fs.writeFileSync('/tmp/'+f+'.png',new Resvg(fs.readFileSync('assets/'+f,'utf8'),{fitTo:{mode:'width',value:900},background:'#14101f'}).render().asPng())"
```

Then read the PNGs as images. resvg ignores CSS animation, so what you get is
the resting frame — which is exactly the state that must contain the true data.

Look specifically for: numbers running past a panel edge, description text
colliding with the footer row of a project card, and month labels overlapping on
the contribution map. Each of those has happened.

Rasterising each file **separately** matters. Ids like `#marquee` and `#ttl` are
document-scoped; merging several cards into one SVG to make a contact sheet
silently breaks every reference after the first and will send you chasing a bug
that does not exist.

### 5. Publish **[human]**

```bash
gh repo create <login> --public --source=. --remote=origin --push
```

Pushing `.github/workflows/` requires the `workflow` OAuth scope, and
`gh auth refresh` needs an interactive browser flow you cannot complete. If the
push is rejected with *"refusing to allow an OAuth App to create or update
workflow"*, commit everything else, then hand the human:

```bash
gh auth refresh -h github.com -s workflow,user
```

### 6. Things only the human can do **[human]**

- **Workflow write permission.** Settings → Actions → General → Workflow
  permissions → "Read and write". Without it the first scheduled run fails 403.
- **Private contributions.** Profile page → Contribution settings → Private
  contributions. This is a UI toggle with no API. It is usually the single
  largest improvement to the numbers, so mention it explicitly rather than
  burying it in a list.
- **Profile fields.** `PATCH /user` needs the `user` scope; see step 5.

### 7. Confirm it is live

```bash
gh run list --limit 1
```

```bash
curl -sI "https://raw.githubusercontent.com/<login>/<login>/main/assets/hero.svg" | head -1
```

`raw.githubusercontent.com` caches for five minutes, so a fresh push is not
visible instantly. Check the committed content through the API rather than
concluding the push failed.

## Working on the drawing code

[HOW-IT-WORKS.md](HOW-IT-WORKS.md) covers the rendering constraints in detail.
The ones that bite:

- SVGs in a README load in *secure animated mode*. CSS `@keyframes`, SMIL,
  filters, `mix-blend-mode` and `<use href>` all work. External fonts,
  `<a>` links inside the SVG, and JavaScript do not. Text is drawn as paths
  because web fonts cannot load and system fonts shift the layout.
- Filter regions clip at `-10%`/`120%` of the bounding box by default, which
  cuts a blur off square. Widen the region and set
  `color-interpolation-filters="sRGB"`.
- `transform-origin` on SVG elements defaults to `0 0`, not `center`. Setting
  `transform-box: fill-box` alone does nothing; you need both.
- GitHub strips `class`, `style`, `srcset` and `loading` from `<img>` in
  Markdown. Only `width` survives.

## Commit style

Explain the reasoning, not the diff. A message that says *why* the score digits
are ordered the way they are saves the next person from "fixing" it. Keep
subject lines in the imperative.
