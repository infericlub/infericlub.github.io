# inferi.club redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a fresh Jekyll-based GitHub Pages blog at `/Users/dsm/war/projects/inferi.club/` whose visual identity is inspired by sweetfish.site — light, type-driven, "editorial cozy" — with a working dark mode, prominent RSS, an inline tag system, and zero existing content.

**Architecture:** Single Jekyll 3.x site served by the `github-pages` gem (no GitHub Actions). Hand-written SCSS partials compiled by Jekyll; one tiny vanilla JS file for theme toggling. CSS custom properties drive light/dark palettes through a `data-theme` attribute on `<html>`. Posts live in a single `_posts/` tree; pages declare per-page permalinks.

**Tech Stack:** Jekyll (via `github-pages` gem, Jekyll 3.x), kramdown + Rouge, SCSS, plain HTML/Liquid, vanilla JS, Open Sans + IBM Plex Mono via Google Fonts, jekyll-feed / jekyll-seo-tag / jekyll-sitemap.

## Global Constraints

- Stack: Jekyll on GitHub Pages with the `github-pages` gem. No GitHub Actions.
- No CSS framework. All styles are hand-written SCSS partials compiled by Jekyll.
- No JS bundler. The only JS file is `assets/js/theme.js`, ≤ 1 KB unminified.
- Fonts: Open Sans (400/500/700) + IBM Plex Mono (400/700) via a single combined Google Fonts request with `display=swap`, preceded by `preconnect` to `fonts.googleapis.com` and `fonts.gstatic.com`.
- Themes: light is default; dark via `<html data-theme="dark">`. Selection sequence: `localStorage.theme` → `prefers-color-scheme` → `light`.
- Permalink rules: posts → `/blog/:slug/`; pages declare their own permalink in frontmatter (`/about/`, `/colophon/`, `/blog/`, `/tags/`).
- Languages: posts mixed in one `_posts/`; `lang:` is optional per post and defaults to `site.lang` (`en`).
- License: code MIT (`LICENSE`); written content CC BY-SA 4.0 (mentioned in `colophon.md`).
- Custom domain: `inferi.club` via a root-level `CNAME` file.
- Brand voice / wordmark: lowercase `inferi.club` throughout the UI; tagline italic and configurable in `_config.yml`.
- Accent colour rules: light `--accent` is `#B85C2E`; dark `--accent` is `#E89B6C`. Both palettes target WCAG AA for body text.
- No thumbnails, no per-post hero images, no pagination, no search, no comments.

---

### Task 1: Bootstrap the Jekyll project

**Files:**
- Create: `Gemfile`
- Create: `_config.yml`
- Create: `.gitignore`
- Create: `index.html`

**Interfaces:**
- Consumes: nothing.
- Produces: a `bundle exec jekyll serve` that serves `http://localhost:4000/` returning the placeholder home, and a `_config.yml` whose `permalink: /blog/:slug/` and `plugins:` list are read by every later task.

- [ ] **Step 1: Initialise git in the empty repo**

Run:
```bash
cd /Users/dsm/war/projects/inferi.club
git init -b main
```
Expected: `Initialized empty Git repository in .../inferi.club/.git/`.

- [ ] **Step 2: Write `Gemfile`**

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "webrick", "~> 1.8"

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end
```

- [ ] **Step 3: Write `_config.yml`**

The `social.discord` URL is the only intentional placeholder — replace `REPLACE-ME` with the real invite slug before deploy. Everything else uses the existing brand handles.

```yaml
title: inferi.club
tagline: a writing desk for cs & security notes
description: notes on computer science and information security
url: https://inferi.club
lang: en
permalink: /blog/:slug/

author:
  name: inferigang
  url: https://github.com/inferigang

social:
  github: https://github.com/inferigang
  twitter: https://twitter.com/inferigang
  discord: https://discord.gg/REPLACE-ME   # replace before deploy
  rss: /feed.xml

markdown: kramdown
highlighter: rouge
kramdown:
  syntax_highlighter: rouge
  syntax_highlighter_opts:
    css_class: highlight

plugins:
  - jekyll-feed
  - jekyll-seo-tag
  - jekyll-sitemap

include:
  - CNAME

exclude:
  - Gemfile
  - Gemfile.lock
  - README.md
  - vendor
  - docs
  - .jekyll-cache
```

- [ ] **Step 4: Write `.gitignore`**

```
_site/
.jekyll-cache/
.jekyll-metadata
vendor/
.bundle/
.DS_Store
*.log
```

- [ ] **Step 5: Write minimal `index.html`** (no layout yet — layouts arrive in Task 3)

```html
---
title: home
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>inferi.club</title>
  </head>
  <body>
    <h1>inferi.club</h1>
    <p>bootstrapping…</p>
  </body>
</html>
```

- [ ] **Step 6: Install dependencies**

Run:
```bash
bundle config set --local path 'vendor/bundle'
bundle install
```
Expected: ends with `Bundle complete!`. `vendor/bundle/` is created and ignored by git.

- [ ] **Step 7: Start the server in the background and verify it answers**

Run:
```bash
bundle exec jekyll serve --skip-initial-build=false --detach --port 4000
sleep 2
curl -sS http://localhost:4000/ | grep -F 'inferi.club'
```
Expected: prints the line containing `<h1>inferi.club</h1>` and `<title>inferi.club</title>`.

- [ ] **Step 8: Stop the server**

Run:
```bash
pkill -f "jekyll serve" || true
```

- [ ] **Step 9: Commit**

```bash
git add Gemfile Gemfile.lock _config.yml .gitignore index.html
git commit -m "chore: bootstrap jekyll project skeleton"
```

---

### Task 2: Design tokens, reset, and main stylesheet entry

**Files:**
- Create: `_sass/_reset.scss`
- Create: `_sass/_tokens.scss`
- Create: `assets/css/main.scss`
- Modify: `index.html` (add stylesheet link)

**Interfaces:**
- Consumes: nothing (CSS-only task).
- Produces: a compiled stylesheet at `/assets/css/main.css` exposing the CSS custom properties `--bg`, `--bg-soft`, `--ink`, `--ink-soft`, `--rule`, `--accent`, `--accent-soft`, and `--step-0`…`--step-4`. All later tasks use these tokens via `var(--name)`.

- [ ] **Step 1: Write `_sass/_reset.scss`**

```scss
*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; }

