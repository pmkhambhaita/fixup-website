# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

FixUp Arena — a marketing/landing page for a football (soccer) prize competition ("Win £500"). The entire site is a **single static HTML file**: `index.html`. There is no build step, no package manager, and no server-side code.

## Running the site

There is no dev server or build command. Open `index.html` directly in a browser, or serve the directory with any static file server, e.g.:

```bash
python3 -m http.server 8000
```

There is no test suite, linter, or CI configured in this repo.

## Architecture

`index.html` is a client-rendered single-page app that fakes multi-page navigation entirely with JS/CSS — there is no router or bundler involved.

- **View switching**: Four "views" live as sibling elements in one DOM (`#home-view`, `#privacy-view`, `#tos-view`, `#support-view`), toggled via `page-visible`/`page-hidden` classes by the `navigateTo(pageId)` function (near line 1075). Navigation updates `history` state and the URL hash (`#privacy`, `#tos`, `#support`) instead of doing a real page load; `popstate` and the initial `location.hash` are handled to support back/forward and deep links.
- **3D background**: A Three.js particle scene (stadium crowd + a helix) renders to a fixed full-viewport `<canvas id="webgl">` behind all content. Camera position and the stadium/helix visibility toggle are driven by GSAP `ScrollTrigger` as the user scrolls through the home view — this is the most complex part of the file (~line 1140 onward).
- **Scroll animation**: GSAP + ScrollTrigger drive the loader intro, a pinned desktop "carousel" (`#roadmap-desktop`) that scrubs cards through 3D space in sync with scroll, and a simpler stagger-in for the mobile roadmap variant (`#roadmap-mobile`). `ScrollTrigger.matchMedia` branches behavior at the `768px` breakpoint.
- **Styling**: Tailwind is loaded via the CDN `<script src="https://cdn.tailwindcss.com">` (JIT in-browser, not a build-time PostCSS setup), plus a `<style>` block for custom effects (glass panels, glow/gradient text, custom cursor).
- **External dependencies**: Everything is loaded from CDNs in `<head>` — Tailwind, Three.js r128, GSAP 3.12.2 + ScrollTrigger, Iconify, Google/Fontsource fonts. There is no local `node_modules`.
- **Assets**: Images are hotlinked from a Supabase storage bucket (`hoirqrkdgbmvpwutwuwj.supabase.co`) and Unsplash — they are not stored in this repo. The local `generated-images/` directory is currently empty.
- **Payments**: Registration is handled entirely off-site via two Stripe Payment Links (hardcoded `https://buy.stripe.com/...` URLs for the £10 and £70 tiers) — there is no backend or webhook code in this repo.

## Conventions

- All markup, styles, and scripts live in the one `index.html` file — keep new sections/views within it rather than splitting into separate files unless asked to restructure.
- Brand colors are CSS custom properties on `:root`: `--brand-cyan: #5de0e6`, `--brand-blue: #004aad`.
- `.ua/` and `graphify-out/` are generated tool output (Understand-Anything / graphify knowledge-graph artifacts), not part of the site.

## Answering questions about this codebase

A graphify knowledge graph of this repo already exists at `graphify-out/graph.json`. For any
question about how the site is structured or how its parts connect (architecture, what depends on
what, where a feature lives, tracing a flow), query that graph **first** instead of re-reading
`index.html` from scratch:

```bash
graphify query "<your question>"
```

- Treat a natural-language question about the code as a graphify query even without the `/graphify`
  prefix — the existing graph is the fast path.
- Only rebuild the graph (`/graphify .`, or `/graphify . --update` after edits) when `index.html`
  has materially changed; a stale graph is worse than none.
- The graph is a **map, not the source of truth** — confirm any specific line/behavior against
  `index.html` before acting on it.
