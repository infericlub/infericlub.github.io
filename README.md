# inferi.club

Source for the [inferi.club](https://inferi.club) blog, Jekyll on GitHub Pages, light/dark, Markdown posts.

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
  twitter: https://x.com/...
---
```

URL is `/blog/<slug>/`. Tags link to `/tags/#<slug>`.

## deploying

Push to `main`. GitHub Pages rebuilds automatically (no Actions needed). Custom domain is set via the `CNAME` file at the repo root.

## license

Code: [MIT](./LICENSE). Written content: [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