body {
  margin: 0;
  min-height: 100vh;
  background: var(--bg);
  color: var(--ink);
}

img, svg, video { max-width: 100%; height: auto; display: block; }

button {
  font: inherit;
  color: inherit;
  background: none;
  border: 0;
  padding: 0;
  cursor: pointer;
}

a { color: inherit; }
```

- [ ] **Step 2: Write `_sass/_tokens.scss`**

```scss
:root {
  --step-0: 1rem;
  --step-1: 1.25rem;
  --step-2: 1.563rem;
  --step-3: 1.953rem;
  --step-4: 2.441rem;
}

:root[data-theme="light"] {
  --bg:          #F8F5EF;
  --bg-soft:     #F1EBE0;
  --ink:         #1B1A17;
  --ink-soft:    #5B574E;
  --rule:        #D9D2C2;
  --accent:      #B85C2E;
  --accent-soft: #E8D7C4;
}

:root[data-theme="dark"] {
  --bg:          #16181C;
  --bg-soft:     #1E2127;
  --ink:         #E8E4DA;
  --ink-soft:    #9A958A;
  --rule:        #2E3138;
  --accent:      #E89B6C;
  --accent-soft: #2D241B;
}
```

- [ ] **Step 3: Write `assets/css/main.scss`** (Jekyll requires the leading front-matter fence so it processes the SCSS)

```scss
---
---

@import "reset";
@import "tokens";
```

- [ ] **Step 4: Modify `index.html`** to load the stylesheet and set the default theme attribute

Replace the file with:
```html
---
title: home
---
<!doctype html>
<html lang="en" data-theme="light">
  <head>
    <meta charset="utf-8">
    <title>inferi.club</title>
    <link rel="stylesheet" href="/assets/css/main.css">
  </head>
  <body>
    <h1>inferi.club</h1>
    <p>bootstrapping…</p>
  </body>
</html>
```

- [ ] **Step 5: Build and verify the compiled CSS exposes the tokens**

Run:
```bash
bundle exec jekyll build
grep -c '#F8F5EF' _site/assets/css/main.css
grep -c -- '--accent: #B85C2E' _site/assets/css/main.css
grep -c -- '--step-0: 1rem' _site/assets/css/main.css
```
Expected: each command prints `1` (or more), confirming the light palette, accent, and scale tokens are all in the output.

- [ ] **Step 6: Commit**

```bash
git add _sass/_reset.scss _sass/_tokens.scss assets/css/main.scss index.html
git commit -m "feat(css): add design tokens, reset, main stylesheet"
```

---

### Task 3: Default layout, head include, typography, and Google Fonts

**Files:**
- Create: `_layouts/default.html`
- Create: `_includes/head.html`
- Create: `_sass/_typography.scss`
- Create: `_sass/_layout.scss`
- Modify: `assets/css/main.scss` (add imports)
- Modify: `index.html` (switch to `layout: default`, drop inline head)

**Interfaces:**
- Consumes: `_sass/_tokens.scss` (for `var(--bg)`, `var(--ink)`, `var(--rule)`, `var(--step-*)`).
- Produces: `_layouts/default.html` which yields `{{ content }}` inside a `<main>` wrapped by `<header>` and `<footer>` placeholders (real header/footer arrive in Task 4); `_includes/head.html` providing `<meta>`, Open Sans + IBM Plex Mono via Google Fonts (preconnect + combined link), favicon link, and the main stylesheet link. Later tasks rely on `{% include head.html %}` and the `.container` class defined here.

- [ ] **Step 1: Write `_includes/head.html`**

```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% if page.title %}{{ page.title }} — {% endif %}{{ site.title }}</title>
  <meta name="description" content="{{ page.description | default: site.description }}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
  <link rel="alternate" type="application/rss+xml" title="{{ site.title }}" href="{{ '/feed.xml' | relative_url }}">
</head>
```

- [ ] **Step 2: Write `_sass/_typography.scss`**

```scss
html { font-size: 18px; }
@media (max-width: 480px) { html { font-size: 16px; } }

body {
  font-family: "Open Sans", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-weight: 400;
  line-height: 1.65;
  font-feature-settings: "kern" 1;
}

h1, h2, h3, h4 {
  font-family: inherit;
  line-height: 1.2;
  margin: 1.5em 0 0.5em;
  font-weight: 700;
}

h1 { font-size: var(--step-4); letter-spacing: -0.02em; }
h2 { font-size: var(--step-3); letter-spacing: -0.02em; }
h3 { font-size: var(--step-2); }
h4 { font-size: var(--step-1); }

p { margin: 0 0 1em; }

code, kbd, pre, samp {
  font-family: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
}

.tabular { font-variant-numeric: tabular-nums; }

a {
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-thickness: 1px;
  color: inherit;
}
a:hover { color: var(--accent); }

::selection { background: var(--accent-soft); }
```

- [ ] **Step 3: Write `_sass/_layout.scss`**

```scss
.container {
  width: min(38rem, calc(100vw - 2rem));
  margin-inline: auto;
}

.site-header,
.site-main,
.site-footer { padding-block: 2rem; }

.site-main { min-height: 60vh; }

hr.dots {
  border: 0;
  text-align: center;
  margin: 2.5rem 0;
  color: var(--ink-soft);
}
hr.dots::before {
  content: "· · ·";
  letter-spacing: 0.4em;
}
```

- [ ] **Step 4: Modify `assets/css/main.scss`** to import the new partials

```scss
---
---

