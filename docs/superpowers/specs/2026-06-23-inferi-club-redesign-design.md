---
title: inferi.club redesign — "editorial cozy"
date: 2026-06-23
status: approved
---

# inferi.club redesign — design spec

## 1. Context & goal

inferi.club is a Jekyll-based GitHub Pages blog for a CS / infosec collective. The current site (live at `https://inferi.club/`, source at `github.com/inferigang/inferigang.github.io`) is bilingual (EN/PT) and ships a fair amount of cruft (Projects, Snippets, Members, Wallpapers).

This redesign starts from an empty repository at `/Users/dsm/war/projects/inferi.club/` and produces a fresh, minimal blog whose aesthetic is **inspired by — not copied from — [sweetfish.site](https://sweetfish.site/)**. The cozy, handcrafted indie-web feeling is kept; the pixel/retro fetish is dropped.

No content migration. No thumbnails. Posts are written in Markdown.

## 2. Non-goals

- Cloning sweetfish's CSS/HTML/illustrations verbatim.
- Pixel art, retro browser chrome, 88x31 buttons, webrings, guestbook.
- Multi-language structural i18n (separate `_posts/en/` and `_posts/pt/` trees, language switcher).
- Migrating old posts, redirecting old permalinks, or preserving SEO from the previous site.
- Per-post thumbnails / hero images / OG image generation.
- Pagination of `/blog/` (out of scope until the post count > 50).
- A search feature.
- Comments (no Disqus / utterances). "Discuss on github/twitter" links per post are enough.

## 3. Decisions (locked)

| # | Decision | Choice |
|---|---|---|
| D1 | Inspiration model | "Inspired by sweetfish", not a 1:1 clone |
| D2 | Static site generator | Jekyll on GitHub Pages |
| D3 | Build path | `github-pages` gem (Jekyll 3.x) — no GitHub Actions |
| D4 | Page set | Home, Blog, Post, About, Colophon, Tags, 404 |
| D5 | Theme mode | Light (default) + Dark, with toggle, localStorage, `prefers-color-scheme` fallback |
| D6 | Languages | Mixed in one `_posts/` tree, optional `lang:` frontmatter for `<html lang>` |
| D7 | Existing content | Start from zero |
| D8 | Personality | Cozy + light frills: prominent RSS, colophon page, stylized social in footer |
| D9 | Visual direction | "Editorial cozy" — type-driven, generous whitespace, paper palette, accent burnt orange |
| D10 | Body / UI / heading font | Open Sans via Google Fonts (preconnect) |
| D11 | Mono font | IBM Plex Mono via Google Fonts (chosen over JetBrains Mono — same family weight as Open Sans, ships full Latin Extended) |
| D12 | CSS framework | None. Hand-written SCSS partials. |
| D13 | JavaScript | One file (`theme.js`, ~30 lines). No bundler. |
| D14 | Brand name & domain | `inferi.club` stays. Custom domain via `CNAME` file. |
| D15 | Licensing | Code under MIT (`LICENSE`). Written content under CC BY-SA 4.0 (note in `colophon.md`). |

## 4. Site map

```
/                       Home: wordmark + tagline + 5 most recent posts + "see all"
/blog/                  All posts, reverse chronological, grouped by year heading
/blog/<slug>/           Individual post
/about/                 About the collective
/colophon/              How the site is built: stack, fonts, palette, credits, license
/tags/                  Auto-generated tag index; anchors per tag
/feed.xml               RSS 2.0 (jekyll-feed)
/sitemap.xml            (jekyll-sitemap)
/404.html               Themed not-found page
```

Tags are inline on post pages; clicking a tag goes to `/tags/#<tag>`.

## 5. Visual system

### 5.1 Typography

- **Body / UI / headings:** Open Sans (weights 400, 500, 700).
- **Mono (code, kbd):** IBM Plex Mono (weight 400, 700).
- **Loading:** `<link rel="preconnect" href="https://fonts.googleapis.com">` + `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` in `_includes/head.html`, followed by a single combined `<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;500;700&family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">`.
- **Scale:**
  - `html { font-size: 18px; }` (16px on `≤480px`).
  - Line-height 1.65 in body prose.
  - Modular scale ratio 1.250 (major third), declared as CSS custom properties in `_sass/_tokens.scss`: `--step-0: 1rem`, `--step-1: 1.25rem`, `--step-2: 1.563rem`, `--step-3: 1.953rem`, `--step-4: 2.441rem`.
  - h1 = step-4, h2 = step-3, h3 = step-2, h4 = step-1.
- **Tracking:** `letter-spacing: -0.02em` on h1/h2.
- **Numerals:** dates and counters get `font-variant-numeric: tabular-nums oldstyle-nums` where supported (Open Sans does *not* ship oldstyle figures in the standard subset — fall back to tabular lining figures; document this in the colophon).
- **Reading column:** `max-width: 38rem` centered, with `padding-inline: 1rem` on small screens.

### 5.2 Palette — light (default)

```scss
:root[data-theme="light"] {
  --bg:          #F8F5EF;  // off-white warm (paper)
  --bg-soft:     #F1EBE0;  // section / code background
  --ink:         #1B1A17;  // body text
  --ink-soft:    #5B574E;  // meta (dates, captions)
  --rule:        #D9D2C2;  // borders, divider dots
  --accent:      #B85C2E;  // burnt orange (links, active nav)
  --accent-soft: #E8D7C4;  // selection background
}
```

### 5.3 Palette — dark

```scss
:root[data-theme="dark"] {
  --bg:          #16181C;
  --bg-soft:     #1E2127;
  --ink:         #E8E4DA;
  --ink-soft:    #9A958A;
  --rule:        #2E3138;
  --accent:      #E89B6C;  // warmer burnt orange for dark surfaces
  --accent-soft: #2D241B;
}
```

Both palettes target WCAG AA for body text against `--bg`. Contrast is verified during implementation (§11 done criteria) using the WebAIM contrast checker; any pair that fails is adjusted before launch.

### 5.4 Theme switching

- Markup: `<html data-theme="light">` (default attribute set inline before any render).
- Inline bootstrap script in `<head>` (before stylesheet):
  ```html
  <script>
    (function () {
      var saved = localStorage.getItem('theme');
      var sys = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', saved || sys);
    })();
  </script>
  ```
- Toggle in header is a `<button>` whose visible glyph is the Unicode symbol of the theme it would switch *to* — `☾` when current theme is `light`, `☀` when current is `dark`. ARIA: `<button aria-label="toggle theme" aria-pressed="...">`. Click handler in `assets/js/theme.js`: read current `data-theme`, flip it, write to `localStorage.theme`, update both `aria-pressed` and the visible glyph.
- Transitions on `body`: `transition: background-color .15s ease, color .15s ease`.

### 5.5 Microdetails

- Section divider: `· · ·` centered in `--ink-soft`, implemented as `<hr class="dots">` with content via `::before`.
- Inline links: `text-decoration: underline; text-underline-offset: 3px; text-decoration-thickness: 1px;`. Hover: `color: var(--accent)`.
- Active nav item: underlined with `--accent`.
- Selection: `::selection { background: var(--accent-soft); }`.
- H2 marker: `§` glyph in `--accent`, set as `::before` content, with a `0.5rem` margin-right. Sutil, not gimmicky.

## 6. Layouts

### 6.1 Header (every page)

```
inferi.club                                    ☀  rss
a writing desk for cs & security notes
home  ·  blog  ·  about  ·  colophon
```

- Wordmark is `inferi.club` weight 700, no logo image, links home.
- Tagline italic in `--ink-soft`, configurable in `_config.yml: tagline`.
- Nav from `_data/navigation.yml`; current item underlined in accent.
- Right cluster: theme toggle button (§5.4) + RSS link rendered as the lowercase text `rss` (no SVG, no icon), linking to `/feed.xml`. Hover applies the accent underline.

### 6.2 Footer (every page)

```
· · ·

© 2026 inferi.club  ·  built with jekyll  ·  cc by-sa 4.0
github  ·  twitter  ·  discord  ·  rss
```

- All links are text-only with hover underline-accent. No svg icons.
- Social URLs in `_config.yml: social: { github: …, twitter: …, discord: …, rss: /feed.xml }`.

### 6.3 Home (`/`)

```
inferi.club
a writing desk for cs & security notes

· · ·

recent

  2026.05.12  —  post title
                 one-line excerpt, optional
                 · tag · tag

  2026.04.30  —  …
  (up to 5 most-recent posts)

  →  all posts

· · ·
```

- Dates: format `YYYY.MM.DD`, tabular figures.
- Title: weight 500, links to post.
- Excerpt: `--ink-soft`, single line, ellipsis on overflow.

### 6.4 Blog index (`/blog/`)

- Same item shape as home, grouped by year.
- Year heading: h2 weight 700, with the `§` marker.
- No pagination.

### 6.5 Post (`/blog/<slug>/`)

```
← blog

Post title (h1)
2026.05.12  ·  6 min read  ·  en
· tag · tag · tag

· · ·

<rendered markdown content>

· · ·

written by {{ post.author | default: site.author.name }}  ·  2026.05.12
discuss: github · twitter   (only rendered if discuss: set in frontmatter)
```

- Reading time: Liquid filter `{{ content | number_of_words | divided_by: 200 }} min read`; never display 0 min (clamp to 1).
- `lang:` frontmatter sets `<html lang>` and `<article lang>`; default = `site.lang` (`en`).
- Code blocks: Rouge classes styled in `_sass/_syntax.scss` using the same CSS vars (works for both themes "for free").

### 6.6 Tags (`/tags/`)

- Tag list ordered by post count (desc), with counts in tabular figures.
- Anchor IDs: `#<slugified-tag>`. Each anchor section lists posts under that tag.

### 6.7 Colophon (`/colophon/`)

Short prose describing: Jekyll on GitHub Pages, Open Sans + IBM Plex Mono via Google Fonts, palette inspiration, content license (CC BY-SA 4.0), code license (MIT), and a credit to sweetfish.site as aesthetic inspiration.

### 6.8 404

Single short cozy line ("this page doesn't exist — maybe it was a draft that never saw daylight") plus a link back home.

## 7. Jekyll architecture

### 7.1 Directory layout

```
inferi.club/
├── _config.yml
├── _data/
│   └── navigation.yml
├── _includes/
│   ├── head.html
│   ├── header.html
│   ├── footer.html
│   ├── post-meta.html
│   ├── post-list-item.html
│   └── theme-toggle.html
├── _layouts/
│   ├── default.html
│   ├── page.html
│   ├── home.html
│   └── post.html
├── _sass/
│   ├── _reset.scss
│   ├── _tokens.scss
│   ├── _typography.scss
│   ├── _layout.scss
│   ├── _components.scss
│   ├── _prose.scss
│   └── _syntax.scss
├── assets/
│   ├── css/main.scss
│   ├── js/theme.js
│   └── img/favicon.svg
├── _posts/                  (empty at launch)
├── _drafts/                 (empty)
├── index.html               front-matter: layout: home
├── blog.html                front-matter: layout: page, all posts grouped by year
├── about.md                 front-matter: layout: page
├── colophon.md              front-matter: layout: page
├── tags.html                front-matter: layout: page
├── 404.html                 front-matter: layout: default
├── Gemfile
├── Gemfile.lock             (committed)
├── .gitignore
├── CNAME                    contains: inferi.club
├── README.md
└── LICENSE
```

### 7.2 `_data/navigation.yml`

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

Rendered in `_includes/header.html` by iterating `site.data.navigation`, joining items with `·`, and underlining the item whose `url` matches `page.url`.

### 7.3 Pretty URLs for pages

Posts get `permalink: /blog/:slug/` globally via `_config.yml`. Pages (`about.md`, `colophon.md`, `blog.html`, `tags.html`) declare their own per-page permalinks in frontmatter so the URLs match §4:

```yaml
# about.md
---
layout: page
title: about
permalink: /about/
---

# colophon.md
---
layout: page
title: colophon
permalink: /colophon/
---

# blog.html
---
layout: page
title: blog
permalink: /blog/
---

# tags.html
---
layout: page
title: tags
permalink: /tags/
---
```

`index.html` and `404.html` stay at the root and don't need explicit permalinks.

### 7.4 `_config.yml` (illustrative — replace `...` placeholders with real URLs during implementation)

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
  discord: https://discord.gg/...
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

### 7.5 `Gemfile`

```ruby
source "https://rubygems.org"

gem "github-pages", group: :jekyll_plugins
gem "webrick", "~> 1.8"   # required on Ruby ≥ 3.0 for local serve

group :jekyll_plugins do
  gem "jekyll-feed"
  gem "jekyll-seo-tag"
  gem "jekyll-sitemap"
end
```

### 7.6 Post frontmatter convention

```yaml
---
layout: post
title: "Title of the post"
date: 2026-05-12 14:30:00 -0300
tags: [reverse-engineering, linux]
lang: en            # optional; defaults to site.lang
excerpt: "Single sentence shown in lists."
discuss:            # optional
  github: https://github.com/...
  twitter: https://twitter.com/...
---
```

### 7.7 Build & deploy

- Local dev: `bundle install`, then `bundle exec jekyll serve --livereload` → `http://localhost:4000`.
- Deploy: push to `main` of `inferigang/inferigang.github.io` (or whichever repo is wired to `inferi.club` via `CNAME`). GitHub Pages auto-builds with the `github-pages` gem. No GitHub Actions required.
- Custom domain: `CNAME` file in repo root + DNS A/AAAA/ALIAS on the registrar pointing to GitHub Pages IPs.

## 8. Accessibility

- Target colour contrast ≥ 4.5:1 for body text in both palettes and ≥ 3:1 for large text / non-text; both are checked against `--bg` during implementation (§11) and any failing pair is adjusted before launch.
- Theme toggle button has `aria-label="toggle theme"` and `aria-pressed`.
- All interactive elements reachable by keyboard; visible focus ring using `--accent` outline.
- `prefers-reduced-motion: reduce` disables the `body` transition.
- Semantic landmarks: `<header>`, `<nav>`, `<main>`, `<article>`, `<footer>`.

## 9. Performance budget

- HTML: well under 50 KB per page.
- CSS: single file ~12 KB minified (Jekyll compiles SCSS partials).
- JS: `theme.js` ≤ 1 KB.
- Fonts: 2 families (Open Sans + IBM Plex Mono) loaded via a single combined Google Fonts request with `display=swap`. Preconnect saves the second-domain RTT to `fonts.gstatic.com`.
- No images required for chrome (favicon SVG only).
- No analytics, no third-party trackers.

## 10. Risks & open questions

| Risk | Mitigation |
|---|---|
| Google Fonts adds external request (privacy) | Documented in colophon. If the team wants zero third parties later, switch to self-hosted woff2 in a follow-up. |
| `github-pages` gem locks Jekyll to 3.x | Acceptable for scope. Switch to Jekyll 4 + GitHub Actions later if needed. |
| Open Sans doesn't ship oldstyle figures | Use tabular lining figures instead; document in colophon. Acceptable trade-off. |
| Burnt orange accent (`#B85C2E`) on white-paper bg may feel warm-only | Warmth is intentional and matches the editorial-cozy direction; contrast for the accent on `--bg` and `--bg-soft` is verified before launch (§11). |
| No pagination at launch | Add `jekyll-paginate` only when `_posts/` size > 50. |

## 11. Done criteria

The redesign is "done" when:

1. `bundle exec jekyll serve` runs locally with no errors.
2. All pages listed in §4 render: home, /blog/, sample post (drop a placeholder `_posts/2026-06-23-hello.md`), /about/, /colophon/, /tags/, /404.html.
3. Light and dark themes both visually correct, toggle persists across reloads, respects `prefers-color-scheme` on first load.
4. RSS (`/feed.xml`) and sitemap (`/sitemap.xml`) generated and linked from `<head>`.
5. `CNAME` and GitHub Pages config in place; deploy to a test branch verified.
6. README.md explains: local dev, writing a post, deploying.
