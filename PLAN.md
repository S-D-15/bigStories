# Field Notes — Architecture & Build Record

> **Status: built and verified.** This document explains what the project is, why
> each piece of technology is there, and how it was checked. For step-by-step
> setup and publishing instructions, see [README.md](README.md).

**Decisions taken with the user:** Netlify hosting · GitHub-account login for the
CMS · site not previously live, so clean URLs with no redirect baggage.

---

## Context — what this replaced

The project was two files. `index.html` (1325 lines) held the entire site: inline
design-token CSS, hero, a story list with **one hardcoded entry**, a localStorage
composer, notes, subscribe, services, footer, and a JSON-LD graph.
`Stories-html.html` was a superseded earlier draft.

It was a well-made shell with no working machinery underneath:

- **Every outbound link was a promise the site could not keep.**
  `stories/hellocloud-founder-story.html`, `about.html`, `contact.html`,
  `privacy.html`, `/feed.xml`, `/assets/*` — none existed.
- **`REPLACE-WITH-YOUR-DOMAIN.com`** sat in the canonical tag, OG tags, Twitter
  tags and JSON-LD, so all the SEO work was inert.
- **The composer did not publish.** It wrote to `localStorage` and produced a
  downloaded `index.html` for someone to upload by hand. Publishing also meant
  hand-managing the `FN 002` number, the reading time, the hero button target and
  a JSON-LD entry.
- **No story body existed anywhere.** The composer only ever captured *index
  rows* — headline, dek, kicker, date. It never captured the article itself.

That last point is why requirements 1 and 2 were one piece of work: the in-page
reader had nothing to read until the publishing system existed.

---

## Architecture

```
   Writer's browser                     GitHub repo                    Netlify
  ┌──────────────────┐              ┌──────────────────┐         ┌──────────────────┐
  │  /admin/         │  commit      │  src/stories/    │  build  │  static HTML     │
  │  Sveltia CMS     │─────────────▶│  *.md            │────────▶│  at the live     │
  │  (login, editor, │   via API    │  assets/uploads/ │  hook   │  domain          │
  │   image upload)  │              │  (images)        │         │  + Netlify Forms │
  └──────────────────┘              └──────────────────┘         └──────────────────┘
                                     the "database"               the host + form handler
```

### Why each piece is necessary

| Piece | Job it does | Why it cannot be dropped |
|---|---|---|
| **GitHub repo** | Stores story markdown + uploaded images; every publish is a commit | This *is* the database. Free, versioned, undo-able, and it doubles as the deploy trigger. |
| **Sveltia CMS** (one HTML file at `/admin/`) | Login screen, rich-text editor, image upload, Publish button | The only way a non-technical user writes without code. Runs entirely in the browser — no server, no CMS backend to host. |
| **Eleventy** | Turns markdown into real HTML pages, and regenerates the index list, FN numbers, reading times, JSON-LD, RSS and sitemap | Story text must exist at real crawlable URLs or the SEO work is lost. This is what makes the in-page reader SEO-safe rather than a content black hole. |
| **Netlify** | Hosting, auto-build on every commit, free custom domain + SSL, **and** the contact form handler | Collapses hosting, deploys and the contact form into one free account. |

### What was deliberately not added

No database server. No auth service. No backend API. No SaaS CMS. No email service.
No React/Vue. No Tailwind. No analytics. No reCAPTCHA.

**Total accounts: GitHub, Netlify, domain registrar. Total npm dependencies: one
(`@11ty/eleventy`).** The planned RSS plugin turned out to be unnecessary — the feed
is 20 lines of template and three date filters.

### The one honest trade-off

Sveltia CMS is a younger project than Decap CMS (the old Netlify CMS). It was chosen
because its editor is markedly better on mobile and with images, which matters for
the person actually using it. Its config is **Decap-compatible**, so switching back
is a one-line change to the script tag in `src/admin/index.html`. Decap's own default
auth path (Netlify Identity) is deprecated, which is why it was not first choice.

---

## Requirement 1 — In-page story reader ✅

**The rule that makes this both smooth and SEO-safe:** every story is built twice
from one markdown file, via one shared include (`_includes/story-body.njk`), so the
two can never drift apart.

- `/stories/<slug>/` — a complete standalone page (own title, description,
  canonical, OG tags, `BlogPosting` JSON-LD). What Google indexes, what a shared
  link opens.
- `/stories/<slug>/partial.html` — the bare `<article>`, fetched by the reader.

Clicking a story fetches the fragment into a native `<dialog>`, `showModal()`s it,
and `pushState`s the real URL. `<a href>` stays real underneath, so crawlers,
⌘-click, middle-click and no-JS visitors all still get the standalone page.

**Native `<dialog>` was chosen deliberately:** focus trapping, Esc handling, an inert
background and top-layer stacking come free, replacing ~80 lines of hand-rolled
accessibility code that would otherwise need maintaining.