@import "reset";
@import "tokens";
@import "typography";
@import "layout";
```

- [ ] **Step 5: Write `_layouts/default.html`**

```html
<!doctype html>
<html lang="{{ page.lang | default: site.lang }}" data-theme="light">
  {% include head.html %}
  <body>
    <header class="site-header"><div class="container">{% include header.html %}</div></header>
    <main class="site-main"><div class="container">{{ content }}</div></main>
    <footer class="site-footer"><div class="container">{% include footer.html %}</div></footer>
  </body>
</html>
```

- [ ] **Step 6: Create placeholder includes that Task 4 will replace**

`_includes/header.html`:
```html
<div class="site-wordmark">inferi.club</div>
```

`_includes/footer.html`:
```html
<small>© inferi.club</small>
```

- [ ] **Step 7: Modify `index.html`** to use the default layout

Replace with:
```html
---
title: home
layout: default
---
<p>bootstrapping…</p>
```

- [ ] **Step 8: Build and verify head, fonts, layout markup**

Run:
```bash
bundle exec jekyll build
grep -c 'fonts.googleapis.com' _site/index.html
grep -c 'Open+Sans' _site/index.html
grep -c 'IBM+Plex+Mono' _site/index.html
grep -c 'data-theme="light"' _site/index.html
grep -c 'class="container"' _site/index.html
```
Expected: every command prints `≥ 1`.

- [ ] **Step 9: Commit**

```bash
git add _includes/head.html _includes/header.html _includes/footer.html \
        _layouts/default.html _sass/_typography.scss _sass/_layout.scss \
        assets/css/main.scss index.html
git commit -m "feat(layout): default layout, head with google fonts, typography"
```

---

### Task 4: Header, footer, navigation data

**Files:**
- Create: `_data/navigation.yml`
- Modify: `_includes/header.html`
- Modify: `_includes/footer.html`
- Modify: `_sass/_layout.scss` (header/footer styles)

**Interfaces:**
- Consumes: `site.title`, `site.tagline`, `site.social.*` from `_config.yml`; `site.data.navigation` (created here).
- Produces: a header rendering wordmark + tagline + nav + (stub) theme toggle + RSS link; a footer rendering meta + social text links. Task 4 ships a no-op `_includes/theme-toggle.html`; Task 5 rewrites that include with the real button — `_includes/header.html` itself doesn't change again.

- [ ] **Step 1: Write `_data/navigation.yml`**

```yaml
- title: home
  url: /
- title: blog
  url: /blog/
- title: about
  url: /about/
- title: colophon
  url: /colophon/
```

- [ ] **Step 2: Rewrite `_includes/header.html`**

```html
<div class="site-head">
  <div class="site-head__top">
    <a href="/" class="site-wordmark">inferi.club</a>
    <div class="site-head__right">
      {% include theme-toggle.html %}
      <a class="site-rss" href="{{ '/feed.xml' | relative_url }}">rss</a>
    </div>
  </div>
  <p class="site-tagline">{{ site.tagline }}</p>
  <nav class="site-nav" aria-label="primary">
    {%- for item in site.data.navigation -%}
      {% assign active = false %}
      {% if page.url == item.url %}{% assign active = true %}{% endif %}
      <a href="{{ item.url }}"{% if active %} class="is-active"{% endif %}>{{ item.title }}</a>
      {%- unless forloop.last %} <span class="site-nav__sep">·</span> {% endunless -%}
    {%- endfor -%}
  </nav>
</div>
```

- [ ] **Step 3: Create placeholder `_includes/theme-toggle.html`** (Task 5 fills it in)

```html
<span class="theme-toggle-slot" aria-hidden="true"></span>
```

- [ ] **Step 4: Rewrite `_includes/footer.html`**

```html
<hr class="dots">
<div class="site-foot">
  <p class="site-foot__meta">
    © {{ "now" | date: "%Y" }} {{ site.title }}
    · built with <a href="https://jekyllrb.com">jekyll</a>
    · <a href="https://creativecommons.org/licenses/by-sa/4.0/">cc by-sa 4.0</a>
  </p>
  <p class="site-foot__social">
    {%- if site.social.github -%}<a href="{{ site.social.github }}">github</a>{%- endif -%}
    {%- if site.social.twitter -%} <span class="site-nav__sep">·</span> <a href="{{ site.social.twitter }}">twitter</a>{%- endif -%}
    {%- if site.social.discord -%} <span class="site-nav__sep">·</span> <a href="{{ site.social.discord }}">discord</a>{%- endif -%}
    <span class="site-nav__sep">·</span> <a href="{{ '/feed.xml' | relative_url }}">rss</a>
  </p>
</div>
```

- [ ] **Step 5: Append header/footer styles to `_sass/_layout.scss`**

Append this block to the existing file:
```scss
.site-head__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
}
.site-wordmark {
  font-weight: 700;
  font-size: var(--step-1);
  text-decoration: none;
}
.site-head__right { display: inline-flex; gap: 1rem; align-items: baseline; }
.site-tagline {
  font-style: italic;
  color: var(--ink-soft);
  margin: 0.25rem 0 1rem;
}
.site-nav { color: var(--ink-soft); }
.site-nav a { text-decoration: none; }
.site-nav a.is-active {
  text-decoration: underline;
  text-decoration-color: var(--accent);
  text-underline-offset: 3px;
  color: var(--ink);
}
.site-nav__sep { color: var(--rule); margin: 0 0.25rem; }
.site-rss { text-decoration: none; }
.site-rss:hover { text-decoration: underline; text-decoration-color: var(--accent); }
.site-foot { color: var(--ink-soft); font-size: 0.95rem; }
.site-foot a { text-decoration: none; }
.site-foot a:hover { text-decoration: underline; text-decoration-color: var(--accent); color: var(--accent); }
.site-foot__meta { margin: 0 0 0.25rem; }
.site-foot__social { margin: 0; }
```

- [ ] **Step 6: Build and verify the header/footer render**

Run:
```bash
bundle exec jekyll build
grep -c 'a writing desk for cs &amp; security notes' _site/index.html
grep -c 'class="site-wordmark"' _site/index.html
grep -c '>home</a>' _site/index.html
grep -c '>colophon</a>' _site/index.html
grep -c 'cc by-sa 4.0' _site/index.html
grep -c 'github</a>' _site/index.html
```
Expected: every command prints `≥ 1`.

- [ ] **Step 7: Commit**

```bash
git add _data/navigation.yml _includes/header.html _includes/footer.html \
        _includes/theme-toggle.html _sass/_layout.scss
