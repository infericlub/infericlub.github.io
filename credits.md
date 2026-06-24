---
layout: page
title: credits
permalink: /credits/
---

## stack

Built with **Jekyll** and deployed on **GitHub Pages** using the `github-pages` gem (no GitHub Actions). The source is a handful of SCSS partials and two small vanilla JS files: one for the theme toggle, one for the snippets page (copy-to-clipboard and client-side filter).

### plugins

Three Jekyll plugins, all on the GitHub Pages allowlist:

- `jekyll-feed`, RSS at [/feed.xml](/feed.xml).
- `jekyll-seo-tag`, OpenGraph and meta tags.
- `jekyll-sitemap`, sitemap at [/sitemap.xml](/sitemap.xml).

#### why not Jekyll 4?

The `github-pages` gem pins Jekyll to 3.x, which is fine for the scope. Moving to Jekyll 4 would mean configuring a custom GitHub Actions build, which is more rope to manage for marginal gains.

## type

**Open Sans** for everything; **IBM Plex Mono** for code. Both loaded via Google Fonts with `preconnect` and `display=swap`.

## look

Monochromatic, dark gray text on light gray paper, no accent colours. Cells of content live in **boxes**: each box has a hairline border and a hard, zero-blur drop shadow, so the page reads as a scrapbook of stickers laid on a desk. Each box's heading is a small title bar across the top, not a big editorial heading.

## inspiration

This redesign was inspired by [sweetfish.site](https://sweetfish.site/), Ayu's hand-built indie web house, where the box-and-shadow vocabulary first won us over. We didn't copy any of the assets, fonts, or CSS, but the visual structure (panels, hard shadows, `<q>`-as-label, monochrome) is theirs by way of inspiration. Go visit it.

## license

Code under [MIT](https://opensource.org/licenses/MIT). Written content under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