**The floating Collapse button** is pinned top-right on desktop, bottom-right on
mobile clear of `env(safe-area-inset-bottom)`, 44px minimum target, styled from
existing tokens with the same backdrop blur as the nav. On close it returns focus to
the originating link and scrolls that entry back into view only if it is off-screen.

**Two details that would otherwise have broken it:**

- The page's `#progress` bar sits at `z-index:120`, which a top-layer dialog paints
  straight over — so the reader has *its own* hairline, driven by the dialog's scroll.
- `overscroll-behavior: contain` stops iOS scroll-chaining at the end of a story.

**A bug caught by screenshot review during the build:** `scrollTop = 0` was running
while the dialog was still `display:none`, where it is a no-op — so reopening a story
resumed at the previous story's scroll position. Fixed by resetting scroll *after*
`showModal()`, and covered by a regression test.

Animation is a CSS transition using `@starting-style` + `transition-behavior:
allow-discrete`, so open **and** close animate natively without JS timers. The
existing `prefers-reduced-motion` block disables it.

The standalone page carries the same floating control, reading `← All stories`.

---

## Requirement 2 — Real publishing system ✅

`/admin/` → **Sign in with GitHub** → six fields: headline, dek, kicker, date, cover
image (with alt text), and the story in a rich-text editor. Plus a **Draft** toggle
and a collapsed SEO-overrides panel. Publish → commit → live in ~60 seconds at the
same URL. No new link, ever.

**It asks for less than the composer it replaced.** These were manual before and are
now computed at build time:

| Was typed by hand | Now derived from |
|---|---|
| `FN 002` number | chronological position in the collection |
| Reading time | word count ÷ 200 |
| File path / slug | the headline |
| JSON-LD blob | the story's own front matter |
| Hero "Read the latest story" target | the newest story |

Retired: the `#composer` section, its CSS block, the footer Editor button and the
composer script — **roughly 450 lines of JavaScript**.

**A second bug caught while testing the Draft toggle:** a story marked `draft: true`
was correctly hidden from the story list — but Eleventy still wrote its page, so the
draft sat at a live, crawlable URL and appeared in the sitemap. Hiding it from the
index was never enough. `src/stories/stories.11tydata.js` now strips the permalink
entirely in a production build, so a draft has no public URL at all, while still
rendering locally so it can be previewed. Verified in both directions.

> ⚠️ **Content gap, not a code gap.** The HelloCloud story body never existed in the
> original project. Its metadata migrated cleanly to
> `src/stories/hellocloud-founder-story.md`; the body is clearly-marked placeholder
> prose that must be replaced via `/admin/`.

---

## Requirement 3 — Hosting and contact form ✅

**Netlify**, connected to the GitHub repo. `netlify.toml` pins the build command,
publish directory and Node version. Free tier: 300 build minutes/month against a
~1-second build, 100 GB bandwidth, free custom domain and automatic SSL.

**Contact form: Netlify Forms** — no extra service, no API key, no SMTP, no backend
code. Present in the built static HTML on both `/contact/` and the homepage
`#contact` section, from one shared include.

- **Validation.** `required` / `type="email"` / `minlength` stay in the HTML.
  `form.noValidate` is set **at runtime by JS**. That ordering is what makes the
  progressive enhancement real: with JS off, native validation and a normal POST to
  `/thanks/` still work; with JS on, the visitor gets inline errors and never leaves
  the page.
- **Accessibility.** `<label for>` throughout, `aria-invalid`, `aria-describedby`
  error text, a `role="status"` region, errors in words rather than colour alone,
  and focus moved to the first invalid field.
- **Spam.** Hidden honeypot + Netlify's built-in filtering. No reCAPTCHA, so no
  third-party JS, no cookie banner, no accessibility penalty. If spam ever gets
  through, Netlify's reCAPTCHA is a dashboard checkbox — no code change.
- **Delivery.** Netlify → Forms → Notifications → email. Submissions are also stored
  in the dashboard, so nothing is lost if an email bounces.

---

## Requirement 4 — Preserving what already worked ✅

**The execution rule:** the CSS and public JS were extracted from `index.html`
**programmatically, byte-for-byte**, guarded by 12 automated fidelity assertions
(correct start/end anchors, key features present, composer code absent). Nothing was
retyped. 402 lines of CSS and 96 lines of JS moved unchanged.

New CSS was **appended** in the existing banner style, built only from existing
tokens. **No token value changed.**

**Preserved:** the warm-paper palette and every design token · Fraunces/Newsreader
typography and the fluid `clamp()` scale · dark mode via both `data-theme` and
`prefers-color-scheme` · the pre-paint theme script that prevents white flash · the
`.label` mono small-caps motif · reading progress bar · hide-on-scroll nav ·
bookmark/save feature · skip link · `:focus-visible` rules · reduced-motion handling
· `lang="en-IN"` · the full mobile breakpoint block.