git commit -m "feat(layout): site header, footer, navigation"
```

---

### Task 5: Theme switching (toggle button, JS, bootstrap script)

**Files:**
- Create: `assets/js/theme.js`
- Modify: `_includes/theme-toggle.html`
- Modify: `_includes/head.html` (inline bootstrap script + theme.js load + reduced-motion)
- Modify: `_layouts/default.html` (drop hard-coded `data-theme="light"` since the inline script sets it)
- Modify: `_sass/_layout.scss` (toggle button visual + transition + focus ring)

**Interfaces:**
- Consumes: `--bg`, `--ink`, `--accent` tokens from `_sass/_tokens.scss`.
- Produces: a working light/dark switcher. The toggle button has class `theme-toggle`, ARIA `aria-pressed` reflecting current theme (`true` when dark), and `data-theme-toggle` for the JS to find. `localStorage.theme` persists `"light" | "dark"`.

- [ ] **Step 1: Rewrite `_includes/theme-toggle.html`**

```html
<button class="theme-toggle"
        type="button"
        data-theme-toggle
        aria-label="toggle theme"
        aria-pressed="false">
  <span data-theme-glyph>☾</span>
</button>
```

- [ ] **Step 2: Write `assets/js/theme.js`**

```js
(function () {
  var btn = document.querySelector('[data-theme-toggle]');
  if (!btn) return;
  var glyph = btn.querySelector('[data-theme-glyph]');
  var root = document.documentElement;

  function sync() {
    var t = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    btn.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
    if (glyph) glyph.textContent = t === 'dark' ? '☀' : '☾';
  }

  sync();

  btn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  });
})();
```

- [ ] **Step 3: Modify `_includes/head.html`**

Replace the `<head>` block with:
```html
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{% if page.title %}{{ page.title }} — {% endif %}{{ site.title }}</title>
  <meta name="description" content="{{ page.description | default: site.description }}">

  <script>
    (function () {
      try {
        var saved = localStorage.getItem('theme');
        var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', saved || sys);
      } catch (e) {
        document.documentElement.setAttribute('data-theme', 'light');
      }
    })();
  </script>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">

  <link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">
  <link rel="alternate" type="application/rss+xml" title="{{ site.title }}" href="{{ '/feed.xml' | relative_url }}">
  <script defer src="{{ '/assets/js/theme.js' | relative_url }}"></script>
</head>
```

- [ ] **Step 4: Modify `_layouts/default.html`**

Replace the `<html>` opener with:
```html
<html lang="{{ page.lang | default: site.lang }}">
```
(The inline script in `head.html` now sets `data-theme` before the stylesheet loads, so the attribute should not be hard-coded.)

- [ ] **Step 5: Append toggle styles + body transition to `_sass/_layout.scss`**

Append:
```scss
body {
  transition: background-color .15s ease, color .15s ease;
}
@media (prefers-reduced-motion: reduce) {
  body { transition: none; }
}

.theme-toggle {
  font-size: 1rem;
  line-height: 1;
  padding: 0.25rem 0.4rem;
  border-radius: 4px;
  color: var(--ink-soft);
}
.theme-toggle:hover { color: var(--accent); }
.theme-toggle:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
```

- [ ] **Step 6: Build and verify toggle wiring**

Run:
```bash
bundle exec jekyll build
grep -c 'data-theme-toggle' _site/index.html
grep -c 'aria-label="toggle theme"' _site/index.html
grep -c "localStorage.getItem('theme')" _site/index.html
test -f _site/assets/js/theme.js && echo "theme.js: ok"
grep -c "matchMedia('(prefers-color-scheme: dark)')" _site/index.html
```
Expected: each grep ≥ 1; the `test` line prints `theme.js: ok`.

- [ ] **Step 7: Smoke test in the browser** *(manual — engineer runs `bundle exec jekyll serve` and confirms in DevTools that clicking the toggle flips `data-theme`, `localStorage.theme` updates, and a reload preserves the choice)*

- [ ] **Step 8: Commit**

```bash
git add assets/js/theme.js _includes/theme-toggle.html _includes/head.html \
        _layouts/default.html _sass/_layout.scss
git commit -m "feat(theme): light/dark toggle with localStorage + prefers-color-scheme"
```

---

### Task 6: Home layout, post list item, placeholder post

**Files:**
- Create: `_layouts/home.html`
- Create: `_includes/post-list-item.html`
- Create: `_includes/post-meta.html`
- Create: `_sass/_components.scss`
- Create: `_posts/2026-06-23-hello.md`
- Modify: `assets/css/main.scss` (import `components`)
- Modify: `index.html` (use `layout: home`)

**Interfaces:**
- Consumes: `_sass/_layout.scss` (for `.container`), `_sass/_tokens.scss`, `_sass/_typography.scss`.
- Produces:
  - `_includes/post-list-item.html` accepting a Liquid `include post-list-item.html post=<post>` parameter; renders `<li class="post-item">` with date, title link, optional excerpt, tags. Reused by Task 7 (blog index) and Task 10 (tags page).
  - `_includes/post-meta.html` accepting `include post-meta.html post=<post>` and rendering `date · N min · lang · tags`. Reused by Task 8 (post layout).
  - A placeholder post at `_posts/2026-06-23-hello.md` ensuring `site.posts` is non-empty.

- [ ] **Step 1: Write the placeholder post `_posts/2026-06-23-hello.md`**

```markdown
---
layout: post
title: "hello"
date: 2026-06-23 12:00:00 -0300
tags: [meta]
excerpt: "a writing desk opens — the first dust settles, the lamp is lit."
---

This is the first post on the rebuilt **inferi.club**. The site is intentionally small: a home, a blog index, posts, an about page, and a colophon. More words will follow.
```

- [ ] **Step 2: Write `_includes/post-meta.html`**

```html
{%- assign p = include.post -%}
{%- assign words = p.content | number_of_words -%}
{%- assign minutes = words | divided_by: 200 -%}
{%- if minutes < 1 %}{% assign minutes = 1 %}{% endif -%}
<p class="post-meta tabular">
  <time datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y.%m.%d" }}</time>
  <span class="post-meta__sep">·</span>
  {{ minutes }} min read
  <span class="post-meta__sep">·</span>
  {{ p.lang | default: site.lang }}
</p>
{%- if p.tags and p.tags.size > 0 -%}
<p class="post-tags">
  {%- for t in p.tags -%}
    <a href="{{ '/tags/' | relative_url }}#{{ t | slugify }}">{{ t }}</a>
    {%- unless forloop.last %} <span class="post-tags__sep">·</span> {% endunless -%}
  {%- endfor -%}
</p>
{%- endif -%}
```

- [ ] **Step 3: Write `_includes/post-list-item.html`**

```html
{%- assign p = include.post -%}
<li class="post-item">
  <time class="post-item__date tabular" datetime="{{ p.date | date_to_xmlschema }}">{{ p.date | date: "%Y.%m.%d" }}</time>
  <div class="post-item__body">
    <a class="post-item__title" href="{{ p.url | relative_url }}">{{ p.title }}</a>
    {%- if p.excerpt -%}
      <p class="post-item__excerpt">{{ p.excerpt | strip_html | strip_newlines | truncate: 140 }}</p>
    {%- endif -%}
    {%- if p.tags and p.tags.size > 0 -%}
      <p class="post-item__tags">
        {%- for t in p.tags -%}
          <a href="{{ '/tags/' | relative_url }}#{{ t | slugify }}">{{ t }}</a>
          {%- unless forloop.last %} <span class="post-tags__sep">·</span> {% endunless -%}
        {%- endfor -%}
      </p>
    {%- endif -%}
  </div>
</li>
```

- [ ] **Step 4: Write `_sass/_components.scss`**

```scss
.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
}
.post-item {
  display: grid;
  grid-template-columns: 7.5rem 1fr;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid var(--rule);
}
.post-item:last-child { border-bottom: 0; }
.post-item__date {
  color: var(--ink-soft);
  font-variant-numeric: tabular-nums;
}
.post-item__title {
  display: block;
  font-weight: 500;
  font-size: var(--step-1);
  text-decoration: none;
}
.post-item__title:hover { color: var(--accent); }
.post-item__excerpt {
  margin: 0.25rem 0 0;
  color: var(--ink-soft);
  font-size: 0.95rem;
}
.post-item__tags,
.post-tags {
  margin: 0.4rem 0 0;
  color: var(--ink-soft);
  font-size: 0.9rem;
}
.post-tags__sep,
.post-meta__sep { color: var(--rule); margin: 0 0.2rem; }

.section-title {
  font-size: var(--step-1);
  margin: 0 0 0.5rem;
  color: var(--ink-soft);
  font-weight: 500;
}

.more-link {
  display: inline-block;
  margin-top: 1.5rem;
  text-decoration: none;
}
.more-link:hover { color: var(--accent); }

@media (max-width: 540px) {
  .post-item { grid-template-columns: 1fr; gap: 0.25rem; }
}
```

- [ ] **Step 5: Modify `assets/css/main.scss`**

```scss
---
---

@import "reset";
@import "tokens";
@import "typography";
@import "layout";
@import "components";
```

- [ ] **Step 6: Write `_layouts/home.html`**

```html
---
layout: default
---
<hr class="dots">
<section class="home-recent">
  <h2 class="section-title">recent</h2>
  <ul class="post-list">
    {%- assign posts = site.posts | slice: 0, 5 -%}
    {%- for post in posts -%}
      {% include post-list-item.html post=post %}
    {%- endfor -%}
  </ul>
  <a class="more-link" href="{{ '/blog/' | relative_url }}">→ all posts</a>
</section>
<hr class="dots">
```

- [ ] **Step 7: Modify `index.html`** to use the home layout

```html
---
title: home
layout: home
---
```

- [ ] **Step 8: Build and verify the home renders**

Run:
```bash
bundle exec jekyll build
grep -c 'class="post-list"' _site/index.html
grep -c 'class="post-item__title"' _site/index.html
grep -c 'hello</a>' _site/index.html
grep -c '2026.06.23' _site/index.html
grep -c '→ all posts' _site/index.html
```
Expected: each prints `≥ 1`.

- [ ] **Step 9: Commit**

```bash
git add _layouts/home.html _includes/post-list-item.html _includes/post-meta.html \
        _sass/_components.scss assets/css/main.scss \
        _posts/2026-06-23-hello.md index.html
git commit -m "feat(home): home layout, post list component, placeholder post"
```

---

### Task 7: Blog index grouped by year

**Files:**
- Create: `blog.html`

**Interfaces:**
- Consumes: `_includes/post-list-item.html` (from Task 6), `_layouts/default.html`.
- Produces: `/blog/` listing all posts grouped by year, year headings carry the `§` marker via the existing prose treatment (added later in Task 8) — but the heading already works as plain h2.

- [ ] **Step 1: Write `blog.html`**

```html
---
layout: default
title: blog
permalink: /blog/
---

<h1>blog</h1>