**SEO — repaired and automated.** Every placeholder URL now resolves from
`_data/site.json`. Added: per-page titles/descriptions/canonicals · per-story
`BlogPosting` JSON-LD with author, date, image and word count · **`/feed.xml`**,
linked from the head since day one but never existing until now · `/sitemap.xml` ·
`/robots.txt` · a 404 page · and `/about/`, `/contact/`, `/privacy/`, all of which
the nav and footer already linked to.

**Assets that were referenced but had never existed** — `favicon.svg`,
`apple-touch-icon.png`, `og-cover.png` — were generated from the brand's own motif
(accent dot, hairline rule, waveform) using Node's built-in `zlib`, adding no image
dependency to the project.

---

## Verification — what was actually run

**37/37 browser checks passed** against the production build, driving real Chromium
(Playwright, installed outside the project so it adds no dependency):

- Reader opens in-page; URL and `document.title` update via `pushState`; focus lands
  on the headline
- Collapse button stays pinned and inside the viewport after scrolling to the end;
  meets the 44px target
- Reopening a story starts at the top *(the regression test for the bug found above)*
- The reader's own progress bar advances with the dialog's scroll
- Close via **button**, **Esc** and **browser Back** all restore URL, title, scroll
  position and focus
- **Ctrl-click** still opens the standalone page in a new tab
- **JavaScript disabled:** story links navigate to a real page containing the full text
- Contact form: empty submit shows inline errors, sets `aria-invalid`, moves focus to
  the first bad field, does not navigate; malformed email rejected; fixed fields clear;
  valid submit posts and swaps in an inline success message
- Reduced motion, 375px mobile (no horizontal scroll), and dark mode all verified

**Draft handling verified in both modes:** in a production build a draft produces no
page directory, no index row, no sitemap entry and no feed item; under
`eleventy --serve` the same draft renders and its page returns 200 for previewing.

**Site integrity checks passed:** every internal link across 9 pages resolves · no
placeholders left in output · every story link has both a page and a partial · every
DOM hook `site.js` reaches for exists · all 7 indexable pages have a unique title,
canonical and meta description.

Re-run any time:

```bash
npm run build
node <scratchpad>/check.js          # link + SEO integrity
node <scratchpad>/browser-test.js   # 37 browser checks
```

---

## File structure

```
eleventy.config.mjs   collections, date/text filters, FN numbering, reading time
netlify.toml          build command, headers
README.md             setup + publishing instructions
archive/              the original single-file site
src/
  _data/site.json     domain, name, author, socials — single source of truth
  _includes/
    base.njk          <head> (all SEO), nav, footer
    story.njk         standalone story page layout
    story-body.njk    the <article> — shared by the page AND the reader fragment
    page.njk          about / privacy / thanks / 404
    contact-form.njk  shared by /contact/ and the homepage section
    schema-site.njk   WebSite + Person + Blog JSON-LD
    schema-story.njk  BlogPosting JSON-LD
  admin/              the CMS (config.yml holds the field definitions)
  assets/             style.css, site.js, favicon, icons, uploads/
  stories/*.md        the content
  stories/stories.11tydata.js   per-story defaults + draft suppression
  story-partials.njk  emits /stories/<slug>/partial.html
  index.njk           the homepage
  contact / about / privacy / thanks / 404 / feed / sitemap / robots
```

---

## Still outstanding

Everything here needs information only the user has:

- [ ] **Replace the placeholder story body** — see the content gap above
- [ ] `OWNER/REPO` in `src/admin/config.yml`
- [ ] Real domain in `src/_data/site.json` and `src/admin/config.yml`
      (currently `https://field-notes.netlify.app`, which works as a Netlify default)
- [ ] Real LinkedIn URL in `src/_data/site.json` (still `REPLACE-WITH-YOUR-HANDLE`)
- [ ] Review `src/about.md` and `src/privacy.md` — both are working drafts
- [ ] Replace the generated `og-cover.png` / `apple-touch-icon.png` with designed
      artwork when there is some
- [ ] `git init` and push — **not done, since committing was never requested.**
      Commands are in the README.

### Deliberately left out of scope

- **The four Notes are still hardcoded**, so they cannot be published from `/admin/`.
  A second CMS collection reusing the same machinery would fix it.
- **The subscribe form** now posts to Netlify Forms (`subscribe`) instead of the old
  dead `REPLACE-WITH-YOUR-EMAIL-TOOL` placeholder, so it captures addresses — but it
  is not wired to a real newsletter tool.
- **Responsive image generation** (`@11ty/eleventy-img`). Cover photos straight off a
  phone will be multi-megabyte. One dependency, meaningful LCP win — left out to
  honour "minimum necessary" until approved.

### Note on a missing file

`Stories-html.html`, the superseded older draft, was present at the start of the
session and was no longer on disk by the time the originals were archived. It was not
removed by any command run here. Nothing functional was lost — it was an earlier
version of the same page, and the current `index.html` is preserved in `archive/`.