{% assign posts_by_year = site.posts | group_by_exp: "post", "post.date | date: '%Y'" %}
{% for year_group in posts_by_year %}
  <h2 class="year-heading">{{ year_group.name }}</h2>
  <ul class="post-list">
    {% for post in year_group.items %}
      {% include post-list-item.html post=post %}
    {% endfor %}
  </ul>
{% endfor %}
```

- [ ] **Step 2: Build and verify the blog index renders the year + post**

Run:
```bash
bundle exec jekyll build
test -f _site/blog/index.html && echo "blog index: ok"
grep -c '<h2 class="year-heading">2026</h2>' _site/blog/index.html
grep -c 'hello</a>' _site/blog/index.html
```
Expected: `blog index: ok` + both greps ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add blog.html
git commit -m "feat(blog): blog index grouped by year"
```

---

### Task 8: Post layout, prose styles, syntax highlighting

**Files:**
- Create: `_layouts/post.html`
- Create: `_sass/_prose.scss`
- Create: `_sass/_syntax.scss`
- Modify: `assets/css/main.scss` (import `prose`, `syntax`)
- Modify: `_sass/_components.scss` (h2 `§` marker — applied only inside `.prose` and `.year-heading`)

**Interfaces:**
- Consumes: `_includes/post-meta.html` (from Task 6).
- Produces: `_layouts/post.html` rendering a single post with back-link, h1, meta, content, and optional `discuss` block. Prose styles target `.prose` so they don't leak into header/footer/nav.

- [ ] **Step 1: Write `_layouts/post.html`**

```html
---
layout: default
---
<p class="post-back"><a href="{{ '/blog/' | relative_url }}">← blog</a></p>

<article class="prose" lang="{{ page.lang | default: site.lang }}">
  <h1>{{ page.title }}</h1>
  {% include post-meta.html post=page %}
  <hr class="dots">
  {{ content }}
  <hr class="dots">
  <p class="post-byline">
    written by {{ page.author | default: site.author.name }}
    <span class="post-meta__sep">·</span>
    <time datetime="{{ page.date | date_to_xmlschema }}">{{ page.date | date: "%Y.%m.%d" }}</time>
  </p>
  {% if page.discuss %}
    <p class="post-discuss">
      discuss:
      {%- if page.discuss.github %} <a href="{{ page.discuss.github }}">github</a>{% endif -%}
      {%- if page.discuss.github and page.discuss.twitter %} <span class="post-meta__sep">·</span>{% endif -%}
      {%- if page.discuss.twitter %} <a href="{{ page.discuss.twitter }}">twitter</a>{% endif -%}
    </p>
  {% endif %}
</article>
```

- [ ] **Step 2: Write `_sass/_prose.scss`**

```scss
.prose {
  font-size: var(--step-0);

  h1 {
    margin-top: 0;
    margin-bottom: 0.25rem;
  }

  h2 {
    position: relative;
  }
  h2::before {
    content: "§";
    color: var(--accent);
    margin-right: 0.5rem;
    font-weight: 700;
  }

  blockquote {
    border-left: 3px solid var(--rule);
    padding: 0.25rem 0 0.25rem 1rem;
    margin: 1.25rem 0;
    color: var(--ink-soft);
    font-style: italic;
  }

  ul, ol { padding-left: 1.5rem; }
  li { margin: 0.25rem 0; }

  code {
    background: var(--bg-soft);
    padding: 0.05rem 0.35rem;
    border-radius: 3px;
    font-size: 0.92em;
  }

  pre {
    background: var(--bg-soft);
    border: 1px solid var(--rule);
    border-radius: 4px;
    padding: 1rem;
    overflow-x: auto;
    font-size: 0.92em;
    line-height: 1.5;
  }
  pre code {
    background: none;
    padding: 0;
    border-radius: 0;
  }

  img { margin: 1rem 0; border-radius: 2px; }

  hr { border: 0; border-top: 1px solid var(--rule); margin: 2rem 0; }
  hr.dots { border-top: 0; }
}

.post-back {
  margin-bottom: 1rem;
  color: var(--ink-soft);
}
.post-back a { text-decoration: none; }
.post-back a:hover { color: var(--accent); }
.post-byline,
.post-discuss { color: var(--ink-soft); font-size: 0.95rem; }
```

- [ ] **Step 3: Write `_sass/_syntax.scss`** (Rouge token classes; uses palette vars so it works in both themes)

```scss
.highlight {
  color: var(--ink);
  background: var(--bg-soft);
}
.highlight .c,
.highlight .c1,
.highlight .cm,
.highlight .cp,
.highlight .cs { color: var(--ink-soft); font-style: italic; }
.highlight .k,
.highlight .kc,
.highlight .kd,
.highlight .kn,
.highlight .kp,
.highlight .kr,
.highlight .kt { color: var(--accent); font-weight: 700; }
.highlight .s,
.highlight .s1,
.highlight .s2,
.highlight .sb,
.highlight .sc,
.highlight .sd,
.highlight .se,
.highlight .sh,
.highlight .si,
.highlight .sx,
.highlight .sr,
.highlight .ss { color: var(--ink); font-style: italic; }
.highlight .n,
.highlight .na,
.highlight .nb,
.highlight .nc,
.highlight .nd,
.highlight .ne,
.highlight .nf,
.highlight .ni,
.highlight .nl,
.highlight .nn,
.highlight .no,
.highlight .nt,
.highlight .nv,
.highlight .nx { color: var(--ink); }
.highlight .o,
.highlight .ow,
.highlight .p { color: var(--ink-soft); }
.highlight .m,
.highlight .mb,
.highlight .mf,
.highlight .mh,
.highlight .mi,
.highlight .mo { color: var(--accent); }
.highlight .err { color: var(--accent); background: var(--accent-soft); }
```

- [ ] **Step 4: Modify `assets/css/main.scss`**

```scss
---
---

@import "reset";
@import "tokens";
@import "typography";
@import "layout";
@import "components";
@import "prose";
@import "syntax";
```

- [ ] **Step 5: Append the year-heading `§` marker treatment to `_sass/_components.scss`**

Append:
```scss
.year-heading {
  position: relative;
  margin-top: 2rem;
}
.year-heading::before {
  content: "§";
  color: var(--accent);
  margin-right: 0.5rem;
  font-weight: 700;
}
```

- [ ] **Step 6: Build and verify the post layout and prose render**

Run:
```bash
bundle exec jekyll build
test -f _site/blog/hello/index.html && echo "post page: ok"
grep -c '← blog' _site/blog/hello/index.html
grep -c '<h1>hello</h1>' _site/blog/hello/index.html
grep -c '1 min read' _site/blog/hello/index.html
grep -c 'written by inferigang' _site/blog/hello/index.html
grep -c 'class="prose"' _site/blog/hello/index.html
```
Expected: `post page: ok` and every grep ≥ 1.

- [ ] **Step 7: Commit**

```bash
git add _layouts/post.html _sass/_prose.scss _sass/_syntax.scss \
        _sass/_components.scss assets/css/main.scss
git commit -m "feat(post): post layout, prose styles, rouge tokens"
```

---

### Task 9: Page layout, About, Colophon

**Files:**
- Create: `_layouts/page.html`
- Create: `about.md`
- Create: `colophon.md`

**Interfaces:**
- Consumes: `_layouts/default.html`, `.prose` styles from `_sass/_prose.scss`.
- Produces: a generic `page` layout used by `about`, `colophon`, `blog`, `tags`. Same prose treatment as posts, no meta/byline.

- [ ] **Step 1: Write `_layouts/page.html`**

```html
---
layout: default
---
<article class="prose" lang="{{ page.lang | default: site.lang }}">
  <h1>{{ page.title }}</h1>
  {{ content }}
</article>
```

- [ ] **Step 2: Write `about.md`**

```markdown
---
layout: page
title: about
permalink: /about/
---

inferi.club is a small writing desk for notes on computer science and information security: rootkits, reverse engineering, web exploitation, mobile, and assorted curiosities that don't fit elsewhere.

Posts are written in Markdown, in English or Portuguese, by people in and around the inferi collective.

The shorter the post, the better the discipline. Long ones are welcome too.
```

- [ ] **Step 3: Write `colophon.md`**

```markdown
---
layout: page
title: colophon
permalink: /colophon/
---

## stack

Built with **Jekyll** and deployed on **GitHub Pages** using the `github-pages` gem (no GitHub Actions). The source is a handful of SCSS partials and a single thirty-line JavaScript file for the theme toggle.

## type

**Open Sans** (400/500/700) for body and headings; **IBM Plex Mono** (400/700) for code. Both loaded via Google Fonts with `preconnect` and `display=swap`. Open Sans does not ship oldstyle figures in its default subset, so dates use tabular lining figures instead — a small concession.

## palette

A warm off-white (`#F8F5EF`) for light mode and a cool grafite (`#16181C`) for dark mode, with a burnt-orange accent that shifts warmer for dark surfaces. Contrast targets WCAG AA for body text against the background in both palettes.

## inspiration

This redesign was inspired by [sweetfish.site](https://sweetfish.site/) — its handcrafted, indie-web feel pushed us toward a more deliberate, type-driven layout. We didn't copy the CSS; we tried to absorb the spirit.

## license

Code under [MIT](https://opensource.org/licenses/MIT). Written content under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
```

- [ ] **Step 4: Build and verify both pages render at their permalinks**

Run:
```bash
bundle exec jekyll build
test -f _site/about/index.html && echo "about: ok"
test -f _site/colophon/index.html && echo "colophon: ok"
grep -c '<h1>about</h1>' _site/about/index.html
grep -c '<h1>colophon</h1>' _site/colophon/index.html
grep -c 'sweetfish.site' _site/colophon/index.html
grep -c 'CC BY-SA 4.0' _site/colophon/index.html
```
Expected: both `: ok` lines + each grep ≥ 1.

- [ ] **Step 5: Commit**

```bash
git add _layouts/page.html about.md colophon.md
git commit -m "feat(pages): page layout, about, colophon"
```

---

### Task 10: Tags index page

**Files:**
- Create: `tags.html`

**Interfaces:**
- Consumes: `_layouts/page.html`, `_includes/post-list-item.html`.
- Produces: `/tags/` page listing every tag with its count and anchor-linked sections (`#<slug>`). Post-list items inside the page reuse the `post-list-item.html` include.

- [ ] **Step 1: Write `tags.html`**

Liquid 3's `sort` is alphabetical, so to order by count descending the tag count is zero-padded to a fixed width inside the sort-key string. After `| sort | reverse`, the entries come back in count-descending order; ties break alphabetically by tag name. The same `site.tags` is then iterated for the per-tag sections.

```html
---
layout: page
title: tags
permalink: /tags/
---

{% assign sorted_tags = "" | split: "" %}
{% for tag in site.tags %}
  {% assign padded = "00000" | append: tag[1].size %}
  {% assign padded = padded | slice: -5, 5 %}
  {% assign entry = padded | append: "|" | append: tag[0] %}
  {% assign sorted_tags = sorted_tags | push: entry %}
{% endfor %}
{% assign sorted_tags = sorted_tags | sort | reverse %}

<p class="tag-index">
  {% for entry in sorted_tags %}
    {% assign parts = entry | split: "|" %}
    {% assign count = parts[0] | plus: 0 %}
    <a href="#{{ parts[1] | slugify }}">{{ parts[1] }}</a>
    <span class="tabular post-meta__sep">({{ count }})</span>
    {% unless forloop.last %} <span class="post-tags__sep">·</span> {% endunless %}
  {% endfor %}
</p>

{% for entry in sorted_tags %}
  {% assign parts = entry | split: "|" %}
  {% assign tag_name = parts[1] %}
  <h2 id="{{ tag_name | slugify }}">{{ tag_name }}</h2>
  <ul class="post-list">
    {% for post in site.tags[tag_name] %}
      {% include post-list-item.html post=post %}
    {% endfor %}
  </ul>
{% endfor %}
```

- [ ] **Step 2: Build and verify the tags page renders**

Run:
```bash
bundle exec jekyll build
test -f _site/tags/index.html && echo "tags: ok"
grep -c 'id="meta"' _site/tags/index.html
grep -c 'href="#meta"' _site/tags/index.html
grep -c 'hello</a>' _site/tags/index.html
```
Expected: `tags: ok` + every grep ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add tags.html
git commit -m "feat(tags): tags index with per-tag anchors"
```

---

### Task 11: Themed 404 page

**Files:**
- Create: `404.html`

**Interfaces:**
- Consumes: `_layouts/default.html`.
- Produces: a `404.html` that GitHub Pages serves for unknown paths under the custom domain.

- [ ] **Step 1: Write `404.html`**

```html
---
layout: default
title: not found
permalink: /404.html
---

<article class="prose">
  <h1>not found</h1>
  <p>this page doesn't exist — maybe it was a draft that never saw daylight.</p>
  <p><a href="{{ '/' | relative_url }}">← back to the home</a></p>
</article>
```

- [ ] **Step 2: Build and verify**

Run:
```bash
bundle exec jekyll build
test -f _site/404.html && echo "404: ok"
grep -c 'not found</h1>' _site/404.html
grep -c "doesn't exist" _site/404.html
```
Expected: `404: ok` + both greps ≥ 1.

- [ ] **Step 3: Commit**

```bash
git add 404.html
git commit -m "feat(404): themed not-found page"
```

---

### Task 12: SEO, RSS, sitemap, favicon, deploy config, README, LICENSE

**Files:**
- Create: `assets/img/favicon.svg`
- Create: `CNAME`
- Create: `LICENSE`
- Create: `README.md`
- Modify: `_includes/head.html` (favicon + `seo`)

**Interfaces:**
- Consumes: plugins `jekyll-feed`, `jekyll-seo-tag`, `jekyll-sitemap` (already declared in `Gemfile` and `_config.yml` from Task 1).
- Produces: `/feed.xml`, `/sitemap.xml`, `<link rel="icon">`, SEO meta tags. The `CNAME` file is what tells GitHub Pages to serve at `inferi.club`.

- [ ] **Step 1: Write `assets/img/favicon.svg`** (a tiny burnt-orange `§` glyph; both palettes recognise the accent)

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#F8F5EF"/>
  <text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, serif" font-weight="700" font-size="22"
        fill="#B85C2E">§</text>
</svg>
```

- [ ] **Step 2: Modify `_includes/head.html`** — add favicon and `seo` tag

Insert these two lines immediately before the existing `<link rel="stylesheet" href="{{ '/assets/css/main.css' | relative_url }}">`:
```html
  <link rel="icon" type="image/svg+xml" href="{{ '/assets/img/favicon.svg' | relative_url }}">
  {% seo %}
```

- [ ] **Step 3: Write `CNAME`** (single-line file, no trailing whitespace)

```
inferi.club
```

- [ ] **Step 4: Write `LICENSE`** (MIT, with current year)

```
MIT License

Copyright (c) 2026 inferi.club

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

- [ ] **Step 5: Write `README.md`**

```markdown
# inferi.club

Source for the [inferi.club](https://inferi.club) blog — Jekyll on GitHub Pages, light/dark, Markdown posts.

## local dev

```sh
bundle install
bundle exec jekyll serve --livereload
```

Open http://localhost:4000.

## writing a post

Create `_posts/YYYY-MM-DD-slug.md` with frontmatter:

```yaml
---
layout: post
title: "title of the post"
date: 2026-06-23 14:30:00 -0300
tags: [linux, reverse-engineering]
lang: en             # optional; defaults to site.lang
excerpt: "single sentence shown in lists"
discuss:             # optional
  github: https://github.com/...
  twitter: https://twitter.com/...
---
```

URL is `/blog/<slug>/`. Tags link to `/tags/#<slug>`.

## deploying

Push to `main`. GitHub Pages rebuilds automatically (no Actions needed). Custom domain is set via the `CNAME` file at the repo root.

## license

Code: [MIT](./LICENSE). Written content: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
```

- [ ] **Step 6: Build and run the final smoke test**

Run:
```bash
bundle exec jekyll build

# 1. CNAME copied to _site (because it's in `include:` of _config.yml)
test -f _site/CNAME && echo "CNAME: ok"
grep -c 'inferi.club' _site/CNAME

# 2. Feed + sitemap generated
test -f _site/feed.xml && echo "feed.xml: ok"
test -f _site/sitemap.xml && echo "sitemap.xml: ok"

# 3. Favicon present and linked
test -f _site/assets/img/favicon.svg && echo "favicon: ok"
grep -c 'favicon.svg' _site/index.html

# 4. jekyll-seo-tag injected (looks for the og:title tag it always emits)
grep -c '"og:title"' _site/index.html

# 5. Every page from the spec exists
for p in / blog/ blog/hello/ about/ colophon/ tags/; do
  test -f "_site/${p}index.html" && echo "page $p: ok" || echo "page $p: MISSING"
done
test -f _site/404.html && echo "page 404: ok" || echo "page 404: MISSING"

# 6. RSS link in head + theme bootstrap script present on every page
grep -c 'alternate' _site/index.html
grep -c "matchMedia" _site/blog/hello/index.html
```
Expected: every `: ok` line prints, every grep ≥ 1, no `MISSING`.

- [ ] **Step 7: Final commit**

```bash
git add assets/img/favicon.svg _includes/head.html CNAME LICENSE README.md
git commit -m "chore: favicon, seo, cname, license, readme — ready to deploy"
```

---

## After all tasks

A final manual pass the engineer must run before declaring done:

1. `bundle exec jekyll serve --livereload` and walk every route in §4 of the spec.
2. Toggle the theme on each route; reload; confirm `localStorage` persists.
3. Open DevTools accessibility panel; confirm focus ring on toggle and links.
4. Run the WebAIM contrast checker on `--ink` vs `--bg` and `--accent` vs `--bg` (both palettes). Adjust if any pair fails AA.
5. Push to the `main` branch of the GitHub Pages repo configured for `inferi.club` and confirm the site builds on GitHub.
